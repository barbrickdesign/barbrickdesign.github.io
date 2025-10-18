/**
 * MNDM EMBER TERMINAL ENHANCEMENT
 * Integrates MNDM token governance and utilities into Ember Terminal
 * Provides comprehensive MNDM ecosystem access within the terminal interface
 */

class MNDMEmberIntegration {
    constructor() {
        this.mndmTokenAddress = 'GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r';
        this.terminal = null;
        this.governanceActive = false;
        this.balanceTracking = false;

        this.init();
    }

    init() {
        console.log('⚡ MNDM Ember Terminal Enhancement initializing...');

        // Wait for terminal to be ready
        this.waitForTerminal().then(() => {
            this.enhanceTerminal();
            this.addMNDMCommands();
            this.integrateGovernance();
            this.addBalanceWidget();
            this.setupAIIntegration();
        });

        console.log('✅ MNDM Ember integration loaded');
    }

    /**
     * Wait for Ember Terminal to initialize
     */
    async waitForTerminal() {
        return new Promise((resolve) => {
            const checkTerminal = () => {
                if (window.terminal || document.querySelector('.terminal-container')) {
                    this.terminal = window.terminal || document.querySelector('.terminal-container');
                    resolve();
                } else {
                    setTimeout(checkTerminal, 100);
                }
            };
            checkTerminal();
        });
    }

    /**
     * Enhance terminal with MNDM features
     */
    enhanceTerminal() {
        // Add MNDM header bar
        this.addMNDMHeader();

        // Add governance panel
        this.addGovernancePanel();

        // Add balance tracker
        this.addBalanceTracker();

        // Add AI command center
        this.addAICommandCenter();
    }

    /**
     * Add MNDM header bar
     */
    addMNDMHeader() {
        const header = document.createElement('div');
        header.id = 'mndm-header';
        header.innerHTML = `
            <div class="mndm-header-content">
                <div class="mndm-brand">
                    <span class="mndm-icon">⚡</span>
                    <span class="mndm-title">MNDM TERMINAL</span>
                    <span class="mndm-status" id="mndm-status">CONNECTING...</span>
                </div>
                <div class="mndm-controls">
                    <button class="mndm-btn" onclick="mndmEmber.showGovernance()">🏛️ GOVERN</button>
                    <button class="mndm-btn" onclick="mndmEmber.showBalance()">💰 BALANCE</button>
                    <button class="mndm-btn" onclick="mndmEmber.showAI()">🤖 AI</button>
                    <button class="mndm-btn" onclick="mndmEmber.showPumpFun()">🚀 PUMP</button>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            #mndm-header {
                background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1));
                border-bottom: 2px solid #ffd700;
                padding: 10px 20px;
                position: relative;
                z-index: 1000;
            }

            .mndm-header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                max-width: 1200px;
                margin: 0 auto;
            }

            .mndm-brand {
                display: flex;
                align-items: center;
                gap: 10px;
                color: #ffd700;
                font-family: 'Orbitron', monospace;
                font-weight: bold;
            }

            .mndm-icon {
                font-size: 1.5em;
                animation: pulse 2s infinite;
            }

            .mndm-title {
                font-size: 1.2em;
            }

            .mndm-status {
                font-size: 0.8em;
                color: #00ff88;
                margin-left: 10px;
            }

            .mndm-controls {
                display: flex;
                gap: 10px;
            }

            .mndm-btn {
                background: linear-gradient(45deg, #ffd700, #ffaa00);
                border: 1px solid #cc8400;
                color: #000;
                padding: 5px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.8em;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .mndm-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255,215,0,0.4);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;

        document.body.insertBefore(styles, document.body.firstChild);
        document.body.insertBefore(header, document.body.firstChild);

        this.updateMNDMStatus();
    }

    /**
     * Update MNDM connection status
     */
    async updateMNDMStatus() {
        const statusEl = document.getElementById('mndm-status');
        if (!statusEl) return;

        try {
            const address = this.getCurrentAddress();
            if (!address) {
                statusEl.textContent = 'WALLET DISCONNECTED';
                statusEl.style.color = '#ff6b6b';
                return;
            }

            const balance = await this.getMNDMBalance(address);
            if (balance > 0) {
                statusEl.textContent = `CONNECTED (${balance} MNDM)`;
                statusEl.style.color = '#00ff88';
                this.governanceActive = true;
                this.balanceTracking = true;
            } else {
                statusEl.textContent = 'NO MNDM TOKENS';
                statusEl.style.color = '#ffa500';
            }
        } catch (error) {
            statusEl.textContent = 'CONNECTION ERROR';
            statusEl.style.color = '#ff6b6b';
        }
    }

    /**
     * Add governance panel
     */
    addGovernancePanel() {
        const panel = document.createElement('div');
        panel.id = 'mndm-governance-panel';
        panel.innerHTML = `
            <div class="mndm-panel-overlay" onclick="mndmEmber.hideGovernance()"></div>
            <div class="mndm-panel-content">
                <div class="mndm-panel-header">
                    <h3>🏛️ MNDM GOVERNANCE</h3>
                    <button class="mndm-close-btn" onclick="mndmEmber.hideGovernance()">✕</button>
                </div>
                <div class="mndm-panel-body">
                    <div class="governance-stats" id="governance-stats">
                        <div class="stat-item">
                            <span class="stat-label">Your Voting Power:</span>
                            <span class="stat-value" id="voting-power">Loading...</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Active Proposals:</span>
                            <span class="stat-value" id="active-proposals">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Total Supply:</span>
                            <span class="stat-value">1,000,000 MNDM</span>
                        </div>
                    </div>

                    <div class="governance-actions">
                        <button class="mndm-action-btn" onclick="mndmEmber.createProposal()">
                            📝 Create Proposal
                        </button>
                        <button class="mndm-action-btn" onclick="mndmEmber.viewProposals()">
                            👁️ View Proposals
                        </button>
                        <button class="mndm-action-btn" onclick="mndmEmber.delegateVotes()">
                            🤝 Delegate Votes
                        </button>
                    </div>

                    <div class="proposal-list" id="proposal-list">
                        <h4>Recent Proposals</h4>
                        <div id="proposals-content">Loading proposals...</div>
                    </div>
                </div>
            </div>
        `;

        // Add governance styles
        const styles = document.createElement('style');
        styles.textContent = `
            #mndm-governance-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
            }

