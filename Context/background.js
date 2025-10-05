import { getSummary, extractCustomData } from './ai_service.js';
import { addJobToQueue, getPendingJob, updateJobStatus, findInCache, addToCache } from './database.js';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'startSession') {
        chrome.storage.local.set({ isSessionActive: true }, () => {
            console.log('Session started.');
        });
    } else if (message.type === 'stopSession') {
        chrome.storage.local.set({ isSessionActive: false }, () => {
            console.log('Session stopped.');
        });
    } else if (message.type === 'pageContent') {
        console.log("BACKGROUND DEBUG: Received pageContent, adding to processing queue.");
        addJobToQueue(message.payload).catch(console.error);
    } else if (message.type === 'getSessionSummary') {
        // This will be handled by the new pipeline later
        // For now, we don't send a response, so we don't return true.
    }
    // Return false or undefined to indicate we are not sending an asynchronous response.
    return false;
});

let isProcessingQueue = false;

// Create an alarm to run the queue worker periodically
chrome.runtime.onInstalled.addListener(() => {
    console.log('BACKGROUND DEBUG: Creating alarm for queue worker.');
    chrome.alarms.create('queueWorker', {
        periodInMinutes: 0.5 // Run every 30 seconds
    });
});

// Listen for the alarm and trigger the queue processing
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'queueWorker') {
        console.log('BACKGROUND DEBUG: Alarm triggered.');
        processQueue(); // Do not await, let it run in the background
    }
});

async function processQueue() {
    if (isProcessingQueue) {
        console.log('BACKGROUND DEBUG: Queue processing already in progress. Skipping.');
        return;
    }
    isProcessingQueue = true;
    console.log('BACKGROUND DEBUG: Starting queue processing loop.');

    try {
        let job;
        while (job = await getPendingJob()) {
            console.log('BACKGROUND DEBUG: Found pending job:', job);
            await processJob(job);
        }
    } catch (error) {
        console.error('BACKGROUND DEBUG: Error during queue processing loop:', error);
    } finally {
        isProcessingQueue = false;
        console.log('BACKGROUND DEBUG: Finished queue processing loop.');
    }
}

async function processJob(job) {
    try {
        await updateJobStatus(job.id, 'processing');

        // 1. Pre-processing Triage: Check cache and then rules
        const cached = await findInCache(job.url);
        if (cached) {
            console.log('BACKGROUND DEBUG: Cache hit! Skipping AI call.', cached);
            await saveResultToLog(cached);
            await updateJobStatus(job.id, 'complete');
            return;
        }

        const { extractionRules = [] } = await chrome.storage.local.get('extractionRules');
        
        const matchedRule = extractionRules.find(rule => {
            try {
                // Convert wildcard to regex safely, escaping other special characters
                const patternStr = '^' + rule.urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*') + '$';
                const pattern = new RegExp(patternStr);
                return pattern.test(job.url);
            } catch (e) {
                console.error('BACKGROUND DEBUG: Invalid URL pattern in rule:', rule, e);
                return false; // Ignore invalid rules and prevent crashing
            }
        });

        if (matchedRule) {
            job.processingType = 'custom_extraction';
            job.rule = matchedRule;
            console.log('BACKGROUND DEBUG: Matched custom rule:', matchedRule);
        }

        // 2. Dual Path AI Processing
        let summary;
        let customData = null;

        if (job.processingType === 'custom_extraction') {
            console.log('BACKGROUND DEBUG: Performing custom extraction and summary.');
            [summary, customData] = await Promise.all([
                getSummary(job.cleanedContent),
                extractCustomData(job.cleanedContent, job.rule.fields)
            ]);
        } else {
            console.log('BACKGROUND DEBUG: Performing generic summary.');
            summary = await getSummary(job.cleanedContent);
        }

        const result = {
            id: new Date().toISOString() + Math.random(),
            url: job.url,
            title: job.title,
            aiSummary: summary,
            customData: customData,
            timestamp: new Date().toISOString()
        };

        // 3. On Success: Save results and update status
        await saveResultToLog(result);
        await addToCache(result);
        await updateJobStatus(job.id, 'complete');
        console.log('BACKGROUND DEBUG: Job completed successfully.', result);

    } catch (error) {
        console.error('BACKGROUND DEBUG: Error processing job:', error);
        // 4. On Failure: Increment attempts and reset status
        const newAttempts = (job.attempts || 0) + 1;
        if (newAttempts < 3) {
            await updateJobStatus(job.id, 'pending', newAttempts);
        } else {
            await updateJobStatus(job.id, 'failed', newAttempts); // Mark as failed after retries
        }
    }
}

async function saveResultToLog(result) {
    const { browsingLog } = await chrome.storage.local.get({ browsingLog: [] });
    const updatedLog = [result, ...browsingLog];
    return chrome.storage.local.set({ browsingLog: updatedLog });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        chrome.storage.local.get(['isSessionActive'], (result) => {
            if (result.isSessionActive) {
                console.log('BACKGROUND DEBUG: Session is active. Injecting scripts into tab:', tab.url);
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['Readability.js', 'content_script.js']
                });
            }
        });
    }
});