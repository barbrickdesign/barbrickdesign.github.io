// MNDM TOKEN INTEGRATION FOR MANDEM.OS
// Comprehensive token system for all platform transactions

class MandemMNDMSystem {
    constructor() {
        this.MNDM_ADDRESS = 'GJFCA8XxnGns9TqKsMLScyVSooyiNrNPpjp2CyQCz7z5';
        this.walletSystem = null;
        this.xpData = { totalXP: 0, totalSwag: 0, level: 1 };
        this.conversionRates = {
            xpToMNDM: 1000,      // 1000 XP = 1 MNDM
            swagToMNDM: 2000,    // 2000 Swag = 1 MNDM
            levelBonus: 1.1,     // 10% bonus per level
            dailyLimit: 10       // Max 10 MNDM per day
        };

        this.init();
    }

    async init() {
        console.log('💎 Initializing Mandem.OS MNDM System...');

        // Load XP data
        this.loadXPData();

        // Initialize wallet system if available
        if (window.UniversalWalletSystem) {
            this.walletSystem = new window.UniversalWalletSystem({
                autoConnect: true,
                showUI: true,
                enableMNDM: true,
                onConnect: (walletInfo) => {
                    console.log('💎 MNDM Wallet connected:', walletInfo);
                    this.updateMNDMDisplay();
                }
            });
        }

        // Create MNDM transaction UI
        this.createMNDMUI();

        console.log('✅ Mandem.OS MNDM System initialized');
    }

    loadXPData() {
        const saved = localStorage.getItem('xpLogData');
        if (saved) {
            this.xpData = JSON.parse(saved);
        }
        this.updateXPDisplay();
    }

    saveXPData() {
        localStorage.setItem('xpLogData', JSON.stringify(this.xpData));
    }

    addXP(amount, type = 'system') {
        const levelBonus = Math.pow(this.conversionRates.levelBonus, this.xpData.level - 1);
        const mndmEarned = (amount / this.conversionRates.xpToMNDM) * levelBonus;

        this.xpData.totalXP += amount;
        this.xpData.level = Math.floor(this.xpData.totalXP / 1000) + 1;

        // Log the XP entry
        if (!this.xpData.entries) this.xpData.entries = [];
        this.xpData.entries.push({
            xp: amount,
            swag: 0,
            type: type,
            time: new Date().toISOString(),
            mndmEarned: mndmEarned
        });

        this.saveXPData();
        this.updateXPDisplay();
        this.updateMNDMDisplay();

        // Show notification
        this.showXPNotification(amount, mndmEarned);

        console.log(`💎 XP: +${amount} (${type}) → ${mndmEarned.toFixed(4)} MNDM`);
    }

    addSwag(amount, type = 'system') {
        const levelBonus = Math.pow(this.conversionRates.levelBonus, this.xpData.level - 1);
        const mndmEarned = (amount / this.conversionRates.swagToMNDM) * levelBonus;

        this.xpData.totalSwag += amount;

        // Log the swag entry
        if (!this.xpData.entries) this.xpData.entries = [];
        this.xpData.entries.push({
            xp: 0,
            swag: amount,
            type: type,
            time: new Date().toISOString(),
            mndmEarned: mndmEarned
        });

        this.saveXPData();
        this.updateXPDisplay();
        this.updateMNDMDisplay();

        // Show notification
        this.showSwagNotification(amount, mndmEarned);

        console.log(`💎 Swag: +${amount} (${type}) → ${mndmEarned.toFixed(4)} MNDM`);
    }

