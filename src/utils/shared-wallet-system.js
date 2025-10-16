/**
 * SHARED WALLET SYSTEM - Consolidated
 * Single, comprehensive wallet connection system
 * Combines best features from all wallet implementations
 * Supports MetaMask, Phantom, Coinbase, and more
 */

class SharedWalletSystem {
    constructor() {
        this.connected = false;
        this.walletType = null;
        this.address = null;
        this.provider = null;
        this.balance = null;
        this.chainId = null;
        this.detectedWallets = [];

        // Session persistence
        this.sessionKey = 'shared_wallet_session';
        this.authTimeout = 4 * 60 * 60 * 1000; // 4 hours

        this.init();
    }

    async init() {
        console.log('🔐 Shared Wallet System initializing...');

        // Detect available wallets
        await this.detectWallets();

        // Try to restore session
        await this.restoreSession();

        // Setup event listeners
        this.setupEventListeners();

        console.log('✅ Shared Wallet System ready');
    }

    /**
     * Detect all available wallets
     */
    async detectWallets() {
        this.detectedWallets = [];

        // MetaMask (Ethereum)
        if (window.ethereum?.isMetaMask) {
            this.detectedWallets.push({
                name: 'MetaMask',
                type: 'ethereum',
                icon: '🦊',
                provider: window.ethereum
            });
        }

        // Coinbase Wallet
        if (window.ethereum?.isCoinbaseWallet) {
            this.detectedWallets.push({
                name: 'Coinbase Wallet',
                type: 'ethereum',
                icon: '🔵',
                provider: window.ethereum
            });
        }

        // Phantom (Solana)
        if (window.solana?.isPhantom || window.phantom?.solana) {
            const provider = window.phantom?.solana || window.solana;
            this.detectedWallets.push({
                name: 'Phantom',
                type: 'solana',
                icon: '👻',
                provider: provider
            });
        }

        // Trust Wallet
        if (window.ethereum?.isTrust) {
            this.detectedWallets.push({
                name: 'Trust Wallet',
                type: 'ethereum',
                icon: '🔒',
                provider: window.ethereum
            });
        }

        console.log(`🔍 Detected ${this.detectedWallets.length} wallets:`, this.detectedWallets.map(w => w.name));
    }

    /**
     * Connect to a specific wallet
     */
    async connect(walletType = null, silent = false) {
        try {
            if (this.connected) {
                console.log('✅ Already connected');
                return this.getConnectionInfo();
            }

            let wallet;
            if (walletType) {
                wallet = this.detectedWallets.find(w => w.type === walletType);
            } else {
                // Auto-select best available wallet
                wallet = this.detectedWallets.find(w => w.type === 'ethereum') ||
                        this.detectedWallets.find(w => w.type === 'solana') ||
                        this.detectedWallets[0];
            }

            if (!wallet) {
                throw new Error('No compatible wallet found. Please install MetaMask, Phantom, or another Web3 wallet.');
            }

            console.log(`🔌 Connecting to ${wallet.name}...`);

            // Connect based on wallet type
            if (wallet.type === 'ethereum') {
                await this.connectEthereum(wallet.provider, silent);
            } else if (wallet.type === 'solana') {
                await this.connectSolana(wallet.provider, silent);
            }

            this.walletType = wallet.type;
            this.provider = wallet.provider;
            this.connected = true;

            // Get balance
            await this.updateBalance();

            // Save session
            this.saveSession();

            console.log(`✅ Connected to ${wallet.name}: ${this.getShortAddress()}`);

            // Notify listeners
            this.notifyConnectionSuccess();

            return this.getConnectionInfo();

        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.clearSession();
            throw error;
        }
    }

