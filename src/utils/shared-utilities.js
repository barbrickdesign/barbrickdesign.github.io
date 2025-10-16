/**
 * SHARED UTILITIES - Consolidated
 * Common utility functions used across all systems
 * Prevents code duplication and ensures consistency
 */

class SharedUtilities {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Load data from localStorage with error handling
     */
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn(`Failed to load ${key} from storage:`, error);
            return defaultValue;
        }
    }

    /**
     * Save data to localStorage with error handling
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn(`Failed to save ${key} to storage:`, error);
            return false;
        }
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}-${random}`;
    }

    /**
     * Format currency amount
     */
    formatCurrency(amount, currency = 'USD', decimals = 2) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);
    }

    /**
     * Format large numbers with K/M/B suffixes
     */
    formatLargeNumber(num) {
        if (typeof num !== 'number') {
            num = parseFloat(num) || 0;
        }

        const suffixes = ['', 'K', 'M', 'B', 'T'];
        let suffixIndex = 0;

        while (num >= 1000 && suffixIndex < suffixes.length - 1) {
            num /= 1000;
            suffixIndex++;
        }

        return num.toFixed(1) + suffixes[suffixIndex];
    }

    /**
     * Format address for display
     */
    formatAddress(address, startChars = 6, endChars = 4) {
        if (!address || typeof address !== 'string') return '';
        if (address.length <= startChars + endChars) return address;

        return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
    }

    /**
     * Debounce function calls
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };

            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) func(...args);
        };
    }

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Simple cache with TTL
     */
    setCache(key, value, ttl = this.cacheTimeout) {
        const expiresAt = Date.now() + ttl;
        this.cache.set(key, { value, expiresAt });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return cached.value;
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        if (typeof obj === 'string') return obj.trim().length === 0;
        return false;
    }

    /**
     * Safe JSON parse
     */
    safeJsonParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            console.warn('JSON parse error:', error);
            return defaultValue;
        }
    }

    /**
     * Safe JSON stringify
     */
    safeJsonStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.warn('JSON stringify error:', error);
            return defaultValue;
        }
    }

    /**
     * Generate random string
     */
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Check if running on mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Check if running in iframe
     */
    isInIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }

    /**
     * Get URL parameters
     */
    getUrlParams() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    }

    /**
     * Set URL parameter without page reload
     */
    setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url);
    }

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackError) {
                console.error('Failed to copy to clipboard:', fallbackError);
                return false;
            }
        }
    }

    /**
     * Download file
     */
    downloadFile(filename, content, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * Format date for display
     */
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };

        const mergedOptions = { ...defaultOptions, ...options };
        return new Date(date).toLocaleDateString('en-US', mergedOptions);
    }

    /**
     * Calculate time ago
     */
    timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];

        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count > 0) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }

        return 'just now';
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate wallet address format
     */
    isValidWalletAddress(address, type = 'ethereum') {
        if (!address || typeof address !== 'string') return false;

        if (type === 'ethereum') {
            return /^0x[a-fA-F0-9]{40}$/.test(address);
        } else if (type === 'solana') {
            return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
        }

        return false;
    }

    /**
     * Sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Retry function with exponential backoff
     */
    async retry(fn, maxRetries = 3, baseDelay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                if (i === maxRetries - 1) throw error;

                const delay = baseDelay * Math.pow(2, i);
                console.warn(`Retry ${i + 1}/${maxRetries} failed, waiting ${delay}ms:`, error.message);
                await this.sleep(delay);
            }
        }
    }
}

// Create global instance
window.sharedUtils = new SharedUtilities();

console.log('🔧 Shared Utilities loaded - consolidating common functionality');
