// MandemOS Sovereign Token Integration - Dashboard JavaScript
// Purpose: Client-side functionality for the visual dashboard

class DashboardManager {
    constructor() {
        this.data = {
            agents: [],
            scoringStats: {},
            dripStats: {},
            syncStatus: {}
        };
        this.updateInterval = null;
        this.isInitialized = false;
    }

    // Initialize dashboard
    initialize() {
        if (this.isInitialized) return;

        console.log('📊 Initializing Dashboard Manager...');
        this.setupEventListeners();
        this.startAutoRefresh();
        this.loadInitialData();
        this.isInitialized = true;
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for agent system updates
        if (window.agentSystem) {
            // Override agent system log function to update dashboard
            const originalLog = window.agentSystem.log;
            window.agentSystem.log = (message, level = 'info') => {
                originalLog.call(window.agentSystem, message, level);
                this.handleAgentUpdate();
            };
        }

        // Listen for token sync updates
        if (window.tokenSyncManager) {
            // Monitor for sync status changes
            setInterval(() => {
                this.checkForUpdates();
            }, 5000);
        }
    }

    // Start automatic refresh
    startAutoRefresh() {
        this.updateInterval = setInterval(() => {
            this.refreshData();
        }, 30000); // Refresh every 30 seconds
    }

    // Load initial data
    loadInitialData() {
        console.log('🔄 Loading initial dashboard data...');
        this.refreshData();
    }

    // Refresh all dashboard data
    refreshData() {
        this.loadAgentData();
        this.loadScoringStats();
        this.loadDripStats();
        this.loadSyncStatus();
        this.loadRealAgentData();
        this.updateUI();
    }

    // Load agent data from agent system
    loadAgentData() {
        if (window.agentSystem && window.agentSystem.agents) {
            this.data.agents = window.agentSystem.agents.map(agent => {
                // Calculate score if scoring system is available
                const score = window.agentScore ? window.agentScore.calculateScore(agent) : 0.5;
                const isEligible = window.agentScore ? window.agentScore.isEligible(score) : false;

                // Get drip info if available
                const dripInfo = window.dripProtocol ? window.dripProtocol.getAgentDripInfo(agent.id) : null;

                return {
                    id: agent.id,
                    name: agent.name,
                    type: agent.type,
                    status: agent.isActive ? 'Active' : 'Inactive',
                    score: score,
                    isEligible: isEligible,
                    totalDrips: dripInfo ? dripInfo.totalDripped : 0,
                    lastActivity: agent.lastActivity || new Date(),
                    walletAddress: dripInfo ? dripInfo.walletAddress : 'Unknown'
                };
            });
        }
    }

    // Load scoring statistics
    loadScoringStats() {
        if (window.agentScore) {
            this.data.scoringStats = window.agentScore.getScoringStats();
        }
    }

    // Load drip statistics
    loadDripStats() {
        if (window.dripProtocol) {
            this.data.dripStats = window.dripProtocol.getDripStats();
        }
    }

    // Load token sync status
    loadSyncStatus() {
        if (window.tokenSyncManager) {
            this.data.syncStatus = window.tokenSyncManager.getSystemStatus();
        }
    }

    // Load real-world agent data
    loadRealAgentData() {
        if (window.realAgentManager) {
            this.data.realAgents = window.realAgentManager.getAllRegisteredAgents().map(agent => {
                const performance = window.realAgentManager.getAgentPerformance(agent.id);
                return {
                    id: agent.id,
                    name: agent.name,
                    status: agent.status,
                    simulationScore: agent.tradingStats.simulationScore,
                    tradingVolume: performance ? performance.totalPnL : 0,
                    pnl: performance ? performance.totalPnL : 0,
                    strategy: agent.permissions.riskLevel,
                    lastActivity: agent.lastActivity,
                    isAuthorized: agent.permissions.canUseFunds
                };
            });
            this.updateRealAgentTable(this.data.realAgents);
        }
    }

    // Update UI with current data
    updateUI() {
        this.updateStatsCards();
        this.updateAgentTable();
        this.updateDripHistory();
        this.updateLastUpdated();
    }

    // Update statistics cards
    updateStatsCards() {
        const stats = this.data.scoringStats;
        const dripStats = this.data.dripStats;

        // Update agent statistics
        const totalAgents = this.data.agents.length;
        const activeAgents = this.data.agents.filter(a => a.status === 'Active').length;
        const eligibleAgents = this.data.agents.filter(a => a.isEligible).length;
        const eligibilityRate = totalAgents > 0 ? Math.round((eligibleAgents / totalAgents) * 100) : 0;

        this.setElementText('totalAgents', totalAgents);
        this.setElementText('activeAgents', activeAgents);
        this.setElementText('eligibilityRate', `${eligibilityRate}%`);

        // Update scoring statistics
        if (stats) {
            this.setElementText('avgScore', `${Math.round(stats.averageScore * 100)}%`);
        }

        // Update drip statistics
        if (dripStats) {
            this.setElementText('totalDripped', dripStats.totalDripped);
            this.setElementText('lastDrip', dripStats.lastDripTime ?
                this.formatDate(dripStats.lastDripTime) : 'Never');
        }
    }

