/**
 * WALLET ADAPTER - Pump.fun Style
 * Clean, simple, always-works wallet connection
 * Modeled after successful Solana dApps
 */

class WalletAdapter {
    constructor() {
        this.wallet = null;
        this.publicKey = null;
        this.connected = false;
        this.connecting = false;
        
        // Auto-detect on load
        this.init();
    }

    async init() {
        console.log('🔌 Wallet Adapter initializing...');
        
        // Wait for wallet injection
        await this.waitForWallet();
        
        // Try auto-reconnect if previously connected
        const shouldReconnect = localStorage.getItem('walletAutoConnect') === 'true';
        if (shouldReconnect) {
            await this.connect(true); // Silent reconnect
        }
        
        // Setup listeners
        this.setupListeners();
    }

    /**
     * Wait for wallet to inject into window (with timeout)
     */
    async waitForWallet(maxWait = 3000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            // Check for Phantom
            if (window.solana || window.phantom) {
                console.log('✅ Solana wallet found');
                return true;
            }
            
            // Check for Ethereum wallets
            if (window.ethereum) {
                console.log('✅ Ethereum wallet found');
                return true;
            }
            
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('⏱️ Wallet detection timeout - will try on user click');
        return false;
    }

    /**
     * Connect wallet (Pump.fun style - simple and direct)
     */
    async connect(silent = false) {
        if (this.connecting) {
            console.log('⏳ Connection already in progress');
            return null;
        }
        
        if (this.connected) {
            console.log('✅ Already connected');
            return this.getWalletInfo();
        }
        
        this.connecting = true;
        
        try {
            // Try Phantom/Solana first (most common on Pump.fun)
            if (window.solana || window.phantom) {
                return await this.connectSolana(silent);
            }
            
            // Fallback to Ethereum
            if (window.ethereum) {
                return await this.connectEthereum(silent);
            }
            
            // No wallet found
            if (!silent) {
                this.showInstallPrompt();
            }
            
            return null;
            
        } catch (error) {
            console.error('Connection error:', error);
            
            if (error.code === 4001 || error.message?.includes('rejected')) {
                // User rejected
                if (!silent) {
                    this.showMessage('Connection cancelled', 'warning');
                }
            } else {
                if (!silent) {
                    this.showMessage('Connection failed: ' + error.message, 'error');
                }
            }
            
            return null;
        } finally {
            this.connecting = false;
        }
    }

    /**
     * Connect to Phantom/Solana wallet
     */
    async connectSolana(silent) {
        const provider = window.phantom?.solana || window.solana;
        
        if (!provider) {
            throw new Error('Solana wallet not found');
        }
        
        console.log('🔗 Connecting to Solana wallet...');
        
        // Check if already connected
        if (provider.isConnected && provider.publicKey) {
            console.log('✅ Using existing connection');
            this.wallet = provider;
            this.publicKey = provider.publicKey.toString();
            this.connected = true;
            
            localStorage.setItem('walletAutoConnect', 'true');
            localStorage.setItem('walletType', 'solana');
            localStorage.setItem('walletAddress', this.publicKey);
            
            this.notifyConnected();
            return this.getWalletInfo();
        }
        
        // Request connection
        const response = await provider.connect({ onlyIfTrusted: silent });
        
        this.wallet = provider;
        this.publicKey = response.publicKey.toString();
        this.connected = true;
        
        // Save state
        localStorage.setItem('walletAutoConnect', 'true');
        localStorage.setItem('walletType', 'solana');
        localStorage.setItem('walletAddress', this.publicKey);
        
        console.log('✅ Solana wallet connected:', this.publicKey);
        
        if (!silent) {
            this.showMessage('Wallet connected!', 'success');
        }
        
        this.notifyConnected();
        return this.getWalletInfo();
    }

    /**
     * Connect to MetaMask/Ethereum wallet
     */
    async connectEthereum(silent) {
        if (!window.ethereum) {
            throw new Error('Ethereum wallet not found');
        }
        
        console.log('🔗 Connecting to Ethereum wallet...');
        
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
            console.log('✅ Using existing connection');
            this.wallet = window.ethereum;
            this.publicKey = accounts[0];
            this.connected = true;
            
            localStorage.setItem('walletAutoConnect', 'true');
            localStorage.setItem('walletType', 'ethereum');
            localStorage.setItem('walletAddress', this.publicKey);
            
            this.notifyConnected();
            return this.getWalletInfo();
        }
        
