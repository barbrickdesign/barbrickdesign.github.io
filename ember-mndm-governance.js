/**
 * EMBER TERMINAL MNDM GOVERNANCE INTEGRATION
 * Special governance features for Ember Terminal - Mandem.OS V3
 * Advanced token governance with AI assistance and real-time proposals
 */

class EmberMNDMGovernance {
    constructor() {
        this.terminal = null;
        this.governancePanel = null;
        this.aiAssistant = null;

        this.init();
    }

    init() {
        console.log('🔥 EMBER TERMINAL MNDM GOVERNANCE initializing...');

        // Wait for Ember Terminal to load
        this.waitForEmberTerminal().then(() => {
            this.setupGovernanceIntegration();
            console.log('✅ Ember Terminal MNDM Governance ready');
        });
    }

    /**
     * Wait for Ember Terminal to be fully loaded
     */
    async waitForEmberTerminal() {
        return new Promise((resolve) => {
            const checkTerminal = () => {
                if (window.emberTerminal || document.querySelector('.ember-terminal')) {
                    this.terminal = window.emberTerminal || document.querySelector('.ember-terminal');
                    resolve();
                } else {
                    setTimeout(checkTerminal, 100);
                }
            };
            checkTerminal();
        });
    }

    /**
     * Setup governance integration with Ember Terminal
     */
    setupGovernanceIntegration() {
        this.createGovernancePanel();
        this.addGovernanceCommands();
        this.integrateAIGovernance();
        this.addMNDMStatusDisplay();
    }

