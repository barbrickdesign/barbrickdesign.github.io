/**
 * Security Manager for AI API Keys
 * Handles secure storage and management of API keys
 *
 * IMPORTANT SECURITY NOTES:
 * - Client-side storage is inherently insecure
 * - Consider server-side proxy for production
 * - Never store sensitive keys in plain text
 * - Use environment variables or secure key vaults
 * - Implement proper key rotation
 */

class SecurityManager {
    constructor() {
        this.storageKey = 'barbrick_ai_keys';
        this.encryptionKey = 'barbrick_secure_key_v1'; // In production, use proper key management
        this.keys = this.loadKeys();
    }

    /**
     * Simple encryption/decryption (NOT SECURE for production)
     * Use proper cryptography libraries for real security
     */
    simpleEncrypt(text) {
        // This is a placeholder - implement proper encryption
        return btoa(text); // Base64 encoding - NOT secure
    }

    simpleDecrypt(encoded) {
        // This is a placeholder - implement proper decryption
        return atob(encoded); // Base64 decoding - NOT secure
    }

    /**
     * Load stored keys
     */
    loadKeys() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const decrypted = this.simpleDecrypt(stored);
                return JSON.parse(decrypted);
            }
        } catch (error) {
            console.error('Failed to load stored keys:', error);
        }
        return {};
    }

    /**
     * Save keys securely
     */
    saveKeys() {
        try {
            const encrypted = this.simpleEncrypt(JSON.stringify(this.keys));
            localStorage.setItem(this.storageKey, encrypted);
        } catch (error) {
            console.error('Failed to save keys:', error);
        }
    }

    /**
     * Set API key for a service
     * @param {string} service - Service name (e.g., 'openai')
     * @param {string} key - API key
     */
    setApiKey(service, key) {
        if (!key || key.length < 10) {
            throw new Error('Invalid API key format');
        }

        this.keys[service] = {
            key: key,
            setAt: new Date().toISOString(),
            lastUsed: null
        };

        this.saveKeys();
        console.log(`✅ API key set for ${service}`);
    }

    /**
     * Get API key for a service
     * @param {string} service - Service name
     * @returns {string|null} - API key or null
     */
    getApiKey(service) {
        const keyData = this.keys[service];
        if (keyData) {
            keyData.lastUsed = new Date().toISOString();
            this.saveKeys();
            return keyData.key;
        }
        return null;
    }

    /**
     * Remove API key for a service
     * @param {string} service - Service name
     */
    removeApiKey(service) {
        if (this.keys[service]) {
            delete this.keys[service];
            this.saveKeys();
            console.log(`🗑️ API key removed for ${service}`);
        }
    }

    /**
     * Check if key exists for service
     * @param {string} service - Service name
     * @returns {boolean}
     */
    hasApiKey(service) {
        return !!this.keys[service];
    }

    /**
     * Get all stored services
     * @returns {Array} - Array of service names
     */
    getStoredServices() {
        return Object.keys(this.keys);
    }

    /**
     * Validate API key format (basic check)
     * @param {string} key - API key to validate
     * @param {string} service - Service name
     * @returns {boolean}
     */
    validateApiKey(key, service) {
        if (!key) return false;

        // Basic validation patterns
        const patterns = {
            openai: /^sk-[a-zA-Z0-9]{48}$/,
            anthropic: /^sk-ant-[a-zA-Z0-9_-]+$/,
            // Add more patterns as needed
        };

        const pattern = patterns[service.toLowerCase()];
        return pattern ? pattern.test(key) : key.length > 20;
    }

    /**
     * Initialize security manager
     */
    init() {
        console.log('🔐 Security Manager initialized');
        console.warn('⚠️ SECURITY WARNING: Client-side key storage is insecure. Use server-side proxy for production.');
    }

    /**
     * Clear all stored keys
     */
    clearAllKeys() {
        this.keys = {};
        localStorage.removeItem(this.storageKey);
        console.log('🧹 All stored API keys cleared');
    }
}

// Global instance
window.securityManager = new SecurityManager();
window.securityManager.init();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityManager;
} else {
    // For browser use
}

export default SecurityManager;
