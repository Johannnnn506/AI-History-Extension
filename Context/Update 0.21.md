

### \#\# The Plan: A User-Friendly, AI-Powered Rule Generator

The goal is to make the "Custom Extraction Rules" feature accessible to all users, regardless of their technical knowledge. We will achieve this with a hybrid approach that combines a simple user experience with a reliable backend.

  * **The User Experience:** Instead of writing complex JSON, the user will describe the data they want to extract in **plain English** (e.g., "Get the repo name and main language").
  * **The Technical Strategy:** We will use a dedicated, one-time AI call to **translate the user's natural language request into the structured JSON format** our system requires. The user will be shown the generated JSON and asked to confirm it before saving.
  * **The Benefit:** This gives us the best of both worlds: a simple, intuitive interface for the user and the robust, predictable data structure our processing pipeline needs for reliable execution.

-----

### \#\# Instructions for Your AI Assistant

Your task is to update the extension's options page to implement this new AI-powered rule generation flow. This will involve modifying `options.html`, `ai_service.js`, and `options.js`.

#### **Step 1: Update the User Interface (`options.html`)**

Modify the "Add New Rule" form to support the new workflow.

1.  **Change the Fields Input:** Find the `<textarea>` with the ID `rule-fields`. Change its `placeholder` text to guide the user to enter a natural language request. For example: `placeholder="Describe the data you want (e.g., 'Get the author name and publication date')"`.
2.  **Add a "Generate" Button:** Immediately after that `<textarea>`, add a new button: `<button id="generate-rule-button">Generate Rule</button>`.
3.  **Add a Preview Area:** After the "Generate Rule" button, add a new `<pre>` tag where the generated JSON will be displayed for confirmation. Give it an ID: `<pre id="rule-json-preview"></pre>`.

#### **Step 2: Create the AI Translator (`ai_service.js`)**

Add a new function to this file that will be responsible for converting the user's text into our required JSON format.

  * **Action:** Add the following new exported async function to `ai_service.js`:

<!-- end list -->

```javascript
export async function generateRuleFromText(naturalLanguageText) {
    const prompt = `You are a specialized AI component in a software application. Your sole purpose is to convert a user's natural language request into a specific JSON format.

The required JSON format is an object where each key is the desired field name (in snake_case) and the value is a brief, helpful description of that field.

**CRITICAL RULES:**
1.  Respond ONLY with the valid JSON object.
2.  Do NOT include any explanatory text, comments, introductions, or closing remarks.
3.  Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`.

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
**Your Response：**
`;
    const jsonResponse = await callOpenAIFormatAPI(prompt);
    // Return the parsed object to ensure it's valid JSON
    return JSON.parse(jsonResponse);
}
```

#### **Step 3: Implement the Connecting Logic (`options.js`)**

Update this file to connect the new UI to the new AI function and modify the rule-saving logic.

1.  **Import the New Function:** At the top of the file, import `generateRuleFromText` from `./ai_service.js`.
2.  **Get New Element References:** Get references to the new UI elements: `generate-rule-button` and `rule-json-preview`.
3.  **Create the "Generate Rule" Event Listener:** Add a `click` event listener for the `generate-rule-button`. Inside this listener:
      * Get the natural language text from the `rule-fields` textarea.
      * Display a "Generating..." message to the user.
      * Call the `generateRuleFromText()` function in a `try...catch` block.
      * On success, populate the `rule-json-preview` element with the `JSON.stringify(result, null, 2)` of the response.
      * On failure, display an error message to the user.
4.  **Modify the "Add Rule" Logic:** Change the existing `add-rule-button` event listener.
      * Instead of reading and parsing the `rule-fields` textarea, it should now read the content of the `rule-json-preview` element.
      * It should check that the preview area is not empty before proceeding to save the rule.

This completes the implementation of the new, more user-friendly custom rules feature. ✅