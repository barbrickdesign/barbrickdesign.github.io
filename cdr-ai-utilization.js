/**
 * CDR AI UTILIZATION SYSTEM
 * Leverages Coder (CDR) token holdings for AI system access and benefits
 * Integrates with all platform AI systems for token-gated features
 */

class CDRAIUtilization {
    constructor() {
        this.cdrTokenAddress = 'DjAbfe6EjhvZs4RAajYs8r3jcC1cFqqK4beTfGS7Lidd';
        this.aiCreditRate = 1000; // 1 CDR = 1000 AI credits
        this.minCDRHolding = 100; // Minimum CDR to access AI features

        // Access levels based on CDR holdings
        this.accessLevels = {
            bronze: { min: 100, max: 999, credits: 1000, priority: 1, features: ['basic-ai', 'text-generation'] },
            silver: { min: 1000, max: 9999, credits: 5000, priority: 2, features: ['basic-ai', 'text-generation', 'image-gen', 'code-assist'] },
            gold: { min: 10000, max: 49999, credits: 25000, priority: 3, features: ['basic-ai', 'text-generation', 'image-gen', 'code-assist', 'video-gen', 'priority-support'] },
            platinum: { min: 50000, max: Infinity, credits: 100000, priority: 4, features: ['all-features', 'unlimited', 'custom-models', 'api-access'] }
        };

        this.userCredits = {};
        this.activeSessions = {};
        this.aiRewards = {};

        this.init();
    }

    init() {
        console.log('👨‍💻 CDR AI Utilization System initializing...');

        // Initialize AI integrations
        this.integrateWithAIAgents();
        this.integrateWithOpenAIOrchestrator();
        this.integrateWithSecurityManager();

        // Setup CDR-based AI access
        this.setupAIAccessControl();
        this.setupCreditSystem();
        this.setupRewardSystem();

        console.log('✅ CDR AI Utilization system ready - token-powered AI access enabled');
    }

    /**
     * Get user's CDR access level
     */
    async getUserAccessLevel(address) {
        if (!address) return null;

        const cdrBalance = await this.getCDRBalance(address);
        if (cdrBalance < this.minCDRHolding) return null;

        // Determine access level
        for (const [level, config] of Object.entries(this.accessLevels)) {
            if (cdrBalance >= config.min && cdrBalance <= config.max) {
                return {
                    level: level,
                    balance: cdrBalance,
                    ...config
                };
            }
        }

        return null;
    }

    /**
     * Get CDR balance for address
     */
    async getCDRBalance(address) {
        if (!window.realTimeBalanceSystem) return 0;

        const balances = window.realTimeBalanceSystem.getBalances(address);
        if (!balances || !balances.tokens) return 0;

        const cdrToken = balances.tokens.find(t => t.symbol === 'CDR');
        return cdrToken ? Math.floor(cdrToken.balance) : 0;
    }

    /**
     * Check if user can access AI feature
     */
    async canAccessFeature(address, feature) {
        const accessLevel = await this.getUserAccessLevel(address);
        if (!accessLevel) return false;

        return accessLevel.features.includes(feature) ||
               accessLevel.features.includes('all-features') ||
               accessLevel.features.includes('unlimited');
    }

    /**
     * Get user's AI credits
     */
    async getUserCredits(address) {
        if (!address) return 0;

        // Check cached credits
        if (this.userCredits[address]) {
            return this.userCredits[address];
        }

        // Calculate credits based on CDR holdings
        const accessLevel = await this.getUserAccessLevel(address);
        if (!accessLevel) return 0;

        // Base credits from access level
        const baseCredits = accessLevel.credits;

        // Additional credits from CDR holdings above minimum
        const extraCDR = accessLevel.balance - accessLevel.min;
        const extraCredits = Math.floor(extraCDR * (this.aiCreditRate / 1000));

        const totalCredits = baseCredits + extraCredits;

        // Cache credits
        this.userCredits[address] = totalCredits;

        return totalCredits;
    }

    /**
     * Use AI credits for a request
     */
    async useCredits(address, amount) {
        const currentCredits = await this.getUserCredits(address);
        if (currentCredits < amount) {
            throw new Error(`Insufficient AI credits. Need ${amount}, have ${currentCredits}`);
        }

        this.userCredits[address] = currentCredits - amount;

        // Award CDR reward for AI usage
        await this.awardCDRForUsage(address, amount);

        return this.userCredits[address];
    }

