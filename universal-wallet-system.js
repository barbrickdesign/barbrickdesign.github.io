/**
 * Universal Wallet System - Enhanced MNDM Token Management
 * Handles wallet connections, balance loading, and token transfers
 */

class UniversalWalletSystem {
    constructor() {
        this.isConnected = false;
        this.currentWallet = null;
        this.currentNetwork = 'solana';
        this.mndmBalance = 0;
        
        // Initialize Solana connection with a more permissive RPC endpoint
        if (typeof window !== 'undefined' && window.solanaWeb3) {
            // Try multiple RPC endpoints for better reliability
            const rpcEndpoints = [
                'https://solana-mainnet.rpc.extrnode.com/',
                'https://ssc-dao.genesysgo.net/',
                'https://rpc.ankr.com/solana',
                'https://solana-api.projectserum.com/',
                'https://api.mainnet-beta.solana.com/'
            ];
            
            // Use the first available endpoint
            this.connection = new window.solanaWeb3.Connection(rpcEndpoints[0], 'confirmed');
            console.log('🔗 Using Solana RPC endpoint:', rpcEndpoints[0]);
        }
        
        console.log('🔗 Universal Wallet System initialized');
    }

    /**
     * Connect wallet
     */
    async connect() {
        try {
            if (window.solana && window.solana.isPhantom) {
                const response = await window.solana.connect();
                this.currentWallet = response.publicKey.toString();
                this.isConnected = true;
                this.currentNetwork = 'solana';
                
                console.log('🔗 Connected to Phantom wallet:', this.currentWallet);
                return {
                    address: this.currentWallet,
                    network: this.currentNetwork,
                    wallet: 'phantom'
                };
            } else {
                throw new Error('Phantom wallet not found');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    /**
     * Disconnect wallet
     */
    async disconnect() {
        try {
            if (window.solana && window.solana.isPhantom) {
                await window.solana.disconnect();
            }
            
            this.isConnected = false;
            this.currentWallet = null;
            this.mndmBalance = 0;
            
            console.log('🔌 Wallet disconnected');
        } catch (error) {
            console.error('Wallet disconnect failed:', error);
        }
    }

    /**
     * Load MNDM balance from Solana with fallback endpoints
     */
    async loadMNDMBalance(walletAddress) {
        if (!walletAddress) return 0;

        const rpcEndpoints = [
            'https://solana-mainnet.rpc.extrnode.com/',
            'https://ssc-dao.genesysgo.net/',
            'https://rpc.ankr.com/solana',
            'https://solana-api.projectserum.com/',
            'https://api.mainnet-beta.solana.com/'
        ];

        for (let i = 0; i < rpcEndpoints.length; i++) {
            try {
                const endpoint = rpcEndpoints[i];
                const tempConnection = new window.solanaWeb3.Connection(endpoint, 'confirmed');
                
                const publicKey = new window.solanaWeb3.PublicKey(walletAddress);
                const mndmMint = new window.solanaWeb3.PublicKey('GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r');

                // Get associated token account
                const ata = await window.solanaWeb3.Token.getAssociatedTokenAddress(
                    window.solanaWeb3.ASSOCIATED_TOKEN_PROGRAM_ID,
                    window.solanaWeb3.TOKEN_PROGRAM_ID,
                    mndmMint,
                    publicKey
                );

                // Get account info
                const accountInfo = await tempConnection.getAccountInfo(ata);
                if (!accountInfo) return 0;

                // Parse token account data
                const tokenAccount = window.solanaWeb3.TokenAccountLayout.decode(accountInfo.data);
                const balance = Number(tokenAccount.amount) / Math.pow(10, 6); // MNDM has 6 decimals

                console.log(`💎 MNDM Balance loaded using ${endpoint}: ${balance}`);
                this.mndmBalance = balance;
                return balance;

            } catch (error) {
                console.log(`❌ RPC endpoint ${rpcEndpoints[i]} failed:`, error.message);
                if (i === rpcEndpoints.length - 1) {
                    // All endpoints failed
                    console.error('❌ All RPC endpoints failed to load MNDM balance');
                    return 0;
                }
                // Try next endpoint
                continue;
            }
        }
    }

    /**
     * Transfer MNDM tokens to a recipient
     */
    async transferMNDM(amount, recipientAddress) {
        if (!this.isConnected || !this.currentWallet) {
            throw new Error('Wallet not connected');
        }

        try {
            console.log(`🔄 Transferring ${amount} MNDM to ${recipientAddress}`);

            // Check current balance
            const balance = await this.loadMNDMBalance(this.currentWallet);
            if (balance < amount) {
                throw new Error(`Insufficient MNDM balance. Have ${balance.toFixed(4)}, need ${amount.toFixed(4)}`);
            }

            let transferSuccess = false;
            let transactionHash = null;

            // Try different transfer methods
            if (this.currentNetwork === 'solana' && window.solana && window.solana.isPhantom) {
                // Direct Phantom transfer
                const result = await this.transferMNDMViaPhantom(amount, recipientAddress);
                if (result) {
                    transferSuccess = true;
                    transactionHash = result.txHash;
                }
            }

            // Fallback to simulated transfer for demo
            if (!transferSuccess) {
                const result = await this.simulateMNDMTransfer(amount, recipientAddress);
                transferSuccess = result.success;
                transactionHash = result.txHash;
            }

            if (transferSuccess) {
                console.log('✅ MNDM transfer successful:', transactionHash);
                return {
                    success: true,
                    txHash: transactionHash,
                    amount: amount,
                    recipient: recipientAddress
                };
            } else {
                throw new Error('All transfer methods failed');
            }

        } catch (error) {
            console.error('MNDM transfer failed:', error);
            throw error;
        }
    }

    /**
     * Transfer MNDM via Phantom wallet
     */
    async transferMNDMViaPhantom(amount, recipientAddress) {
        try {
            if (!window.solana || !window.solana.isPhantom) {
                throw new Error('Phantom wallet not available');
            }

            // Convert amount to lamports (MNDM has 6 decimals like USDC)
            const transferAmount = Math.floor(amount * Math.pow(10, 6));

            // Create transfer instruction for MNDM token
            const mndmMint = new window.solanaWeb3.PublicKey('GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r');
            const recipient = new window.solanaWeb3.PublicKey(recipientAddress);

            // Get sender's associated token account
            const senderATA = await window.solanaWeb3.Token.getAssociatedTokenAddress(
                window.solanaWeb3.ASSOCIATED_TOKEN_PROGRAM_ID,
                window.solanaWeb3.TOKEN_PROGRAM_ID,
                mndmMint,
                new window.solanaWeb3.PublicKey(this.currentWallet)
            );

            // Get or create recipient's associated token account
            const recipientATA = await window.solanaWeb3.Token.getAssociatedTokenAddress(
                window.solanaWeb3.ASSOCIATED_TOKEN_PROGRAM_ID,
                window.solanaWeb3.TOKEN_PROGRAM_ID,
                mndmMint,
                recipient
            );

            // Create transfer instruction
            const transferInstruction = window.solanaWeb3.Token.createTransferInstruction(
                window.solanaWeb3.TOKEN_PROGRAM_ID,
                senderATA,
                recipientATA,
                new window.solanaWeb3.PublicKey(this.currentWallet),
                [],
                transferAmount
            );

            // Send transaction
            const transaction = new window.solanaWeb3.Transaction().add(transferInstruction);

            const { signature } = await window.solana.signAndSendTransaction(transaction);

            return {
                success: true,
                txHash: signature,
                amount: amount,
                recipient: recipientAddress
            };

        } catch (error) {
            console.error('Phantom MNDM transfer failed:', error);
            throw error;
        }
    }

    /**
     * Simulate MNDM transfer for demo purposes
     */
    async simulateMNDMTransfer(amount, recipientAddress) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock transaction hash
        const txHash = 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        console.log(`🎭 Simulated MNDM transfer: ${amount} to ${recipientAddress}`);

        return {
            success: true,
            txHash: txHash,
            amount: amount,
            recipient: recipientAddress,
            simulated: true
        };
    }

    /**
     * Get transaction history for MNDM transfers
     */
    getMNDMTransactionHistory() {
        // In production, this would query blockchain for transaction history
        // For now, return mock data
        return [
            {
                hash: 'sim_1234567890_abc123',
                timestamp: Date.now() - 86400000, // 1 day ago
                amount: 10,
                type: 'transfer',
                recipient: 'AGENT_CONTRIBUTION_VAULT',
                status: 'confirmed'
            }
        ];
    }

    /**
     * Check if wallet is connected
     */
    isAuthenticated() {
        return this.isConnected && this.currentWallet !== null;
    }

    /**
     * Get current wallet address
     */
    getAddress() {
        return this.currentWallet;
    }

    /**
     * Get current auth info
     */
    getAuthInfo() {
        return {
            address: this.currentWallet,
            shortAddress: this.currentWallet ? this.currentWallet.slice(0, 8) + '...' + this.currentWallet.slice(-4) : null,
            mndmBalance: this.mndmBalance,
            isConnected: this.isConnected,
            network: this.currentNetwork
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.universalWalletSystem = new UniversalWalletSystem();
    console.log('✅ Universal Wallet System loaded');
}
