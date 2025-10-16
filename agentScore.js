// MandemOS Sovereign Token Integration - Contribution Scoring Algorithm
// Purpose: Calculate agent performance scores for drip eligibility

class AgentScoringSystem {
    constructor() {
        this.scoringWeights = {
            activity: 0.25,      // Recent activity and responsiveness
            performance: 0.35,   // Success rate and effectiveness
            reliability: 0.20,   // Consistency over time
            impact: 0.20         // Overall system contribution
        };

        this.agentTypeMultipliers = {
            'error-recovery': 1.2,      // High impact agents
            'security': 1.2,           // Critical for system integrity
            'function-testing': 1.1,   // Core functionality testing
            'performance-monitoring': 1.1, // System health monitoring
            'button-testing': 1.0,     // Standard UI testing
            'navigation': 1.0          // Standard navigation testing
        };

        this.scoreHistory = {};
        this.baselineScores = {};
    }

    // Calculate comprehensive score for agent
    calculateScore(agent) {
        try {
            const agentId = agent.id || agent;
            const scores = {
                activity: this.calculateActivityScore(agent),
                performance: this.calculatePerformanceScore(agent),
                reliability: this.calculateReliabilityScore(agent),
                impact: this.calculateImpactScore(agent)
            };

            // Apply type multiplier
            const typeMultiplier = this.agentTypeMultipliers[agent.type] || 1.0;

            // Calculate weighted score
            let totalScore = 0;
            for (const [category, weight] of Object.entries(this.scoringWeights)) {
                totalScore += scores[category] * weight;
            }

            // Apply type multiplier and clamp to 0-1 range
            const finalScore = Math.min(1.0, Math.max(0, totalScore * typeMultiplier));

            // Store score for trend analysis
            this.storeScore(agentId, finalScore);

            return finalScore;

        } catch (error) {
            console.error(`Failed to calculate score for agent ${agent.id}:`, error);
            return 0;
        }
    }

    // Calculate activity score based on recent performance
    calculateActivityScore(agent) {
        const now = Date.now();
        const lastActivity = agent.lastActivity ? new Date(agent.lastActivity).getTime() : 0;

        if (lastActivity === 0) return 0;

        // Score based on recency (0-1, where 1 is very recent)
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);

        if (hoursSinceActivity < 1) return 1.0;      // Within last hour
        if (hoursSinceActivity < 6) return 0.8;      // Within last 6 hours
        if (hoursSinceActivity < 24) return 0.6;     // Within last 24 hours
        if (hoursSinceActivity < 72) return 0.4;     // Within last 3 days
        if (hoursSinceActivity < 168) return 0.2;    // Within last week

