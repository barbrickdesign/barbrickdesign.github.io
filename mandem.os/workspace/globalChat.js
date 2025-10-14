// ...existing code...
// Remove or guard any use of 'process' in frontend code
if (typeof process !== 'undefined') {
  // ...existing code that uses process...
}
// Dynamically determine backend API base URL
const API_BASE_URL =
  window.location.origin.includes('localhost') || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000' // Local dev
    : window.location.origin; // Production (same host as frontend)
// Use getApiBaseUrl() for all fetch calls
// Example:
// fetch(`${getApiBaseUrl()}/api/chat/log`, ...)
if (typeof process !== 'undefined') {
  // ...existing code that uses process...
}
// Use getApiBaseUrl() for all fetch calls
// Example:
// fetch(`${getApiBaseUrl()}/api/chat/log`, ...)
// ...existing code...