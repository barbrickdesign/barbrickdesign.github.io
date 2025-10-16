/**
 * UNIVERSAL AUTHENTICATION SYSTEM
 * Single wallet connection shared across all pages
 * Uses signed message for verification
 */

class UniversalAuth {
    constructor() {
        this.isAuthenticated = false;
        this.walletAddress = null;
        this.walletType = null;
        this.signature = null;
        this.verifiedAt = null;
    }

    /**
     * Check if user is authenticated
     */
    async checkAuth() {
        // Load from localStorage
        const verified = localStorage.getItem('wallet_verified');
        const address = localStorage.getItem('wallet_address');
        const walletType = localStorage.getItem('wallet_type');
        const signature = localStorage.getItem('wallet_signature');
        const verifiedAt = localStorage.getItem('wallet_verified_at');

        if (verified === 'true' && address && signature) {
            // Check if verification is not too old (24 hours)
            const verifiedDate = new Date(verifiedAt);
            const now = new Date();
            const hoursSinceVerification = (now - verifiedDate) / (1000 * 60 * 60);

            if (hoursSinceVerification < 24) {
                this.isAuthenticated = true;
                this.walletAddress = address;
                this.walletType = walletType;
                this.signature = JSON.parse(signature);
                this.verifiedAt = verifiedAt;

                console.log('✅ User authenticated:', {
                    address: this.getShortAddress(),
                    type: this.walletType,
                    verifiedHoursAgo: hoursSinceVerification.toFixed(1)
                });

                return true;
            } else {
                console.log('⚠️ Authentication expired (>24h), please reconnect');
                this.clearAuth();
                return false;
            }
        }

        console.log('❌ User not authenticated');
        return false;
    }

    /**
     * Get authenticated wallet info
     */
    getWalletInfo() {
        if (!this.isAuthenticated) {
            return null;
        }

        return {
            address: this.walletAddress,
            shortAddress: this.getShortAddress(),
            type: this.walletType,
            signature: this.signature,
            verifiedAt: this.verifiedAt,
            isAuthenticated: true
        };
    }

    /**
     * Get shortened wallet address
     */
    getShortAddress() {
        if (!this.walletAddress) return null;
        return this.walletAddress.slice(0, 6) + '...' + this.walletAddress.slice(-4);
    }

    /**
     * Clear authentication
     */
    clearAuth() {
        this.isAuthenticated = false;
        this.walletAddress = null;
        this.walletType = null;
        this.signature = null;
        this.verifiedAt = null;

        localStorage.removeItem('wallet_verified');
        localStorage.removeItem('wallet_signature');
        localStorage.removeItem('wallet_verified_at');
    }

    /**
     * Redirect to index.html if not authenticated
     */
    requireAuth(redirectUrl = '/') {
        if (!this.isAuthenticated) {
            console.log('🔒 Authentication required, redirecting...');
            alert('Please connect your wallet first.');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Show authentication status in page (optional)
     */
    displayAuthStatus(containerId = 'authStatus') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.isAuthenticated) {
            container.innerHTML = `
                <div style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 15px; background: rgba(0,255,0,0.1); border: 1px solid #00ff00; border-radius: 5px;">
                    <span style="color: #00ff00;">✅ Connected:</span>
                    <span style="color: #00ffff;">${this.getShortAddress()}</span>
                    <span style="color: #00ff00;">(${this.walletType})</span>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="padding: 10px 15px; background: rgba(255,165,0,0.1); border: 1px solid orange; border-radius: 5px;">
                    <span style="color: orange;">⚠️ Not connected</span>
                    <a href="/" style="color: #00ffff; margin-left: 10px;">Connect Wallet</a>
                </div>
            `;
        }
    }

    /**
     * Get user signature for API authentication
     */
    getAuthHeaders() {
        if (!this.isAuthenticated) {
            return {};
        }

        return {
            'X-Wallet-Address': this.walletAddress,
            'X-Wallet-Type': this.walletType,
            'X-Wallet-Signature': JSON.stringify(this.signature),
            'X-Verified-At': this.verifiedAt
        };
    }

    /**
     * Check if wallet matches (for security)
     */
    async verifyCurrentWallet() {
        if (!this.isAuthenticated) return false;

        try {
            // Check if wallet is still connected
            if (this.walletType === 'Phantom' && window.solana) {
                const provider = window.phantom?.solana || window.solana;
                if (provider.isConnected && provider.publicKey) {
                    const currentAddress = provider.publicKey.toString();
                    if (currentAddress === this.walletAddress) {
                        console.log('✅ Wallet verified: still connected');
                        return true;
                    } else {
                        console.warn('⚠️ Wallet address changed!');
                        this.clearAuth();
                        return false;
                    }
                }
            } else if (this.walletType === 'MetaMask' && window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    const currentAddress = accounts[0];
                    if (currentAddress.toLowerCase() === this.walletAddress.toLowerCase()) {
                        console.log('✅ Wallet verified: still connected');
                        return true;
                    } else {
                        console.warn('⚠️ Wallet address changed!');
                        this.clearAuth();
                        return false;
                    }
                }
            }

            // If we can't verify, assume it's still valid (offline mode)
            console.log('⚠️ Cannot verify wallet connection (offline mode)');
            return true;
        } catch (error) {
            console.warn('⚠️ Wallet verification error:', error.message);
            return true; // Don't fail on errors
        }
    }
}

// Create global instance
window.universalAuth = new UniversalAuth();

// Auto-check authentication on page load
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🔐 Universal Auth initializing...');
    await window.universalAuth.checkAuth();
    
    // Verify wallet is still connected
    if (window.universalAuth.isAuthenticated) {
        await window.universalAuth.verifyCurrentWallet();
    }
    
    // Dispatch event for pages to react
    window.dispatchEvent(new CustomEvent('authStatusChanged', {
        detail: window.universalAuth.getWalletInfo()
    }));
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalAuth;
}