    async claimMNDMTokens() {
        if (!this.walletSystem || !this.walletSystem.isConnected) {
            alert('Please connect your Phantom wallet first');
            return;
        }

        const earnedTokens = this.calculateEarnedTokens();
        const claimedTokens = this.xpData.claimedTokens || 0;
        const availableTokens = earnedTokens - claimedTokens;

        if (availableTokens <= 0) {
            alert('No tokens available to claim');
            return;
        }

        // Check daily limit
        const today = new Date().toDateString();
        const lastClaimDate = localStorage.getItem('lastMNDMClaimDate');

        if (lastClaimDate === today) {
            const claimedToday = parseFloat(localStorage.getItem('claimedToday') || '0');
            if (claimedToday >= this.conversionRates.dailyLimit) {
                alert(`Daily limit reached (${this.conversionRates.dailyLimit} MNDM). Try again tomorrow.`);
                return;
            }
        }

        // Limit claim to daily maximum
        const claimAmount = Math.min(availableTokens, this.conversionRates.dailyLimit);

        try {
            // For demo purposes, we'll simulate the claim
            // In production, this would call the wallet system's transfer method
            console.log(`💎 Claiming ${claimAmount.toFixed(4)} MNDM tokens...`);

            // Simulate successful claim
            this.xpData.claimedTokens = (this.xpData.claimedTokens || 0) + claimAmount;
            this.saveXPData();

            // Update daily tracking
            localStorage.setItem('lastMNDMClaimDate', today);
            localStorage.setItem('claimedToday', claimAmount.toString());

            this.updateMNDMDisplay();

            alert(`✅ Successfully claimed ${claimAmount.toFixed(4)} MNDM tokens!\n\nCheck your Phantom wallet for the tokens.`);

        } catch (error) {
            console.error('Claim failed:', error);
            alert('❌ Claim failed. Please try again.');
        }
    }

    calculateEarnedTokens() {
        if (!this.xpData.entries) return 0;

        let totalMNDM = 0;
        this.xpData.entries.forEach(entry => {
            totalMNDM += entry.mndmEarned || 0;
        });

        return totalMNDM;
    }

