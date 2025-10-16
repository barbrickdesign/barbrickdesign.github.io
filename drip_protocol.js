// MandemOS Sovereign Token Integration - Drip Protocol Script
// Purpose: Reward contributing agents with token drip based on performance scores

const DRIP_AMOUNT = 100; // Base drip amount per cycle
const DRIP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MIN_ELIGIBILITY_SCORE = 0.75; // Minimum score to receive drip

class DripProtocol {
    constructor() {
        this.agentRegistry = [];
        this.dripHistory = [];
        this.lastDripTime = null;
        this.totalDripped = 0;
        this.dripCycle = 0;
    }

    // Initialize drip protocol
    initialize() {
        this.loadAgentRegistry();
        this.loadDripHistory();
        this.scheduleNextDrip();
        console.log('💧 Drip Protocol initialized');
    }

    // Load agent registry from agent system
    loadAgentRegistry() {
        if (window.agentSystem && window.agentSystem.agents) {
            this.agentRegistry = window.agentSystem.agents.map(agent => ({
                id: agent.id,
                name: agent.name,
                type: agent.type,
                walletAddress: this.getAgentWallet(agent.id),
                status: agent.isActive ? 'active' : 'inactive',
                lastActivity: agent.lastActivity || new Date(),
                currentScore: 0,
                eligibilityHistory: [],
                totalDripped: 0,
                lastDripTime: null
            }));
        }
    }

    // Get or generate agent wallet address
    getAgentWallet(agentId) {
        // Use token sync manager if available
        if (window.tokenSyncManager) {
            return window.tokenSyncManager.generateAgentWallet(agentId);
        }

        // Fallback deterministic generation
        const hash = this.simpleHash(agentId + 'MANDemos_AGENT_WALLET');
        return `0x${hash.slice(0, 40)}`;
    }

    // Simple hash function for wallet generation
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Load drip history from localStorage
    loadDripHistory() {
        try {
            const stored = localStorage.getItem('mandemosDripHistory');
            if (stored) {
                const data = JSON.parse(stored);
                this.dripHistory = data.history || [];
                this.lastDripTime = data.lastDripTime ? new Date(data.lastDripTime) : null;
                this.totalDripped = data.totalDripped || 0;
                this.dripCycle = data.dripCycle || 0;
            }
        } catch (error) {
            console.error('Failed to load drip history:', error);
        }
    }