    // Update agent table
    updateAgentTable() {
        const tbody = document.getElementById('agentTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.data.agents.forEach(agent => {
            const row = this.createAgentRow(agent);
            tbody.appendChild(row);
        });
    }

    // Create table row for agent
    createAgentRow(agent) {
        const row = document.createElement('tr');

        const scorePercent = Math.round(agent.score * 100);
        const eligibilityClass = agent.isEligible ? 'eligible' : 'ineligible';
        const eligibilityText = agent.isEligible ? 'Eligible' : 'Ineligible';

        row.innerHTML = `
            <td>${agent.name}</td>
            <td><span style="background: rgba(0,255,255,0.2); padding: 2px 6px; border-radius: 8px; font-size: 0.8em;">${agent.type}</span></td>
            <td><span style="color: ${agent.status === 'Active' ? '#00ff00' : '#ffaa00'};">${agent.status}</span></td>
            <td>
                <div class="score-bar" style="margin: 2px 0;">
                    <div class="score-fill" style="width: ${scorePercent}%; background: linear-gradient(90deg, ${this.getScoreColor(agent.score)});"></div>
                </div>
                <small>${scorePercent}%</small>
            </td>
            <td><span class="eligibility-badge ${eligibilityClass}">${eligibilityText}</span></td>
            <td>${agent.totalDrips}</td>
            <td><small>${this.formatDate(agent.lastActivity)}</small></td>
        `;

        return row;
    }

    // Get color for score visualization
    getScoreColor(score) {
        if (score >= 0.8) return '#00ff00, #44ff44';
        if (score >= 0.6) return '#ffaa00, #ffff00';
        return '#ff4444, #ff6666';
    }

    // Update drip history section
    updateDripHistory() {
        const container = document.getElementById('dripHistory');
        if (!container) return;

        const dripStats = this.data.dripStats;

        if (!dripStats.recentCycles || dripStats.recentCycles.length === 0) {
            container.innerHTML = '<p style="color: #8addff; text-align: center; padding: 20px;">No recent drip cycles</p>';
            return;
        }

        container.innerHTML = '';

        dripStats.recentCycles.slice(0, 5).forEach(cycle => {
            const item = this.createHistoryItem(cycle);
            container.appendChild(item);
        });
    }

    // Create history item for drip cycle
    createHistoryItem(cycle) {
        const item = document.createElement('div');
        item.className = 'history-item';

        const cycleDate = this.formatDate(cycle.timestamp);
        const successCount = cycle.results ? cycle.results.filter(r => r.success).length : 0;
        const totalCount = cycle.results ? cycle.results.length : 0;
        const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

        item.innerHTML = `
            <div>
                <div style="font-weight: bold; color: #00ffff;">Cycle #${cycle.cycle}</div>
                <div style="font-size: 0.9em; color: #8addff;">${cycleDate}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: bold;">${cycle.totalDripped} tokens</div>
                <div style="font-size: 0.9em; color: #8addff;">${cycle.eligibleAgents} eligible • ${successRate}% success</div>
            </div>
        `;

        return item;
    }

    // Update last updated timestamp
    updateLastUpdated() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            lastUpdated.textContent = new Date().toLocaleTimeString();
        }
    }

    // Set text content of element
    setElementText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    // Format date for display
    formatDate(date) {
        if (!date) return 'Unknown';

        const d = new Date(date);
        return d.toLocaleString();
    }

    // Handle agent system updates
    handleAgentUpdate() {
        // Debounce updates to avoid excessive refreshes
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            this.refreshData();
        }, 1000);
    }

    // Check for data updates
    checkForUpdates() {
        // Check if any data has changed significantly
        const needsUpdate = this.detectSignificantChanges();

        if (needsUpdate) {
            this.refreshData();
        }
    }

    // Detect significant changes in data
    detectSignificantChanges() {
        // This could be enhanced to compare current data with cached data
        // For now, always return false to avoid excessive updates
        return false;
    }

    // Get dashboard data for export
    getExportData() {
        return {
            timestamp: new Date(),
            agents: this.data.agents,
            scoringStats: this.data.scoringStats,
            dripStats: this.data.dripStats,
            syncStatus: this.data.syncStatus,
            summary: {
                totalAgents: this.data.agents.length,
                activeAgents: this.data.agents.filter(a => a.status === 'Active').length,
                eligibleAgents: this.data.agents.filter(a => a.isEligible).length,
                totalDripped: this.data.dripStats.totalDripped || 0,
                averageScore: this.data.scoringStats.averageScore || 0
            }
        };
    }

    // Export dashboard data
    exportData() {
        const data = this.getExportData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `mandemos-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📥 Dashboard data exported');
    }

    // Force drip cycle execution
    forceDripCycle() {
        if (window.dripProtocol) {
            window.dripProtocol.forceDripCycle();

            // Show loading indicator
            this.showNotification('Drip cycle initiated...', 'info');

            // Refresh data after a delay
            setTimeout(() => {
                this.refreshData();
                this.showNotification('Drip cycle completed', 'success');
            }, 3000);
        } else {
            this.showNotification('Drip protocol not available', 'error');
        }
    }

    // Show notification to user
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? 'rgba(255, 68, 68, 0.9)' : type === 'success' ? 'rgba(0, 255, 0, 0.9)' : 'rgba(0, 255, 255, 0.9)'};
            color: #000;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Cleanup when dashboard is destroyed
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.isInitialized = false;
    }
}

// Create global dashboard instance
const dashboard = new DashboardManager();

// Export functions for global access
function refreshDashboard() {
    dashboard.refreshData();
}

function forceDripCycle() {
    dashboard.forceDripCycle();
}

function exportData() {
    dashboard.exportData();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    dashboard.initialize();
});

console.log('📊 MandemOS Dashboard Manager loaded');

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardManager, refreshDashboard, forceDripCycle, exportData };
}
