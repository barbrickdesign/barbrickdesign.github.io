// Agent Monitoring System - Core Module
// Main AgentSystem class and core functionality

class AgentSystem {
    constructor() {
        this.agents = [];
        this.logs = [];
        this.errors = [];
        this.fixes = 0;
        this.testsRun = 0;
        this.isRunning = false;
        this.lastHealthCheck = null;
        this.healthStatus = 'unknown';
        this.agentStats = {};

        // Site components to monitor
        this.siteComponents = {
            // Core Systems
            'universal-wallet-auth': {
                type: 'javascript',
                path: 'universal-wallet-auth.js',
                testFunction: this.testWalletAuth.bind(this),
                critical: true
            },
            'auth-integration': {
                type: 'javascript',
                path: 'auth-integration.js',
                testFunction: this.testAuthIntegration.bind(this),
                critical: true
            },
            'fpds-contract-schema': {
                type: 'javascript',
                path: 'fpds-contract-schema.js',
                testFunction: this.testFpdsSchema.bind(this),
                critical: true
            },
            'samgov-integration': {
                type: 'javascript',
                path: 'samgov-integration.js',
                testFunction: this.testSamGovIntegration.bind(this),
                critical: true
            },

            // Pages
            'main-hub': {
                type: 'html',
                path: 'index.html',
                testFunction: this.testMainHub.bind(this),
                critical: true
            },
            'gem-bot-universe': {
                type: 'html',
                path: 'mandem.os/workspace/index.html',
                testFunction: this.testGemBotUniverse.bind(this),
                critical: true
            },
            'ember-terminal': {
                type: 'html',
                path: 'ember-terminal/app.html',
                testFunction: this.testEmberTerminal.bind(this),
                critical: true
            },
            'grand-exchange': {
                type: 'html',
                path: 'grand-exchange.html',
                testFunction: this.testGrandExchange.bind(this),
                critical: true
            },
            'classified-contracts': {
                type: 'html',
                path: 'classified-contracts.html',
                testFunction: this.testClassifiedContracts.bind(this),
                critical: true
            },

            // APIs and External Services
            'service-worker': {
                type: 'service-worker',
                path: 'service-worker.js',
                testFunction: this.testServiceWorker.bind(this),
                critical: true
            }
        };

        this.loadFromStorage();
    }

    initializeAgents() {
        // Create specialized testing agents with repair capabilities
        this.agents = [
            new FunctionTestingAgent('function-tester', 'Tests all site functions and APIs', this),
            new ButtonTestingAgent('button-tester', 'Tests all buttons and clickable elements', this),
            new NavigationAgent('navigation-tester', 'Tests navigation between pages', this),
            new PerformanceAgent('performance-monitor', 'Monitors site performance and speed', this),
            new SecurityAgent('security-monitor', 'Monitors security and authentication', this),
            new ErrorRecoveryAgent('error-recovery', 'Automatically fixes detected errors', this)
        ];

        // Initialize agent statistics
        this.agents.forEach(agent => {
            this.agentStats[agent.id] = {
                id: agent.id,
                name: agent.name,
                type: agent.type,
                repairs: 0,
                fixes: 0,
                tests: 0,
                uptime: 0,
                efficiency: 0,
                startTime: Date.now()
            };
        });
    }

    async start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.log('🚀 Agent System Started');

        // Initialize agents if not already done
        if (this.agents.length === 0) {
            this.initializeAgents();
        }

        // Start all agents
        for (const agent of this.agents) {
            agent.start(this);
        }

        // Begin continuous monitoring
        this.startHealthMonitoring();
        this.startErrorMonitoring();

