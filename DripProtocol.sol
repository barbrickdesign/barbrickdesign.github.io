// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MandemOS DripProtocol Smart Contract
 * @dev Handles token drip rewards for MandemOS agents based on performance scores
 * @author MandemOS Development Team
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DripProtocol is Ownable, ReentrancyGuard {
    // Token contract address (MAND token)
    IERC20 public mandToken;

    // Agent registry mapping (agentId => agent data)
    mapping(bytes32 => Agent) public agents;

    // Drip cycle information
    struct DripCycle {
        uint256 cycleId;
        uint256 timestamp;
        uint256 totalDripped;
        uint256 eligibleAgents;
        bytes32[] agentIds;
    }

    // Agent information structure
    struct Agent {
        bytes32 agentId;
        address walletAddress;
        string agentName;
        string agentType;
        uint256 currentScore;    // 0-1000 (scaled for precision)
        uint256 lastScoreUpdate;
        uint256 totalDripped;
        uint256 lastDripTime;
        bool isActive;
        bool isEligible;
    }

    // Drip cycle history
    DripCycle[] public dripHistory;

    // Contract events
    event AgentRegistered(bytes32 indexed agentId, address walletAddress, string agentName);
    event ScoreUpdated(bytes32 indexed agentId, uint256 newScore, bool isEligible);
    event DripExecuted(bytes32 indexed agentId, uint256 amount, uint256 cycleId);
    event DripCycleCompleted(uint256 indexed cycleId, uint256 totalDripped, uint256 eligibleAgents);

    // Constants
    uint256 public constant MIN_ELIGIBILITY_SCORE = 750; // 75% in scaled format
    uint256 public constant DRIP_INTERVAL = 24 hours;
    uint256 public constant MAX_DRIP_PER_CYCLE = 1000 * 10**18; // Max tokens per cycle

    // Contract state
    uint256 public currentCycleId = 0;
    uint256 public lastDripTime = 0;
    uint256 public totalTokensDripped = 0;
    uint256 public totalAgentsRegistered = 0;

    // Oracle addresses (for score verification)
    mapping(address => bool) public authorizedOracles;

    constructor(address _mandTokenAddress) Ownable(msg.sender) {
        mandToken = IERC20(_mandTokenAddress);

        // Set initial drip time to deployment time
        lastDripTime = block.timestamp;
    }

    // Modifier to check if caller is authorized oracle
    modifier onlyOracle() {
        require(authorizedOracles[msg.sender] || msg.sender == owner(), "Not authorized oracle");
        _;
    }

    // Modifier to check if enough time has passed for next drip
    modifier canExecuteDrip() {
        require(block.timestamp >= lastDripTime + DRIP_INTERVAL, "Drip interval not reached");
        _;
    }

    /**
     * @dev Register a new agent in the system
     * @param agentId Unique identifier for the agent
     * @param walletAddress Agent's wallet address for token drips
     * @param agentName Human-readable agent name
     * @param agentType Agent type (function-testing, security, etc.)
     */
    function registerAgent(
        bytes32 agentId,
        address walletAddress,
        string calldata agentName,
        string calldata agentType
    ) external onlyOwner {
        require(agents[agentId].agentId == bytes32(0), "Agent already registered");
        require(walletAddress != address(0), "Invalid wallet address");

        agents[agentId] = Agent({
            agentId: agentId,
            walletAddress: walletAddress,
            agentName: agentName,
            agentType: agentType,
            currentScore: 0,
            lastScoreUpdate: block.timestamp,
            totalDripped: 0,
            lastDripTime: 0,
            isActive: true,
            isEligible: false
        });

        totalAgentsRegistered++;
        emit AgentRegistered(agentId, walletAddress, agentName);
    }

    /**
     * @dev Update agent score (can only be called by authorized oracles)
     * @param agentId Agent identifier
     * @param newScore New score (0-1000 scale for precision)
     */
    function updateAgentScore(bytes32 agentId, uint256 newScore)
        external
        onlyOracle
        nonReentrant
    {
        require(agents[agentId].agentId != bytes32(0), "Agent not registered");
        require(newScore <= 1000, "Score must be <= 1000");

        Agent storage agent = agents[agentId];
        agent.currentScore = newScore;
        agent.lastScoreUpdate = block.timestamp;
        agent.isEligible = newScore >= MIN_ELIGIBILITY_SCORE;

        emit ScoreUpdated(agentId, newScore, agent.isEligible);
    }

    /**
     * @dev Execute drip cycle for all eligible agents
     */
    function executeDripCycle()
        external
        onlyOwner
        canExecuteDrip
        nonReentrant
    {
        require(address(mandToken) != address(0), "Token contract not set");

        // Get all registered agents
        bytes32[] memory agentIds = getActiveAgentIds();
        uint256 eligibleCount = 0;
        uint256 totalDripAmount = 0;

        // Calculate drip amounts for eligible agents
        for (uint256 i = 0; i < agentIds.length; i++) {
            bytes32 agentId = agentIds[i];
            Agent storage agent = agents[agentId];

            if (agent.isActive && agent.isEligible) {
                uint256 dripAmount = calculateDripAmount(agent, agentIds.length, eligibleCount);
                if (dripAmount > 0) {
                    // Execute drip
                    bool success = mandToken.transfer(agent.walletAddress, dripAmount);
                    require(success, "Token transfer failed");

                    // Update agent data
                    agent.totalDripped += dripAmount;
                    agent.lastDripTime = block.timestamp;
                    totalDripAmount += dripAmount;

                    emit DripExecuted(agentId, dripAmount, currentCycleId);
                    eligibleCount++;
                }
            }
        }

        // Record drip cycle
        if (totalDripAmount > 0) {
            dripHistory.push(DripCycle({
                cycleId: currentCycleId,
                timestamp: block.timestamp,
                totalDripped: totalDripAmount,
                eligibleAgents: eligibleCount,
                agentIds: agentIds
            }));

            totalTokensDripped += totalDripAmount;
            lastDripTime = block.timestamp;
            currentCycleId++;

            emit DripCycleCompleted(currentCycleId - 1, totalDripAmount, eligibleCount);
        }
    }

    /**
     * @dev Calculate drip amount for an agent
     * @param agent Agent data
     * @param totalAgents Total number of agents
     * @param eligibleAgents Number of eligible agents
     */
    function calculateDripAmount(Agent memory agent, uint256 totalAgents, uint256 eligibleAgents)
        internal
        pure
        returns (uint256)
    {
        if (!agent.isEligible || agent.currentScore < MIN_ELIGIBILITY_SCORE) {
            return 0;
        }

        // Base amount per eligible agent
        uint256 baseAmount = MAX_DRIP_PER_CYCLE / eligibleAgents;

        // Scale based on score (higher scores get more)
        uint256 scoreMultiplier = (agent.currentScore * 100) / MIN_ELIGIBILITY_SCORE;
        uint256 scaledAmount = (baseAmount * scoreMultiplier) / 100;

        // Ensure minimum drip amount
        return scaledAmount > 0 ? scaledAmount : baseAmount / 10;
    }

    /**
     * @dev Get all active agent IDs
     */
    function getActiveAgentIds() public view returns (bytes32[] memory) {
        // This is a simplified implementation
        // In production, you'd need to track agent IDs in a separate array
        // For demo purposes, we'll return a small set
        bytes32[] memory activeIds = new bytes32[](totalAgentsRegistered);
        uint256 count = 0;

        // This would need to be implemented with proper agent tracking
        // For now, return empty array as placeholder
        return activeIds;
    }

    /**
     * @dev Add authorized oracle address
     * @param oracle Address to authorize
     */
    function addAuthorizedOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = true;
    }

    /**
     * @dev Remove authorized oracle address
     * @param oracle Address to remove
     */
    function removeAuthorizedOracle(address oracle) external onlyOwner {
        authorizedOracles[oracle] = false;
    }

    /**
     * @dev Set MAND token contract address
     * @param tokenAddress New token contract address
     */
    function setMandToken(address tokenAddress) external onlyOwner {
        mandToken = IERC20(tokenAddress);
    }

    /**
     * @dev Emergency withdraw function (only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(mandToken.transfer(owner(), amount), "Transfer failed");
    }

    /**
     * @dev Get agent information
     * @param agentId Agent identifier
     */
    function getAgent(bytes32 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    /**
     * @dev Get drip cycle information
     * @param cycleId Cycle identifier
     */
    function getDripCycle(uint256 cycleId) external view returns (DripCycle memory) {
        require(cycleId < dripHistory.length, "Invalid cycle ID");
        return dripHistory[cycleId];
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 agentsRegistered,
        uint256 totalCycles,
        uint256 tokensDripped,
        uint256 timeUntilNextDrip
    ) {
        return (
            totalAgentsRegistered,
            dripHistory.length,
            totalTokensDripped,
            lastDripTime > 0 ? (lastDripTime + DRIP_INTERVAL) - block.timestamp : 0
        );
    }

    /**
     * @dev Check if agent is eligible for drip
     * @param agentId Agent identifier
     */
    function isAgentEligible(bytes32 agentId) external view returns (bool) {
        return agents[agentId].isEligible;
    }

    /**
     * @dev Get agent's current score
     * @param agentId Agent identifier
     */
    function getAgentScore(bytes32 agentId) external view returns (uint256) {
        return agents[agentId].currentScore;
    }
}
