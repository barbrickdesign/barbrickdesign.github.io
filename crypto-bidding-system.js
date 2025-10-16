/**
 * CRYPTO BIDDING SYSTEM FOR CLASSIFIED CONTRACTS
 * <!-- REF: BIDDING-SYSTEM -->
 * Integrates with SAM.gov data and contractor performance metrics
 * Supports multi-crypto bidding and smart contract escrow
 */

class CryptoBiddingSystem {
    constructor() {
        this.STORAGE_KEY = 'contractBids';
        this.ESCROW_KEY = 'escrowContracts';
        this.PERFORMANCE_KEY = 'contractorPerformance';
        
        this.bids = this.loadBids();
        this.escrowContracts = this.loadEscrow();
        this.performanceData = this.loadPerformance();
        
        // Supported cryptocurrencies
        this.supportedCrypto = {
            'ETH': {
                name: 'Ethereum',
                chain: 'ethereum',
                decimals: 18,
                icon: '⟠'
            },
            'SOL': {
                name: 'Solana',
                chain: 'solana',
                decimals: 9,
                icon: '◎'
            },
            'USDC': {
                name: 'USD Coin',
                chain: 'ethereum',
                decimals: 6,
                icon: '$'
            },
            'USDT': {
                name: 'Tether',
                chain: 'ethereum',
                decimals: 6,
                icon: '$'
            }
        };
        
        // Performance scoring weights
        this.performanceWeights = {
            completionRate: 0.30,        // 30% - Projects completed on time
            qualityScore: 0.25,           // 25% - Quality of delivered work
            budgetAdherence: 0.20,        // 20% - Stayed within budget
            clientSatisfaction: 0.15,     // 15% - Client ratings
            complexity: 0.10              // 10% - Difficulty of past projects
        };
    }

