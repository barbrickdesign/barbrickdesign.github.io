// MandemOS Sovereign Token Integration - Token Sync Script
// Purpose: Push governing token to all MandemOS nodes and agents

const TOKEN_HASH = 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r';
const SYNC_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 3;

class TokenSyncManager {
    constructor() {
        this.nodeRegistry = [];
        this.agentRegistry = [];
        this.syncStatus = {};
        this.tokenBalances = {};
        this.lastSyncTime = null;
    }

    // Initialize with current agent system
    initialize() {
        this.loadNodeRegistry();
        this.loadAgentRegistry();
        this.loadTokenBalances();
        console.log('🔗 Token Sync Manager initialized');
    }

    // Load node registry from localStorage or API
    loadNodeRegistry() {
        try {
            const stored = localStorage.getItem('mandemosNodeRegistry');
            if (stored) {
                this.nodeRegistry = JSON.parse(stored);
            } else {
                // Initialize with default nodes
                this.nodeRegistry = [
                    { id: 'main-hub', url: window.location.origin, type: 'primary', status: 'active' },
                    { id: 'ember-terminal', url: `${window.location.origin}/ember-terminal`, type: 'secondary', status: 'active' },
                    { id: 'gem-bot-universe', url: `${window.location.origin}/gem-bot-universe`, type: 'secondary', status: 'active' }
                ];
                this.saveNodeRegistry();
            }
        } catch (error) {
            console.error('Failed to load node registry:', error);
            this.nodeRegistry = [];
        }
    }

    // Load agent registry from current agent system
    loadAgentRegistry() {
        if (window.agentSystem && window.agentSystem.agents) {
            this.agentRegistry = window.agentSystem.agents.map(agent => ({
                id: agent.id,
                name: agent.name,
                type: agent.type,
                walletAddress: this.generateAgentWallet(agent.id),
                status: agent.isActive ? 'active' : 'inactive',
                lastActivity: agent.lastActivity || new Date(),
                tokenBalance: this.tokenBalances[agent.id] || 0
            }));
        }
    }

    // Generate deterministic wallet address for agent
    generateAgentWallet(agentId) {
        // Simple deterministic generation - in production, use proper key derivation
        const hash = this.simpleHash(agentId + TOKEN_HASH);
        return `0x${hash.slice(0, 40)}`;
    }

    // Simple hash function for deterministic wallet generation
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // Save node registry to localStorage
    saveNodeRegistry() {
        try {
            localStorage.setItem('mandemosNodeRegistry', JSON.stringify(this.nodeRegistry));
        } catch (error) {
            console.error('Failed to save node registry:', error);
        }
    }

    // Load token balances from localStorage
    loadTokenBalances() {
        try {
            const stored = localStorage.getItem('mandemosTokenBalances');
            if (stored) {
                this.tokenBalances = JSON.parse(stored);
            } else {
                this.tokenBalances = {};
            }
        } catch (error) {
            console.error('Failed to load token balances:', error);
            this.tokenBalances = {};
        }
    }

    // Save token balances to localStorage
    saveTokenBalances() {
        try {
            localStorage.setItem('mandemosTokenBalances', JSON.stringify(this.tokenBalances));
        } catch (error) {
            console.error('Failed to save token balances:', error);
        }
    }

    // Sync token to specific node
    async syncToNode(node) {
        const nodeId = node.id || node;
        console.log(`🔄 Syncing token to node: ${nodeId}`);

        try {
            // Simulate token injection and confirmation
            const syncData = {
                tokenHash: TOKEN_HASH,
                timestamp: Date.now(),
                nodeId: nodeId,
                version: '1.0.0',
                checksum: this.generateChecksum(TOKEN_HASH + nodeId)
            };

            // In production, this would make actual API calls to nodes
            // For now, simulate the sync process
            await this.simulateNodeSync(node, syncData);

            this.syncStatus[nodeId] = {
                status: 'success',
                lastSync: new Date(),
                version: syncData.version,
                error: null
            };

            console.log(`✅ Token synced to node: ${nodeId}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to sync token to node ${nodeId}:`, error);
            this.syncStatus[nodeId] = {
                status: 'failed',
                lastSync: new Date(),
                error: error.message
            };
            return false;
        }
    }

    // Simulate node synchronization (replace with actual API calls)
    async simulateNodeSync(node, syncData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // Simulate occasional failures for testing
        if (Math.random() < 0.05) { // 5% failure rate
            throw new Error('Node connection timeout');
        }

        // Simulate successful sync
        console.log(`📡 Node ${node.id} received token sync:`, syncData);
    }

