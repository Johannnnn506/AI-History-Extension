That's an excellent and insightful suggestion. You're thinking about the next level of customization, and I completely agree. Letting the user define their own **"General Summary Rule"** is a natural evolution of the app's philosophy.

This feature would elevate the extension from a tool with a single function into a flexible platform that each user can tailor to their specific workflow.

-----

### \#\# The Plan: A Customizable General Prompt

The idea is to expose the default "page summarizer" prompt to the user, allowing them to modify it. This gives them control over the output for *every* page that doesn't match a specific Custom Extraction Rule.

#### **How It Would Work (User's Perspective)**

We would add a new section in the `options.html` page called **"Default Summary Configuration."**

1.  **Editable Prompt:** This section would contain a `<textarea>` that is pre-filled with the current default prompt.
2.  **Clear Instructions:** We would add a note explaining how it works, like:
    > "Edit the prompt below to change how every page is summarized. Use the `{{PAGE_CONTENT}}` variable to tell the AI where to insert the text from the webpage."
3.  **Save and Reset:** There would be a "Save" button to store their custom prompt and a "Reset to Default" button in case they want to revert to the original.

#### **Example Use Cases**

With this, a user could change the extension's behavior entirely:

  * **For a student:** "Summarize the key arguments and evidence from the following text: `{{PAGE_CONTENT}}`"
  * **For a developer:** "Extract the names of any software libraries or tools mentioned in the following text: `{{PAGE_CONTENT}}`"
  * **For a multi-point summary:** "Provide a three-bullet-point summary of the following text: `{{PAGE_CONTENT}}`"

-----

### \#\# Instructions for Your AI Assistant

Here are the step-by-step instructions to implement this feature.

#### **Step 1: Update the Settings UI (`options.html`)**

  * **Action:** Add a new "Default Summary Configuration" section to the `options.html` file.
  * **Details:**
      * Add an `<h2>` heading.
      * Add a `<textarea>` with an ID like `custom-general-prompt`.
      * Add two buttons: `<button id="save-general-prompt">Save Prompt</button>` and `<button id="reset-general-prompt">Reset to Default</button>`.

#### **Step 2: Add Logic to Manage the Custom Prompt (`options.js`)**

  * **Action:** Add the logic to load, save, and reset the custom general prompt.
  * **Details:**
    1.  **On `DOMContentLoaded`:**
          * Get the custom prompt from `chrome.storage.local` (e.g., from a key named `customGeneralPrompt`).
          * If it exists, populate the `custom-general-prompt` textarea with it.
          * If it does not exist, populate the textarea with the hardcoded default prompt.
    2.  **Add a `click` listener** to the `save-general-prompt` button that saves the content of the textarea to `chrome.storage.local`.
    3.  **Add a `click` listener** to the `reset-general-prompt` button that clears the `customGeneralPrompt` key from storage and repopulates the textarea with the default prompt.

#### **Step 3: Make the AI Service Use the Custom Prompt (`ai_service.js`)**

  * **Action:** Modify the `getSummary(text)` function to be dynamic.

  * **Reasoning:** This is the core logic change. Instead of using a hardcoded prompt, this function will now check for a user-defined one.

  * **Instructions:**

    Update the `getSummary(text)` function with the following logic:

    ```javascript
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
    ```

This implementation is highly efficient because it requires no changes to the `background.js` worker. The logic is neatly encapsulated within the settings page and the AI service, where it belongs.