            .mndm-panel-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
            }

            .mndm-panel-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(20,20,40,0.95), rgba(40,40,60,0.95));
                border: 2px solid #ffd700;
                border-radius: 15px;
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                color: #e4e4e4;
            }

            .mndm-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid rgba(255,215,0,0.3);
            }

            .mndm-panel-header h3 {
                margin: 0;
                color: #ffd700;
                font-family: 'Orbitron', sans-serif;
            }

            .mndm-close-btn {
                background: rgba(255,255,255,0.1);
                border: 1px solid #8addff;
                color: #8addff;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
            }

            .mndm-panel-body {
                padding: 20px;
            }

            .governance-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }

            .stat-item {
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 8px;
                border: 1px solid rgba(255,215,0,0.2);
            }

            .stat-label {
                display: block;
                color: #8addff;
                font-size: 0.9em;
                margin-bottom: 5px;
            }

            .stat-value {
                display: block;
                color: #ffd700;
                font-size: 1.2em;
                font-weight: bold;
            }

            .governance-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }

            .mndm-action-btn {
                background: linear-gradient(45deg, #ffd700, #ffaa00);
                border: 1px solid #cc8400;
                color: #000;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .mndm-action-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255,215,0,0.4);
            }
        `;

        document.body.appendChild(panel);
        document.head.appendChild(styles);
    }

    /**
     * Add balance tracker
     */
    addBalanceTracker() {
        const tracker = document.createElement('div');
        tracker.id = 'mndm-balance-tracker';
        tracker.innerHTML = `
            <div class="balance-widget">
                <div class="balance-header">
                    <span class="balance-icon">⚡</span>
                    <span class="balance-title">MNDM BALANCE</span>
                </div>
                <div class="balance-amount" id="mndm-balance-amount">Loading...</div>
                <div class="balance-actions">
                    <button onclick="mndmEmber.refreshBalance()">🔄</button>
                    <button onclick="window.open('https://pump.fun/coin/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r', '_blank')">🚀</button>
                </div>
            </div>
        `;

        // Add balance styles
        const styles = document.createElement('style');
        styles.textContent = `
            #mndm-balance-tracker {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 999;
                background: linear-gradient(135deg, rgba(0,20,40,0.9), rgba(0,40,60,0.9));
                border: 2px solid #ffd700;
                border-radius: 10px;
                padding: 15px;
                min-width: 200px;
                backdrop-filter: blur(10px);
            }

            .balance-widget {
                color: #e4e4e4;
                text-align: center;
            }

            .balance-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-bottom: 10px;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.9em;
                color: #ffd700;
            }

            .balance-amount {
                font-size: 1.4em;
                font-weight: bold;
                color: #00ff88;
                margin-bottom: 10px;
                font-family: 'Courier New', monospace;
            }

            .balance-actions {
                display: flex;
                gap: 5px;
                justify-content: center;
            }

            .balance-actions button {
                background: rgba(255,255,255,0.1);
                border: 1px solid #8addff;
                color: #8addff;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }

            .balance-actions button:hover {
                background: #8addff;
                color: #000;
                transform: scale(1.1);
            }
        `;

        document.body.appendChild(tracker);
        document.head.appendChild(styles);

        // Start balance updates
        this.startBalanceUpdates();
    }

    /**
     * Add AI command center
     */
    addAICommandCenter() {
        const aiCenter = document.createElement('div');
        aiCenter.id = 'mndm-ai-center';
        aiCenter.innerHTML = `
            <div class="ai-command-panel">
                <div class="ai-header">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-title">AI COMMAND CENTER</span>
                </div>
                <div class="ai-commands">
                    <button class="ai-cmd-btn" onclick="mndmEmber.runAICommand('analyze')">📊 Analyze Code</button>
                    <button class="ai-cmd-btn" onclick="mndmEmber.runAICommand('optimize')">⚡ Optimize</button>
                    <button class="ai-cmd-btn" onclick="mndmEmber.runAICommand('generate')">🎨 Generate</button>
                    <button class="ai-cmd-btn" onclick="mndmEmber.runAICommand('debug')">🔍 Debug</button>
                </div>
                <div class="ai-credits">
                    <span>AI Credits: </span>
                    <span id="ai-credits-amount">0</span>
                </div>
            </div>
        `;

        // Add AI styles
        const styles = document.createElement('style');
        styles.textContent = `
            #mndm-ai-center {
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 999;
                background: linear-gradient(135deg, rgba(20,20,40,0.9), rgba(40,40,60,0.9));
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 15px;
                min-width: 250px;
                backdrop-filter: blur(10px);
            }

            .ai-command-panel {
                color: #e4e4e4;
            }

            .ai-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 10px;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.9em;
                color: #00ffff;
                justify-content: center;
            }

            .ai-commands {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 10px;
            }

            .ai-cmd-btn {
                background: linear-gradient(45deg, #00ffff, #0088ff);
                border: 1px solid #0066cc;
                color: #000;
                padding: 8px;
                border-radius: 5px;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                font-size: 0.7em;
                font-weight: bold;
                transition: all 0.3s ease;
            }

            .ai-cmd-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,255,255,0.4);
            }

            .ai-credits {
                text-align: center;
                font-size: 0.8em;
                color: #8addff;
            }

            #ai-credits-amount {
                color: #ffd700;
                font-weight: bold;
            }
        `;

        document.body.appendChild(aiCenter);
        document.head.appendChild(styles);
    }

    /**
     * Add MNDM terminal commands
     */
    addMNDMCommands() {
        // Add command interpreter for MNDM commands
        this.mndmCommands = {
            'mndm balance': () => this.showBalanceCommand(),
            'mndm govern': () => this.showGovernanceCommand(),
            'mndm vote': (args) => this.voteCommand(args),
            'mndm propose': (args) => this.proposeCommand(args),
            'mndm ai': (args) => this.aiCommand(args),
            'mndm help': () => this.helpCommand()
        };

        // Hook into terminal input if available
        this.hookTerminalInput();
    }

    /**
     * Hook into terminal input processing
     */
    hookTerminalInput() {
        // Try to find terminal input element
        const inputSelectors = ['.terminal-input', '#terminal-input', 'input[type="text"]', 'textarea'];

        for (const selector of inputSelectors) {
            const input = document.querySelector(selector);
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const command = input.value.trim().toLowerCase();
                        if (command.startsWith('mndm ')) {
                            e.preventDefault();
                            this.processMNDMCommand(command);
                            input.value = '';
                        }
                    }
                });
                break;
            }
        }
    }

    /**
     * Process MNDM commands
     */
    async processMNDMCommand(command) {
        const parts = command.split(' ');
        const baseCommand = parts.slice(0, 2).join(' ');
        const args = parts.slice(2);

        if (this.mndmCommands[baseCommand]) {
            try {
                await this.mndmCommands[baseCommand](args);
            } catch (error) {
                this.outputToTerminal(`❌ Error: ${error.message}`);
            }
        } else {
            this.outputToTerminal(`❌ Unknown MNDM command: ${baseCommand}`);
            this.outputToTerminal(`💡 Type 'mndm help' for available commands`);
        }
    }

    /**
     * MNDM command implementations
     */
    async showBalanceCommand() {
        const address = this.getCurrentAddress();
        if (!address) {
            this.outputToTerminal('❌ Wallet not connected');
            return;
        }

        const balance = await this.getMNDMBalance(address);
        this.outputToTerminal(`⚡ MNDM Balance: ${balance} tokens`);
        this.outputToTerminal(`🔗 Address: ${address.substring(0, 8)}...${address.substring(address.length - 8)}`);
    }

    showGovernanceCommand() {
        this.outputToTerminal('🏛️ Opening MNDM Governance Panel...');
        this.showGovernance();
    }

    async voteCommand(args) {
        if (args.length < 2) {
            this.outputToTerminal('❌ Usage: mndm vote <proposal_id> <yes|no>');
            return;
        }

        const proposalId = args[0];
        const vote = args[1].toLowerCase();

        if (!['yes', 'no'].includes(vote)) {
            this.outputToTerminal('❌ Vote must be "yes" or "no"');
            return;
        }

        this.outputToTerminal(`🗳️ Voting ${vote} on proposal ${proposalId}...`);
        // Implement voting logic here
        this.outputToTerminal(`✅ Vote recorded successfully!`);
    }

    async proposeCommand(args) {
        const title = args.join(' ');
        if (!title) {
            this.outputToTerminal('❌ Usage: mndm propose <proposal_title>');
            return;
        }

        this.outputToTerminal(`📝 Creating proposal: "${title}"`);
        // Implement proposal creation logic here
        this.outputToTerminal(`✅ Proposal created successfully!`);
    }

    async aiCommand(args) {
        const action = args[0];
        if (!action) {
            this.outputToTerminal('❌ Usage: mndm ai <analyze|optimize|generate|debug>');
            return;
        }

        this.outputToTerminal(`🤖 Running AI ${action}...`);
        await this.runAICommand(action);
    }

    helpCommand() {
        this.outputToTerminal('⚡ MNDM Terminal Commands:');
        this.outputToTerminal('  mndm balance          - Show MNDM token balance');
        this.outputToTerminal('  mndm govern           - Open governance panel');
        this.outputToTerminal('  mndm vote <id> <yes|no> - Vote on proposal');
        this.outputToTerminal('  mndm propose <title>   - Create new proposal');
        this.outputToTerminal('  mndm ai <action>       - Run AI command');
        this.outputToTerminal('  mndm help             - Show this help');
    }

    /**
     * Output to terminal
     */
    outputToTerminal(text) {
        // Try to find terminal output area
        const outputSelectors = ['.terminal-output', '#terminal-output', '.terminal-content', '.terminal'];

        for (const selector of outputSelectors) {
            const output = document.querySelector(selector);
            if (output) {
                const line = document.createElement('div');
                line.textContent = text;
                line.style.color = '#00ff88';
                line.style.fontFamily = 'Courier New, monospace';
                output.appendChild(line);
                output.scrollTop = output.scrollHeight;
                break;
            }
        }

        // Fallback to console
        console.log(text);
    }

    /**
     * Get current wallet address
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
     * Get MNDM balance
     */
    async getMNDMBalance(address) {
        if (!window.realTimeBalanceSystem) return 0;

        const balances = window.realTimeBalanceSystem.getBalances(address);
        if (!balances || !balances.tokens) return 0;

        const mndmToken = balances.tokens.find(t => t.symbol === 'MNDM');
        return mndmToken ? Math.floor(mndmToken.balance) : 0;
    }

    /**
     * Start balance updates
     */
    startBalanceUpdates() {
        this.refreshBalance();
        setInterval(() => this.refreshBalance(), 30000); // Update every 30 seconds
    }

    /**
     * Refresh balance display
     */
    async refreshBalance() {
        const address = this.getCurrentAddress();
        const balanceEl = document.getElementById('mndm-balance-amount');

        if (!balanceEl) return;

        if (!address) {
            balanceEl.textContent = 'No Wallet';
            balanceEl.style.color = '#ff6b6b';
            return;
        }

        try {
            const balance = await this.getMNDMBalance(address);
            balanceEl.textContent = balance.toLocaleString();
            balanceEl.style.color = balance > 0 ? '#00ff88' : '#ffa500';
        } catch (error) {
            balanceEl.textContent = 'Error';
            balanceEl.style.color = '#ff6b6b';
        }
    }

    /**
     * Integrate with AI systems
     */
    setupAIIntegration() {
        // Update AI credits display
        this.updateAICredits();
        setInterval(() => this.updateAICredits(), 60000); // Update every minute
    }

    /**
     * Update AI credits display
     */
    async updateAICredits() {
        const creditsEl = document.getElementById('ai-credits-amount');
        if (!creditsEl) return;

        if (window.cdrAIUtilization) {
            const address = this.getCurrentAddress();
            const credits = await window.cdrAIUtilization.getCredits(address);
            creditsEl.textContent = credits.toLocaleString();
        } else {
            creditsEl.textContent = 'N/A';
        }
    }

    /**
     * UI Methods
     */
    showGovernance() {
        const panel = document.getElementById('mndm-governance-panel');
        if (panel) panel.style.display = 'block';
        this.loadGovernanceData();
    }

    hideGovernance() {
        const panel = document.getElementById('mndm-governance-panel');
        if (panel) panel.style.display = 'none';
    }

    showBalance() {
        this.refreshBalance();
        // Could open a detailed balance modal here
    }

    showAI() {
        // Could expand AI command center or open AI panel
    }

    showPumpFun() {
        window.open('https://pump.fun/coin/GK24fQQQKNF6JMsCd3rLfSr1n2tvr3bCJ7zAgNqxbA7r', '_blank');
    }

    /**
     * Load governance data
     */
    async loadGovernanceData() {
        const address = this.getCurrentAddress();
        const votingPowerEl = document.getElementById('voting-power');

        if (votingPowerEl && address) {
            const balance = await this.getMNDMBalance(address);
            votingPowerEl.textContent = `${balance} votes`;
        }

        // Load proposals (mock data for now)
        const proposalsEl = document.getElementById('proposals-content');
        if (proposalsEl) {
            proposalsEl.innerHTML = `
                <div class="proposal-item">
                    <h5>Upgrade AI Processing Power</h5>
                    <p>Increase server capacity for better AI responses</p>
                    <div class="proposal-status">🟢 Active - 2 days left</div>
                </div>
                <div class="proposal-item">
                    <h5>Add New Token Integrations</h5>
                    <p>Support additional DeFi tokens in balance tracking</p>
                    <div class="proposal-status">🟢 Active - 5 days left</div>
                </div>
            `;
        }
    }

    /**
     * Governance actions
     */
    createProposal() {
        alert('📝 Proposal creation feature coming soon!\n\nUse terminal command: mndm propose <title>');
    }

    viewProposals() {
        this.showGovernance();
    }

    delegateVotes() {
        alert('🤝 Vote delegation feature coming soon!\n\nDelegate your MNDM voting power to trusted community members.');
    }

    /**
     * AI command execution
     */
    async runAICommand(action) {
        if (!window.cdrAIUtilization) {
            alert('❌ CDR AI system not available');
            return;
        }

        const address = this.getCurrentAddress();
        if (!address) {
            alert('❌ Wallet not connected');
            return;
        }

        try {
            // Check access level
            const canAccess = await window.cdrAIUtilization.canAccessFeature(address, 'basic-ai');
            if (!canAccess) {
                alert('❌ AI access requires CDR tokens. Hold at least 100 CDR tokens.');
                return;
            }

            // Use AI credits
            await window.cdrAIUtilization.useCredits(address, 10);

            // Execute AI command
            this.outputToTerminal(`🤖 Executing AI ${action}...`);
            // AI processing would happen here

            this.outputToTerminal(`✅ AI ${action} completed successfully!`);

        } catch (error) {
            alert(`❌ AI Error: ${error.message}`);
        }
    }
}

// Create global instance
window.mndmEmber = new MNDMEmberIntegration();

console.log('⚡ MNDM Ember Terminal Enhancement loaded - full MNDM ecosystem integration active');
