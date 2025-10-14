// Example fix for invalid assignment in if statement
// if (a = b) { ... }  -->  if (a === b) { ... }

// Fix invalid assignment in if statement
// Replace any 'if (a = b)' with 'if (a === b)' or correct logic

// Dynamically determine backend API base URL
const API_BASE_URL =
  window.location.origin.includes('localhost') || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000' // Local dev
    : window.location.origin; // Production (same host as frontend)

// Use getApiBaseUrl() for all fetch calls
// Example:
// fetch(`${getApiBaseUrl()}/api/machine/status`, ...)