    /**
     * Load bids from storage
     */
    loadBids() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading bids:', error);
            return {};
        }
    }

    /**
     * Load escrow contracts from storage
     */
    loadEscrow() {
        try {
            const data = localStorage.getItem(this.ESCROW_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading escrow:', error);
            return {};
        }
    }

    /**
     * Load contractor performance data
     */
    loadPerformance() {
        try {
            const data = localStorage.getItem(this.PERFORMANCE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading performance:', error);
            return {};
        }
    }

    /**
     * Save bids to storage
     */
    saveBids() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.bids));
        } catch (error) {
            console.error('Error saving bids:', error);
        }
    }

    /**
     * Save escrow contracts
     */
    saveEscrow() {
        try {
            localStorage.setItem(this.ESCROW_KEY, JSON.stringify(this.escrowContracts));
        } catch (error) {
            console.error('Error saving escrow:', error);
        }
    }

    /**
     * Save performance data
     */
    savePerformance() {
        try {
            localStorage.setItem(this.PERFORMANCE_KEY, JSON.stringify(this.performanceData));
        } catch (error) {
            console.error('Error saving performance:', error);
        }
    }

    /**
     * Calculate comprehensive contractor performance score (0-100)
     */
    calculatePerformanceScore(walletAddress) {
        const performance = this.performanceData[walletAddress];
        
        if (!performance || !performance.completedProjects || performance.completedProjects.length === 0) {
            // New contractor with no history - baseline score
            return {
                score: 50,
                breakdown: {
                    completionRate: 0,
                    qualityScore: 0,
                    budgetAdherence: 0,
                    clientSatisfaction: 0,
                    complexity: 0
                },
                totalProjects: 0,
                reputation: 'New Contractor',
                trustLevel: 'Building Trust'
            };
        }
        
        const completed = performance.completedProjects;
        const total = performance.totalProjects || completed.length;
        
        // Calculate completion rate (on-time delivery)
        const onTimeProjects = completed.filter(p => p.completedOnTime).length;
        const completionRate = (onTimeProjects / completed.length) * 100;
        
        // Calculate quality score (average ratings)
        const avgQuality = completed.reduce((sum, p) => sum + (p.qualityRating || 0), 0) / completed.length;
        const qualityScore = (avgQuality / 5) * 100; // Convert 0-5 rating to 0-100
        
        // Calculate budget adherence
        const onBudgetProjects = completed.filter(p => p.withinBudget).length;
        const budgetAdherence = (onBudgetProjects / completed.length) * 100;
        
        // Calculate client satisfaction
        const avgSatisfaction = completed.reduce((sum, p) => sum + (p.clientRating || 0), 0) / completed.length;
        const clientSatisfaction = (avgSatisfaction / 5) * 100;
        
        // Calculate complexity bonus
        const avgComplexity = completed.reduce((sum, p) => sum + (p.complexityLevel || 1), 0) / completed.length;
        const complexityScore = Math.min((avgComplexity / 5) * 100, 100);
        
        // Weighted score calculation
        const finalScore = 
            (completionRate * this.performanceWeights.completionRate) +
            (qualityScore * this.performanceWeights.qualityScore) +
            (budgetAdherence * this.performanceWeights.budgetAdherence) +
            (clientSatisfaction * this.performanceWeights.clientSatisfaction) +
            (complexityScore * this.performanceWeights.complexity);
        
        // Determine reputation level
        let reputation, trustLevel;
        if (finalScore >= 90) {
            reputation = 'Elite Contractor';
            trustLevel = 'Highly Trusted';
        } else if (finalScore >= 80) {
            reputation = 'Expert Contractor';
            trustLevel = 'Trusted';
        } else if (finalScore >= 70) {
            reputation = 'Experienced Contractor';
            trustLevel = 'Reliable';
        } else if (finalScore >= 60) {
            reputation = 'Competent Contractor';
            trustLevel = 'Developing';
        } else {
            reputation = 'Developing Contractor';
            trustLevel = 'Building Trust';
        }
        
        return {
            score: Math.round(finalScore),
            breakdown: {
                completionRate: Math.round(completionRate),
                qualityScore: Math.round(qualityScore),
                budgetAdherence: Math.round(budgetAdherence),
                clientSatisfaction: Math.round(clientSatisfaction),
                complexity: Math.round(complexityScore)
            },
            totalProjects: completed.length,
            onTimeRate: Math.round((onTimeProjects / completed.length) * 100),
            avgQuality: avgQuality.toFixed(1),
            reputation,
            trustLevel
        };
    }

    /**
     * Validate bid data comprehensively
     */
    validateBidData(bidData) {
        const errors = [];

        if (!bidData.contractId) errors.push('Contract ID required');
        if (!bidData.walletAddress) errors.push('Wallet address required');
        if (!bidData.bidAmount || bidData.bidAmount <= 0) errors.push('Valid bid amount required');
        if (!bidData.crypto || !this.supportedCrypto[bidData.crypto]) errors.push('Supported cryptocurrency required');
        if (!bidData.timeline || bidData.timeline < 1) errors.push('Valid timeline required');
        if (!bidData.approach || bidData.approach.length < 50) errors.push('Detailed approach description required');

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check contractor eligibility including SAM.gov status
     */
    async checkContractorEligibility(walletAddress) {
        try {
            let samGovEntity = null;

            // Check SAM.gov status if integration available
            if (window.samGovIntegration) {
                try {
                    // Get contractor profile if available
                    const contractor = window.contractorRegistry?.getContractor(walletAddress);

                    if (contractor?.uei) {
                        samGovEntity = await window.samGovIntegration.validateEntity(contractor.uei);

                        if (!samGovEntity.valid) {
                            return {
                                eligible: false,
                                reason: 'SAM.gov entity not found or inactive'
                            };
                        }

                        if (samGovEntity.exclusions.length > 0) {
                            return {
                                eligible: false,
                                reason: 'Active SAM.gov exclusions found'
                            };
                        }
                    }
                } catch (error) {
                    console.warn('SAM.gov eligibility check failed:', error);
                }
            }

            return {
                eligible: true,
                reason: 'Contractor meets all requirements',
                samGovEntity: samGovEntity
            };

        } catch (error) {
            console.error('Error checking eligibility:', error);
            return {
                eligible: false,
                reason: error.message
            };
        }
    }

    /**
     * Assess technical feasibility of bid
     */
    assessTechnicalFeasibility(bidData) {
        let score = 50; // Base score

        // Timeline realism
        if (parseInt(bidData.timeline) < 30) score += 10;
        if (parseInt(bidData.timeline) > 180) score -= 10;

        // Approach detail
        if (bidData.approach.length > 200) score += 15;
        if (bidData.approach.length > 500) score += 10;

        // Contractor experience (from performance data)
        const contractor = window.contractorRegistry?.getContractor(bidData.walletAddress);
        if (contractor) {
            if (contractor.experience === '20+') score += 20;
            if (contractor.experience === '16-20') score += 15;
            if (contractor.experience === '11-15') score += 10;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Assess market competitiveness
     */
    assessMarketCompetitiveness(bidData) {
        // This would integrate with SAM.gov market data
        // For now, provide basic assessment
        const marketData = window.samGovIntegration?.getMarketStatistics('software-development');

        if (marketData) {
            const avgValue = marketData.averageValue;
            const bidRatio = bidData.bidAmount / avgValue;

            if (bidRatio < 0.8) return 'Very Competitive';
            if (bidRatio < 1.0) return 'Competitive';
            if (bidRatio < 1.2) return 'Fair';
            return 'Above Market';
        }

        return 'Market data unavailable';
    }

    /**
     * Assess project risk
     */
    assessRisk(bidData) {
        let riskScore = 50; // Base risk

        // Timeline risk
        if (parseInt(bidData.timeline) < 60) riskScore += 20; // Aggressive timeline
        if (parseInt(bidData.timeline) > 365) riskScore -= 10; // Very long timeline

        // Amount risk
        if (bidData.bidAmount > 10000000) riskScore += 15; // Large projects

        // Technical complexity
        if (bidData.approach.toLowerCase().includes('blockchain') ||
            bidData.approach.toLowerCase().includes('ai') ||
            bidData.approach.toLowerCase().includes('security')) {
            riskScore += 10; // Complex technologies
        }

        return {
            score: Math.min(100, riskScore),
            level: riskScore > 70 ? 'High' : riskScore > 50 ? 'Medium' : 'Low',
            factors: this.getRiskFactors(bidData)
        };
    }

    /**
     * Get risk factors for bid
     */
    getRiskFactors(bidData) {
        const factors = [];

        if (parseInt(bidData.timeline) < 60) {
            factors.push('Aggressive timeline may impact quality');
        }

        if (bidData.bidAmount > 5000000) {
            factors.push('Large project scope increases complexity');
        }

        if (bidData.approach.length < 200) {
            factors.push('Limited approach detail may indicate incomplete planning');
        }

        return factors;
    }

    /**
     * Generate unique bid ID
     */
    generateBidId() {
        return `BID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sync bid with SAM.gov opportunity
     */
    async syncBidWithSAMGov(bid) {
        try {
            // Find matching SAM.gov opportunity
            const opportunities = await window.samGovIntegration.findOpportunities(['software'], ['software']);

            const matchingOpportunity = opportunities.find(opp =>
                this.calculateBidOpportunityMatch(bid, opp) > 0.7
            );

            if (matchingOpportunity) {
                bid.samGovSync.synced = true;
                bid.samGovSync.opportunityId = matchingOpportunity.id;
                bid.samGovSync.lastSyncAttempt = new Date().toISOString();

                // Update opportunity status if needed
                // This would integrate with SAM.gov API in production

                this.saveBids();

                console.log(`✅ Bid ${bid.id} synced with SAM.gov opportunity ${matchingOpportunity.id}`);
            }

        } catch (error) {
            console.error('Error syncing bid with SAM.gov:', error);
            throw error;
        }
    }

    /**
     * Calculate match score between bid and SAM.gov opportunity
     */
    calculateBidOpportunityMatch(bid, opportunity) {
        let score = 0;

        // Technical capability match
        const bidCapabilities = bid.contractor.capabilities || [];
        const oppRequirements = opportunity.requirements || [];

        const capabilityMatches = bidCapabilities.filter(cap =>
            oppRequirements.some(req => req.toLowerCase().includes(cap.toLowerCase()))
        );

        score += (capabilityMatches.length / Math.max(oppRequirements.length, 1)) * 40;

        // Timeline match
        if (opportunity.deadline) {
            const oppDeadline = new Date(opportunity.deadline);
            const bidTimelineDays = parseInt(bid.bid.timeline);

            if (bidTimelineDays <= 30 && (oppDeadline - new Date()) / (1000 * 60 * 60 * 24) <= 60) {
                score += 30; // Matches urgent timeline
            }
        }

        // Budget match
        if (opportunity.estimatedValue) {
            const budgetRatio = bid.bid.amount / opportunity.estimatedValue;

            if (budgetRatio >= 0.8 && budgetRatio <= 1.2) {
                score += 30; // Within reasonable budget range
            }
        }

        return Math.min(100, score);
    }

    /**
     * Get all bids for a contract
     */
    getContractBids(contractId) {
        return this.bids[contractId] || [];
    }

    /**
     * Get contractor's bids
     */
    getContractorBids(walletAddress) {
        const allBids = [];
        
        for (const contractId in this.bids) {
            const contractBids = this.bids[contractId].filter(
                bid => bid.contractorWallet === walletAddress
            );
            allBids.push(...contractBids);
        }
        
        return allBids;
    }

    /**
     * Enhanced bid ranking with SAM.gov integration
     */
    rankBids(contractId) {
        const contractBids = this.bids[contractId] || [];

        if (contractBids.length === 0) {
            return [];
        }

        // Enhanced ranking algorithm
        const rankedBids = contractBids.map(bid => {
            const ranking = this.calculateBidRanking(bid);

            return {
                ...bid,
                rankingScore: ranking.totalScore,
                rankingBreakdown: ranking,
                recommendation: this.generateBidRecommendation(ranking)
            };
        });

        // Sort by ranking score (highest first)
        return rankedBids.sort((a, b) => b.rankingScore - a.rankingScore);
    }

    /**
     * Calculate comprehensive bid ranking
     */
    calculateBidRanking(bid) {
        const ranking = {
            performanceScore: 0,
            priceCompetitiveness: 0,
            timelineFeasibility: 0,
            technicalCapability: 0,
            riskAssessment: 0,
            samGovAlignment: 0,
            totalScore: 0
        };

        // Performance score (40% weight)
        ranking.performanceScore = bid.contractor.performanceScore || 0;
        ranking.performanceScore = Math.min(100, ranking.performanceScore);

        // Price competitiveness (30% weight)
        const contractBids = this.bids[bid.contractId] || [];
        if (contractBids.length > 1) {
            const amounts = contractBids.map(b => b.bid.amount);
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const priceRatio = bid.bid.amount / avgAmount;

            if (priceRatio <= 0.9) ranking.priceCompetitiveness = 100;
            else if (priceRatio <= 1.1) ranking.priceCompetitiveness = 80;
            else if (priceRatio <= 1.3) ranking.priceCompetitiveness = 60;
            else ranking.priceCompetitiveness = 40;
        } else {
            ranking.priceCompetitiveness = 70; // Default for single bid
        }

        // Timeline feasibility (20% weight)
        const timelineDays = parseInt(bid.bid.timeline);
        if (timelineDays >= 60 && timelineDays <= 180) {
            ranking.timelineFeasibility = 100; // Optimal range
        } else if (timelineDays < 60) {
            ranking.timelineFeasibility = 60; // Aggressive
        } else {
            ranking.timelineFeasibility = 40; // Very long
        }

        // Technical capability (10% weight)
        ranking.technicalCapability = bid.validation?.technicalFeasibility || 50;

        // Risk assessment (bonus/penalty)
        const riskScore = bid.validation?.riskAssessment?.score || 50;
        ranking.riskAssessment = Math.max(0, 100 - riskScore); // Lower risk = higher score

        // SAM.gov alignment (bonus)
        if (bid.samGovSync.synced) {
            ranking.samGovAlignment = 20; // Bonus for SAM.gov sync
        }

        // Calculate total score
        ranking.totalScore = (
            ranking.performanceScore * 0.4 +
            ranking.priceCompetitiveness * 0.3 +
            ranking.timelineFeasibility * 0.2 +
            ranking.technicalCapability * 0.1
        ) + ranking.riskAssessment + ranking.samGovAlignment;

        return ranking;
    }

    /**
     * Generate recommendation for bid
     */
    generateBidRecommendation(ranking) {
        if (ranking.totalScore >= 85) {
            return 'Highly Recommended - Excellent match for project requirements';
        } else if (ranking.totalScore >= 70) {
            return 'Recommended - Good fit with minor considerations';
        } else if (ranking.totalScore >= 50) {
            return 'Consider with Caution - Meets minimum requirements';
        } else {
            return 'Not Recommended - Does not meet key requirements';
        }
    }

    /**
     * Accept bid with enhanced workflow
     */
    async acceptBid(bidId, approverAddress) {
        try {
            // Find bid
            let bid = null;
            let contractId = null;

            for (const [cid, bids] of Object.entries(this.bids)) {
                bid = bids.find(b => b.id === bidId);
                if (bid) {
                    contractId = cid;
                    break;
                }
            }

            if (!bid) {
                return {
                    success: false,
                    error: 'Bid not found'
                };
            }

            // Verify approver authority (System Architect only)
            if (!this.isSystemArchitect(approverAddress)) {
                return {
                    success: false,
                    error: 'Only System Architect can accept bids'
                };
            }

            // Update bid status
            bid.bid.status = 'accepted';
            bid.bid.acceptedAt = new Date().toISOString();
            bid.bid.acceptedBy = approverAddress;

            // Create escrow contract
            const escrowId = this.createEscrowContract(bid);

            // Update other bids for this contract
            const contractBids = this.bids[contractId];
            contractBids.forEach(b => {
                if (b.id !== bidId) {
                    b.bid.status = 'rejected';
                    b.bid.rejectedAt = new Date().toISOString();
                }
            });

            this.saveBids();
            this.saveEscrow();

            // Sync acceptance with SAM.gov
            if (bid.samGovSync.synced && window.samGovIntegration) {
                try {
                    await this.syncAcceptanceWithSAMGov(bid, escrowId);
                } catch (syncError) {
                    console.warn('SAM.gov acceptance sync failed:', syncError);
                }
            }

            return {
                success: true,
                escrowId: escrowId,
                message: 'Bid accepted and escrow created successfully',
                syncedWithSAMGov: bid.samGovSync.synced
            };

        } catch (error) {
            console.error('Error accepting bid:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if address is System Architect
     */
    isSystemArchitect(address) {
        const systemArchitects = [
            '0xefc6910e7624f164dae9d0f799954aa69c943c8d',
            '0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb'
        ];

        return systemArchitects.includes(address.toLowerCase());
    }

    /**
     * Sync bid acceptance with SAM.gov
     */
    async syncAcceptanceWithSAMGov(bid, escrowId) {
        try {
            // This would integrate with SAM.gov API to update opportunity status
            console.log(`🏛️ Syncing bid acceptance for ${bid.id} with SAM.gov opportunity ${bid.samGovSync.opportunityId}`);

            // In production, this would call SAM.gov API to update the opportunity
            // For now, just log the action

        } catch (error) {
            console.error('Error syncing acceptance with SAM.gov:', error);
            throw error;
        }
    }

    /**
     * Release milestone payment from escrow
     */
    async releaseMilestonePayment(escrowId, milestoneIndex, releaserWallet) {
        try {
            const escrow = this.escrowContracts[escrowId];
            
            if (!escrow) {
                throw new Error('Escrow contract not found');
            }
            
            if (escrow.client !== releaserWallet) {
                throw new Error('Only the client can release payments');
            }
            
            if (!escrow.milestones[milestoneIndex]) {
                throw new Error('Invalid milestone index');
            }
            
            const milestone = escrow.milestones[milestoneIndex];
            
            if (milestone.fundsReleased) {
                throw new Error('Funds already released for this milestone');
            }
            
            // Release payment
            milestone.status = 'completed';
            milestone.fundsReleased = true;
            milestone.releasedAt = new Date().toISOString();
            
            escrow.totalReleased += milestone.amount;
            
            // Check if all milestones completed
            const allCompleted = escrow.milestones.every(m => m.fundsReleased);
            if (allCompleted) {
                escrow.status = 'completed';
                escrow.completedAt = new Date().toISOString();
            }
            
            this.saveEscrow();
            
            return {
                success: true,
                message: 'Milestone payment released',
                escrow: escrow
            };
            
        } catch (error) {
            console.error('Error releasing payment:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Record completed project for contractor performance
     */
    recordCompletedProject(walletAddress, projectData) {
        if (!this.performanceData[walletAddress]) {
            this.performanceData[walletAddress] = {
                completedProjects: [],
                totalProjects: 0,
                totalEarned: 0
            };
        }
        
        const performance = this.performanceData[walletAddress];
        
        const project = {
            contractId: projectData.contractId,
            title: projectData.title,
            value: projectData.value,
            completedOnTime: projectData.completedOnTime,
            withinBudget: projectData.withinBudget,
            qualityRating: projectData.qualityRating || 0,
            clientRating: projectData.clientRating || 0,
            complexityLevel: projectData.complexityLevel || 1,
            completedAt: new Date().toISOString(),
            clientFeedback: projectData.feedback || ''
        };
        
        performance.completedProjects.push(project);
        performance.totalProjects++;
        performance.totalEarned += projectData.value;
        
        this.savePerformance();
        
        return this.calculatePerformanceScore(walletAddress);
    }

    /**
     * Get contractor leaderboard
     */
    getContractorLeaderboard() {
        const leaderboard = [];
        
        for (const wallet in this.performanceData) {
            const score = this.calculatePerformanceScore(wallet);
            const performance = this.performanceData[wallet];
            
            leaderboard.push({
                walletAddress: wallet,
                performanceScore: score.score,
                reputation: score.reputation,
                trustLevel: score.trustLevel,
                totalProjects: score.totalProjects,
                totalEarned: performance.totalEarned || 0,
                onTimeRate: score.onTimeRate,
                avgQuality: score.avgQuality
            });
        }
        
        // Sort by performance score
        leaderboard.sort((a, b) => b.performanceScore - a.performanceScore);
        
        return leaderboard;
    }
}

// Create global instance
window.cryptoBiddingSystem = new CryptoBiddingSystem();

console.log('💰 Crypto Bidding System loaded');
