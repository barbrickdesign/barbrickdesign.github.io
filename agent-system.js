// Agent Monitoring System - Main Entry Point
// Modular agent monitoring system for better organization

// Load core agent system
// Note: agent-core.js must be loaded first
if (typeof AgentSystem === 'undefined') {
    console.error('❌ Agent Core not loaded. Make sure agent-core.js is included before agent-system.js');
}

// Load agent types
// Note: agent-types.js must be loaded after agent-core.js
if (typeof BaseAgent === 'undefined') {
    console.error('❌ Agent Types not loaded. Make sure agent-types.js is included after agent-core.js');
}

// Load monitoring systems
// Note: monitoring-systems.js can be loaded independently
if (typeof setupEnhancedErrorMonitoring === 'undefined') {
    console.error('❌ Monitoring Systems not loaded. Make sure monitoring-systems.js is included');
}

// Main initialization - now handled by agent-core.js
console.log('🤖 Agent System modules loaded - using modular architecture');

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AgentSystem, BaseAgent };
}
