// ...existing code...
// Dynamically determine backend API base URL
const API_BASE_URL =
  window.location.origin.includes('localhost') || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000' // Local dev
    : window.location.origin; // Production (same host as frontend)

// Use getApiBaseUrl() for all fetch calls
// Example:
// fetch(`${getApiBaseUrl()}/api/token/validate`, ...)

if (someObject && someObject.property) {
  // ...existing code...
}

if (someFunction && typeof someFunction.bind === 'function') {
  const bound = someFunction.bind(this);
  // ...existing code...
}

// ...existing code...