/**
 * CRYPTO BIDDING SYSTEM FOR CLASSIFIED CONTRACTS
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
     * Submit bid on a contract
     */
    async submitBid(bidData) {
        try {
            // Validate bid data
            if (!bidData.contractId || !bidData.walletAddress || !bidData.bidAmount || !bidData.crypto) {
                throw new Error('Missing required bid information');
            }
            
            // Validate cryptocurrency
            if (!this.supportedCrypto[bidData.crypto]) {
                throw new Error('Unsupported cryptocurrency');
            }
            
            // Get contractor performance
            const performance = this.calculatePerformanceScore(bidData.walletAddress);
            
            // Generate unique bid ID
            const bidId = `BID-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Create bid record
            const bid = {
                bidId: bidId,
                contractId: bidData.contractId,
                contractorWallet: bidData.walletAddress,
                contractorName: bidData.contractorName,
                organization: bidData.organization,
                bidAmount: bidData.bidAmount,
                cryptocurrency: bidData.crypto,
                cryptoSymbol: this.supportedCrypto[bidData.crypto].icon,
                timeline: bidData.timeline || 'Not specified',
                deliverables: bidData.deliverables || [],
                approach: bidData.approach || '',
                teamMembers: bidData.teamMembers || [],
                performanceScore: performance.score,
                reputation: performance.reputation,
                trustLevel: performance.trustLevel,
                totalCompletedProjects: performance.totalProjects,
                submittedAt: new Date().toISOString(),
                status: 'pending',
                escrowDeposit: bidData.escrowDeposit || 0,
                milestones: bidData.milestones || []
            };
            
            // Store bid
            if (!this.bids[bidData.contractId]) {
                this.bids[bidData.contractId] = [];
            }
            
            this.bids[bidData.contractId].push(bid);
            this.saveBids();
            
            console.log('✅ Bid submitted successfully:', bidId);
            
            return {
                success: true,
                bidId: bidId,
                bid: bid,
                message: 'Bid submitted successfully'
            };
            
        } catch (error) {
            console.error('Error submitting bid:', error);
            return {
                success: false,
                error: error.message
            };
        }
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
     * Rank bids by multiple factors
     */
    rankBids(contractId) {
        const contractBids = this.getContractBids(contractId);
        
        if (contractBids.length === 0) {
            return [];
        }
        
        // Calculate ranking score for each bid
        const rankedBids = contractBids.map(bid => {
            // Factors:
            // 1. Performance score (40% weight)
            // 2. Price competitiveness (30% weight)
            // 3. Timeline (20% weight)
            // 4. Experience level (10% weight)
            
            const lowestBid = Math.min(...contractBids.map(b => b.bidAmount));
            const priceScore = (lowestBid / bid.bidAmount) * 100;
            
            const performanceWeight = bid.performanceScore * 0.40;
            const priceWeight = priceScore * 0.30;
            const timelineWeight = 20; // Placeholder - could calculate based on timeline
            const experienceWeight = Math.min((bid.totalCompletedProjects / 10) * 100, 100) * 0.10;
            
            const rankingScore = performanceWeight + priceWeight + timelineWeight + experienceWeight;
            
            return {
                ...bid,
                rankingScore: Math.round(rankingScore),
                priceCompetitiveness: Math.round(priceScore),
                recommendation: this.generateBidRecommendation(rankingScore)
            };
        });
        
        // Sort by ranking score (highest first)
        rankedBids.sort((a, b) => b.rankingScore - a.rankingScore);
        
        return rankedBids;
    }

    /**
     * Generate bid recommendation
     */
    generateBidRecommendation(score) {
        if (score >= 85) {
            return '🌟 Highly Recommended - Excellent value and proven track record';
        } else if (score >= 70) {
            return '✅ Recommended - Strong bid with good credentials';
        } else if (score >= 55) {
            return '⚠️ Consider - Competitive but verify details';
        } else {
            return '❌ Not Recommended - Better options available';
        }
    }

    /**
     * Accept bid and create escrow contract
     */
    async acceptBid(bidId, acceptorWallet) {
        try {
            // Find the bid
            let foundBid = null;
            let contractId = null;
            
            for (const cId in this.bids) {
                const bid = this.bids[cId].find(b => b.bidId === bidId);
                if (bid) {
                    foundBid = bid;
                    contractId = cId;
                    break;
                }
            }
            
            if (!foundBid) {
                throw new Error('Bid not found');
            }
            
            if (foundBid.status !== 'pending') {
                throw new Error('Bid is no longer available');
            }
            
            // Update bid status
            foundBid.status = 'accepted';
            foundBid.acceptedBy = acceptorWallet;
            foundBid.acceptedAt = new Date().toISOString();
            
            // Create escrow contract
            const escrowId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const escrow = {
                escrowId: escrowId,
                bidId: bidId,
                contractId: contractId,
                contractor: foundBid.contractorWallet,
                client: acceptorWallet,
                amount: foundBid.bidAmount,
                cryptocurrency: foundBid.cryptocurrency,
                milestones: foundBid.milestones.map(m => ({
                    ...m,
                    status: 'pending',
                    fundsReleased: false
                })),
                status: 'active',
                createdAt: new Date().toISOString(),
                totalReleased: 0,
                disputeOpen: false
            };
            
            this.escrowContracts[escrowId] = escrow;
            
            this.saveBids();
            this.saveEscrow();
            
            return {
                success: true,
                escrowId: escrowId,
                escrow: escrow,
                message: 'Bid accepted and escrow contract created'
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