    /**
     * Award CDR tokens for AI usage (simulated)
     */
    async awardCDRForUsage(address, creditAmount) {
        // In a real implementation, this would mint/burn tokens
        // For now, we'll track rewards for potential future distribution

        if (!this.aiRewards[address]) {
            this.aiRewards[address] = { totalEarned: 0, sessions: 0 };
        }

        // Award 0.01 CDR per 100 credits used (very small reward)
        const cdrReward = (creditAmount / 100) * 0.01;

        this.aiRewards[address].totalEarned += cdrReward;
        this.aiRewards[address].sessions += 1;

        console.log(`🎁 Awarded ${cdrReward} CDR to ${address} for AI usage`);

        return cdrReward;
    }

    /**
     * Integrate with AI Agents
     */
    integrateWithAIAgents() {
        // Hook into agent mappings for CDR-based access control
        if (window.agentMappings) {
            const originalGetAgent = window.agentMappings.getAgent;

            window.agentMappings.getAgent = async (agentId, userAddress) => {
                // Check CDR access before allowing agent access
                const canAccess = await this.canAccessFeature(userAddress, 'agent-access');
                if (!canAccess) {
                    throw new Error('CDR token required for AI agent access. Hold at least 100 CDR tokens.');
                }

                return originalGetAgent.call(window.agentMappings, agentId);
            };
        }
    }

    /**
     * Integrate with OpenAI Orchestrator
     */
    integrateWithOpenAIOrchestrator() {
        if (window.openaiOrchestrator) {
            const originalProcessRequest = window.openaiOrchestrator.processRequest;

            window.openaiOrchestrator.processRequest = async (request, userAddress) => {
                // Check credits
                const creditCost = this.calculateRequestCost(request);
                await this.useCredits(userAddress, creditCost);

                // Add priority based on access level
                const accessLevel = await this.getUserAccessLevel(userAddress);
                if (accessLevel && accessLevel.priority > 1) {
                    request.priority = accessLevel.priority;
                }

                return originalProcessRequest.call(window.openaiOrchestrator, request);
            };
        }
    }

    /**
     * Integrate with Security Manager
     */
    integrateWithSecurityManager() {
        if (window.securityManager) {
            // Add CDR-based security clearance levels
            const originalCheckClearance = window.securityManager.checkClearance;

            window.securityManager.checkClearance = async (userAddress, requiredLevel) => {
                const accessLevel = await this.getUserAccessLevel(userAddress);

                // Map CDR access levels to security clearance
                const clearanceMapping = {
                    bronze: 1,
                    silver: 2,
                    gold: 3,
                    platinum: 4
                };

                const userClearance = accessLevel ? clearanceMapping[accessLevel.level] : 0;

                if (userClearance < requiredLevel) {
                    throw new Error(`Insufficient security clearance. CDR access level: ${accessLevel ? accessLevel.level : 'none'}`);
                }

                return originalCheckClearance.call(window.securityManager, userAddress, requiredLevel);
            };
        }
    }

    /**
     * Calculate credit cost for AI request
     */
    calculateRequestCost(request) {
        // Base costs for different AI operations
        const baseCosts = {
            'text-generation': 10,
            'code-assist': 25,
            'image-gen': 100,
            'video-gen': 500,
            'agent-query': 50,
            'custom-model': 200
        };

        // Calculate based on request type and complexity
        let cost = 10; // Default

        if (request.type && baseCosts[request.type]) {
            cost = baseCosts[request.type];
        }

        // Factor in request size/complexity
        if (request.prompt && request.prompt.length > 1000) {
            cost *= 2;
        }

        return Math.ceil(cost);
    }

    /**
     * Setup AI access control UI
     */
    setupAIAccessControl() {
        // Add CDR status to AI interfaces
        this.addCDRAIStatusWidget();
        this.addAIAccessGates();
    }

    /**
     * Setup credit system
     */
    setupCreditSystem() {
        // Auto-refresh credits when balances update
        window.addEventListener('balanceUpdate', async (event) => {
            const address = this.getCurrentAddress();
            if (address) {
                // Clear cached credits to recalculate
                delete this.userCredits[address];
                await this.updateCreditDisplay(address);
            }
        });
    }

    /**
     * Setup reward system
     */
    setupRewardSystem() {
        // Track AI usage for potential CDR rewards
        this.aiUsageTracker = {
            sessions: {},
            rewards: {}
        };
    }

