/**
 * UNIVERSAL WALLET CONNECTOR
 * Elite multi-wallet support with TRON-style visuals
 * Works across all devices, browsers, and wallet types
 * Auto-detects and connects to available wallets
 * 
 * Supported Wallets:
 * - Phantom (Solana)
 * - MetaMask (Ethereum)
 * - Coinbase Wallet
 * - WalletConnect
 * - Trust Wallet
 * - And more...
 */

class UniversalWalletConnector {
    constructor() {
        this.connectedWallet = null;
        this.walletType = null;
        this.address = null;
        this.balance = null;
        this.chainId = null;
        this.detectedWallets = [];
    }

    /**
     * Auto-detect all available wallets
     */
    async detectWallets() {
        this.detectedWallets = [];

        // Check for Phantom (Solana)
        if (window.solana && window.solana.isPhantom) {
            this.detectedWallets.push({
                name: 'Phantom',
                type: 'solana',
                icon: '👻',
                provider: window.solana
            });
        }

        // Check for MetaMask (Ethereum)
        if (window.ethereum && window.ethereum.isMetaMask) {
            this.detectedWallets.push({
                name: 'MetaMask',
                type: 'ethereum',
                icon: '🦊',
                provider: window.ethereum
            });
        }

        // Check for Coinbase Wallet
        if (window.ethereum && window.ethereum.isCoinbaseWallet) {
            this.detectedWallets.push({
                name: 'Coinbase Wallet',
                type: 'ethereum',
                icon: '🔷',
                provider: window.ethereum
            });
        }

        // Check for Trust Wallet
        if (window.ethereum && window.ethereum.isTrust) {
            this.detectedWallets.push({
                name: 'Trust Wallet',
                type: 'ethereum',
                icon: '🛡️',
                provider: window.ethereum
            });
        }

        // Check for generic Ethereum provider
        if (window.ethereum && this.detectedWallets.length === 0) {
            this.detectedWallets.push({
                name: 'Web3 Wallet',
                type: 'ethereum',
                icon: '🔗',
                provider: window.ethereum
            });
        }

        return this.detectedWallets;
    }

    /**
     * Connect to Phantom wallet (Solana)
     */
    async connectPhantom() {
        try {
            const resp = await window.solana.connect();
            this.connectedWallet = window.solana;
            this.walletType = 'Phantom';
            this.address = resp.publicKey.toString();
            
            // Get SOL balance
            await this.getSolanaBalance();
            
            return {
                success: true,
                address: this.address,
                balance: this.balance,
                type: 'solana'
            };
        } catch (error) {
            console.error('Phantom connection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Connect to MetaMask/Ethereum wallet
     */
    async connectMetaMask() {
        try {
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            this.connectedWallet = window.ethereum;
            this.walletType = 'MetaMask';
            this.address = accounts[0];
            
            // Get chain ID
            this.chainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            
            // Get ETH balance
            await this.getEthereumBalance();
            
            return {
                success: true,
                address: this.address,
                balance: this.balance,
                chainId: this.chainId,
                type: 'ethereum'
            };
        } catch (error) {
            console.error('MetaMask connection error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Universal connect - auto-detects and connects to best available wallet
     */
    async connect() {
        await this.detectWallets();
        
        if (this.detectedWallets.length === 0) {
            return {
                success: false,
                error: 'No wallet detected. Please install Phantom, MetaMask, or another Web3 wallet.'
            };
        }

        // Try Phantom first (Solana)
        const phantom = this.detectedWallets.find(w => w.type === 'solana');
        if (phantom) {
            return await this.connectPhantom();
        }

        // Fall back to MetaMask (Ethereum)
        const ethereum = this.detectedWallets.find(w => w.type === 'ethereum');
        if (ethereum) {
            return await this.connectMetaMask();
        }

        return {
            success: false,
            error: 'Could not connect to any detected wallet'
        };
    }

    /**
     * Get Solana balance
     */
    async getSolanaBalance() {
        try {
            const connection = new solanaWeb3.Connection(
                'https://api.mainnet-beta.solana.com',
                'confirmed'
            );
            const publicKey = new solanaWeb3.PublicKey(this.address);
            const balance = await connection.getBalance(publicKey);
            this.balance = (balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
        } catch (error) {
            console.error('Error getting SOL balance:', error);
            this.balance = '0.0000';
        }
    }

    /**
     * Get Ethereum balance
     */
    async getEthereumBalance() {
        try {
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [this.address, 'latest']
            });
            const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
            this.balance = ethBalance.toFixed(4);
        } catch (error) {
            console.error('Error getting ETH balance:', error);
            this.balance = '0.0000';
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        if (this.connectedWallet && this.connectedWallet.disconnect) {
            await this.connectedWallet.disconnect();
        }
        
        this.connectedWallet = null;
        this.walletType = null;
        this.address = null;
        this.balance = null;
        this.chainId = null;
        
        // Clear localStorage
        localStorage.removeItem('wallet_connected');
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_type');
        
        return { success: true };
    }

    /**
     * Get connection state
     */
    getState() {
        return {
            connected: !!this.connectedWallet,
            walletType: this.walletType,
            address: this.address,
            balance: this.balance,
            chainId: this.chainId
        };
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        if (this.address) {
            localStorage.setItem('wallet_connected', 'true');
            localStorage.setItem('wallet_address', this.address);
            localStorage.setItem('wallet_type', this.walletType);
            localStorage.setItem('wallet_balance', this.balance || '0');
        }
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        const connected = localStorage.getItem('wallet_connected');
        if (connected === 'true') {
            this.address = localStorage.getItem('wallet_address');
            this.walletType = localStorage.getItem('wallet_type');
            this.balance = localStorage.getItem('wallet_balance');
            return true;
        }
        return false;
    }
}

// Create global instance
window.walletConnector = new UniversalWalletConnector();

// Auto-load previous connection
window.addEventListener('DOMContentLoaded', function() {
    if (window.walletConnector.loadState()) {
        console.log('Previous wallet connection restored');
    }
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalWalletConnector;
}
