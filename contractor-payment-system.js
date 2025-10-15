/**
 * CONTRACTOR PAYMENT SYSTEM
 * Auto-calculates crypto drip payments based on project completion and contract matches
 * Includes leaderboard, reputation scoring, and team collaboration tracking
 */

class ContractorPaymentSystem {
    constructor() {
        this.contractors = new Map();
        this.projects = new Map();
        this.contracts = new Map();
        this.dripPayments = [];
        this.leaderboard = [];
        
        // Payment Configuration
        this.config = {
            baseDripRate: 0.01,        // SOL per day base rate
            projectMultiplier: 1.5,     // Multiplier per active project
            contractMultiplier: 2.0,    // Multiplier per matched contract
            reputationBonus: 0.1,       // Bonus per reputation point
            teamworkBonus: 0.25,        // Bonus for collaboration
            trustScoreWeight: 0.5,      // Trust score influence
            minimumDrip: 0.005,         // Minimum daily drip
            maximumDrip: 5.0,           // Maximum daily drip
            paymentToken: 'SOL'         // Payment token (SOL/MGC)
        };
        
        // Leaderboard Categories
        this.categories = {
            totalEarnings: 'Total Earnings',
            projectCount: 'Projects Completed',
            contractMatches: 'Contract Matches',
            trustScore: 'Trust Score',
            teamCollaborations: 'Team Collaborations',
            reputationPoints: 'Reputation Points'
        };
    }

    /**
     * Check if wallet is System Architect
     */
    isSystemArchitect(walletAddress) {
        const ARCHITECT_WALLETS = [
            '0xEFc6910e7624F164dAe9d0F799954aa69c943c8d',
            '6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk'
        ];
        return ARCHITECT_WALLETS.includes(walletAddress);
    }

    /**
     * Register a new contractor
     */
    registerContractor(walletAddress, profile) {
        // Check if System Architect
        const isArchitect = this.isSystemArchitect(walletAddress);
        
        const contractor = {
            walletAddress,
            displayName: profile.displayName || (isArchitect ? 'Agent R - System Architect' : `Contractor ${walletAddress.slice(0, 6)}`),
            joinDate: new Date().toISOString(),
            isSystemArchitect: isArchitect,
            
            // Stats
            stats: {
                projectsCompleted: 0,
                contractsMatched: 0,
                totalEarnings: 0,
                currentDripRate: this.config.baseDripRate,
                activeProjects: 0,
                teamCollaborations: 0,
                reputationPoints: 0,
                trustScore: 50, // Start at 50/100
                specialties: profile.specialties || [],
                teamMembers: []
            },
            
            // Payment Info
            payment: {
                lastPayout: null,
                accumulatedAmount: 0,
                dripHistory: [],
                totalPaid: 0,
                pendingAmount: 0
            },
            
            // Activity
            activity: {
                currentProjects: [],
                completedProjects: [],
                matchedContracts: [],
                collaborations: []
            },
            
            // Metadata
            metadata: {
                bio: profile.bio || '',
                portfolio: profile.portfolio || [],
                skills: profile.skills || [],
                availability: profile.availability || 'available'
            }
        };
        
        this.contractors.set(walletAddress, contractor);
        console.log(`✅ Contractor registered: ${contractor.displayName}`);
        return contractor;
    }

    /**
     * Add a project to the system
     */
    addProject(projectData) {
        const project = {
            id: this.generateProjectId(),
            title: projectData.title,
            description: projectData.description,
            contractor: projectData.contractorWallet,
            status: 'active', // active, completed, cancelled
            
            // Value
            estimatedValue: projectData.estimatedValue || 0,
            actualValue: projectData.actualValue || 0,
            
            // Dates
            startDate: new Date().toISOString(),
            completionDate: null,
            deadline: projectData.deadline,
            
            // Contract Matching
            matchedContracts: [],
            contractValue: 0,
            
            // Team
            team: projectData.team || [projectData.contractorWallet],
            
            // Progress
            progress: 0,
            milestones: projectData.milestones || [],
            
            // Metadata
            tags: projectData.tags || [],
            category: projectData.category || 'general',
            visibility: projectData.visibility || 'public'
        };
        
        this.projects.set(project.id, project);
        
        // Update contractor stats
        const contractor = this.contractors.get(projectData.contractorWallet);
        if (contractor) {
            contractor.activity.currentProjects.push(project.id);
            contractor.stats.activeProjects++;
            this.recalculateDripRate(projectData.contractorWallet);
        }
        
        console.log(`📊 Project added: ${project.title}`);
        return project;
    }

