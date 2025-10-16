/**
 * WALLET BUTTON COMPONENT - Pump.fun Style
 * Simple, clean, always-visible wallet button
 */

class WalletButton {
    constructor(containerId = 'walletButtonContainer') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Wallet button container not found');
            return;
        }
        
        // Initialize auth system first
        this.initAuth().then(() => {
            this.render();
            this.setupListeners();
        });
    }

    /**
     * Initialize the authentication system
     */
    async initAuth() {
        try {
            // Initialize universal wallet auth if not already done
            if (window.authIntegration && typeof window.authIntegration.init === 'function') {
                await window.authIntegration.init({
                    showUI: false, // We handle the UI
                    onAuthSuccess: (authInfo) => {
                        console.log('✅ Wallet authenticated:', authInfo.address);
                        this.render();
                    },
                    onAuthFail: () => {
                        console.log('⚠️ Wallet auth failed');
                        this.render();
                    }
                });
            }
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
        }
    }

    /**
     * Render the button (Pump.fun style - clean and simple)
     */
    render() {
        // Check shared wallet system first, fallback to universal auth
        let wallet = null;
        if (window.sharedWalletSystem && window.sharedWalletSystem.connected) {
            wallet = {
                address: window.sharedWalletSystem.address,
                shortAddress: window.sharedWalletSystem.address ?
                    window.sharedWalletSystem.address.slice(0, 6) + '...' + window.sharedWalletSystem.address.slice(-4) : 'Unknown',
                authenticated: true
            };
        } else if (window.universalWalletAuth) {
            wallet = window.universalWalletAuth.getAuthInfo();
        }

        if (wallet && wallet.authenticated) {
            // Connected state - show address with dropdown
            this.container.innerHTML = `
                <div class="wallet-button-group">
                    <button id="walletConnectedBtn" class="wallet-btn-connected">
                        <span class="wallet-icon">👛</span>
                        <span class="wallet-address">${wallet.shortAddress}</span>
                    </button>
                    <div id="walletDropdown" class="wallet-dropdown" style="display: none;">
                        <div class="wallet-dropdown-header">
                            <div class="wallet-address-full">${wallet.address}</div>
                            <button class="wallet-copy-btn" onclick="walletButton.copyAddress()">
                                📋 Copy
                            </button>
                        </div>
                        <button class="wallet-disconnect-btn" onclick="walletButton.disconnect()">
                            🚪 Disconnect
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Disconnected state - show connect button
            this.container.innerHTML = `
                <button id="walletConnectBtn" class="wallet-btn-connect">
                    <span class="wallet-icon">🔌</span>
                    <span class="wallet-text">Connect Wallet</span>
                </button>
            `;
        }

        this.attachClickHandlers();
    }

    /**
     * Attach click handlers to buttons
     */
    attachClickHandlers() {
        const connectBtn = document.getElementById('walletConnectBtn');
        const connectedBtn = document.getElementById('walletConnectedBtn');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connect());
        }
        
        if (connectedBtn) {
            connectedBtn.addEventListener('click', () => this.toggleDropdown());
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('walletDropdown');
            if (dropdown && !e.target.closest('.wallet-button-group')) {
                dropdown.style.display = 'none';
            }
        });
    }

    /**
     * Connect wallet
     */
    async connect() {
        const btn = document.getElementById('walletConnectBtn');
        if (!btn) return;

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="wallet-icon">⏳</span><span class="wallet-text">Connecting...</span>';
        btn.disabled = true;

        try {
            let result = null;

            // Try shared wallet system first
            if (window.sharedWalletSystem) {
                result = await window.sharedWalletSystem.connect();
            }
            // Fallback to global connectWallet function (from index.html)
            else if (window.connectWallet) {
                result = await window.connectWallet();
            }
            // Last resort: universal wallet auth
            else if (window.universalWalletAuth) {
                result = await window.universalWalletAuth.connect();
            }

            if (result) {
                // Re-render to show connected state
                this.render();
            } else {
                // Reset button if no result
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            console.error('Connection failed:', error);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        await window.universalWalletAuth.disconnect();
        this.render();
    }

    /**
     * Toggle dropdown menu
     */
    toggleDropdown() {
        const dropdown = document.getElementById('walletDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Copy wallet address to clipboard
     */
    async copyAddress() {
        // Get wallet info from shared system first, fallback to universal auth
        let wallet = null;
        if (window.sharedWalletSystem && window.sharedWalletSystem.connected) {
            wallet = {
                address: window.sharedWalletSystem.address
            };
        } else if (window.universalWalletAuth) {
            wallet = window.universalWalletAuth.getAuthInfo();
        }

        if (!wallet || !wallet.address) return;

        try {
            await navigator.clipboard.writeText(wallet.address);

            // Show copied feedback
            const copyBtn = document.querySelector('.wallet-copy-btn');
            if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            }
        } catch (error) {
            console.error('Copy failed:', error);
        }
    }

    /**
     * Setup event listeners for wallet state changes
     */
    setupListeners() {
        // Re-render when wallet connects
        window.addEventListener('authSuccess', () => {
            console.log('🔔 Wallet connected, updating UI');
            this.render();
        });

        // Re-render when wallet disconnects
        window.addEventListener('authLogout', () => {
            console.log('🔔 Wallet disconnected, updating UI');
            this.render();
        });
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletButton = new WalletButton();
    });
} else {
    window.walletButton = new WalletButton();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletButton;
}
