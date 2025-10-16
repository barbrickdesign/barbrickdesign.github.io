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
        if (this.isRunning) {
            console.log('🤖 Agent system already running');
            return;
        }

        console.log('🚀 Starting Agent System...');
        this.isRunning = true;
        this.log('🚀 Agent System Started');

        // Initialize agents if not already done
        if (this.agents.length === 0) {
            console.log('🔧 Initializing agents...');
            this.initializeAgents();
        }

        console.log(`✅ Initialized ${this.agents.length} agents`);

        // Start all agents
        console.log('🎯 Starting all agents...');
        for (const agent of this.agents) {
            try {
                await agent.start(this);
                console.log(`✅ Started ${agent.name} (${agent.type})`);
            } catch (error) {
                console.error(`❌ Failed to start ${agent.name}:`, error);
            }
        }

        console.log('🏥 Starting health monitoring...');
        // Begin continuous monitoring
        this.startHealthMonitoring();
        this.startErrorMonitoring();

        // Save state
        this.saveToStorage();
        console.log('💾 Agent system state saved');

        // Force initial update after short delay
        setTimeout(() => {
            console.log('🔄 Triggering initial agent display update...');
            if (typeof updateAgentDisplay === 'function') {
                updateAgentDisplay();
            }
        }, 3000);

        console.log('🎉 Agent System fully operational!');
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
        // Wait for dependencies to be available
        let retries = 0;
        const maxRetries = 50; // 5 seconds max wait

        while (retries < maxRetries) {
            if (typeof window.universalWalletAuth !== 'undefined') {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

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
        // Wait for dependencies to be available
        let retries = 0;
        const maxRetries = 50; // 5 seconds max wait

        while (retries < maxRetries) {
            if (typeof window.authIntegration !== 'undefined') {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

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

    recordError(component, error, metadata = {}) {
        const now = new Date();
        const errorEntry = {
            id: `error_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
            component,
            message: error.message || error.toString(),
            stack: error.stack,
            timestamp: now.toISOString(),
            timestampMs: now.getTime(),
            status: 'open',
            category: this.categorizeError(error, component),
            severity: this.determineSeverity(error, component),
            source: metadata.source || 'unknown',
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: metadata.userId || null,
            sessionId: metadata.sessionId || null,
            errorType: error.name || 'Unknown',
            metadata: {
                ...metadata,
                lineNumber: error.lineNumber || metadata.lineNumber,
                columnNumber: error.columnNumber || metadata.columnNumber,
                fileName: error.fileName || metadata.fileName
            },
            fixAttempts: [],
            resolved: false,
            resolutionTime: null,
            resolvedBy: null
        };

        this.errors.push(errorEntry);
        this.log(`❌ ERROR [${errorEntry.category.toUpperCase()}] ${component} - ${errorEntry.message}`, 'error');

        // Attempt auto-recovery if error recovery agent is available
        const errorRecoveryAgent = this.agents.find(a => a.type === 'error-recovery');
        if (errorRecoveryAgent) {
            errorRecoveryAgent.attemptFix(errorEntry);
        }

        this.saveToStorage();
        return errorEntry.id;
    }

    categorizeError(error, component) {
        const message = (error.message || error.toString()).toLowerCase();

        // Network errors
        if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
            return 'network';
        }

        // Script loading errors
        if (message.includes('script') || message.includes('module') || component.includes('script')) {
            return 'script';
        }

        // DOM errors
        if (message.includes('element') || message.includes('dom') || message.includes('missing')) {
            return 'dom';
        }

        // Authentication errors
        if (message.includes('auth') || message.includes('wallet') || message.includes('permission')) {
            return 'auth';
        }

        // Performance errors
        if (message.includes('performance') || message.includes('memory') || message.includes('timeout')) {
            return 'performance';
        }

        // Security errors
        if (message.includes('security') || message.includes('cors') || message.includes('blocked')) {
            return 'security';
        }

        // Default categorization
        return 'general';
    }

    determineSeverity(error, component) {
        const message = (error.message || error.toString()).toLowerCase();

        // Critical errors that break functionality
        if (component === 'universal-wallet-auth' || component === 'main-hub' || component === 'service-worker') {
            return 'critical';
        }

        // High severity errors
        if (message.includes('failed') || message.includes('error') || message.includes('exception')) {
            return 'high';
        }

        // Medium severity warnings
        if (message.includes('warning') || message.includes('deprecated') || message.includes('missing')) {
            return 'medium';
        }

        // Low severity informational
        return 'low';
    }

    recordFix(errorId, agentId = null, fixDetails = {}) {
        const error = this.errors.find(e => e.id === errorId);
        if (!error) return false;

        const now = new Date();
        const fixEntry = {
            id: `fix_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
            errorId,
            timestamp: now.toISOString(),
            timestampMs: now.getTime(),
            agentId,
            fixType: fixDetails.type || 'automatic',
            fixMethod: fixDetails.method || 'unknown',
            success: fixDetails.success !== false,
            description: fixDetails.description || 'Automated fix applied',
            metadata: fixDetails.metadata || {},
            duration: fixDetails.duration || 0
        };

        // Update error record
        error.status = 'fixed';
        error.fixedAt = now.toISOString();
        error.fixedBy = agentId;
        error.resolved = true;
        error.resolutionTime = now.getTime() - new Date(error.timestamp).getTime();
        error.fixAttempts.push(fixEntry);

        // Update agent statistics
        if (agentId && this.agentStats[agentId]) {
            this.agentStats[agentId].fixes++;
            this.agentStats[agentId].repairs++;
        }

        this.fixes++;
        this.log(`✅ FIXED [${error.category.toUpperCase()}] ${error.component} - ${error.message} (Agent: ${agentId || 'unknown'})`, 'success');

        this.saveToStorage();
        return fixEntry.id;
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

// Export AgentSystem class globally for other modules to use
window.AgentSystem = AgentSystem;
