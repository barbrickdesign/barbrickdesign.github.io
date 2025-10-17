/**
 * WALLET BUTTON COMPONENT - Pump.fun Style
 * Simple, clean, always-visible wallet button
 */

class WalletButton {
    constructor(containerId = 'walletButtonContainer') {
        this.container = document.getElementById(containerId);
        this.listenersSetup = false; // Track if listeners are already set up
        
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
        // PRIORITY 1: Check shared wallet system first
        let wallet = null;
        if (window.sharedWalletSystem && window.sharedWalletSystem.connected) {
            wallet = {
                address: window.sharedWalletSystem.address,
                shortAddress: window.sharedWalletSystem.getShortAddress(),
                authenticated: true
            };
        }
        // PRIORITY 2: Fallback to universal auth
        else if (window.universalWalletAuth) {
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

            // PRIORITY 1: Try shared wallet system first (no signature required)
            if (window.sharedWalletSystem) {
                console.log('🔌 Trying shared wallet system...');
                result = await window.sharedWalletSystem.connect();
                if (result) {
                    console.log('✅ Connected via shared wallet system');
                }
            }

            // PRIORITY 2: Try universal auth only if shared system fails
            if (!result && window.universalWalletAuth) {
                console.log('🔌 Falling back to universal auth...');
                result = await window.universalWalletAuth.connect();
                if (result) {
                    console.log('✅ Connected via universal auth');
                }
            }

            // PRIORITY 3: Last resort - global connectWallet function
            if (!result && window.connectWallet) {
                console.log('🔌 Trying global connectWallet...');
                result = await window.connectWallet();
                if (result) {
                    console.log('✅ Connected via global function');
                }
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
        try {
            // PRIORITY 1: Try shared wallet system first
            if (window.sharedWalletSystem) {
                await window.sharedWalletSystem.disconnect();
            }
            // PRIORITY 2: Try universal auth
            else if (window.universalWalletAuth) {
                await window.universalWalletAuth.disconnect();
            }
            // PRIORITY 3: Try global disconnectWallet function
            else if (window.disconnectWallet) {
                await window.disconnectWallet();
            }

            this.render();
        } catch (error) {
            console.error('Disconnect failed:', error);
            this.render(); // Still re-render even if disconnect fails
        }
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
        // PRIORITY 1: Get from shared wallet system first
        let wallet = null;
        if (window.sharedWalletSystem && window.sharedWalletSystem.connected) {
            wallet = {
                address: window.sharedWalletSystem.address
            };
        }
        // PRIORITY 2: Fallback to universal auth
        else if (window.universalWalletAuth) {
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
        // Only setup listeners if we haven't set them up before
        if (this.listenersSetup) return;
        this.listenersSetup = true;

        // Re-render when wallet connects (but don't trigger reloads)
        window.addEventListener('authSuccess', () => {
            console.log('🔔 Wallet connected via auth system, updating UI');
            this.render();
        });

        // Re-render when wallet disconnects
        window.addEventListener('authLogout', () => {
            console.log('🔔 Wallet disconnected, updating UI');
            this.render();
        });

        // Listen for shared wallet system events
        if (window.sharedWalletSystem) {
            window.addEventListener('walletConnected', () => {
                console.log('🔔 Wallet connected via shared system, updating UI');
                this.render();
            });

            window.addEventListener('walletDisconnected', () => {
                console.log('🔔 Wallet disconnected from shared system, updating UI');
                this.render();
            });
        }
    }
}

// Auto-initialize when DOM is ready
// DISABLED: Auto-initialization causes conflicts with other wallet systems
// Users should manually initialize with: window.walletButton = new WalletButton();

/*
// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.walletButton = new WalletButton();
    });
} else {
    window.walletButton = new WalletButton();
}
*/

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletButton;
}
