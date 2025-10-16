/**
 * COINBASE WALLET SDK INTEGRATION
 * Full integration with Coinbase Wallet for verification and authentication
 * Supports both browser extension and mobile wallet link
 * 
 * Documentation: https://docs.cloud.coinbase.com/wallet-sdk/docs
 */

class CoinbaseWalletIntegration {
    constructor() {
        this.walletLink = null;
        this.ethereum = null;
        this.address = null;
        this.connected = false;
        this.chainId = null;
        this.balance = null;
        
        // Coinbase Wallet SDK configuration
        this.config = {
            appName: 'BarbrickDesign Platform',
            appLogoUrl: 'https://barbrickdesign.github.io/header.jpg',
            darkMode: true,
            overrideIsMetaMask: false,
            // Network options: mainnet, goerli, polygon, etc.
            jsonRpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
            chainId: 1 // Ethereum Mainnet
        };
    }

    /**
     * Initialize Coinbase Wallet SDK
     */
    async initialize() {
        try {
            // Check if CoinbaseWalletSDK is loaded
            if (typeof CoinbaseWalletSDK === 'undefined') {
                console.warn('⚠️ Coinbase Wallet SDK not loaded. Loading from CDN...');
                await this.loadSDK();
            }

            // Initialize Coinbase Wallet
            const coinbaseWallet = new CoinbaseWalletSDK({
                appName: this.config.appName,
                appLogoUrl: this.config.appLogoUrl,
                darkMode: this.config.darkMode,
                overrideIsMetaMask: this.config.overrideIsMetaMask
            });

            // Get Ethereum provider
            this.ethereum = coinbaseWallet.makeWeb3Provider(
                this.config.jsonRpcUrl,
                this.config.chainId
            );

            // Set up event listeners
            this.setupEventListeners();

            console.log('✅ Coinbase Wallet SDK initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize Coinbase Wallet SDK:', error);
            return false;
        }
    }