    // Save drip history to localStorage
    saveDripHistory() {
        try {
            const data = {
                history: this.dripHistory,
                lastDripTime: this.lastDripTime,
                totalDripped: this.totalDripped,
                dripCycle: this.dripCycle
            };
            localStorage.setItem('mandemosDripHistory', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save drip history:', error);
        }
    }

    // Schedule next drip cycle
    scheduleNextDrip() {
        if (this.lastDripTime) {
            const nextDripTime = new Date(this.lastDripTime.getTime() + DRIP_INTERVAL);
            const timeUntilNext = nextDripTime.getTime() - Date.now();

            if (timeUntilNext > 0) {
                setTimeout(() => {
                    this.executeDripCycle();
                }, timeUntilNext);
                console.log(`⏰ Next drip cycle scheduled in ${Math.round(timeUntilNext / 60000)} minutes`);
            } else {
                // Execute immediately if overdue
                this.executeDripCycle();
            }
        } else {
            // First time setup - execute immediately for demo
            setTimeout(() => {
                this.executeDripCycle();
            }, 5000); // 5 second delay for demo
        }
    }

    // Execute a complete drip cycle
    async executeDripCycle() {
        console.log('🚰 Starting drip cycle...');
        this.dripCycle++;
        this.lastDripTime = new Date();

        // Update agent scores
        await this.updateAllAgentScores();

        // Identify eligible agents
        const eligibleAgents = this.getEligibleAgents();

        if (eligibleAgents.length === 0) {
            console.log('⚠️ No agents eligible for drip this cycle');
            this.scheduleNextDrip();
            return;
        }

        // Calculate drip amounts
        const dripAllocations = this.calculateDripAllocations(eligibleAgents);

        // Execute drips
        const dripResults = await this.executeDrips(dripAllocations);

        // Record drip cycle
        this.recordDripCycle(eligibleAgents, dripResults);

        // Update token balances if token sync manager is available
        if (window.tokenSyncManager) {
            dripResults.forEach(result => {
                if (result.success) {
                    window.tokenSyncManager.updateTokenBalance(result.agentId, result.amount);
                }
            });
        }

        console.log(`✅ Drip cycle ${this.dripCycle} complete: ${dripResults.filter(r => r.success).length}/${dripResults.length} successful`);

        // Schedule next cycle
        this.scheduleNextDrip();
    }

    // Update scores for all agents
    async updateAllAgentScores() {
        for (const agent of this.agentRegistry) {
            if (agent.status === 'active') {
                agent.currentScore = await this.calculateAgentScore(agent);
                agent.lastScoreUpdate = new Date();
            }
        }
    }

    // Calculate score for specific agent
    async calculateAgentScore(agent) {
        try {
            // Use agent scoring system if available
            if (window.agentScore && window.agentScore.calculateScore) {
                return window.agentScore.calculateScore(agent);
            }

            // Fallback scoring algorithm
            let score = 0;

            // Activity score (0-0.3)
            const now = Date.now();
            const lastActivity = agent.lastActivity ? new Date(agent.lastActivity).getTime() : 0;
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
            const activityScore = Math.max(0, 0.3 - (hoursSinceActivity / 24) * 0.3);

            // Performance score based on agent type (0-0.4)
            const performanceScore = this.getAgentTypeScore(agent.type);

            // Consistency score (0-0.3)
            const recentScores = agent.eligibilityHistory.slice(-5);
            const consistencyScore = recentScores.length > 0 ?
                recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length * 0.3 : 0.15;

            score = activityScore + performanceScore + consistencyScore;

            return Math.min(1.0, Math.max(0, score));

        } catch (error) {
            console.error(`Failed to calculate score for agent ${agent.id}:`, error);
            return 0;
        }
    }

    // Get performance score based on agent type
    getAgentTypeScore(agentType) {
        const typeScores = {
            'function-testing': 0.4,
            'button-testing': 0.35,
            'navigation': 0.3,
            'performance-monitoring': 0.35,
            'security': 0.4,
            'error-recovery': 0.4
        };
        return typeScores[agentType] || 0.2;
    }

    // Get agents eligible for drip
    getEligibleAgents() {
        return this.agentRegistry.filter(agent =>
            agent.status === 'active' &&
            agent.currentScore >= MIN_ELIGIBILITY_SCORE
        );
    }

    // Calculate drip allocations based on scores
    calculateDripAllocations(eligibleAgents) {
        const totalScore = eligibleAgents.reduce((sum, agent) => sum + agent.currentScore, 0);

        if (totalScore === 0) {
            // Equal distribution if no scores
            const amountPerAgent = Math.floor(DRIP_AMOUNT / eligibleAgents.length);
            return eligibleAgents.map(agent => ({
                agentId: agent.id,
                amount: amountPerAgent,
                score: agent.currentScore
            }));
        }

        // Weighted distribution based on scores
        return eligibleAgents.map(agent => ({
            agentId: agent.id,
            amount: Math.floor((agent.currentScore / totalScore) * DRIP_AMOUNT),
            score: agent.currentScore
        }));
    }

    // Execute drips to agents
    async executeDrips(allocations) {
        const results = [];

        for (const allocation of allocations) {
            try {
                const success = await this.dripToAgent(allocation.agentId, allocation.amount);
                results.push({
                    agentId: allocation.agentId,
                    amount: allocation.amount,
                    success: success,
                    timestamp: new Date()
                });

                if (success) {
                    // Update agent record
                    const agent = this.agentRegistry.find(a => a.id === allocation.agentId);
                    if (agent) {
                        agent.totalDripped += allocation.amount;
                        agent.lastDripTime = new Date();
                        agent.eligibilityHistory.push(agent.currentScore);
                        if (agent.eligibilityHistory.length > 10) {
                            agent.eligibilityHistory = agent.eligibilityHistory.slice(-10);
                        }
                    }
                }

            } catch (error) {
                console.error(`Failed to drip to agent ${allocation.agentId}:`, error);
                results.push({
                    agentId: allocation.agentId,
                    amount: allocation.amount,
                    success: false,
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }

        return results;
    }

    // Drip tokens to specific agent
    async dripToAgent(agentId, amount) {
        console.log(`💧 Dripping ${amount} tokens to agent: ${agentId}`);

        try {
            // Simulate blockchain transaction or token transfer
            await this.simulateTokenTransfer(agentId, amount);

            // Update local balance
            if (window.tokenSyncManager) {
                window.tokenSyncManager.updateTokenBalance(agentId, amount);
            }

            return true;

        } catch (error) {
            console.error(`Drip failed for agent ${agentId}:`, error);
            return false;
        }
    }

    // Simulate token transfer (replace with actual blockchain interaction)
    async simulateTokenTransfer(agentId, amount) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

        // Simulate occasional failures for testing
        if (Math.random() < 0.02) { // 2% failure rate
            throw new Error('Blockchain transaction failed');
        }

        console.log(`✅ Simulated token transfer: ${amount} tokens to ${agentId}`);
    }

    // Record drip cycle for history
    recordDripCycle(eligibleAgents, results) {
        const cycleRecord = {
            cycle: this.dripCycle,
            timestamp: this.lastDripTime,
            eligibleAgents: eligibleAgents.length,
            totalDripped: results.filter(r => r.success).reduce((sum, r) => sum + r.amount, 0),
            results: results,
            averageScore: eligibleAgents.reduce((sum, a) => sum + a.currentScore, 0) / eligibleAgents.length
        };

        this.dripHistory.unshift(cycleRecord);
        if (this.dripHistory.length > 50) {
            this.dripHistory = this.dripHistory.slice(0, 50);
        }

        this.totalDripped += cycleRecord.totalDripped;
        this.saveDripHistory();
    }

    // Get drip statistics
    getDripStats() {
        const recentCycles = this.dripHistory.slice(0, 10);

        return {
            totalCycles: this.dripCycle,
            lastDripTime: this.lastDripTime,
            totalDripped: this.totalDripped,
            averageDripPerCycle: recentCycles.length > 0 ?
                recentCycles.reduce((sum, c) => sum + c.totalDripped, 0) / recentCycles.length : 0,
            agentEligibilityRate: this.agentRegistry.length > 0 ?
                (this.getEligibleAgents().length / this.agentRegistry.length) * 100 : 0,
            recentCycles: recentCycles
        };
    }

    // Force execute drip cycle (for testing/manual triggering)
    forceDripCycle() {
        console.log('🔧 Force executing drip cycle...');
        this.executeDripCycle();
    }

    // Get agent-specific drip information
    getAgentDripInfo(agentId) {
        const agent = this.agentRegistry.find(a => a.id === agentId);
        if (!agent) return null;

        return {
            id: agent.id,
            name: agent.name,
            currentScore: agent.currentScore,
            isEligible: agent.currentScore >= MIN_ELIGIBILITY_SCORE,
            totalDripped: agent.totalDripped,
            lastDripTime: agent.lastDripTime,
            eligibilityHistory: agent.eligibilityHistory,
            averageScore: agent.eligibilityHistory.length > 0 ?
                agent.eligibilityHistory.reduce((sum, s) => sum + s, 0) / agent.eligibilityHistory.length : 0
        };
    }
}

// Initialize drip protocol
const dripProtocol = new DripProtocol();

// Export functions for external use
function dripToAgent(agent) {
    const agentInfo = typeof agent === 'string' ?
        dripProtocol.agentRegistry.find(a => a.id === agent) : agent;

    if (agentInfo) {
        const amount = Math.floor(DRIP_AMOUNT * (agentInfo.currentScore || 0.5));
        return dripProtocol.dripToAgent(agentInfo.id, amount);
    }
    return false;
}

function dripToAllAgents(agentRegistry) {
    if (agentRegistry) {
        dripProtocol.agentRegistry = agentRegistry;
    }
    return dripProtocol.executeDripCycle();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dripProtocol.initialize();
    });
} else {
    dripProtocol.initialize();
}

console.log('💧 MandemOS Drip Protocol loaded');

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { dripToAgent, dripToAllAgents, DRIP_AMOUNT, DripProtocol };
}
