// Agent Monitoring System - Main Entry Point
// Modular agent monitoring system for better organization

// Wait for dependencies to be available
async function waitForDependencies() {
    const dependencies = {
        'agentSystem': 'agent-core.js',
        'agentDisplay': 'agent-display.js',
        'BaseAgent': 'agent-types.js'
    };

    const maxRetries = 80; // 8 seconds max wait (increased from 5)
    let retries = 0;

    while (retries < maxRetries) {
        let allLoaded = true;

        for (const [name, script] of Object.entries(dependencies)) {
            if (typeof window[name] === 'undefined') {
                allLoaded = false;
                console.log(`⏳ Waiting for ${script} to load (${name})`);
                break;
            }
        }

        if (allLoaded) {
            console.log('✅ All agent dependencies loaded');
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }

    console.error('❌ Agent dependencies failed to load after 8 seconds');
    return false;
}

// Load core agent system
// Note: agent-core.js must be loaded first
async function checkAgentCore() {
    if (typeof AgentSystem === 'undefined') {
        console.error('❌ Agent Core not loaded. Make sure agent-core.js is included before agent-system.js');
        return false;
    }
    return true;
}

// Load agent types
// Note: agent-types.js must be loaded after agent-core.js
async function checkAgentTypes() {
    if (typeof BaseAgent === 'undefined') {
        console.error('❌ Agent Types not loaded. Make sure agent-types.js is included after agent-core.js');
        return false;
    }
    return true;
}

// Load monitoring systems
// Note: monitoring-systems.js can be loaded independently
async function checkMonitoringSystems() {
    if (typeof setupEnhancedErrorMonitoring === 'undefined') {
        console.error('❌ Monitoring Systems not loaded. Make sure monitoring-systems.js is included');
        return false;
    }
    return true;
}

// Initialize agent system after dependencies are loaded
async function initializeAgentSystem() {
    console.log('🔄 Initializing agent system...');

    const dependenciesLoaded = await waitForDependencies();

    if (!dependenciesLoaded) {
        console.error('❌ Failed to initialize agent system - dependencies not loaded');
        return;
    }

    // All dependencies are loaded, system is ready
    console.log('✅ Agent system initialized successfully');

    // Run initial tests if agent system is available
    if (typeof window.agentSystem !== 'undefined') {
        try {
            await window.agentSystem.start();
            console.log('🚀 Agent system started');
        } catch (error) {
            console.error('❌ Failed to start agent system:', error);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAgentSystem);
} else {
    initializeAgentSystem();
}

// Main initialization - now handled by modular loading
console.log('🤖 Agent System modules loaded - using modular architecture');

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AgentSystem, BaseAgent };
}
