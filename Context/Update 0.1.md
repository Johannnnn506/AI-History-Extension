Of course. Based on our conversation, we will upgrade the extension from a simple, direct-to-AI model to a robust, resilient, and more intelligent data processing pipeline. This plan details the necessary changes to your existing files to implement this improved architecture.

**The Guiding Principle:** Decouple data capture from data processing to ensure reliability and add intelligence before making expensive AI calls.

---

### **Phase 1: Implementing the Resilient Data Pipeline**

**Goal:** Replace the current "fire-and-forget" system with a queue-based pipeline that can handle AI service failures and avoid redundant work. This is the most critical architectural change.

**1.1. Create a Database Module (New File)**

- **Action:** Create a new file named `database.js`.

- **Reasoning:** Your current logic mixes storage calls (`chrome.storage.local`) throughout the background script. Centralizing all IndexedDB interactions into one module will make the code much cleaner and easier to manage. IndexedDB is necessary because `localStorage` is not suitable for storing large amounts of page content.

- **Tasks for `database.js`:**
  
  - Define the database schema with two stores:
    
    1. `processingQueue`: To hold raw page content waiting for AI processing. Objects will look like: `{ id, url, title, cleanedContent, status: 'pending', attempts: 0, processingType: 'generic_summary', rule: null }`.
    
    2. `summaryCache`: To store completed summaries, keyed by URL, to prevent duplicate API calls. Objects will look like: `{ url, aiSummary, customData, timestamp }`.
  
  - Create and export functions like `addJobToQueue`, `getPendingJob`, `updateJobStatus`, `findInCache`, and `addToCache`.

**1.2. Reroute the Capture Flow (`background.js`)**

- **Action:** Modify the `chrome.tabs.onUpdated` listener and the message handler for `pageContent`.

- **Reasoning:** This is where we decouple capture from processing. Instead of immediately calling the AI, we will now just add a job to the queue.

- **Tasks:**
  
  1. Import the functions from your new `database.js` module.
  
  2. In the `onMessage` listener for `pageContent`, **remove the call to `summarizeAndStore()`**.
  
  3. Instead, call the new `database.js` function `addJobToQueue()` with the payload from the content script.

**1.3. Build the Queue Worker (`background.js`)**

- **Action:** Create the core processing logic that runs independently of the user's browsing.

- **Reasoning:** This worker is the heart of the new reliable system. It will process jobs from the queue one by one.

- **Tasks:**
  
  1. Use the `chrome.alarms` API to create an alarm that fires periodically (e.g., every 30 seconds) to trigger the worker.
  
  2. Create an onAlarm listener. This listener will contain the main processing logic:
     
     a. Call database.js to get the next job where status is 'pending'. If no job, do nothing.
     
     b. Pre-Processing Triage: Before any AI call, perform the smart checks:
     
     i. Call database.js's findInCache(url). If a result is found, copy the cached data to the main log and mark the job as 'complete'.
     
     ii. If no cache hit, check if the job's URL matches any Custom Extraction Rules. If it does, update the job with processingType: 'custom_extraction'.
     
     c. AI Call: Pass the job to a new processJob() function.
     
     d. Inside processJob(), use a try...catch block to call the relevant function from ai_service.js.
     
     e. On Success: Save the result to the main browsingLog and the summaryCache. Mark the job as 'complete'.
     
     f. On Failure: Update the job's status back to 'pending' and increment the attempts counter.

---

### **Phase 2: Enhancing the User Experience & UI**

**Goal:** Update the popup and options pages to reflect the new, asynchronous nature of the backend and provide the user with more control and insight.

**2.1. Update the Log Display (`popup.js`)**

- **Action:** Modify the `renderLog()` function.

- **Reasoning:** The UI needs to show the user that work is happening in the background. A log entry might exist before its summary is ready.

- **Tasks:**
  
  1. The `renderLog()` function should now also fetch the contents of the `processingQueue`.
  
  2. When rendering entries, if an item is in the log but also in the queue with a `pending` or `processing` status, display a visual indicator next to it (e.g., a small spinner icon or the text "Summarizing...").
  
  3. Once a job is complete and the log updates, the `onChanged` listener will trigger a re-render, and the loading indicator will be replaced by the summary.

**2.2. Add More Control and Transparency (`options.html`, `options.js`)**

- **Action:** Add a new "System Status" section to the options page.

- **Reasoning:** To build trust, users should be able to see what the extension is doing and manually intervene if needed.

- **Tasks:**
  
  1. In `options.html`, add a section to display the number of items currently in the processing queue.
  
  2. Add a "Retry All Failed Items" button.
  
  3. In `options.js`, implement the logic for this button, which would find all jobs with a high `attempts` count and reset their status to `'pending'`.

---

### **Phase 3: Feature Expansion - "Projects" & "Collections"**

**Goal:** Build upon the robust new foundation to implement the features that directly serve your core needs of "recording your work process" and "using the data."

**3.1. Implement the "Projects" Feature**

- **Action:** Modify the UI and data storage to support project-based logging.

- **Reasoning:** To better organize work processes that span multiple sessions.

- **Tasks:**
  
  1. In `popup.html`, add a small text input field near the "Start Session" button, labeled "Project Name (Optional)".
  
  2. When a session is started, save the project name along with the session state.
  
  3. In `background.js`, when creating log entries, add a `projectId` field.
  
  4. In `popup.js`, add a dropdown menu to filter the displayed log by project.

**3.2. Create the "Collection View"**

- **Action:** Add a new view or tab to the popup UI.

- **Reasoning:** To create the "workbench" for your data, separate from the chronological session log.

- **Tasks:**
  
  1. In `popup.html`, add tabs for "Session Log" and "Collection."
  
  2. The "Collection" tab will render the *entire* `browsingLog` and include filter controls (search bar, filter by domain, filter by project).
  
  3. Add checkboxes next to each item in the Collection view.
  
  4. Modify the "Export" button (moving it from Options to the Popup) so it only exports the items currently selected in the Collection view, allowing for targeted data exports.
