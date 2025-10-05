const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';

// A helper function to manage the offscreen document.
async function getOffscreenDocument() {
    // Check if an offscreen document is already active.
    if (await chrome.offscreen.hasDocument()) {
        return;
    }

    // Create the offscreen document.
    await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ['DOM_PARSER'],
        justification: 'To perform long-running fetch requests for AI services without blocking the service worker.',
    });
}

// The new implementation of the AI call, which delegates the fetch to the offscreen document.
async function callOpenAIFormatAPI(prompt) {
    // 1. Ensure the offscreen document is active.
    await getOffscreenDocument();

    // 2. Get AI config from storage.
    const result = await chrome.storage.local.get('aiConfig');
    const config = result.aiConfig;
    if (!config || !config.apiKey || !config.baseUrl || !config.modelName) {
        throw new Error("AI Configuration is not set. Please configure it in the extension's options page.");
    }

    let { baseUrl, modelName, apiKey } = config;
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }
    const endpoint = `${baseUrl}/v1/chat/completions`;

    // 3. Send a message to the offscreen document to perform the fetch.
    const response = await chrome.runtime.sendMessage({
        type: 'call-ai-api',
        prompt,
        endpoint,
        modelName,
        apiKey
    });

    // 4. Handle the response from the offscreen document.
    if (response && response.success) {
        return response.content;
    } else {
        throw new Error(response.error || 'Unknown error in offscreen document.');
    }
}

// The functions below use the new non-blocking callOpenAIFormatAPI.

export async function getSummary(text) {
    // 1. Define the hardcoded default prompt as a fallback.
    const defaultPrompt = `You are a text analysis expert. I will provide you with the text content of a webpage. Your task is to generate a very concise, one-sentence summary of what this page is about. Here is the content:

{{PAGE_CONTENT}}`;

    // 2. Get the user's custom prompt from storage.
    const { customGeneralPrompt } = await chrome.storage.local.get('customGeneralPrompt');

    // 3. Choose which prompt template to use.
    const promptTemplate = customGeneralPrompt || defaultPrompt;

    // 4. Inject the actual page content into the template.
    const finalPrompt = promptTemplate.replace('{{PAGE_CONTENT}}', text.substring(0, 10000));
    
    // 5. Call the AI with the final, complete prompt.
    return callOpenAIFormatAPI(finalPrompt);
}

export async function getSessionSummary(logText) {
    const prompt = `You are a highly efficient personal assistant. Analyze the following browsing log and generate a structured report. The report should have two parts: 1. An "Overall Summary" of the entire session. 2. A "Categorized Links" section where you group the visited pages by topic. Use Markdown for formatting. Here is the log:\n\n${logText}`;
    return callOpenAIFormatAPI(prompt);
}

export async function extractCustomData(text, fields) {
    const prompt = `You are a data extraction expert. From the following text, extract the data for the fields defined in this JSON: ${fields}. Respond ONLY with a valid JSON object containing the extracted data. Do not include any other text or explanations. Here is the text to analyze:\n\n${text.substring(0, 15000)}`;
    
    const jsonResponse = await callOpenAIFormatAPI(prompt);
    const cleaned = jsonResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
}

export async function generateRuleFromText(naturalLanguageText) {
    const prompt = `You are a specialized AI component in a software application. Your sole purpose is to convert a user's natural language request into a specific JSON format.

The required JSON format is an object where each key is the desired field name (in snake_case) and the value is a brief, helpful description of that field.

**CRITICAL RULES:**
1.  Respond ONLY with the valid JSON object.
2.  Do NOT include any explanatory text, comments, introductions, or closing remarks.
3.  Do NOT wrap the JSON in markdown code blocks like 
\`\`\`json
... 
\`\`\`
.

---
**EXAMPLE 1**
**User Request:** Get the name of the author and the date it was published.
**Your Response:**
{"author_name": "The name of the article's author", "publication_date": "The date the article was published"}
---
**EXAMPLE 2**
**User Request:** For a GitHub page, I need the repo name and the main language.
**Your Response:**
{"repository_name": "The name of the GitHub repository", "primary_language": "The main programming language used in the repository"}
---

**User Request:**
${naturalLanguageText}
**Your Response:**
`;
    const jsonResponse = await callOpenAIFormatAPI(prompt);
    return JSON.parse(jsonResponse);
}
