// SHARED UTILITY FUNCTIONS
// Common utilities for BARBRICKDESIGN platform

// Modal Management
function createModal(title, content, onClose = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="color: var(--neon-blue); margin: 0;">${title}</h2>
                <span onclick="this.closest('.modal-overlay').remove(); ${onClose ? onClose() : ''}" style="cursor: pointer; font-size: 24px; color: var(--neon-blue);">×</span>
            </div>
            <div>${content}</div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateApiKey(key) {
    return key && key.startsWith('sk-') && key.length > 20;
}

// Local Storage Helpers
function safeLocalStorageGet(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading localStorage key ${key}:`, error);
        return defaultValue;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Error writing localStorage key ${key}:`, error);
        return false;
    }
}

// Toast Notifications
function showToast(message, duration = 3000, type = 'info') {
    const colors = {
        success: 'var(--neon-green)',
        error: 'var(--neon-orange)',
        warning: 'var(--neon-gold)',
        info: 'var(--neon-blue)'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.9);
        border: 2px solid ${colors[type]};
        color: ${colors[type]};
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

// URL Helpers
function getCurrentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
}

function navigateTo(page, addBreadcrumb = true) {
    if (addBreadcrumb) {
        const breadcrumbs = safeLocalStorageGet('navigationHistory', []);
        breadcrumbs.push({
            page: getCurrentPage(),
            timestamp: new Date().toISOString()
        });
        if (breadcrumbs.length > 10) breadcrumbs.shift();
        safeLocalStorageSet('navigationHistory', breadcrumbs);
    }
    window.location.href = page;
}

// Error Handling
function handleError(error, context = 'Unknown') {
    console.error(`[${context}] Error:`, error);
    showToast(`Error in ${context}: ${error.message}`, 5000, 'error');
}

// Loading States
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 2em; margin-bottom: 1rem;">⏳</div>
                <div style="color: var(--neon-blue);">${message}</div>
            </div>
        `;
    }
}

function hideLoading(elementId, originalContent = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = originalContent;
    }
}

// XP System Helpers (for pages that use XP)
function addXP(amount, reason = 'system') {
    // Placeholder - actual implementation in mandem.os
    console.log(`XP: +${amount} (${reason})`);
    showToast(`+${amount} XP: ${reason}`, 2000, 'success');
}

// Wallet Connection Helpers
function isWalletConnected() {
    return typeof window.solana !== 'undefined' && window.solana.isPhantom;
}

function formatAddress(address, length = 6) {
    if (!address) return 'Not Connected';
    return `${address.substring(0, length)}...${address.substring(-length)}`;
}

// Performance Monitoring
function measurePerformance(label) {
    if (window.performance && window.performance.mark) {
        window.performance.mark(`${label}-start`);
        return () => {
            window.performance.mark(`${label}-end`);
            window.performance.measure(label, `${label}-start`, `${label}-end`);
            const measure = window.performance.getEntriesByName(label)[0];
            console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
        };
    }
    return () => {};
}

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createModal,
        validateEmail,
        validateApiKey,
        safeLocalStorageGet,
        safeLocalStorageSet,
        showToast,
        getCurrentPage,
        navigateTo,
        handleError,
        showLoading,
        hideLoading,
        addXP,
        isWalletConnected,
        formatAddress,
        measurePerformance
    };
}
