// Service Worker for Mandem.OS Workspace
// Provides offline support and API fallbacks

const CACHE_NAME = 'mandem-os-workspace-v1';
const API_CACHE_NAME = 'mandem-os-api-v1';

// Files to cache for offline use
const CACHE_FILES = [
    './index.html',
    './css/style.css',
    './js/main.js',
    './manifest.json',
    // Add other essential files
];

// API endpoints that should return mock data when offline
const API_ENDPOINTS = [
    '/api/ping',
    '/api/models',
    '/api/players/leaderboard',
    '/api/start-server'
];

// Mock API responses for offline use
const MOCK_RESPONSES = {
    '/api/ping': {
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ status: 'online', timestamp: new Date().toISOString() })
    },
    '/api/models': {
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve([
            {
                name: 'Sample 3D Model',
                author: 'Mandem.OS',
                preview: './images/model-preview.jpg',
                filename: 'sample.glb',
                description: 'Sample 3D model for testing'
            }
        ])
    },
    '/api/players/leaderboard': {
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({
            players: [
                { id: 1, name: 'Player1', score: 1000 },
                { id: 2, name: 'Player2', score: 900 },
                { id: 3, name: 'Player3', score: 800 }
            ]
        })
    },
    '/api/start-server': {
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ message: 'Server started successfully' })
    }
};

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('[Service Worker] Installed successfully');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activated successfully');
            return self.clients.claim();
        })
    );
});

// Fetch event - handle API requests with mock data when offline
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle API requests
    if (API_ENDPOINTS.some(endpoint => url.pathname.endsWith(endpoint))) {
        event.respondWith(
            handleApiRequest(event.request)
        );
        return;
    }

    // Handle regular requests with cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache successful responses
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Network failed, try to return cached version
                        return caches.match(event.request);
                    });
            })
    );
});

// Handle API requests with mock data
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const endpoint = API_ENDPOINTS.find(ep => url.pathname.endsWith(ep));

    if (endpoint && MOCK_RESPONSES[endpoint]) {
        console.log(`[Service Worker] Serving mock response for: ${endpoint}`);
        const mockResponse = MOCK_RESPONSES[endpoint];

        return new Response(
            JSON.stringify(await mockResponse.json()),
            {
                status: mockResponse.status,
                statusText: mockResponse.statusText,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }

    // If no mock response available, return 404
    return new Response(
        JSON.stringify({ error: 'API endpoint not available offline' }),
        {
            status: 404,
            statusText: 'Not Found',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

console.log('[Service Worker] Loaded and ready');
