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
        
        this.render();
        this.setupListeners();
    }

    /**
     * Render the button (Pump.fun style - clean and simple)
     */
    render() {
        const wallet = window.universalWalletAuth?.getAuthInfo();

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

        // Check if universalWalletAuth is available
        if (!window.universalWalletAuth) {
            console.error('Universal Wallet Auth not loaded yet');
            btn.innerHTML = '<span class="wallet-icon">❌</span><span class="wallet-text">Auth System Error</span>';
            return;
        }

        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="wallet-icon">⏳</span><span class="wallet-text">Connecting...</span>';
        btn.disabled = true;

        try {
            const result = await window.universalWalletAuth.connect();

            if (result) {
                // Re-render to show connected state
                this.render();
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            btn.innerHTML = '<span class="wallet-icon">❌</span><span class="wallet-text">Connection Failed</span>';
            btn.disabled = false;

            // Reset after 3 seconds
            setTimeout(() => {
                this.render();
            }, 3000);
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        if (window.universalWalletAuth) {
            await window.universalWalletAuth.disconnect();
        }
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
        const wallet = window.universalWalletAuth?.getAuthInfo();
        if (!wallet) return;

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
        // Small delay to ensure all scripts are loaded
        setTimeout(() => {
            window.walletButton = new WalletButton();
        }, 100);
    });
} else {
    // Small delay to ensure all scripts are loaded
    setTimeout(() => {
        window.walletButton = new WalletButton();
    }, 100);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletButton;
}
