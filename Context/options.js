import { generateRuleFromText } from './ai_service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Rule elements
    const urlPatternInput = document.getElementById('rule-url-pattern');
    const fieldsInput = document.getElementById('rule-fields');
    const rulesList = document.getElementById('rules-list');
    const addRuleButton = document.getElementById('add-rule-button');
    const generateRuleButton = document.getElementById('generate-rule-button');
    const ruleJsonPreview = document.getElementById('rule-json-preview');

    // API Config elements
    const baseUrlInput = document.getElementById('base-url-input');
    const modelNameInput = document.getElementById('model-name-input');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiConfigButton = document.getElementById('save-api-config-button');

    // General Prompt elements
    const customGeneralPromptTextarea = document.getElementById('custom-general-prompt');
    const saveGeneralPromptButton = document.getElementById('save-general-prompt');
    const resetGeneralPromptButton = document.getElementById('reset-general-prompt');

    // Initial rendering
    renderRules();

    // Load General Prompt
    const defaultGeneralPrompt = `You are a text analysis expert. I will provide you with the text content of a webpage. Your task is to generate a very concise, one-sentence summary of what this page is about. Here is the content:

{{PAGE_CONTENT}}`;
    chrome.storage.local.get(['customGeneralPrompt'], (result) => {
        if (result.customGeneralPrompt) {
            customGeneralPromptTextarea.value = result.customGeneralPrompt;
        } else {
            customGeneralPromptTextarea.value = defaultGeneralPrompt;
        }
    });

    // Load AI Config
    chrome.storage.local.get(['aiConfig'], (result) => {
        if (result.aiConfig) {
            baseUrlInput.value = result.aiConfig.baseUrl || '';
            modelNameInput.value = result.aiConfig.modelName || '';
            apiKeyInput.value = result.aiConfig.apiKey || '';
        }
    });

    // --- Event Listeners ---

    saveApiConfigButton.addEventListener('click', () => {
        const config = {
            baseUrl: baseUrlInput.value.trim(),
            modelName: modelNameInput.value.trim(),
            apiKey: apiKeyInput.value.trim()
        };
        if (config.baseUrl && config.modelName && config.apiKey) {
            chrome.storage.local.set({ aiConfig: config }, () => { alert('AI Configuration saved.'); });
        } else {
            alert('Please fill in all API configuration fields.');
        }
    });

    generateRuleButton.addEventListener('click', async () => {
        const naturalLanguageText = fieldsInput.value.trim();
        if (!naturalLanguageText) {
            alert('Please describe the data you want to extract.');
            return;
        }
        ruleJsonPreview.textContent = 'Generating...';
        generateRuleButton.disabled = true;
        try {
            const ruleObject = await generateRuleFromText(naturalLanguageText);
            ruleJsonPreview.textContent = JSON.stringify(ruleObject, null, 2);
        } catch (error) {
            console.error('Error generating rule:', error);
            ruleJsonPreview.textContent = 'Error: Could not generate rule. Check console for details.';
            alert('Failed to generate rule. Please ensure your AI configuration is correct.');
        } finally {
            generateRuleButton.disabled = false;
        }
    });

    addRuleButton.addEventListener('click', () => {
        const urlPattern = urlPatternInput.value.trim();
        const fieldsJson = ruleJsonPreview.textContent.trim();
        if (!urlPattern || !fieldsJson || fieldsJson === 'Generating...' || fieldsJson.startsWith('Error:')) {
            alert('URL pattern and a successfully generated rule are required.');
            return;
        }
        try {
            JSON.parse(fieldsJson);
        } catch (e) {
            alert('The generated rule is not valid JSON. Please try generating it again.');
            return;
        }
        chrome.storage.local.get({ extractionRules: [] }, (result) => {
            const rules = result.extractionRules;
            rules.push({ id: `rule_${Date.now()}`, urlPattern, fields: fieldsJson });
            chrome.storage.local.set({ extractionRules: rules }, () => {
                urlPatternInput.value = '';
                fieldsInput.value = '';
                ruleJsonPreview.textContent = '';
                renderRules();
            });
        });
    });

    saveGeneralPromptButton.addEventListener('click', () => {
        const newPrompt = customGeneralPromptTextarea.value.trim();
        if (newPrompt && newPrompt.includes('{{PAGE_CONTENT}}')) {
            chrome.storage.local.set({ customGeneralPrompt: newPrompt }, () => {
                alert('Default summary prompt saved.');
            });
        } else {
            alert('Prompt cannot be empty and must include the {{PAGE_CONTENT}} variable.');
        }
    });

    resetGeneralPromptButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset to the default prompt?')) {
            chrome.storage.local.remove('customGeneralPrompt', () => {
                customGeneralPromptTextarea.value = defaultGeneralPrompt;
                alert('Prompt reset to default.');
            });
        }
    });

    // --- Helper Functions ---

    function renderRules() {
        chrome.storage.local.get({ extractionRules: [] }, (result) => {
            rulesList.innerHTML = '';
            const rules = result.extractionRules;
            if (rules.length === 0) {
                rulesList.innerHTML = '<p>No rules saved yet.</p>';
                return;
            }
            rules.forEach(rule => {
                const ruleDiv = document.createElement('div');
                ruleDiv.className = 'rule';
                ruleDiv.innerHTML = `<strong>Pattern:</strong> ${rule.urlPattern}<br><strong>Fields:</strong> <pre>${rule.fields}</pre>`;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteRule(rule.id));
                ruleDiv.appendChild(deleteButton);
                rulesList.appendChild(ruleDiv);
            });
        });
    }

    function deleteRule(ruleId) {
        chrome.storage.local.get({ extractionRules: [] }, (result) => {
            let rules = result.extractionRules;
            rules = rules.filter(rule => rule.id !== ruleId);
            chrome.storage.local.set({ extractionRules: rules }, () => { renderRules(); });
        });
    }

    // Data Management Buttons
    document.getElementById('export-log-button').addEventListener('click', () => {
        chrome.storage.local.get({ browsingLog: [] }, (result) => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.browsingLog, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute("href", dataStr);
            dl.setAttribute("download", "context_log.json");
            dl.click();
            dl.remove();
        });
    });

    document.getElementById('clear-data-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            chrome.storage.local.clear(() => {
                alert('All data has been cleared.');
                renderRules();
            });
        }
    });
});
