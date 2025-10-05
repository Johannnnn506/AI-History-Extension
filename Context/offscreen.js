// This script runs in the offscreen document.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'call-ai-api') {
        // Use an async function to handle the fetch and response
        const handleFetch = async () => {
            try {
                const response = await fetch(message.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${message.apiKey}`
                    },
                    body: JSON.stringify({
                        model: message.modelName,
                        messages: [{ role: "user", content: message.prompt }]
                    })
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
                }

                const data = await response.json();
                if (!data.choices || data.choices.length === 0) {
                    throw new Error('Invalid response format from AI API.');
                }

                return { success: true, content: data.choices[0].message.content.trim() };
            } catch (error) {
                console.error('Offscreen fetch error:', error);
                return { success: false, error: error.message };
            }
        };

        handleFetch().then(sendResponse);
        return true; // Indicates that the response is asynchronous.
    }
});