        // Request connection
        const newAccounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        this.wallet = window.ethereum;
        this.publicKey = newAccounts[0];
        this.connected = true;
        
        // Save state
        localStorage.setItem('walletAutoConnect', 'true');
        localStorage.setItem('walletType', 'ethereum');
        localStorage.setItem('walletAddress', this.publicKey);
        
        console.log('✅ Ethereum wallet connected:', this.publicKey);
        
        if (!silent) {
            this.showMessage('Wallet connected!', 'success');
        }
        
        this.notifyConnected();
        return this.getWalletInfo();
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        try {
            // Disconnect Solana wallet
            if (this.wallet && this.wallet.disconnect) {
                await this.wallet.disconnect();
            }
            
            this.wallet = null;
            this.publicKey = null;
            this.connected = false;
            
            // Clear saved state
            localStorage.removeItem('walletAutoConnect');
            localStorage.removeItem('walletType');
            localStorage.removeItem('walletAddress');
            localStorage.removeItem('wallet_verified');
            localStorage.removeItem('wallet_signature');
            
            console.log('✅ Wallet disconnected');
            this.showMessage('Wallet disconnected', 'info');
            
            this.notifyDisconnected();
            
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Setup event listeners for wallet changes
     */
    setupListeners() {
        // Solana wallet events
        if (window.solana) {
            window.solana.on('connect', () => {
                console.log('🔔 Wallet connected event');
            });
            
            window.solana.on('disconnect', () => {
                console.log('🔔 Wallet disconnected event');
                this.disconnect();
            });
            
            window.solana.on('accountChanged', (publicKey) => {
                if (publicKey) {
                    console.log('🔔 Account changed:', publicKey.toString());
                    this.publicKey = publicKey.toString();
                    localStorage.setItem('walletAddress', this.publicKey);
                    this.notifyConnected();
                } else {
                    this.disconnect();
                }
            });
        }
        
        // Ethereum wallet events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    console.log('🔔 Account changed:', accounts[0]);
                    this.publicKey = accounts[0];
                    localStorage.setItem('walletAddress', this.publicKey);
                    this.notifyConnected();
                } else {
                    this.disconnect();
                }
            });
            
            window.ethereum.on('chainChanged', () => {
                console.log('🔔 Chain changed, reloading...');
                window.location.reload();
            });
        }
    }

    /**
     * Get current wallet info
     */
    getWalletInfo() {
        if (!this.connected) return null;
        
        return {
            address: this.publicKey,
            shortAddress: this.getShortAddress(),
            connected: true,
            type: localStorage.getItem('walletType')
        };
    }

    /**
     * Get shortened address (Pump.fun style)
     */
    getShortAddress() {
        if (!this.publicKey) return '';
        return this.publicKey.slice(0, 4) + '...' + this.publicKey.slice(-4);
    }

    /**
     * Notify app of connection
     */
    notifyConnected() {
        window.dispatchEvent(new CustomEvent('walletConnected', {
            detail: this.getWalletInfo()
        }));
    }

    /**
     * Notify app of disconnection
     */
    notifyDisconnected() {
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
    }

    /**
     * Show install prompt (Pump.fun style)
     */
    showInstallPrompt() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            alert(
                '📱 Wallet Not Detected\n\n' +
                'Please open this site in:\n' +
                '• Phantom app browser\n' +
                '• MetaMask app browser\n\n' +
                'Regular mobile browsers cannot access wallets.'
            );
        } else {
            const install = confirm(
                '💼 No Wallet Detected\n\n' +
                'You need a Solana wallet to use this site.\n\n' +
                'Click OK to install Phantom (recommended)'
            );
            
            if (install) {
                window.open('https://phantom.app/', '_blank');
            }
        }
    }

    /**
     * Show user message (toast style)
     */
    showMessage(text, type = 'info') {
        const colors = {
            success: '#00ff00',
            error: '#ff4444',
            warning: '#ffaa00',
            info: '#00ffff'
        };
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.95);
            color: ${colors[type]};
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid ${colors[type]};
            font-family: 'Orbitron', sans-serif;
            font-weight: bold;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        `;
        toast.textContent = text;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Create global instance
window.walletAdapter = new WalletAdapter();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletAdapter;
}
