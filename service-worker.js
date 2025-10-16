/**
 * SERVICE WORKER - Offline Support & Sync
 * Enables all projects to work offline and sync when back online
 */

const CACHE_NAME = 'barbrickdesign-v2';
const OFFLINE_URL = 'offline.html';

// Files to cache for offline access
const CACHE_URLS = [
    '/',
    '/index.html',
    '/universal-wallet-connect.js',
    '/wallet-adapter.js',
    '/universal-wallet-auth.js',
    '/auth-integration.js',
    '/contractor-registry.js',
    '/security-clearance-auth.js',
    '/samgov-api-integration.js',
    '/coinbase-wallet-integration.js',
    '/pumpfun-integration.js',
    '/dev-compensation-calculator.js',
    '/project-tokenomics.js',
    '/samgov-integration.js',
    '/crypto-bidding-system.js',
    '/mobile-responsive.css',
    '/dev-time-tracker.html',
    '/gembot-control-3d.html',
    '/investment-dashboard.html',
    '/server-health-monitor.html',
    '/test-all-projects.html',
    '/classified-contracts.html',
    '/contractor-registration.html',
    '/contractor-portal.html',
    '/admin-contractor-dashboard.html',
    '/mandem.os/workspace/index.html',
    '/mandem.os/index.html',
    '/ember-terminal/app.html',
    '/ember-terminal/index.html',
    'https://cdn.jsdelivr.net/npm/@solana/web3.js@1.95.8/lib/index.iife.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(CACHE_URLS.map(url => new Request(url, {cache: 'reload'})));
            })
            .catch((error) => {
                console.error('[Service Worker] Cache install failed:', error);
            })
    );
    
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip chrome extensions and non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch((error) => {
                    console.log('[Service Worker] Fetch failed, serving offline page:', error);
                    
                    // Return offline page for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    
                    return new Response('Offline - Content not available', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                });
            })
    );
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
    
    if (event.tag === 'sync-time-entries') {
        event.waitUntil(syncTimeEntries());
    }
    
    if (event.tag === 'sync-wallet-state') {
        event.waitUntil(syncWalletState());
    }
});

// Sync functions
async function syncData() {
    try {
        console.log('[Service Worker] Syncing data...');
        
        // Get pending data from IndexedDB
        const pendingData = await getPendingData();
        
        if (pendingData && pendingData.length > 0) {
            for (const item of pendingData) {
                try {
                    // Send to server/blockchain
                    await fetch('/api/sync', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(item)
                    });
                    
                    // Mark as synced
                    await markAsSynced(item.id);
                } catch (error) {
                    console.error('[Service Worker] Sync failed for item:', item.id, error);
                }
            }
        }
        
        console.log('[Service Worker] Data sync complete');
    } catch (error) {
        console.error('[Service Worker] Sync error:', error);
        throw error;
    }
}

async function syncTimeEntries() {
    try {
        console.log('[Service Worker] Syncing time entries...');
        
        // Sync compensation calculator time entries
        const timeEntries = await getStoredTimeEntries();
        
        if (timeEntries && timeEntries.length > 0) {
            // Backup to cloud/blockchain when online
            console.log(`[Service Worker] Found ${timeEntries.length} time entries to sync`);
        }
        
        return true;
    } catch (error) {
        console.error('[Service Worker] Time entry sync error:', error);
        throw error;
    }
}

async function syncWalletState() {
    try {
        console.log('[Service Worker] Syncing wallet state...');
        
        // Restore wallet connections when back online
        const walletState = await getStoredWalletState();
        
        if (walletState) {
            console.log('[Service Worker] Wallet state ready for restoration');
        }
        
        return true;
    } catch (error) {
        console.error('[Service Worker] Wallet sync error:', error);
        throw error;
    }
}

// Helper functions for IndexedDB operations
async function getPendingData() {
    // This would interface with IndexedDB
    // For now, return empty array
    return [];
}

async function markAsSynced(id) {
    // Mark item as synced in IndexedDB
    console.log('[Service Worker] Marked as synced:', id);
}

async function getStoredTimeEntries() {
    // Get time entries from localStorage/IndexedDB
    try {
        const entries = localStorage.getItem('timeEntries');
        return entries ? JSON.parse(entries) : [];
    } catch {
        return [];
    }
}

async function getStoredWalletState() {
    // Get wallet state from localStorage
    try {
        const state = localStorage.getItem('walletState');
        return state ? JSON.parse(state) : null;
    } catch {
        return null;
    }
}

// Message handling
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.addAll(event.data.urls);
            })
        );
    }
});

console.log('[Service Worker] Loaded and ready');