    /**
     * Add CDR AI status widget
     */
    addCDRAIStatusWidget() {
        const widget = document.createElement('div');
        widget.id = 'cdr-ai-status';
        widget.innerHTML = `
            <div class="cdr-ai-header">
                <h4>👨‍💻 CDR AI Access</h4>
                <div class="cdr-status">
                    <span class="cdr-level" id="cdr-level">No Access</span>
                    <span class="cdr-credits" id="cdr-credits">-- Credits</span>
                </div>
            </div>
            <div class="cdr-features" id="cdr-features">
                <p>Connect wallet with CDR tokens to access AI features</p>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #cdr-ai-status {
                background: linear-gradient(135deg, rgba(40,40,80,0.9), rgba(60,60,120,0.9));
                border: 2px solid #4a90e2;
                border-radius: 10px;
                padding: 15px;
                margin: 10px 0;
                color: #e4e4e4;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }

            .cdr-ai-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .cdr-ai-header h4 {
                margin: 0;
                color: #4a90e2;
            }

            .cdr-status {
                text-align: right;
                font-size: 0.8em;
            }

            .cdr-level {
                display: block;
                color: #ffd700;
                font-weight: bold;
            }

            .cdr-credits {
                display: block;
                color: #00ff88;
            }

            .cdr-features {
                font-size: 0.8em;
                color: #cccccc;
            }

            .cdr-feature-list {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                margin-top: 5px;
            }

            .cdr-feature {
                background: rgba(0,0,0,0.3);
                padding: 3px 6px;
                border-radius: 3px;
                text-align: center;
                font-size: 0.7em;
            }
        `;

        document.body.appendChild(styles);
        document.body.appendChild(widget);

        // Auto-update status
        this.updateCDRAIStatus();
        setInterval(() => this.updateCDRAIStatus(), 30000); // Update every 30 seconds
    }

    /**
     * Update CDR AI status display
     */
    async updateCDRAIStatus() {
        const address = this.getCurrentAddress();
        if (!address) {
            this.setStatusDisplay('No Access', '-- Credits', 'Connect wallet with CDR tokens');
            return;
        }

        const accessLevel = await this.getUserAccessLevel(address);
        const credits = await this.getUserCredits(address);

        if (!accessLevel) {
            this.setStatusDisplay('No Access', '0 Credits', `Need ${this.minCDRHolding}+ CDR tokens`);
            return;
        }

        const features = accessLevel.features.map(f => `<span class="cdr-feature">${f}</span>`).join('');

        this.setStatusDisplay(
            accessLevel.level.toUpperCase(),
            `${credits} Credits`,
            `<div class="cdr-feature-list">${features}</div>`
        );
    }

    /**
     * Set status display values
     */
    setStatusDisplay(level, credits, features) {
        const levelEl = document.getElementById('cdr-level');
        const creditsEl = document.getElementById('cdr-credits');
        const featuresEl = document.getElementById('cdr-features');

        if (levelEl) levelEl.textContent = level;
        if (creditsEl) creditsEl.textContent = credits;
        if (featuresEl) featuresEl.innerHTML = features;
    }

    /**
     * Add access gates to AI features
     */
    addAIAccessGates() {
        // Gate Sora video generation
        if (window.soraVideoGenerator) {
            const originalShowApiModal = window.soraVideoGenerator.showApiModal;
            window.soraVideoGenerator.showApiModal = async () => {
                const address = this.getCurrentAddress();
                const canAccess = await this.canAccessFeature(address, 'video-gen');
                if (!canAccess) {
                    alert('🎬 Video generation requires CDR tokens!\n\nHold at least 10,000 CDR for Gold access or 50,000+ CDR for Platinum access to unlock Sora AI video generation.');
                    return;
                }
                originalShowApiModal.call(window.soraVideoGenerator);
            };
        }
    }

    /**
     * Get current user address
     */
    getCurrentAddress() {
        if (window.universalWalletAuth && window.universalWalletAuth.getAddress) {
            return window.universalWalletAuth.getAddress();
        }
        if (window.sharedWalletSystem && window.sharedWalletSystem.address) {
            return window.sharedWalletSystem.address;
        }
        return null;
    }

    /**
     * Update credit display
     */
    async updateCreditDisplay(address) {
        if (!address) return;
        const credits = await this.getUserCredits(address);
        // Update any credit displays here
    }

    /**
     * Get AI usage statistics
     */
    getUsageStats(address) {
        return this.aiRewards[address] || { totalEarned: 0, sessions: 0 };
    }

    /**
     * Public API methods
     */
    async checkAccess(address, feature) {
        return this.canAccessFeature(address, feature);
    }

    async getCredits(address) {
        return this.getUserCredits(address);
    }

    async spendCredits(address, amount) {
        return this.useCredits(address, amount);
    }
}

// Create global instance
window.cdrAIUtilization = new CDRAIUtilization();

console.log('👨‍💻 CDR AI Utilization System loaded - token-powered AI access enabled');
