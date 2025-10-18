/**
 * Mandem.OS MNDM System - MNDM Token Management
 * Handles MNDM-specific operations and integration
 */

class MandemMNDMSystem {
    constructor() {
        this.mndmTokenAddress = 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r';
        this.mndmDecimals = 6; // Like USDC
        this.agentContributionVault = 'AGENT_CONTRIBUTION_VAULT';

        console.log('💎 Mandem.OS MNDM System initialized');
    }

    /**
     * Initialize the system
     */
    async init() {
        console.log('💎 Initializing Mandem.OS MNDM System...');

        // Wait for wallet system to be ready
        if (window.universalWalletSystem) {
            console.log('✅ Universal Wallet System detected');
        } else {
            console.warn('⚠️ Universal Wallet System not found');
        }

        console.log('✅ Mandem.OS MNDM System ready');
    }

    /**
     * Update wallet balance display
     */
    async updateWalletBalance(walletAddress) {
        try {
            if (window.universalWalletSystem) {
                const balance = await window.universalWalletSystem.loadMNDMBalance(walletAddress);
                console.log(`💎 Updated MNDM balance for ${walletAddress}: ${balance}`);

                // Dispatch balance update event
                window.dispatchEvent(new CustomEvent('mndmBalanceUpdate', {
                    detail: { address: walletAddress, balance: balance }
                }));

                return balance;
            }
        } catch (error) {
            console.error('Failed to update MNDM balance:', error);
        }
        return 0;
    }

    /**
     * Get MNDM token info
     */
    getTokenInfo() {
        return {
            address: this.mndmTokenAddress,
            symbol: 'MNDM',
            name: 'MANDEM.OS',
            decimals: this.mndmDecimals,
            pumpFunUrl: 'https://pump.fun/coin/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r'
        };
    }

    /**
     * Format MNDM amount for display
     */
    formatAmount(amount) {
        if (amount === null || amount === undefined) return '0.0000';
        return parseFloat(amount).toFixed(4);
    }

    /**
     * Validate MNDM transaction
     */
    validateTransaction(amount, senderBalance) {
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }

        if (senderBalance < amount) {
            throw new Error(`Insufficient balance. Have ${this.formatAmount(senderBalance)}, need ${this.formatAmount(amount)}`);
        }

        return true;
    }

    /**
     * Get contribution statistics
     */
    getContributionStats() {
        // Mock stats - in production this would come from blockchain/smart contract
        return {
            totalContributions: 47,
            totalMNDMSpent: 470,
            activeAgents: 23,
            topContributors: [
                { name: 'Ryan Barbrick', contributions: 12, totalSpent: 120 },
                { name: 'AgentSmith', contributions: 8, totalSpent: 80 },
                { name: 'CodeMaster', contributions: 6, totalSpent: 60 }
            ]
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.mandemMNDMSystem = new MandemMNDMSystem();
    window.mandemMNDMSystem.init();
    console.log('✅ Mandem.OS MNDM System loaded');
}