    /**
     * Create dedicated governance panel for Ember Terminal
     */
    createGovernancePanel() {
        const panel = document.createElement('div');
        panel.id = 'ember-mndm-governance';
        panel.className = 'ember-governance-panel';
        panel.innerHTML = `
            <div class="governance-header">
                <h3>⚡ MNDM GOVERNANCE TERMINAL</h3>
                <div class="governance-status">
                    <span class="status-indicator">●</span>
                    <span class="status-text">ACTIVE</span>
                </div>
            </div>

            <div class="governance-controls">
                <div class="control-row">
                    <button class="ember-btn governance-btn" onclick="window.emberMNDMGovernance.showProposals()">
                        📋 View Proposals
                    </button>
                    <button class="ember-btn governance-btn" onclick="window.emberMNDMGovernance.createProposal()">
                        📝 New Proposal
                    </button>
                </div>
                <div class="control-row">
                    <button class="ember-btn governance-btn" onclick="window.emberMNDMGovernance.showVotingPower()">
                        🗳️ My Voting Power
                    </button>
                    <button class="ember-btn governance-btn" onclick="window.emberMNDMGovernance.aiGovernanceAssistant()">
                        🤖 AI Governance Assistant
                    </button>
                </div>
            </div>

            <div class="governance-display" id="governance-display">
                <div class="welcome-message">
                    <h4>Welcome to MNDM Governance Terminal</h4>
                    <p>Govern the platform with your MNDM tokens. Connect your wallet to participate in decision-making.</p>
                    <div class="mndm-stats">
                        <div class="stat-item">
                            <span class="stat-label">Your MNDM:</span>
                            <span class="stat-value" id="user-mndm-balance">--</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Voting Power:</span>
                            <span class="stat-value" id="user-voting-power">--</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="governance-ai-assistant" id="ai-assistant" style="display: none;">
                <div class="ai-header">
                    <h4>🤖 AI Governance Assistant</h4>
                    <button class="close-ai" onclick="window.emberMNDMGovernance.hideAIAssistant()">×</button>
                </div>
                <div class="ai-chat" id="ai-chat-messages">
                    <div class="ai-message">
                        <strong>AI:</strong> Hello! I'm your governance assistant. I can help you understand proposals, analyze voting patterns, and suggest optimal governance strategies. What would you like to know?
                    </div>
                </div>
                <div class="ai-input">
                    <input type="text" id="ai-input" placeholder="Ask about governance, proposals, or voting strategies..." />
                    <button onclick="window.emberMNDMGovernance.sendAIMessage()">Send</button>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .ember-governance-panel {
                background: linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,60,0.95));
                border: 2px solid #ffd700;
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                color: #e4e4e4;
                font-family: 'Courier New', monospace;
                box-shadow: 0 0 30px rgba(255,215,0,0.3);
            }

            .governance-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 1px solid rgba(255,215,0,0.3);
                padding-bottom: 10px;
            }

            .governance-header h3 {
                color: #ffd700;
                margin: 0;
                font-size: 1.4em;
            }

            .governance-status {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-indicator {
                color: #00ff00;
                font-size: 1.2em;
            }

            .status-text {
                color: #00ff00;
                font-weight: bold;
            }

            .governance-controls {
                margin-bottom: 20px;
            }

            .control-row {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
            }

            .governance-btn {
                flex: 1;
                background: linear-gradient(45deg, #ff6b35, #ffaa00);
                border: none;
                color: black;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .governance-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255,107,53,0.4);
            }

            .governance-display {
                min-height: 200px;
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                padding: 15px;
            }

            .welcome-message h4 {
                color: #00ffff;
                margin-bottom: 10px;
            }

            .mndm-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 15px;
            }

            .stat-item {
                text-align: center;
            }

            .stat-label {
                display: block;
                color: #8addff;
                font-size: 0.9em;
                margin-bottom: 5px;
            }

            .stat-value {
                color: #ffd700;
                font-size: 1.2em;
                font-weight: bold;
            }

            .governance-ai-assistant {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(0,20,40,0.98), rgba(0,40,60,0.98));
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 20px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 10000;
                box-shadow: 0 0 50px rgba(0,255,255,0.5);
            }

            .ai-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(0,255,255,0.3);
                padding-bottom: 10px;
            }

            .ai-header h4 {
                color: #00ffff;
                margin: 0;
            }

            .close-ai {
                background: none;
                border: none;
                color: #ff6b6b;
                font-size: 1.5em;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-ai:hover {
                background: rgba(255,107,107,0.2);
            }

            .ai-chat {
                max-height: 300px;
                overflow-y: auto;
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
            }

            .ai-message {
                margin-bottom: 10px;
                line-height: 1.4;
            }

            .ai-input {
                display: flex;
                gap: 10px;
            }

            .ai-input input {
                flex: 1;
                padding: 10px;
                background: rgba(20,20,20,0.9);
                border: 1px solid #00ffff;
                color: #00ffff;
                border-radius: 5px;
                font-family: 'Courier New', monospace;
            }

            .ai-input button {
                background: linear-gradient(45deg, #00ffff, #0080ff);
                border: none;
                color: black;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }

            .proposal-list {
                display: grid;
                gap: 15px;
            }

            .proposal-item {
                background: rgba(0,0,0,0.4);
                border: 1px solid rgba(255,215,0,0.3);
                border-radius: 8px;
                padding: 15px;
            }

            .proposal-title {
                color: #ffd700;
                margin-bottom: 8px;
                font-size: 1.1em;
            }

            .proposal-description {
                color: #e4e4e4;
                margin-bottom: 10px;
                font-size: 0.9em;
            }

            .vote-button {
                background: linear-gradient(45deg, #00ff88, #00aa55);
                border: none;
                color: black;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.8em;
                margin-right: 5px;
            }

            @media (max-width: 768px) {
                .control-row {
                    flex-direction: column;
                }

                .mndm-stats {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.body.appendChild(styles);
        document.body.appendChild(panel);

        this.governancePanel = panel;
        this.updateMNDMStats();
    }

    /**
     * Add governance commands to Ember Terminal
     */
    addGovernanceCommands() {
        // Add to Ember Terminal command system if available
        if (window.emberTerminal && window.emberTerminal.addCommand) {
            window.emberTerminal.addCommand('governance', () => {
                this.showGovernancePanel();
                return 'MNDM Governance Terminal activated';
            });

            window.emberTerminal.addCommand('proposals', () => {
                this.showProposals();
                return 'Loading governance proposals...';
            });

            window.emberTerminal.addCommand('vote', (args) => {
                if (args.length < 2) {
                    return 'Usage: vote <proposal_id> <option_index>';
                }
                this.voteOnProposal(args[0], parseInt(args[1]));
                return `Voting on proposal ${args[0]}...`;
            });

            window.emberTerminal.addCommand('mndm-power', async () => {
                const power = await this.getVotingPower();
                return `Your MNDM voting power: ${power} votes`;
            });
        }
    }

    /**
     * Integrate AI governance assistant
     */
    integrateAIGovernance() {
        this.aiAssistant = {
            responses: {
                'help': 'I can help you with: proposal analysis, voting strategies, governance rules, and platform decisions. Ask me anything!',
                'proposals': 'To view active proposals, use the "View Proposals" button or type "proposals" in the terminal.',
                'voting': 'You need at least 1,000 MNDM to vote. Your voting power equals your MNDM balance (whole tokens only).',
                'create': 'To create a proposal, you need 5,000 MNDM minimum. Click "New Proposal" to start.',
                'rules': 'Governance rules: 7-day voting period, 1,000 MNDM minimum to vote, 5,000 MNDM to create proposals.',
                'strategy': 'Good voting strategy: Review proposal details, consider platform impact, vote with your values, participate actively.',
                'default': 'I\'m here to help with governance questions. Try asking about proposals, voting, or platform decisions!'
            },

            getResponse(message) {
                const msg = message.toLowerCase();
                if (msg.includes('help')) return this.responses.help;
                if (msg.includes('proposal')) return this.responses.proposals;
                if (msg.includes('vot')) return this.responses.voting;
                if (msg.includes('create') || msg.includes('new')) return this.responses.create;
                if (msg.includes('rule')) return this.responses.rules;
                if (msg.includes('strategy') || msg.includes('how')) return this.responses.strategy;
                return this.responses.default;
            }
        };
    }

    /**
     * Add MNDM status display to terminal
     */
    addMNDMStatusDisplay() {
        // Add MNDM status to terminal status bar if available
        const statusBar = document.querySelector('.terminal-status, .ember-status');
        if (statusBar) {
            const mndmStatus = document.createElement('div');
            mndmStatus.className = 'mndm-status';
            mndmStatus.innerHTML = `
                <span class="mndm-label">⚡ MNDM:</span>
                <span class="mndm-value" id="terminal-mndm-balance">--</span>
            `;
            statusBar.appendChild(mndmStatus);
        }
    }

    /**
     * Update MNDM statistics display
     */
    async updateMNDMStats() {
        const address = this.getCurrentAddress();
        if (!address) {
            this.setStatsDisplay('--', '--');
            return;
        }

        const balance = await this.getMNDMBalance(address);
        const votingPower = await this.getVotingPower(address);

        this.setStatsDisplay(balance, votingPower);
    }

    /**
     * Set statistics display values
     */
    setStatsDisplay(balance, votingPower) {
        const balanceEl = document.getElementById('user-mndm-balance');
        const powerEl = document.getElementById('user-voting-power');
        const terminalBalanceEl = document.getElementById('terminal-mndm-balance');

        if (balanceEl) balanceEl.textContent = balance;
        if (powerEl) powerEl.textContent = votingPower;
        if (terminalBalanceEl) terminalBalanceEl.textContent = balance;
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
     * Get MNDM balance for address
     */
    async getMNDMBalance(address) {
        if (!address || !window.realTimeBalanceSystem) return '0';

        const balances = window.realTimeBalanceSystem.getBalances(address);
        if (balances && balances.tokens) {
            const mndmToken = balances.tokens.find(t => t.symbol === 'MNDM');
            return mndmToken ? mndmToken.formatted : '0';
        }
        return '0';
    }

    /**
     * Get voting power for address
     */
    async getVotingPower(address) {
        if (!address) return 0;

        if (window.mndmGovernance && window.mndmGovernance.getVotingPower) {
            return await window.mndmGovernance.getVotingPower(address);
        }

        // Fallback: calculate from balance
        const balanceStr = await this.getMNDMBalance(address);
        const balance = parseFloat(balanceStr.replace(/,/g, '')) || 0;
        return Math.floor(balance);
    }

    /**
     * Show governance panel
     */
    showGovernancePanel() {
        if (this.governancePanel) {
            this.governancePanel.style.display = 'block';
            this.updateMNDMStats();
        }
    }

    /**
     * Show proposals
     */
    showProposals() {
        const display = document.getElementById('governance-display');
        if (!display || !window.mndmGovernance) return;

        const proposals = window.mndmGovernance.getActiveProposals();

        if (proposals.length === 0) {
            display.innerHTML = '<div style="text-align: center; color: #8addff;">No active proposals</div>';
            return;
        }

        let html = '<div class="proposal-list">';
        proposals.forEach(proposal => {
            const results = window.mndmGovernance.getProposalResults(proposal.id);
            const timeLeft = Math.max(0, Math.ceil((proposal.endTime - Date.now()) / (24 * 60 * 60 * 1000)));

            html += `
                <div class="proposal-item">
                    <div class="proposal-title">${proposal.title}</div>
                    <div class="proposal-description">${proposal.description}</div>
                    <div style="color: #cccccc; font-size: 0.8em; margin-bottom: 10px;">
                        ${results.totalVotes} total votes • ${timeLeft} days left
                    </div>
                    <div>
                        ${results.results.map((result, index) => `
                            <button class="vote-button" onclick="window.emberMNDMGovernance.voteOnProposal('${proposal.id}', ${index})">
                                ${result.option} (${result.percentage.toFixed(1)}%)
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '</div>';

        display.innerHTML = html;
    }

    /**
     * Create new proposal
     */
    createProposal() {
        if (!window.mndmGovernance) return;

        const title = prompt('Proposal Title:');
        if (!title) return;

        const description = prompt('Proposal Description:');
        if (!description) return;

        // Simple yes/no for Ember Terminal
        const options = ['Yes', 'No'];

        try {
            window.mndmGovernance.createProposal(title, description, options);
            alert('✅ Proposal created successfully!');
            this.showProposals();
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Vote on proposal
     */
    async voteOnProposal(proposalId, optionIndex) {
        if (!window.mndmGovernance) return;

        try {
            await window.mndmGovernance.vote(proposalId, optionIndex);
            alert('✅ Vote cast successfully!');
            this.showProposals();
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        }
    }

    /**
     * Show voting power
     */
    async showVotingPower() {
        const address = this.getCurrentAddress();
        if (!address) {
            alert('❌ Wallet not connected');
            return;
        }

        const power = await this.getVotingPower(address);
        const balance = await this.getMNDMBalance(address);

        alert(`⚡ MNDM Governance Status\n\nWallet: ${address.slice(0, 6)}...${address.slice(-4)}\nMNDM Balance: ${balance}\nVoting Power: ${power} votes`);
    }

    /**
     * AI Governance Assistant
     */
    aiGovernanceAssistant() {
        const aiDiv = document.getElementById('ai-assistant');
        if (aiDiv) {
            aiDiv.style.display = 'block';
        }
    }

    /**
     * Hide AI Assistant
     */
    hideAIAssistant() {
        const aiDiv = document.getElementById('ai-assistant');
        if (aiDiv) {
            aiDiv.style.display = 'none';
        }
    }

    /**
     * Send AI Message
     */
    sendAIMessage() {
        const input = document.getElementById('ai-input');
        const messages = document.getElementById('ai-chat-messages');

        if (!input || !input.value.trim()) return;

        const userMessage = input.value.trim();

        // Add user message
        messages.innerHTML += `<div class="ai-message"><strong>You:</strong> ${userMessage}</div>`;

        // Get AI response
        const aiResponse = this.aiAssistant.getResponse(userMessage);

        // Add AI response
        messages.innerHTML += `<div class="ai-message"><strong>AI:</strong> ${aiResponse}</div>`;

        // Scroll to bottom
        messages.scrollTop = messages.scrollHeight;

        // Clear input
        input.value = '';
    }
}

// Create global instance
window.emberMNDMGovernance = new EmberMNDMGovernance();

console.log('🔥 EMBER TERMINAL MNDM GOVERNANCE loaded - advanced token governance with AI assistance');
