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
     * Auto-detect all available wallets (improved with retry logic for all browsers)
     */
    async detectWallets(retries = 3, delayMs = 100) {
        this.detectedWallets = [];

        console.log('🔍 Scanning for wallets... (attempt ' + (4 - retries) + '/3)');
        console.log('window.solana:', !!window.solana, 'isPhantom:', window.solana?.isPhantom);
        console.log('window.ethereum:', !!window.ethereum, 'isMetaMask:', window.ethereum?.isMetaMask);
        console.log('window.phantom:', !!window.phantom);

        // Wait a bit for wallet injection (especially important for Edge/Safari)
        await new Promise(resolve => setTimeout(resolve, delayMs));

        // Check for Phantom (Solana) - check both window.solana and window.phantom
        if ((window.solana && window.solana.isPhantom) || window.phantom?.solana) {
            const provider = window.phantom?.solana || window.solana;
            this.detectedWallets.push({
                name: 'Phantom',
                type: 'solana',
                icon: '👻',
                provider: provider
            });
            console.log('✅ Phantom detected');
        }

        // Check for MetaMask (Ethereum) - be more flexible
        if (window.ethereum) {
            // MetaMask specific check
            if (window.ethereum.isMetaMask) {
                this.detectedWallets.push({
                    name: 'MetaMask',
                    type: 'ethereum',
                    icon: '🦊',
                    provider: window.ethereum
                });
                console.log('✅ MetaMask detected');
            }
            // Coinbase Wallet
            else if (window.ethereum.isCoinbaseWallet) {
                this.detectedWallets.push({
                    name: 'Coinbase Wallet',
                    type: 'ethereum',
                    icon: '🔷',
                    provider: window.ethereum
                });
                console.log('✅ Coinbase Wallet detected');
            }
            // Trust Wallet
            else if (window.ethereum.isTrust) {
                this.detectedWallets.push({
                    name: 'Trust Wallet',
                    type: 'ethereum',
                    icon: '🛡️',
                    provider: window.ethereum
                });
                console.log('✅ Trust Wallet detected');
            }
            // Generic Ethereum provider (catch-all)
            else {
                this.detectedWallets.push({
                    name: 'Ethereum Wallet',
                    type: 'ethereum',
                    icon: '🔗',
                    provider: window.ethereum
                });
                console.log('✅ Generic Ethereum wallet detected');
            }
        }

        // If no wallets found and we have retries left, try again
        if (this.detectedWallets.length === 0 && retries > 0) {
            console.log('⏳ No wallets found, retrying in ' + delayMs + 'ms...');
            return await this.detectWallets(retries - 1, delayMs * 2);
        }

        // Log what we found
        if (this.detectedWallets.length === 0) {
            console.warn('⚠️ No wallets detected after all retries');
        } else {
            console.log(`✅ Total wallets found: ${this.detectedWallets.length}`);
        }

        return this.detectedWallets;
    }
    
    /**
     * Check if running on mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Connect to Phantom wallet (Solana)
     */
    async connectPhantom() {
        try {
            // Use window.phantom.solana if available, otherwise window.solana
            const provider = window.phantom?.solana || window.solana;
            
            if (!provider) {
                throw new Error('Phantom wallet not found. Please install from phantom.app');
            }

            console.log('🔗 Connecting to Phantom...');
            
            // Check if already connected
            if (provider.isConnected && provider.publicKey) {
                console.log('✅ Phantom already connected, using existing session');
                this.connectedWallet = provider;
                this.walletType = 'Phantom';
                this.address = provider.publicKey.toString();
                
                // Get SOL balance
                await this.getSolanaBalance();
                
                return {
                    success: true,
                    address: this.address,
                    balance: this.balance,
                    type: 'solana'
                };
            }
            
            // Not connected, request connection
            const resp = await provider.connect({ onlyIfTrusted: false });
            this.connectedWallet = provider;
            this.walletType = 'Phantom';
            this.address = resp.publicKey.toString();
            
            console.log('✅ Phantom connected:', this.address);
            
            // Get SOL balance
            await this.getSolanaBalance();
            
            return {
                success: true,
                address: this.address,
                balance: this.balance,
                type: 'solana'
            };
        } catch (error) {
            console.error('❌ Phantom connection error:', error);
            
            // Handle user rejection
            if (error.message?.includes('User rejected') || error.code === 4001) {
                return {
                    success: false,
                    error: 'Connection cancelled by user'
                };
            }
            
            // Handle wallet locked
            if (error.message?.includes('locked')) {
                return {
                    success: false,
                    error: 'Phantom wallet is locked. Please unlock it and try again.'
                };
            }
            
            return { 
                success: false, 
                error: error.message || 'Phantom connection failed. Try refreshing the page.' 
            };
        }
    }

    /**
     * Connect to MetaMask/Ethereum wallet
     */
    async connectMetaMask() {
        try {
            if (!window.ethereum) {
                throw new Error('Ethereum wallet not found. Please install MetaMask from metamask.io');
            }

            console.log('🔗 Connecting to Ethereum wallet...');
            
            // Check if already connected
            let accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
                console.log('✅ Ethereum wallet already connected, using existing session');
            } else {
                // Request connection
                accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
            }
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please unlock your wallet.');
            }
            
            this.connectedWallet = window.ethereum;
            this.walletType = window.ethereum.isMetaMask ? 'MetaMask' : 'Ethereum Wallet';
            this.address = accounts[0];
            
            console.log('✅ Ethereum wallet connected:', this.address);
            
            // Get chain ID
            this.chainId = await window.ethereum.request({ 
                method: 'eth_chainId' 
            });
            
            console.log('📡 Chain ID:', this.chainId);
            
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
            console.error('❌ Ethereum wallet connection error:', error);
            
            // Handle user rejection
            if (error.code === 4001) {
                return {
                    success: false,
                    error: 'Connection cancelled by user'
                };
            }
            
            return { 
                success: false, 
                error: error.message || 'Ethereum wallet connection failed. Make sure the extension is unlocked.' 
            };
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

    /**
     * Attempt auto-reconnect on page load
     */
    async autoReconnect() {
        const wasConnected = this.loadState();
        if (!wasConnected) return { success: false, message: 'No previous connection' };

        try {
            // Try to reconnect silently
            if (this.walletType === 'Phantom' && window.solana) {
                const result = await this.connectPhantom();
                if (result.success) {
                    console.log('✅ Auto-reconnected to Phantom');
                    this.saveState();
                    return result;
                }
            } else if (this.walletType === 'MetaMask' && window.ethereum) {
                const result = await this.connectMetaMask();
                if (result.success) {
                    console.log('✅ Auto-reconnected to MetaMask');
                    this.saveState();
                    return result;
                }
            }
        } catch (error) {
            console.warn('Auto-reconnect failed:', error.message);
        }

        return { success: false, message: 'Auto-reconnect failed' };
    }
}

