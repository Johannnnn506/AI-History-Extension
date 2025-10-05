const DB_NAME = 'ContextDB';
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject('Database error: ' + event.target.error);
        };

        request.onupgradeneeded = (event) => {
            const tempDb = event.target.result;
            
            // Create the processingQueue object store
            if (!tempDb.objectStoreNames.contains('processingQueue')) {
                const queueStore = tempDb.createObjectStore('processingQueue', { keyPath: 'id', autoIncrement: true });
                queueStore.createIndex('status', 'status', { unique: false });
            }

            // Create the summaryCache object store
            if (!tempDb.objectStoreNames.contains('summaryCache')) {
                const cacheStore = tempDb.createObjectStore('summaryCache', { keyPath: 'url' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
    });
}

// We will add more functions here later.

export { openDB };

export async function addJobToQueue(pageData) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['processingQueue'], 'readwrite');
        const store = transaction.objectStore('processingQueue');
        const job = {
            url: pageData.url,
            title: pageData.title,
            cleanedContent: pageData.textContent,
            status: 'pending',
            attempts: 0,
            processingType: 'generic_summary',
            rule: null
        };
        const request = store.add(job);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error adding job to queue: ' + event.target.error);
    });
}

export async function getPendingJob() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['processingQueue'], 'readonly');
        const store = transaction.objectStore('processingQueue');
        const index = store.index('status');
        const request = index.get('pending');

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error getting pending job: ' + event.target.error);
    });
}

export async function updateJobStatus(jobId, status, attempts) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['processingQueue'], 'readwrite');
        const store = transaction.objectStore('processingQueue');
        const request = store.get(jobId);

        request.onsuccess = () => {
            const job = request.result;
            if (job) {
                job.status = status;
                if (attempts !== undefined) {
                    job.attempts = attempts;
                }
                const updateRequest = store.put(job);
                updateRequest.onsuccess = () => resolve(updateRequest.result);
                updateRequest.onerror = (event) => reject('Error updating job: ' + event.target.error);
            } else {
                resolve(null); // Job not found
            }
        };
        request.onerror = (event) => reject('Error finding job to update: ' + event.target.error);
    });
}

export async function findInCache(url) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['summaryCache'], 'readonly');
        const store = transaction.objectStore('summaryCache');
        const request = store.get(url);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error finding in cache: ' + event.target.error);
    });
}

export async function addToCache(summary) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['summaryCache'], 'readwrite');
        const store = transaction.objectStore('summaryCache');
        const request = store.put(summary);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject('Error adding to cache: ' + event.target.error);
    });
}