        return 0.1; // Older than a week
    }

    // Calculate performance score based on success metrics
    calculatePerformanceScore(agent) {
        try {
            // Get agent statistics from agent system
            const stats = window.agentSystem?.agentStats?.[agent.id];

            if (!stats) {
                // Fallback: use agent activity as proxy
                return agent.isActive ? 0.7 : 0.3;
            }

            // Calculate performance based on multiple factors
            const repairsScore = Math.min(1.0, (stats.repairs || 0) / 10) * 0.4;    // Up to 10 repairs
            const fixesScore = Math.min(1.0, (stats.fixes || 0) / 20) * 0.3;        // Up to 20 fixes
            const testsScore = Math.min(1.0, (stats.tests || 0) / 50) * 0.2;        // Up to 50 tests
            const efficiencyScore = Math.min(1.0, (stats.efficiency || 0) / 100) * 0.1; // Up to 100% efficiency

            return repairsScore + fixesScore + testsScore + efficiencyScore;

        } catch (error) {
            console.error(`Failed to calculate performance score for ${agent.id}:`, error);
            return 0.5; // Neutral score on error
        }
    }

    // Calculate reliability score based on historical consistency
    calculateReliabilityScore(agent) {
        try {
            const agentId = agent.id;
            const recentScores = this.getRecentScores(agentId, 10);

            if (recentScores.length < 3) {
                // Not enough data for reliability calculation
                return agent.isActive ? 0.7 : 0.3;
            }

            // Calculate standard deviation of recent scores
            const mean = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
            const variance = recentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / recentScores.length;
            const stdDev = Math.sqrt(variance);

            // Lower standard deviation = higher reliability (inverted and normalized)
            const reliabilityScore = Math.max(0, 1.0 - (stdDev * 2)); // Scale factor of 2

            return reliabilityScore;

        } catch (error) {
            console.error(`Failed to calculate reliability score for ${agent.id}:`, error);
            return 0.5;
        }
    }

    // Calculate impact score based on system contribution
    calculateImpactScore(agent) {
        try {
            const agentId = agent.id;
            const agentType = agent.type;

            // Base impact score by agent type
            let baseScore = 0.5;

            switch (agentType) {
                case 'error-recovery':
                    baseScore = 0.9; // High impact - fixes critical issues
                    break;
                case 'security':
                    baseScore = 0.8; // Critical for system security
                    break;
                case 'function-testing':
                    baseScore = 0.7; // Core functionality validation
                    break;
                case 'performance-monitoring':
                    baseScore = 0.7; // System health monitoring
                    break;
                case 'button-testing':
                    baseScore = 0.6; // UI interaction testing
                    break;
                case 'navigation':
                    baseScore = 0.6; // Navigation flow testing
                    break;
                default:
                    baseScore = 0.5; // Unknown/undefined type
            }

            // Adjust based on recent activity and system health
            const activityMultiplier = agent.isActive ? 1.0 : 0.5;

            // Check if agent has been making recent contributions
            const recentContributions = this.getRecentContributions(agentId);

            return Math.min(1.0, baseScore * activityMultiplier * (1 + recentContributions * 0.1));

        } catch (error) {
            console.error(`Failed to calculate impact score for ${agent.id}:`, error);
            return 0.5;
        }
    }

    // Get recent scores for trend analysis
    getRecentScores(agentId, count = 10) {
        if (!this.scoreHistory[agentId]) return [];

        return this.scoreHistory[agentId]
            .slice(0, count)
            .map(entry => entry.score);
    }

    // Get recent contributions count
    getRecentContributions(agentId) {
        if (!this.scoreHistory[agentId]) return 0;

        const recent = this.scoreHistory[agentId].slice(0, 5);
        return recent.filter(entry => entry.score > 0.7).length;
    }

    // Store score for historical tracking
    storeScore(agentId, score) {
        if (!this.scoreHistory[agentId]) {
            this.scoreHistory[agentId] = [];
        }

        this.scoreHistory[agentId].unshift({
            score: score,
            timestamp: new Date(),
            agentType: this.getAgentType(agentId)
        });

        // Keep only last 50 scores per agent
        if (this.scoreHistory[agentId].length > 50) {
            this.scoreHistory[agentId] = this.scoreHistory[agentId].slice(0, 50);
        }

        // Save to localStorage periodically
        if (Math.random() < 0.1) { // 10% chance on each score
            this.saveScoreHistory();
        }
    }

    // Get agent type (fallback method)
    getAgentType(agentId) {
        if (window.agentSystem && window.agentSystem.agents) {
            const agent = window.agentSystem.agents.find(a => a.id === agentId);
            return agent ? agent.type : 'unknown';
        }
        return 'unknown';
    }

    // Load score history from localStorage
    loadScoreHistory() {
        try {
            const stored = localStorage.getItem('mandemosAgentScores');
            if (stored) {
                this.scoreHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load score history:', error);
        }
    }

    // Save score history to localStorage
    saveScoreHistory() {
        try {
            localStorage.setItem('mandemosAgentScores', JSON.stringify(this.scoreHistory));
        } catch (error) {
            console.error('Failed to save score history:', error);
        }
    }

    // Check if agent is eligible for rewards
    isEligible(score, threshold = 0.75) {
        return score >= threshold;
    }

    // Get agent score breakdown
    getScoreBreakdown(agent) {
        const scores = {
            activity: this.calculateActivityScore(agent),
            performance: this.calculatePerformanceScore(agent),
            reliability: this.calculateReliabilityScore(agent),
            impact: this.calculateImpactScore(agent)
        };

        const weights = this.scoringWeights;
        const weightedScores = {};

        let totalWeightedScore = 0;
        for (const [category, weight] of Object.entries(weights)) {
            weightedScores[category] = scores[category] * weight;
            totalWeightedScore += weightedScores[category];
        }

        const typeMultiplier = this.agentTypeMultipliers[agent.type] || 1.0;
        const finalScore = Math.min(1.0, totalWeightedScore * typeMultiplier);

        return {
            rawScores: scores,
            weightedScores: weightedScores,
            typeMultiplier: typeMultiplier,
            finalScore: finalScore,
            isEligible: this.isEligible(finalScore)
        };
    }

    // Get top performing agents
    getTopPerformers(count = 5) {
        if (!window.agentSystem || !window.agentSystem.agents) return [];

        const scoredAgents = window.agentSystem.agents.map(agent => ({
            agent: agent,
            score: this.calculateScore(agent),
            breakdown: this.getScoreBreakdown(agent)
        }));

        return scoredAgents
            .sort((a, b) => b.score - a.score)
            .slice(0, count);
    }

    // Get agent performance trends
    getPerformanceTrends(agentId, days = 7) {
        if (!this.scoreHistory[agentId]) return null;

        const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
        const recentScores = this.scoreHistory[agentId].filter(
            entry => new Date(entry.timestamp).getTime() > cutoffTime
        );

        if (recentScores.length < 2) return null;

        const scores = recentScores.map(entry => entry.score);
        const firstScore = scores[scores.length - 1];
        const lastScore = scores[0];
        const trend = lastScore - firstScore;

        return {
            currentScore: lastScore,
            trend: trend,
            trendDirection: trend > 0.05 ? 'improving' : trend < -0.05 ? 'declining' : 'stable',
            averageScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
            dataPoints: scores.length
        };
    }

    // Initialize scoring system
    initialize() {
        this.loadScoreHistory();

        // Calculate baseline scores for all agents
        if (window.agentSystem && window.agentSystem.agents) {
            window.agentSystem.agents.forEach(agent => {
                if (agent.isActive) {
                    this.baselineScores[agent.id] = this.calculateScore(agent);
                }
            });
        }

        console.log('📊 Agent Scoring System initialized');
    }

    // Get comprehensive scoring statistics
    getScoringStats() {
        const allScores = Object.values(this.scoreHistory).flat().map(entry => entry.score);
        const recentScores = Object.values(this.scoreHistory).flat()
            .filter(entry => (Date.now() - new Date(entry.timestamp).getTime()) < (24 * 60 * 60 * 1000))
            .map(entry => entry.score);

        return {
            totalAgentsScored: Object.keys(this.scoreHistory).length,
            totalScoreEntries: allScores.length,
            averageScore: allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0,
            recentAverageScore: recentScores.length > 0 ? recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length : 0,
            eligibilityRate: allScores.length > 0 ? (allScores.filter(s => s >= 0.75).length / allScores.length) * 100 : 0,
            baselineScores: this.baselineScores
        };
    }
}

// Initialize scoring system
const agentScore = new AgentScoringSystem();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        agentScore.initialize();
    });
} else {
    agentScore.initialize();
}

console.log('📊 MandemOS Agent Scoring System loaded');

// Export functions for external use
function calculateScore(agent) {
    return agentScore.calculateScore(agent);
}

function isEligible(score, threshold = 0.75) {
    return agentScore.isEligible(score, threshold);
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateScore, isEligible, AgentScoringSystem };
}