// Create global instance
window.walletConnector = new UniversalWalletConnector();

// Auto-reconnect on page load (with delay for wallet injection)
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🔗 Universal Wallet Connector loading...');
    
    // Wait for wallet extensions to inject (especially important for Edge/Safari)
    // Different browsers inject at different speeds
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🔍 Starting wallet detection...');
    await window.walletConnector.detectWallets();
    console.log('💼 Detected wallets:', window.walletConnector.detectedWallets.map(w => w.name).join(', ') || 'None');
    
    // Try auto-reconnect if previously connected
    const reconnect = await window.walletConnector.autoReconnect();
    if (reconnect.success) {
        console.log('✅ Wallet auto-connected:', window.walletConnector.address);
        
        // Dispatch event for pages to update UI
        window.dispatchEvent(new CustomEvent('walletAutoConnected', {
            detail: window.walletConnector.getState()
        }));
    }
});

// Also listen for window.load as backup
window.addEventListener('load', async function() {
    // If still no wallets detected after page fully loads, try one more time
    if (window.walletConnector.detectedWallets.length === 0) {
        console.log('🔄 Page fully loaded, retrying wallet detection...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await window.walletConnector.detectWallets();
        console.log('💼 Wallets after reload:', window.walletConnector.detectedWallets.map(w => w.name).join(', ') || 'Still none');
    }
});

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UniversalWalletConnector;
}