    /**
     * Match a project to a government contract
     */
    matchProjectToContract(projectId, contractData) {
        const project = this.projects.get(projectId);
        if (!project) return { success: false, error: 'Project not found' };
        
        const match = {
            contractId: contractData.id,
            contractTitle: contractData.title,
            contractValue: contractData.value,
            agency: contractData.agency,
            classification: contractData.classification,
            matchDate: new Date().toISOString(),
            matchScore: this.calculateMatchScore(project, contractData)
        };
        
        project.matchedContracts.push(match);
        project.contractValue += contractData.value;
        
        // Update contractor stats
        const contractor = this.contractors.get(project.contractor);
        if (contractor) {
            contractor.stats.contractsMatched++;
            contractor.activity.matchedContracts.push({
                projectId,
                contractId: contractData.id,
                value: contractData.value
            });
            
            // Boost drip rate for contract match
            this.recalculateDripRate(project.contractor);
            
            // Add reputation points
            this.addReputationPoints(project.contractor, 10);
        }
        
        console.log(`🎯 Contract matched: ${contractData.title} → ${project.title}`);
        return { success: true, match };
    }

    /**
     * Calculate match score between project and contract
     */
    calculateMatchScore(project, contract) {
        let score = 0;
        
        // Tag matching
        const projectTags = project.tags.map(t => t.toLowerCase());
        const contractReqs = (contract.requirements || []).map(r => r.toLowerCase());
        const commonTags = projectTags.filter(t => 
            contractReqs.some(r => r.includes(t) || t.includes(r))
        );
        score += commonTags.length * 10;
        
        // Category matching
        if (project.category === contract.category) score += 20;
        
        // Value alignment
        const valueRatio = Math.min(project.estimatedValue, contract.value) / 
                          Math.max(project.estimatedValue, contract.value);
        score += valueRatio * 20;
        
        return Math.min(score, 100);
    }

    /**
     * Complete a project
     */
    completeProject(projectId, completionData) {
        const project = this.projects.get(projectId);
        if (!project) return { success: false, error: 'Project not found' };
        
        project.status = 'completed';
        project.completionDate = new Date().toISOString();
        project.actualValue = completionData.actualValue || project.estimatedValue;
        project.progress = 100;
        
        // Update contractor stats
        const contractor = this.contractors.get(project.contractor);
        if (contractor) {
            contractor.stats.projectsCompleted++;
            contractor.stats.activeProjects--;
            contractor.activity.currentProjects = contractor.activity.currentProjects.filter(p => p !== projectId);
            contractor.activity.completedProjects.push(projectId);
            
            // Calculate payment
            const payment = this.calculateProjectPayment(project);
            contractor.stats.totalEarnings += payment;
            contractor.payment.pendingAmount += payment;
            
            // Add reputation points based on project value
            const repPoints = Math.floor(payment / 100); // 1 point per 100 SOL
            this.addReputationPoints(project.contractor, repPoints);
            
            // Update trust score
            this.updateTrustScore(project.contractor, 'project_completed');
            
            // Recalculate drip rate
            this.recalculateDripRate(project.contractor);
        }
        
        console.log(`✅ Project completed: ${project.title} - Payment: ${this.calculateProjectPayment(project)} SOL`);
        return { success: true, project, payment: this.calculateProjectPayment(project) };
    }

    /**
     * Calculate project payment
     */
    calculateProjectPayment(project) {
        let payment = project.actualValue * 0.05; // 5% base commission
        
        // Contract value bonus
        if (project.contractValue > 0) {
            payment += project.contractValue * 0.02; // 2% of contract value
        }
        
        // Team collaboration bonus
        if (project.team.length > 1) {
            payment *= (1 + (project.team.length - 1) * 0.1); // 10% per additional team member
        }
        
        return payment;
    }

