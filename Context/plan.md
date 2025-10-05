Of course. This is an excellent project, and a detailed, phased plan is the best way to ensure success when working with an AI coding assistant.

Here is a comprehensive development plan, breaking down the project into logical phases and specific, actionable tasks. Treat each numbered item as a distinct task you can give to your AI assistant.

---

### **Project: AI Browsing Assistant (Codename: "Context")**

**Core Mission:** To build a browser extension that intelligently logs a user's browsing activity with AI-generated summaries, allowing them to understand and organize their research sessions on-demand.

---

### **Phase 1: The MVP (Minimum Viable Product) – The Core Collector & Manual Control**

**Goal:** Create a functional extension that can be manually started and stopped. While active, it will capture the content of visited pages, generate a one-sentence AI summary, and display these summaries in a simple log.

**1.1. Initial Project & Manifest Setup**

- **Task:** Create the basic file structure for a Chrome Manifest V3 extension.
  
  - `manifest.json`
  
  - `popup.html` (for the user interface)
  
  - `popup.js` (for UI logic)
  
  - `popup.css` (for UI styling)
  
  - `background.js` (for the core logic)
  
  - `icons/` directory with 16, 48, and 128px placeholder icons.

- **Task:** Configure `manifest.json`.
  
  - Set `manifest_version` to `3`.
  
  - Define `name`, `version`, and `description`.
  
  - In `permissions`, request `storage` (to save data) and `activeTab` & `scripting` (to access page content).
  
  - Set up the `action` to use `popup.html`.
  
  - Define the `background` service worker using `background.js`.

**1.2. UI: The Popup Interface**

- **Task:** Design `popup.html`.
  
  - Create a simple layout with a title (e.g., "Context").
  
  - Add a single primary button with the ID `session-toggle-button`.
  
  - Add a status display area (e.g., a `<p>` tag with ID `status-display`).
  
  - Add an empty `<div>` with the ID `log-container` where log entries will be displayed.

- **Task:** Style the UI in `popup.css`.
  
  - Make it clean and simple. Ensure the button is prominent.

- **Task:** Implement the core UI logic in `popup.js`.
  
  - On script load, check `chrome.storage.local` to determine if a session is currently active. Update the button text ("Start Session" or "Stop Session") and status display accordingly.
  
  - Add a click event listener to `session-toggle-button` that sends a message ('startSession' or 'stopSession') to `background.js`.
  
  - After sending the message, immediately update the button and status text to reflect the new state.

**1.3. Background: The Logging Engine**

- **Task:** Set up the service worker in `background.js`.
  
  - Create a `chrome.runtime.onMessage` listener to handle 'startSession' and 'stopSession' messages from the popup. This listener will set a value in `chrome.storage.local` (e.g., `isSessionActive: true/false`).

- **Task:** Implement the page visit trigger.
  
  - Create a `chrome.tabs.onUpdated` listener that fires when a tab is fully loaded (`changeInfo.status === 'complete'`).
  
  - Inside the listener, first check `chrome.storage.local` to see if `isSessionActive` is `true`. If not, do nothing.
  
  - If the session is active, use `chrome.scripting.executeScript` to inject a content-scraping script into the active tab.

**1.4. Content Extraction: The Scraper**

- **Task:** Create the content script file, `content_script.js`. This script is not listed in the manifest; it will be injected programmatically.
  
  - The script should use the **Readability.js** library (you'll need to download and include the `Readability.js` file in your extension's folder) to parse the page's main content.
  
  - The script's logic:
    
    1. Instantiate `new Readability(document).parse()`.
    
    2. Extract the clean `textContent` from the result.
    
    3. Send the `textContent`, page `title`, and `URL` back to `background.js` using `chrome.runtime.sendMessage`.

**1.5. AI Integration & Storage**

- **Task:** In `background.js`, create a listener for messages from `content_script.js`.
  
  - When page content is received, create an async function to call the Gemini API.
  
  - **Prompt:** Use the "Page Summarizer" prompt: `You are a text analysis expert. I will provide you with the text content of a webpage. Your task is to generate a very concise, one-sentence summary of what this page is about.`
  
  - **API Call:** Use `fetch` to make a `POST` request to the `gemini-2.5-flash-preview-05-20:generateContent` endpoint.
  
  - **Log Entry:** Upon receiving a successful AI response, create a JavaScript object: `{ id, timestamp, url, title, aiSummary }`.
  
  - **Storage:** Retrieve the existing log from `chrome.storage.local`, add the new entry, and save the updated log back to storage.

