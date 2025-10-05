# Context: Your AI-Powered Browsing Assistant

Context is a Chrome extension that enhances your browsing experience by leveraging AI to summarize web pages, log your journey, and extract specific information based on your needs. It's designed to be a flexible and powerful tool for researchers, students, and anyone who wants to get more out of their time online.

## Features

*   **AI-Powered Summaries:** Automatically get concise, one-sentence summaries of the pages you visit.
*   **Browsing Log:** Keep a local, searchable log of your browsing history, complete with summaries.
*   **Custom Data Extraction:** Define rules to pull specific pieces of information from websites (e.g., product prices, article authors, etc.).
*   **Session-Based Activity:** Start and stop logging sessions to control when the extension is active.
*   **Configurable:** Set your own API endpoint and model for the AI service.
*   **Data Portability:** Export your browsing log to a JSON file.

## How to Install

1.  **Download the Extension:** Clone or download this repository to your local machine.
2.  **Open Chrome Extensions:** Open Google Chrome, navigate to `chrome://extensions/`.
3.  **Enable Developer Mode:** Turn on the "Developer mode" toggle in the top right corner.
4.  **Load the Extension:** Click on "Load unpacked" and select the `Context` directory from the downloaded files.

## How to Use

1.  **Pin the Extension:** Pin the Context extension to your Chrome toolbar for easy access.
2.  **Configure the AI:**
    *   Right-click the extension icon and select "Options".
    *   Enter the base URL, model name, and API key for your AI service. This is compatible with any OpenAI-compatible API.
    .
3.  **Start a Session:**
    *   Click the extension icon to open the popup.
    *   Click "Start Session". The extension will now start processing the pages you visit.
4.  **View Your Log:** The popup displays a log of your visited pages and their summaries.
5.  **Stop a Session:** Click "Stop Session" in the popup to pause logging.

## Configuration

### AI Configuration

You must configure the AI service for the extension to work. In the options page, you can set:

*   **Base URL:** The base URL of your AI provider's API (e.g., `https://api.openai.com/v1`).
*   **Model Name:** The name of the model you want to use (e.g., `gpt-3.5-turbo`).
*   **API Key:** Your API key for the service.

### Custom Extraction Rules

You can create rules to extract specific data from pages that match a certain URL pattern.

1.  **Go to the Options Page.**
2.  **Describe the Data:** In the "Rule Fields" section, describe in natural language the data you want to extract (e.g., "the author's name and the article's publication date").
3.  **Generate the Rule:** Click "Generate Rule" to have the AI create a JSON structure for the fields.
4.  **Add URL Pattern:** Specify a URL pattern where this rule should apply (e.g., `https://www.example.com/articles/*`).
5.  **Save the Rule:** Click "Add Rule".

Now, when you visit a page matching the pattern, the extension will try to extract the data you defined in addition to the summary.