    /**
     * Calculate and update contractor drip rate
     */
    recalculateDripRate(walletAddress) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) return;
        
        let dripRate = this.config.baseDripRate;
        
        // Active projects bonus
        dripRate *= Math.pow(this.config.projectMultiplier, contractor.stats.activeProjects);
        
        // Contract matches bonus
        dripRate *= Math.pow(this.config.contractMultiplier, contractor.stats.contractsMatched);
        
        // Reputation bonus
        dripRate += contractor.stats.reputationPoints * this.config.reputationBonus;
        
        // Trust score influence
        const trustMultiplier = 1 + (contractor.stats.trustScore / 100) * this.config.trustScoreWeight;
        dripRate *= trustMultiplier;
        
        // Team collaboration bonus
        if (contractor.stats.teamCollaborations > 0) {
            dripRate *= (1 + contractor.stats.teamCollaborations * this.config.teamworkBonus);
        }
        
        // Clamp to min/max
        dripRate = Math.max(this.config.minimumDrip, Math.min(this.config.maximumDrip, dripRate));
        
        contractor.stats.currentDripRate = dripRate;
        console.log(`💧 Drip rate updated for ${contractor.displayName}: ${dripRate.toFixed(4)} SOL/day`);
    }

    /**
     * Process daily drip payments
     */
    async processDripPayments() {
        console.log('💰 Processing daily drip payments...');
        
        const payments = [];
        
        for (const [walletAddress, contractor] of this.contractors) {
            const amount = contractor.stats.currentDripRate;
            
            if (amount > 0) {
                contractor.payment.accumulatedAmount += amount;
                contractor.payment.dripHistory.push({
                    date: new Date().toISOString(),
                    amount,
                    rate: contractor.stats.currentDripRate
                });
                
                payments.push({
                    walletAddress,
                    displayName: contractor.displayName,
                    amount,
                    accumulated: contractor.payment.accumulatedAmount
                });
                
                console.log(`  💧 ${contractor.displayName}: +${amount.toFixed(4)} SOL`);
            }
        }
        
        this.dripPayments.push({
            date: new Date().toISOString(),
            payments,
            totalDistributed: payments.reduce((sum, p) => sum + p.amount, 0)
        });
        
        return payments;
    }

    /**
     * Execute payout for contractor
     */
    async executePayout(walletAddress) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) return { success: false, error: 'Contractor not found' };
        
        const amount = contractor.payment.accumulatedAmount + contractor.payment.pendingAmount;
        
        if (amount < 0.01) {
            return { success: false, error: 'Minimum payout amount not met (0.01 SOL)' };
        }
        
        // TODO: Integrate with actual Solana payment
        // For now, simulate payment
        contractor.payment.totalPaid += amount;
        contractor.payment.lastPayout = new Date().toISOString();
        contractor.payment.accumulatedAmount = 0;
        contractor.payment.pendingAmount = 0;
        
        console.log(`💸 Payout executed: ${amount.toFixed(4)} SOL → ${contractor.displayName}`);
        
        return {
            success: true,
            amount,
            recipient: walletAddress,
            displayName: contractor.displayName,
            txSignature: 'simulated_' + Date.now()
        };
    }

    /**
     * Add reputation points
     */
    addReputationPoints(walletAddress, points) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) return;
        
        contractor.stats.reputationPoints += points;
        console.log(`⭐ ${contractor.displayName} gained ${points} reputation points`);
        
        // Recalculate drip rate when reputation changes
        this.recalculateDripRate(walletAddress);
    }

    /**
     * Update trust score
     */
    updateTrustScore(walletAddress, action) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) return;
        
        const scoreChanges = {
            'project_completed': +5,
            'contract_matched': +3,
            'team_collaboration': +2,
            'deadline_missed': -5,
            'project_cancelled': -3,
            'dispute': -10
        };
        
        const change = scoreChanges[action] || 0;
        contractor.stats.trustScore = Math.max(0, Math.min(100, contractor.stats.trustScore + change));
        
        console.log(`🤝 ${contractor.displayName} trust score: ${contractor.stats.trustScore}/100 (${change > 0 ? '+' : ''}${change})`);
    }

    /**
     * Add team collaboration
     */
    addCollaboration(contractorWallet, teammateWallet, projectId) {
        const contractor = this.contractors.get(contractorWallet);
        const teammate = this.contractors.get(teammateWallet);
        
        if (!contractor || !teammate) return;
        
        contractor.stats.teamCollaborations++;
        contractor.activity.collaborations.push({
            teammate: teammateWallet,
            project: projectId,
            date: new Date().toISOString()
        });
        
        if (!contractor.stats.teamMembers.includes(teammateWallet)) {
            contractor.stats.teamMembers.push(teammateWallet);
        }
        
        this.updateTrustScore(contractorWallet, 'team_collaboration');
        this.recalculateDripRate(contractorWallet);
    }

    /**
     * Generate leaderboard
     */
    generateLeaderboard(category = 'totalEarnings', limit = 50) {
        const contractors = Array.from(this.contractors.values());
        
        const sortFunctions = {
            totalEarnings: (a, b) => b.stats.totalEarnings - a.stats.totalEarnings,
            projectCount: (a, b) => b.stats.projectsCompleted - a.stats.projectsCompleted,
            contractMatches: (a, b) => b.stats.contractsMatched - a.stats.contractsMatched,
            trustScore: (a, b) => b.stats.trustScore - a.stats.trustScore,
            teamCollaborations: (a, b) => b.stats.teamCollaborations - a.stats.teamCollaborations,
            reputationPoints: (a, b) => b.stats.reputationPoints - a.stats.reputationPoints
        };
        
        const sortFn = sortFunctions[category] || sortFunctions.totalEarnings;
        contractors.sort(sortFn);
        
        this.leaderboard = contractors.slice(0, limit).map((contractor, index) => ({
            rank: index + 1,
            walletAddress: contractor.walletAddress,
            displayName: contractor.displayName,
            stats: contractor.stats,
            payment: {
                totalEarnings: contractor.stats.totalEarnings,
                currentDripRate: contractor.stats.currentDripRate,
                totalPaid: contractor.payment.totalPaid
            },
            score: this.calculateContractorScore(contractor)
        }));
        
        return this.leaderboard;
    }

    /**
     * Calculate overall contractor score
     */
    calculateContractorScore(contractor) {
        return (
            contractor.stats.projectsCompleted * 100 +
            contractor.stats.contractsMatched * 150 +
            contractor.stats.reputationPoints * 10 +
            contractor.stats.trustScore * 5 +
            contractor.stats.teamCollaborations * 25 +
            contractor.stats.totalEarnings
        );
    }

    /**
     * Get contractor profile for bidding
     */
    getContractorProfile(walletAddress) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) return null;
        
        return {
            ...contractor,
            score: this.calculateContractorScore(contractor),
            rank: this.leaderboard.findIndex(c => c.walletAddress === walletAddress) + 1,
            trustRating: this.getTrustRating(contractor.stats.trustScore),
            availability: contractor.metadata.availability,
            recentProjects: contractor.activity.completedProjects.slice(-5),
            teamMembers: contractor.stats.teamMembers.map(wallet => {
                const tm = this.contractors.get(wallet);
                return tm ? { wallet, name: tm.displayName } : null;
            }).filter(Boolean)
        };
    }

    /**
     * Get trust rating label
     */
    getTrustRating(trustScore) {
        if (trustScore >= 90) return 'Excellent';
        if (trustScore >= 75) return 'Very Good';
        if (trustScore >= 60) return 'Good';
        if (trustScore >= 40) return 'Fair';
        return 'Building';
    }

    /**
     * Generate project ID
     */
    generateProjectId() {
        return 'PRJ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get system statistics
     */
    getSystemStats() {
        const contractors = Array.from(this.contractors.values());
        const projects = Array.from(this.projects.values());
        
        return {
            totalContractors: contractors.length,
            activeContractors: contractors.filter(c => c.stats.activeProjects > 0).length,
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            completedProjects: projects.filter(p => p.status === 'completed').length,
            totalContractValue: projects.reduce((sum, p) => sum + p.contractValue, 0),
            totalEarnings: contractors.reduce((sum, c) => sum + c.stats.totalEarnings, 0),
            totalDripRate: contractors.reduce((sum, c) => sum + c.stats.currentDripRate, 0),
            averageTrustScore: contractors.reduce((sum, c) => sum + c.stats.trustScore, 0) / contractors.length,
            topContractor: contractors.sort((a, b) => 
                this.calculateContractorScore(b) - this.calculateContractorScore(a)
            )[0]
        };
    }
}

// Initialize global instance
window.contractorPaymentSystem = new ContractorPaymentSystem();
console.log('💰 Contractor Payment System initialized');