**1.6. Displaying the Log**

- **Task:** In `popup.js`, create a function `renderLog()`.
  
  - This function will get the log array from `chrome.storage.local`.
  
  - It will clear the `log-container` and dynamically create and append HTML elements for each log entry.

- **Task:** Make the log update in real-time.
  
  - Call `renderLog()` when the popup first opens.
  
  - Add a `chrome.storage.onChanged` listener that checks if the log data has changed. If it has, call `renderLog()` again to refresh the view.

---

### **Phase 2: On-Demand Session Summarization**

**Goal:** Allow the user to get a high-level summary and categorized breakdown of the session they've just completed.

**2.1. UI Enhancements**

- **Task:** In `popup.html`, add a "Summarize Session" button (initially disabled) and a `<div>` with ID `summary-container` to display the output.

- **Task:** In `popup.js`, enable the "Summarize Session" button only when the log contains entries.

**2.2. Summarizer Logic**

- **Task:** Add a click listener to the "Summarize Session" button in `popup.js`.
  
  - When clicked, it should retrieve the entire log from storage.
  
  - Format the log data into a simple text string (e.g., `[Timestamp]: [aiSummary]\n...`).
  
  - Send this string to `background.js` via a message ('getSessionSummary').
  
  - Show a "Loading..." state in the UI.

- **Task:** In `background.js`, add a case to the message listener for 'getSessionSummary'.
  
  - It will call the Gemini API with the full log text.
  
  - **Prompt:** Use the "Session Summary" prompt: `You are a highly efficient personal assistant. Analyze this history and generate a structured report with an "Overall Summary" and "Categorized Links" using Markdown.`
  
  - Send the Markdown response from the AI back to `popup.js`.

**2.3. Displaying the Summary**

- **Task:** In `popup.js`, handle the response from the background script.
  
  - Use a lightweight library like **`marked.js`** (included in the extension folder) to convert the Markdown response to HTML.
  
  - Inject this HTML into the `summary-container` and make it visible.

---

### **Phase 3: Custom Extraction Rules**

**Goal:** Implement the "power-user" feature allowing the extension to extract specific, structured data from designated websites.

**3.1. Options Page for Rule Management**

- **Task:** Create `options.html` and `options.js`.

- **Task:** In `manifest.json`, add an `options_page` entry pointing to `options.html`.

- **Task:** In `options.html`, build a UI that allows users to:
  
  - Add a new rule (with inputs for "URL Pattern" and "Fields to Extract").
  
  - View a list of all saved rules.
  
  - Delete an existing rule.

- **Task:** In `options.js`, implement the logic to save, display, and delete rules using `chrome.storage.local`.

**3.2. Update Logging Logic to Use Rules**

- **Task:** In `background.js`, modify the `chrome.tabs.onUpdated` listener.
  
  - After receiving page content, it must first load the rules from storage.
  
  - Check if the current page's URL matches any rule's URL pattern.
  
  - If a match is found, make a **second, separate API call** to Gemini.
  
  - **Prompt:** Use a dynamic "Data Extraction" prompt: `You are a data extraction expert. From the following text, extract these specific fields: [Fields from rule]. Respond only in valid JSON format.`
  
  - Parse the JSON response.
  
  - When creating the log entry, add a `customData` property containing the extracted JSON object.

**3.3. Display Enriched Log Data**

- **Task:** In `popup.js`, update the `renderLog()` function.
  
  - When rendering a log entry, check for the existence of the `customData` property.
  
  - If it exists, format and display the key-value pairs neatly under the main `aiSummary` for that entry.

---

### **Phase 4: Refinement & Release Prep**

**Goal:** Polish the extension, handle errors, and improve the user experience.

**4.1. Error Handling & Security**

- **Task:** Wrap all API calls (`fetch`) and storage interactions in `try...catch` blocks.

- **Task:** Display user-friendly error messages in the UI if the AI fails or storage is corrupt.

- **Task:** Create a system for the user to securely input and save their Gemini API key (e.g., in the Options page). Do not hardcode it.

**4.2. UX/UI Polish**

- **Task:** Refine the CSS to make the UI look professional.

- **Task:** Add loading indicators for all asynchronous operations.

- **Task:** Implement an "onboarding" or "help" section in the Options page to explain how the features work.

**4.3. Data Management**

- **Task:** In the Options page, add buttons to "Export Log as JSON" and "Clear All Data." Implement the logic for these functions.
