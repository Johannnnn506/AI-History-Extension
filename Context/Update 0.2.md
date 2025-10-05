Of course. I've reviewed your project files. Here is a complete overview of the project's plan and the immediate next steps for your AI assistant.

---

### ## 1. The Complete Project Plan

Your project, "**Context**," is an intelligent browser extension designed to help users record and understand their web browsing sessions. It acts as a personal research assistant by automatically summarizing visited pages and organizing them for later use.

The architecture is built around a **resilient data processing pipeline** to ensure reliability, even if the AI service is temporarily unavailable. 🧠


#### **Core Mission**

The extension serves two primary user needs:
* **Work Process Recording:** To create a clear, narrative log of a browsing session that helps users understand and document their workflow.
* **Data Collection:** To gather valuable content and structured data from webpages, which can then be exported to personal knowledge bases (like NotebookLM).

#### **The Technical Plan**

The project is structured in three main phases:

* **Phase 1: Build a Resilient Data Pipeline.** This foundational phase replaces a simple, direct-to-AI approach with a robust, queue-based system.
    1.  **Capture:** When the user is in an active session, the extension captures the main text content of visited pages using the `Readability.js` library.
    2.  **Queue:** Instead of processing immediately, the captured content is saved as a "job" in a local `IndexedDB` database (`processingQueue`) with a status of `'pending'`.
    3.  **Process:** A background worker, triggered by `chrome.alarms` every 30 seconds, picks up a pending job. It first checks a `summaryCache` to avoid duplicate work. If no cache exists, it calls the AI service to generate a summary or extract custom data. The worker includes retry logic for failed attempts.
    4.  **Store:** The final summary and any custom data are saved to the main `browsingLog` (in `chrome.storage.local`) and the `summaryCache`.

* **Phase 2: Enhance the User Experience.** This phase focuses on making the asynchronous backend transparent and controllable for the user. The UI will be updated to show the status of pages being processed (e.g., "Summarizing...") and provide controls to manage the queue.

* **Phase 3: Feature Expansion.** With a solid foundation, this phase adds advanced features that directly serve the core mission:
    1.  **Projects:** Allow users to group sessions under a specific project name for better organization.
    2.  **Collection View:** Create a dedicated, searchable "workbench" view for all logged data, allowing users to filter, select, and export specific information.
    3.  **Advanced Export:** Offer multiple export formats tailored to different needs (e.g., clean text for knowledge bases, JSON for structured data).

---

### ## 2. Where We Are and What's Next

You are currently in the middle of **Phase 1**. You've successfully built several key components of the resilient data pipeline.

#### **What You Have Completed:**

* **Database (`database.js`):** You have a solid module for handling `IndexedDB` with functions to manage the `processingQueue` and `summaryCache`.
* **Capture (`content_script.js`):** Your content script correctly uses `Readability.js` to extract clean page content and send it to the background.
* **Queueing (`background.js`):** Your background script correctly receives the page content and adds it as a job to the `processingQueue` using `addJobToQueue()`.
* **Worker Trigger (`background.js`):** The `chrome.alarms` system is set up to run the queue worker periodically.
* **Basic Processing (`background.js`):** The `processJob` function correctly handles the "happy path": it checks the cache, calls the AI for a generic summary, and saves the result.

#### **What's Next: Complete Phase 1**

Your immediate next task is to **fully implement the "Triage" and "Dual Path" logic** for the queue worker. The current `processJob` function only handles generic summaries and doesn't yet incorporate the Custom Extraction Rules.

**Next Instruction for your AI Assistant:**

"Update `background.js` to complete the `processJob` function. It needs to handle the **Pre-Processing Triage** and **Dual Path AI Processing** logic we planned.

Here are the specific steps:

1.  **In `background.js`, modify the `processJob` function:**
    * After the cache check (`findInCache`), add the **Rule Check** logic. Before calling the AI, you must load the `extractionRules` from `chrome.storage.local`.
    * Check if the `job.url` matches any of the saved rule patterns.
    * If a rule matches, update the job's `processingType` to `'custom_extraction'` and attach the matched `rule` to the job object for later use.

2.  **Create the Dual AI Processing Path:**
    * If the `job.processingType` is `'custom_extraction'`:
        * Call `ai_service.js`'s `extractCustomData()` function, passing it the `job.cleanedContent` and the `rule.fields`.
        * Store the result in the `customData` property of the final log entry object.
        * You should *still* call `getSummary()` to ensure every entry has a basic summary.
    * If the `job.processingType` is `'generic_summary'` (the existing logic), simply call `getSummary()`.

3.  **Update the `saveResultToLog` call** to include the `customData` field (which can be `null` if no rule was applied). The final object saved to the log and cache must contain both the `aiSummary` and the `customData`."