    updateXPDisplay() {
        const levelElement = document.getElementById('currentLevel');
        const xpElement = document.getElementById('currentXP');
        const nextLevelElement = document.getElementById('nextLevelXP');
        const swagElement = document.getElementById('currentSwag');

        if (levelElement) levelElement.textContent = this.xpData.level;
        if (xpElement) xpElement.textContent = this.xpData.totalXP.toLocaleString();
        if (nextLevelElement) nextLevelElement.textContent = ((this.xpData.level) * 1000).toLocaleString();
        if (swagElement) swagElement.textContent = this.xpData.totalSwag.toLocaleString();

        // Update XP bar
        const xpBar = document.getElementById('xpBarFill');
        if (xpBar) {
            const progress = (this.xpData.totalXP % 1000) / 10;
            xpBar.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    updateMNDMDisplay() {
        const earnedTokensElement = document.getElementById('earnedTokens');
        const earnedTokens = this.calculateEarnedTokens();
        const claimedTokens = this.xpData.claimedTokens || 0;
        const availableTokens = Math.max(0, earnedTokens - claimedTokens);

        if (earnedTokensElement) {
            earnedTokensElement.textContent = availableTokens.toFixed(4);
        }
    }

    showXPNotification(xpAmount, mndmEarned) {
        this.showNotification(`🎉 +${xpAmount} XP (+${mndmEarned.toFixed(4)} MNDM)`, 'success');
    }

    showSwagNotification(swagAmount, mndmEarned) {
        this.showNotification(`💰 +${swagAmount} Swag (+${mndmEarned.toFixed(4)} MNDM)`, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            border: 2px solid var(--neon-${type === 'success' ? 'green' : 'blue'});
            color: var(--neon-${type === 'success' ? 'green' : 'blue'});
            padding: 10px 15px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    createMNDMUI() {
        // Add MNDM-specific UI elements to existing Mission Control
        const missionControl = document.getElementById('missionControl');
        if (!missionControl) return;

        // Add MNDM transaction panel
        const mndmPanel = document.createElement('div');
        mndmPanel.id = 'mndm-transaction-panel';
        mndmPanel.style.cssText = `
            margin-top: 2rem;
            background: rgba(255,215,0,0.1);
            border: 2px solid var(--neon-gold);
            border-radius: 15px;
            padding: 1.5rem;
        `;

        mndmPanel.innerHTML = `
            <h3 style="color: var(--neon-gold); margin-bottom: 1rem;">💎 MNDM Token Transactions</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div style="text-align: center;">
                    <div style="color: var(--neon-green); font-weight: bold;">Available to Claim</div>
                    <div style="font-size: 1.5em; color: var(--neon-gold);" id="availableMNDM">0.0000</div>
                </div>
                <div style="text-align: center;">
                    <div style="color: var(--neon-blue); font-weight: bold;">Wallet Balance</div>
                    <div style="font-size: 1.5em; color: var(--neon-gold);" id="walletMNDM">Not Connected</div>
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: center;">
                <button onclick="mandemMNDM.claimMNDMTokens()" class="cyber-btn" style="background: linear-gradient(135deg, var(--neon-gold), var(--neon-orange));">
                    🎁 Claim MNDM Tokens
                </button>
                <button onclick="window.open('https://pump.fun/coin/${this.MNDM_ADDRESS}', '_blank')" class="cyber-btn cyber-btn-secondary">
                    🌐 Trade on Pump.fun
                </button>
            </div>

            <div style="margin-top: 1rem; font-size: 0.8em; color: var(--neon-green); text-align: center;">
                Daily Limit: ${this.conversionRates.dailyLimit} MNDM • Level Bonus: ${(this.conversionRates.levelBonus * 100 - 100).toFixed(0)}%
            </div>
        `;

        missionControl.appendChild(mndmPanel);

        // Update displays
        this.updateMNDMDisplay();
        this.updateWalletBalance();

        // Set up periodic updates
        setInterval(() => {
            this.updateWalletBalance();
        }, 30000); // Update every 30 seconds
    }

    async updateWalletBalance() {
        const walletElement = document.getElementById('walletMNDM');

        if (!walletElement) return;

        if (this.walletSystem && this.walletSystem.isConnected) {
            const balance = await this.walletSystem.loadMNDMBalance();
            walletElement.textContent = balance.toFixed(4);
            walletElement.style.color = 'var(--neon-gold)';
        } else {
            walletElement.textContent = 'Not Connected';
            walletElement.style.color = 'var(--neon-orange)';
        }
    }

    // Integration methods for platform transactions
    async processTransaction(type, amount, recipient = null) {
        switch (type) {
            case 'xp_earn':
                this.addXP(amount, 'platform_activity');
                break;
            case 'swag_earn':
                this.addSwag(amount, 'platform_activity');
                break;
            case 'agent_access':
                this.addXP(amount, 'agent_interaction');
                break;
            case 'navigation':
                this.addXP(amount, 'system_navigation');
                break;
            case 'mndm_transfer':
                if (recipient && this.walletSystem) {
                    return await this.walletSystem.transferMNDM(recipient, amount);
                }
                break;
            default:
                console.warn('Unknown transaction type:', type);
        }
    }

    // Get comprehensive token statistics
    getTokenStats() {
        const earned = this.calculateEarnedTokens();
        const claimed = this.xpData.claimedTokens || 0;
        const available = Math.max(0, earned - claimed);

        return {
            earned: earned,
            claimed: claimed,
            available: available,
            level: this.xpData.level,
            xpTotal: this.xpData.totalXP,
            swagTotal: this.xpData.totalSwag,
            conversionRates: this.conversionRates
        };
    }
}

// Initialize Mandem.OS MNDM System
let mandemMNDM;
document.addEventListener('DOMContentLoaded', () => {
    mandemMNDM = new MandemMNDMSystem();
});

// Export for global access
if (typeof window !== 'undefined') {
    window.MandemMNDMSystem = MandemMNDMSystem;
    window.mandemMNDM = mandemMNDM;
}
