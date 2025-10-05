
document.addEventListener('DOMContentLoaded', () => {
    const sessionToggleButton = document.getElementById('session-toggle-button');
    const statusDisplay = document.getElementById('status-display');

    // Check initial session state from storage
    chrome.storage.local.get(['isSessionActive'], (result) => {
        updateUI(result.isSessionActive);
    });

    // Initial render of the log
    renderLog();

    // Listen for changes in storage and re-render the log
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.browsingLog) {
            renderLog();
        }
    });

    // Listen for summary response from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'sessionSummaryResponse') {
            const summaryContainer = document.getElementById('summary-container');
            if (message.error) {
                summaryContainer.innerHTML = `<p>Error: ${message.error}</p>`;
            } else {
                summaryContainer.innerHTML = marked.parse(message.payload);
            }
        }
    });

    // Add click listener to the toggle button
    sessionToggleButton.addEventListener('click', () => {
        chrome.storage.local.get(['isSessionActive'], (result) => {
            const wasActive = result.isSessionActive;
            const isActive = !wasActive;

            // Update the UI immediately for a responsive feel
            updateUI(isActive);

            // Send a message to the background to persist the state
            chrome.runtime.sendMessage({ type: isActive ? 'startSession' : 'stopSession' });
        });
    });

    const summarizeButton = document.getElementById('summarize-button');
    summarizeButton.addEventListener('click', () => {
        const summaryContainer = document.getElementById('summary-container');
        summaryContainer.innerHTML = '<p>Generating summary...</p>';

        chrome.storage.local.get({ browsingLog: [] }, (result) => {
            const log = result.browsingLog;
            let formattedLog = "";
            for (const entry of log) {
                formattedLog += `[${entry.timestamp}] ${entry.title}: ${entry.aiSummary}\n`;
            }

            chrome.runtime.sendMessage({ type: 'getSessionSummary', payload: formattedLog });
        });
    });

    function updateUI(isActive) {
        if (isActive) {
            sessionToggleButton.textContent = 'Stop Session';
            sessionToggleButton.style.backgroundColor = '#dc3545'; // Red for stop
            statusDisplay.textContent = 'Active';
        } else {
            sessionToggleButton.textContent = 'Start Session';
            sessionToggleButton.style.backgroundColor = '#007bff'; // Blue for start
            statusDisplay.textContent = 'Inactive';
        }
    }

    function renderLog() {
        const logContainer = document.getElementById('log-container');
        const summarizeButton = document.getElementById('summarize-button');

        chrome.storage.local.get({ browsingLog: [] }, (result) => {
            logContainer.innerHTML = ''; // Clear previous entries
            const log = result.browsingLog;

            // Enable or disable the summarize button based on log content
            summarizeButton.disabled = log.length === 0;

            if (log.length === 0) {
                logContainer.innerHTML = '<p>No activity logged yet.</p>';
                return;
            }

            for (const entry of log) {
                const logEntryDiv = document.createElement('div');
                logEntryDiv.className = 'log-entry';

                const title = document.createElement('a');
                title.href = entry.url;
                title.textContent = entry.title;
                title.target = '_blank';
                logEntryDiv.appendChild(title);

                const summary = document.createElement('p');
                summary.textContent = entry.aiSummary;
                logEntryDiv.appendChild(summary);

                // Display custom data if it exists
                if (entry.customData) {
                    const customDataPre = document.createElement('pre');
                    customDataPre.textContent = JSON.stringify(entry.customData, null, 2);
                    const customDataTitle = document.createElement('strong');
                    customDataTitle.textContent = 'Extracted Data:';
                    logEntryDiv.appendChild(customDataTitle);
                    logEntryDiv.appendChild(customDataPre);
                }

                logContainer.appendChild(logEntryDiv);
            }
        });
    }
});