    /**
     * Load Coinbase Wallet SDK from CDN
     */
    async loadSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@coinbase/wallet-sdk@3.9.1/dist/index.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Connect to Coinbase Wallet
     */
    async connect() {
        try {
            if (!this.ethereum) {
                await this.initialize();
            }

            // Request account access
            const accounts = await this.ethereum.request({
                method: 'eth_requestAccounts'
            });

            this.address = accounts[0];
            this.connected = true;

            // Get chain ID
            this.chainId = await this.ethereum.request({
                method: 'eth_chainId'
            });

            // Get balance
            await this.updateBalance();

            // Save connection state
            this.saveConnectionState();

            console.log('✅ Connected to Coinbase Wallet:', this.address);

            return {
                success: true,
                address: this.address,
                chainId: this.chainId,
                balance: this.balance,
                provider: 'coinbase'
            };
        } catch (error) {
            console.error('Coinbase Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Disconnect from Coinbase Wallet
     */
    async disconnect() {
        try {
            if (this.ethereum && this.ethereum.disconnect) {
                await this.ethereum.disconnect();
            }

            this.address = null;
            this.connected = false;
            this.chainId = null;
            this.balance = null;

            // Clear saved state
            this.clearConnectionState();

            console.log('✅ Disconnected from Coinbase Wallet');

            return { success: true };
        } catch (error) {
            console.error('Disconnect error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get current balance
     */
    async updateBalance() {
        if (!this.address || !this.ethereum) {
            return null;
        }

        try {
            const balance = await this.ethereum.request({
                method: 'eth_getBalance',
                params: [this.address, 'latest']
            });

            // Convert from Wei to ETH
            const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
            this.balance = ethBalance.toFixed(4);

            return this.balance;
        } catch (error) {
            console.error('Error getting balance:', error);
            return null;
        }
    }

    /**
     * Sign message for verification
     */
    async signMessage(message) {
        if (!this.connected || !this.address) {
            throw new Error('Wallet not connected');
        }

        try {
            const signature = await this.ethereum.request({
                method: 'personal_sign',
                params: [message, this.address]
            });

            return {
                success: true,
                signature: signature,
                message: message,
                address: this.address
            };
        } catch (error) {
            console.error('Sign message error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify wallet ownership (sign and verify)
     */
    async verifyOwnership() {
        const timestamp = Date.now();
        const message = `Verify wallet ownership for BarbrickDesign\nTimestamp: ${timestamp}\nAddress: ${this.address}`;

        const result = await this.signMessage(message);

        if (result.success) {
            // Store verification
            localStorage.setItem('wallet_verified', 'true');
            localStorage.setItem('wallet_verified_at', timestamp.toString());
            localStorage.setItem('wallet_verification_signature', result.signature);

            return {
                success: true,
                verified: true,
                timestamp: timestamp,
                signature: result.signature
            };
        }

        return {
            success: false,
            verified: false,
            error: result.error
        };
    }

    /**
     * Switch to different network
     */
    async switchNetwork(chainId) {
        try {
            await this.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });

            this.chainId = chainId;
            return { success: true, chainId: chainId };
        } catch (error) {
            // Chain not added, try to add it
            if (error.code === 4902) {
                return await this.addNetwork(chainId);
            }

            console.error('Switch network error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add custom network
     */
    async addNetwork(chainId) {
        const networks = {
            137: {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com/']
            },
            56: {
                chainId: '0x38',
                chainName: 'BSC Mainnet',
                nativeCurrency: {
                    name: 'BNB',
                    symbol: 'BNB',
                    decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
            }
        };

        const networkConfig = networks[chainId];
        if (!networkConfig) {
            return {
                success: false,
                error: 'Network not supported'
            };
        }

        try {
            await this.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig]
            });

            return { success: true, chainId: chainId };
        } catch (error) {
            console.error('Add network error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send transaction
     */
    async sendTransaction(to, value, data = '0x') {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }

        try {
            const transactionParameters = {
                from: this.address,
                to: to,
                value: `0x${parseInt(value * Math.pow(10, 18)).toString(16)}`,
                data: data
            };

            const txHash = await this.ethereum.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters]
            });

            return {
                success: true,
                transactionHash: txHash
            };
        } catch (error) {
            console.error('Transaction error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (!this.ethereum) return;

        // Account changed
        this.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.address = accounts[0];
                this.updateBalance();
                this.saveConnectionState();
                console.log('Account changed:', this.address);
            }
        });

        // Chain changed
        this.ethereum.on('chainChanged', (chainId) => {
            this.chainId = parseInt(chainId, 16);
            this.saveConnectionState();
            console.log('Chain changed:', this.chainId);
            // Reload page on chain change (recommended by Coinbase)
            window.location.reload();
        });

        // Disconnect
        this.ethereum.on('disconnect', () => {
            this.disconnect();
            console.log('Wallet disconnected');
        });
    }

    /**
     * Save connection state to localStorage
     */
    saveConnectionState() {
        if (this.connected && this.address) {
            localStorage.setItem('coinbase_connected', 'true');
            localStorage.setItem('coinbase_address', this.address);
            localStorage.setItem('coinbase_chainId', this.chainId?.toString() || '');
            localStorage.setItem('coinbase_balance', this.balance || '0');
        }
    }

    /**
     * Clear connection state
     */
    clearConnectionState() {
        localStorage.removeItem('coinbase_connected');
        localStorage.removeItem('coinbase_address');
        localStorage.removeItem('coinbase_chainId');
        localStorage.removeItem('coinbase_balance');
        localStorage.removeItem('wallet_verified');
        localStorage.removeItem('wallet_verified_at');
        localStorage.removeItem('wallet_verification_signature');
    }

    /**
     * Restore previous connection
     */
    async restoreConnection() {
        const wasConnected = localStorage.getItem('coinbase_connected') === 'true';
        
        if (wasConnected) {
            this.address = localStorage.getItem('coinbase_address');
            this.chainId = parseInt(localStorage.getItem('coinbase_chainId') || '1');
            this.balance = localStorage.getItem('coinbase_balance');
            this.connected = true;

            console.log('✅ Restored Coinbase Wallet connection:', this.address);
            
            // Refresh balance
            await this.updateBalance();
            
            return true;
        }

        return false;
    }

    /**
     * Get connection state
     */
    getState() {
        return {
            connected: this.connected,
            address: this.address,
            chainId: this.chainId,
            balance: this.balance,
            provider: 'coinbase'
        };
    }

    /**
     * Check if wallet is verified
     */
    isVerified() {
        return localStorage.getItem('wallet_verified') === 'true';
    }
}

// Create global instance
window.coinbaseWallet = new CoinbaseWalletIntegration();

// Auto-restore previous connection on load
window.addEventListener('DOMContentLoaded', async function() {
    const restored = await window.coinbaseWallet.restoreConnection();
    if (restored) {
        console.log('Coinbase Wallet connection restored');
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoinbaseWalletIntegration;
}

console.log('🔷 Coinbase Wallet Integration loaded');