    // Generate checksum for data integrity
    generateChecksum(data) {
        return this.simpleHash(data).slice(0, 8);
    }

    // Sync token to all registered nodes
    async syncAllNodes() {
        console.log('🚀 Broadcasting token sync to all nodes...');
        this.lastSyncTime = new Date();

        const results = [];
        for (const node of this.nodeRegistry) {
            if (node.status === 'active') {
                try {
                    const success = await this.syncToNode(node);
                    results.push({ node: node.id, success });
                } catch (error) {
                    console.error(`Failed to sync node ${node.id}:`, error);
                    results.push({ node: node.id, success: false, error: error.message });
                }
            }
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = this.nodeRegistry.filter(n => n.status === 'active').length;

        console.log(`📊 Token sync complete: ${successCount}/${totalCount} nodes synced`);

        // Save sync status
        localStorage.setItem('mandemosLastSync', JSON.stringify({
            timestamp: this.lastSyncTime,
            results: results,
            successRate: successCount / totalCount
        }));

        return results;
    }

    // Get sync status for all nodes
    getSyncStatus() {
        return {
            lastSyncTime: this.lastSyncTime,
            nodeStatuses: this.syncStatus,
            nodeRegistry: this.nodeRegistry,
            totalNodes: this.nodeRegistry.length,
            activeNodes: this.nodeRegistry.filter(n => n.status === 'active').length
        };
    }

    // Add new node to registry
    addNode(nodeData) {
        const node = {
            id: nodeData.id,
            url: nodeData.url,
            type: nodeData.type || 'secondary',
            status: 'active',
            addedAt: new Date(),
            ...nodeData
        };

        this.nodeRegistry.push(node);
        this.saveNodeRegistry();
        console.log(`➕ Added new node to registry: ${node.id}`);
    }

    // Remove node from registry
    removeNode(nodeId) {
        const index = this.nodeRegistry.findIndex(n => n.id === nodeId);
        if (index !== -1) {
            this.nodeRegistry.splice(index, 1);
            delete this.syncStatus[nodeId];
            this.saveNodeRegistry();
            console.log(`➖ Removed node from registry: ${nodeId}`);
        }
    }

    // Get token balance for agent or node
    getTokenBalance(entityId) {
        return this.tokenBalances[entityId] || 0;
    }

    // Update token balance for agent or node
    updateTokenBalance(entityId, amount) {
        this.tokenBalances[entityId] = Math.max(0, (this.tokenBalances[entityId] || 0) + amount);
        this.saveTokenBalances();
    }

    // Distribute tokens to all active agents (drip functionality)
    distributeTokensToAgents(totalAmount) {
        const activeAgents = this.agentRegistry.filter(agent => agent.status === 'active');

        if (activeAgents.length === 0) {
            console.log('⚠️ No active agents to distribute tokens to');
            return;
        }

        const amountPerAgent = Math.floor(totalAmount / activeAgents.length);

        activeAgents.forEach(agent => {
            this.updateTokenBalance(agent.id, amountPerAgent);
            console.log(`💰 Distributed ${amountPerAgent} tokens to agent: ${agent.name}`);
        });

        console.log(`📈 Token distribution complete: ${totalAmount} tokens distributed to ${activeAgents.length} agents`);
    }

    // Get comprehensive system status
    getSystemStatus() {
        return {
            tokenHash: TOKEN_HASH,
            nodeRegistry: this.nodeRegistry,
            agentRegistry: this.agentRegistry,
            syncStatus: this.syncStatus,
            tokenBalances: this.tokenBalances,
            lastSyncTime: this.lastSyncTime,
            totalNodes: this.nodeRegistry.length,
            activeAgents: this.agentRegistry.filter(a => a.status === 'active').length,
            totalTokensDistributed: Object.values(this.tokenBalances).reduce((sum, balance) => sum + balance, 0)
        };
    }
}

// Initialize token sync manager
const tokenSyncManager = new TokenSyncManager();

// Export functions for external use
function syncToNode(node) {
    return tokenSyncManager.syncToNode(node);
}

function syncAllNodes(nodeRegistry) {
    if (nodeRegistry) {
        tokenSyncManager.nodeRegistry = nodeRegistry;
    }
    return tokenSyncManager.syncAllNodes();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tokenSyncManager.initialize();
    });
} else {
    tokenSyncManager.initialize();
}

console.log('🔗 MandemOS Token Sync System loaded');

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { syncToNode, syncAllNodes, TOKEN_HASH, TokenSyncManager };
}
