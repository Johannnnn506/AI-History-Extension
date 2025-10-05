console.log('CONTENT SCRIPT DEBUG: Injected and running.');

// Check if the Readability script has been loaded
if (typeof Readability === 'undefined') {
    console.error('CONTENT SCRIPT DEBUG: Readability.js is not loaded.');
} else {
    // Bypassing Readability.js to capture more content, including metadata tables.
    // This will be less clean but more comprehensive.
    const pageTitle = document.title;
    const pageText = document.body.innerText;

    console.log('CONTENT SCRIPT DEBUG: Bypassing Readability. Sending document.body.innerText.');

    if (pageText) {
        chrome.runtime.sendMessage({
            type: 'pageContent',
            payload: {
                url: window.location.href,
                title: pageTitle,
                textContent: pageText
            }
        });
    } else {
        console.log('CONTENT SCRIPT DEBUG: document.body.innerText is empty. Nothing to send.');
    }
}