    /**
     * Connect to Ethereum wallet
     */
    async connectEthereum(provider, silent = false) {
        try {
            const accounts = silent ?
                await provider.request({ method: 'eth_accounts' }) :
                await provider.request({ method: 'eth_requestAccounts' });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found');
            }

            this.address = accounts[0].toLowerCase();
            this.chainId = await provider.request({ method: 'eth_chainId' });

        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Connection rejected by user');
            }
            throw error;
        }
    }

    /**
     * Connect to Solana wallet
     */
    async connectSolana(provider, silent = false) {
        try {
            if (silent && provider.publicKey) {
                this.address = provider.publicKey.toString();
                return;
            }

            const response = await provider.connect();
            this.address = response.publicKey.toString();

        } catch (error) {
            if (error.message?.includes('User rejected')) {
                throw new Error('Connection rejected by user');
            }
            throw error;
        }
    }

    /**
     * Update wallet balance
     */
    async updateBalance() {
        if (!this.connected || !this.address) return;

        try {
            if (this.walletType === 'ethereum') {
                this.balance = await this.provider.request({
                    method: 'eth_getBalance',
                    params: [this.address, 'latest']
                });
            } else if (this.walletType === 'solana') {
                // For Solana, we'd need to implement balance fetching
                this.balance = '0'; // Placeholder
            }
        } catch (error) {
            console.warn('Failed to update balance:', error);
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        try {
            if (this.provider?.disconnect) {
                await this.provider.disconnect();
            }

            this.clearSession();
            this.notifyDisconnection();

            console.log('👋 Wallet disconnected');
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    /**
     * Sign a message for authentication
     */
    async signMessage(message) {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }

        try {
            if (this.walletType === 'ethereum') {
                return await this.provider.request({
                    method: 'personal_sign',
                    params: [message, this.address]
                });
            } else if (this.walletType === 'solana') {
                const encodedMessage = new TextEncoder().encode(message);
                const signed = await this.provider.signMessage(encodedMessage, 'utf8');
                return btoa(String.fromCharCode.apply(null, signed.signature));
            }
        } catch (error) {
            throw new Error('Message signing failed: ' + error.message);
        }
    }

    /**
     * Save session to localStorage
     */
    saveSession() {
        const session = {
            walletType: this.walletType,
            address: this.address,
            connectedAt: Date.now(),
            expiresAt: Date.now() + this.authTimeout
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    /**
     * Restore session from localStorage
     */
    async restoreSession() {
        try {
            const sessionStr = localStorage.getItem(this.sessionKey);
            if (!sessionStr) return;

            const session = JSON.parse(sessionStr);

            // Check if session is expired
            if (Date.now() > session.expiresAt) {
                this.clearSession();
                return;
            }

            // Restore connection
            this.walletType = session.walletType;
            this.address = session.address;

            // Try to reconnect silently
            try {
                await this.connect(session.walletType, true);
            } catch (error) {
                console.log('Silent reconnect failed:', error.message);
                this.clearSession();
            }

        } catch (error) {
            console.warn('Session restore failed:', error);
            this.clearSession();
        }
    }

    /**
     * Clear session data
     */
    clearSession() {
        this.connected = false;
        this.walletType = null;
        this.address = null;
        this.provider = null;
        this.balance = null;
        this.chainId = null;

        localStorage.removeItem(this.sessionKey);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Ethereum events
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                } else if (accounts[0].toLowerCase() !== this.address) {
                    this.address = accounts[0].toLowerCase();
                    this.saveSession();
                    this.notifyAccountChanged();
                }
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = chainId;
                this.notifyChainChanged();
            });
        }

        // Solana events
        if (window.solana) {
            window.solana.on('disconnect', () => {
                this.disconnect();
            });

            window.solana.on('accountChanged', (publicKey) => {
                if (!publicKey) {
                    this.disconnect();
                } else {
                    this.address = publicKey.toString();
                    this.saveSession();
                    this.notifyAccountChanged();
                }
            });
        }
    }

    /**
     * Get connection info
     */
    getConnectionInfo() {
        return {
            connected: this.connected,
            walletType: this.walletType,
            address: this.address,
            shortAddress: this.getShortAddress(),
            balance: this.balance,
            chainId: this.chainId
        };
    }

    /**
     * Get short address for display
     */
    getShortAddress() {
        if (!this.address) return '';
        return this.address.slice(0, 6) + '...' + this.address.slice(-4);
    }

    /**
     * Check if user is authenticated (connected)
     */
    isAuthenticated() {
        return this.connected;
    }

    /**
     * Event notification methods
     */
    notifyConnectionSuccess() {
        window.dispatchEvent(new CustomEvent('walletConnected', {
            detail: this.getConnectionInfo()
        }));
    }

    notifyDisconnection() {
        window.dispatchEvent(new CustomEvent('walletDisconnected'));
    }

    notifyAccountChanged() {
        window.dispatchEvent(new CustomEvent('walletAccountChanged', {
            detail: this.getConnectionInfo()
        }));
    }

    notifyChainChanged() {
        window.dispatchEvent(new CustomEvent('walletChainChanged', {
            detail: { chainId: this.chainId }
        }));
    }
}

// Create global instance
window.sharedWalletSystem = new SharedWalletSystem();

console.log('🔐 Shared Wallet System loaded - consolidating all wallet functionality');