        // Save state
        this.saveToStorage();
    }

    stop() {
        this.isRunning = false;
        this.log('⏹️ Agent System Stopped');

        for (const agent of this.agents) {
            agent.stop();
        }
    }

    // ... existing test functions remain the same ...
    async testWalletAuth() {
        if (typeof window.universalWalletAuth === 'undefined') {
            throw new Error('universal-wallet-auth.js not loaded');
        }

        if (typeof window.universalWalletAuth.connect !== 'function') {
            throw new Error('connect function missing');
        }
        if (typeof window.universalWalletAuth.disconnect !== 'function') {
            throw new Error('disconnect function missing');
        }
        if (typeof window.universalWalletAuth.isAuthenticated !== 'function') {
            throw new Error('isAuthenticated function missing');
        }

        return {
            functions: ['connect', 'disconnect', 'isAuthenticated', 'getAddress'],
            version: '2.0.0'
        };
    }

    async testAuthIntegration() {
        if (typeof window.authIntegration === 'undefined') {
            throw new Error('auth-integration.js not loaded');
        }

        if (typeof window.authIntegration.init !== 'function') {
            throw new Error('init function missing');
        }

        return {
            functions: ['init', 'requireSystemArchitect', 'requireApprovedContractor'],
            version: '1.0.0'
        };
    }

    async testFpdsSchema() {
        if (typeof window.samGovIntegration === 'undefined') {
            throw new Error('samgov-integration.js not loaded');
        }

        const testContract = 'FA8750-23-C-0001';
        const parsed = window.samGovIntegration.parseContractNumber(testContract);
        if (!parsed || !parsed.agency) {
            throw new Error('Contract parsing failed');
        }

        return {
            parsedContract: parsed,
            functions: ['parseContractNumber', 'validateContractNumber', 'generateContractNumber']
        };
    }

    async testSamGovIntegration() {
        if (typeof window.samGovIntegration === 'undefined') {
            throw new Error('samgov-integration.js not loaded');
        }

        if (typeof window.samGovIntegration.getMarketStatistics !== 'function') {
            throw new Error('getMarketStatistics function missing');
        }

        return {
            functions: ['getMarketStatistics', 'generateMarketReport', 'fetchFPDSContracts'],
            version: '1.0.0'
        };
    }

    async testMainHub() {
        const requiredElements = [
            '.project-card',
            '#walletButtonContainer',
            '.portfolio-ticker'
        ];

        for (const selector of requiredElements) {
            if (!document.querySelector(selector)) {
                throw new Error(`Required element missing: ${selector}`);
            }
        }

        const projectCards = document.querySelectorAll('.project-card');
        if (projectCards.length === 0) {
            throw new Error('No project cards found');
        }

        return {
            projectCards: projectCards.length,
            requiredElements: requiredElements.length,
            status: 'loaded'
        };
    }

    async testGemBotUniverse() {
        try {
            const response = await fetch('mandem.os/workspace/index.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testEmberTerminal() {
        try {
            const response = await fetch('ember-terminal/app.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testGrandExchange() {
        try {
            const response = await fetch('grand-exchange.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testClassifiedContracts() {
        try {
            const response = await fetch('classified-contracts.html');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return { status: 'accessible', responseTime: Date.now() };
        } catch (error) {
            throw new Error(`Page not accessible: ${error.message}`);
        }
    }

    async testServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            throw new Error('Service Worker not supported');
        }

        const registration = await navigator.serviceWorker.getRegistration('./');
        if (!registration) {
            throw new Error('Service Worker not registered');
        }

        return {
            status: 'registered',
            scope: registration.scope,
            updateViaCache: registration.updateViaCache
        };
    }

    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 30000);

        setTimeout(() => this.performHealthCheck(), 5000);
    }

    async performHealthCheck() {
        try {
            this.lastHealthCheck = new Date();

            const criticalTests = ['universal-wallet-auth', 'main-hub', 'service-worker'];
            const results = [];

            for (const component of criticalTests) {
                try {
                    const result = await this.siteComponents[component].testFunction();
                    results.push({ component, status: 'healthy' });
                } catch (error) {
                    results.push({ component, status: 'unhealthy', error: error.message });
                    this.recordError(component, error);
                }
            }

            const healthyCount = results.filter(r => r.status === 'healthy').length;
            this.healthStatus = healthyCount === criticalTests.length ? 'healthy' :
                               healthyCount >= criticalTests.length * 0.8 ? 'degraded' : 'critical';

            this.log(`🏥 Health Check: ${this.healthStatus.toUpperCase()} (${healthyCount}/${criticalTests.length} healthy)`);

        } catch (error) {
            this.healthStatus = 'critical';
            this.recordError('health-check', error);
        }
    }

    startErrorMonitoring() {
        window.addEventListener('error', (event) => {
            this.recordError('javascript-error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordError('unhandled-promise', {
                reason: event.reason?.toString() || 'Unknown promise rejection'
            });
        });

        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.recordError('console-error', { message: args.join(' ') });
            originalConsoleError.apply(console, args);
        };
    }

    recordError(component, error) {
        const errorEntry = {
            id: Date.now() + Math.random(),
            component,
            message: error.message || error.toString(),
            stack: error.stack,
            timestamp: new Date().toISOString(),
            status: 'open'
        };

        this.errors.push(errorEntry);
        this.log(`❌ ERROR: ${component} - ${errorEntry.message}`);

        const errorRecoveryAgent = this.agents.find(a => a.type === 'error-recovery');
        if (errorRecoveryAgent) {
            errorRecoveryAgent.attemptFix(errorEntry);
        }

        this.saveToStorage();
    }

    recordFix(errorId, agentId = null) {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.status = 'fixed';
            error.fixedAt = new Date().toISOString();
            error.fixedBy = agentId;
            this.fixes++;

            if (agentId && this.agentStats[agentId]) {
                this.agentStats[agentId].fixes++;
                this.agentStats[agentId].repairs++;
            }

            this.log(`✅ FIXED: ${error.component} - ${error.message} (Agent: ${agentId || 'unknown'})`);
            this.saveToStorage();
        }
    }

    recordAgentActivity(agentId, activityType) {
        if (this.agentStats[agentId]) {
            if (activityType === 'test') {
                this.agentStats[agentId].tests++;
            } else if (activityType === 'repair') {
                this.agentStats[agentId].repairs++;
            }
        }
    }

    log(message, agentId = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'info',
            message,
            agentId
        };

        this.logs.push(logEntry);

        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }

        console.log(`[AGENT${agentId ? `:${agentId}` : ''}] ${message}`);
    }

    saveToStorage() {
        try {
            localStorage.setItem('agent-system-data', JSON.stringify({
                logs: this.logs.slice(-100),
                errors: this.errors.slice(-50),
                fixes: this.fixes,
                testsRun: this.testsRun,
                healthStatus: this.healthStatus,
                lastHealthCheck: this.lastHealthCheck,
                agentStats: this.agentStats,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.warn('Failed to save agent data to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('agent-system-data');
            if (data) {
                const parsed = JSON.parse(data);
                this.logs = parsed.logs || [];
                this.errors = parsed.errors || [];
                this.fixes = parsed.fixes || 0;
                this.testsRun = parsed.testsRun || 0;
                this.healthStatus = parsed.healthStatus || 'unknown';
                this.lastHealthCheck = parsed.lastHealthCheck ? new Date(parsed.lastHealthCheck) : null;
                this.agentStats = parsed.agentStats || this.agentStats;
            }
        } catch (error) {
            console.warn('Failed to load agent data from storage:', error);
        }
    }

    async runAllTests() {
        this.log('🔬 Running comprehensive site tests...');

        const results = [];
        for (const [componentName, component] of Object.entries(this.siteComponents)) {
            try {
                const result = await component.testFunction();
                results.push({
                    component: componentName,
                    status: 'success',
                    data: result,
                    timestamp: new Date().toISOString()
                });
                this.log(`✅ ${componentName}: PASSED`);
            } catch (error) {
                results.push({
                    component: componentName,
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                this.log(`❌ ${componentName}: FAILED - ${error.message}`);
                this.recordError(componentName, error);
            }
        }

        this.testsRun++;
        this.saveToStorage();
        return results;
    }

    getStats() {
        const recentLogs = this.logs.slice(-100);
        const recentErrors = this.errors.filter(e => {
            const errorTime = new Date(e.timestamp);
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
            return errorTime > cutoff;
        });

        const totalRepairs = Object.values(this.agentStats).reduce((sum, agent) => sum + agent.repairs, 0);
        Object.values(this.agentStats).forEach(agent => {
            agent.efficiency = totalRepairs > 0 ? Math.round((agent.repairs / totalRepairs) * 100) : 0;
            agent.uptime = Date.now() - agent.startTime;
        });

        return {
            totalAgents: this.agents.length,
            activeAgents: this.agents.filter(a => a.isActive).length,
            totalLogs: this.logs.length,
            recentLogs: recentLogs.length,
            totalErrors: this.errors.length,
            recentErrors: recentErrors.length,
            openErrors: this.errors.filter(e => e.status === 'open').length,
            totalFixes: this.fixes,
            testsRun: this.testsRun,
            healthStatus: this.healthStatus,
            lastHealthCheck: this.lastHealthCheck,
            uptime: this.isRunning ? Date.now() - (this.startTime || Date.now()) : 0,
            agentStats: this.agentStats,
            totalRepairs: totalRepairs
        };
    }
}

// Initialize the agent system
window.agentSystem = new AgentSystem();

console.log('🤖 Agent Core System loaded');
