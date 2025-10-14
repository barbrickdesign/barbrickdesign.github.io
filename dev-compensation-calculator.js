/**
 * DEVELOPER COMPENSATION CALCULATOR
 * Tracks dev time, screen time, and calculates accurate compensation
 * Based on SAM.gov contract rates and market standards
 * Links wallet addresses to project contributions for fair payment
 */

class DevCompensationCalculator {
    constructor() {
        this.contractors = new Map();
        this.projects = new Map();
        this.timeEntries = [];
        
        // Market rates based on SAM.gov data and industry standards
        this.rates = {
            'junior-developer': 45,      // $45/hour
            'mid-level-developer': 75,   // $75/hour
            'senior-developer': 125,     // $125/hour
            'lead-developer': 175,       // $175/hour
            'architect': 200,            // $200/hour
            'security-specialist': 150,  // $150/hour
            'ui-ux-designer': 85,        // $85/hour
            'devops-engineer': 110,      // $110/hour
            'qa-engineer': 65,           // $65/hour
            'technical-writer': 55       // $55/hour
        };
        
        // SAM.gov contract multipliers based on project type
        this.contractMultipliers = {
            'government': 1.5,          // 50% premium for gov work
            'classified': 2.0,          // 100% premium for classified
            'web3': 1.3,               // 30% premium for Web3
            'security-critical': 1.4,   // 40% premium for security
            'open-source': 1.0,         // Base rate
            'commercial': 1.2           // 20% premium for commercial
        };
        
        // Usage fee percentages when code is reused
        this.usageFees = {
            'direct-copy': 0.50,        // 50% of original dev cost
            'substantial-use': 0.30,    // 30% of original dev cost
            'partial-use': 0.15,        // 15% of original dev cost
            'reference': 0.05           // 5% of original dev cost
        };
    }

    /**
     * Register a contractor with wallet address
     */
    registerContractor(walletAddress, profile) {
        const contractor = {
            walletAddress: walletAddress,
            name: profile.name || 'Anonymous',
            role: profile.role || 'mid-level-developer',
            registeredAt: new Date().toISOString(),
            totalHours: 0,
            totalEarned: 0,
            projects: [],
            hourlyRate: this.rates[profile.role] || this.rates['mid-level-developer']
        };
        
        this.contractors.set(walletAddress, contractor);
        return contractor;
    }

    /**
     * Log development time entry
     */
    logTimeEntry(walletAddress, projectId, hours, options = {}) {
        const entry = {
            id: this.generateId(),
            walletAddress: walletAddress,
            projectId: projectId,
            hours: hours,
            timestamp: options.timestamp || new Date().toISOString(),
            description: options.description || '',
            taskType: options.taskType || 'development', // development, review, testing, documentation
            verified: false,
            commitHash: options.commitHash || null,
            evidenceUrl: options.evidenceUrl || null
        };
        
        this.timeEntries.push(entry);
        this.updateContractorStats(walletAddress, hours);
        
        return entry;
    }

    /**
     * Calculate compensation for a contractor on a project
     */
    calculateCompensation(walletAddress, projectId) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) {
            throw new Error('Contractor not registered');
        }

        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Get all time entries for this contractor on this project
        const entries = this.timeEntries.filter(e => 
            e.walletAddress === walletAddress && e.projectId === projectId
        );

        if (entries.length === 0) {
            return {
                totalHours: 0,
                grossPay: 0,
                netPay: 0,
                breakdown: []
            };
        }

        const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
        const baseRate = contractor.hourlyRate;
        const contractMultiplier = this.contractMultipliers[project.type] || 1.0;
        const effectiveRate = baseRate * contractMultiplier;

        // Calculate breakdown by task type
        const breakdown = {};
        entries.forEach(entry => {
            const type = entry.taskType;
            if (!breakdown[type]) {
                breakdown[type] = {
                    hours: 0,
                    rate: effectiveRate,
                    subtotal: 0
                };
            }
            breakdown[type].hours += entry.hours;
            breakdown[type].subtotal += entry.hours * effectiveRate;
        });

        const grossPay = totalHours * effectiveRate;

        return {
            walletAddress: walletAddress,
            contractorName: contractor.name,
            projectId: projectId,
            projectName: project.name,
            totalHours: totalHours,
            baseRate: baseRate,
            effectiveRate: effectiveRate,
            contractType: project.type,
            contractMultiplier: contractMultiplier,
            grossPay: Math.round(grossPay * 100) / 100,
            netPay: Math.round(grossPay * 0.95 * 100) / 100, // After 5% platform fee
            breakdown: breakdown,
            entries: entries.length,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Calculate usage fees when code is reused
     */
    calculateUsageFees(projectId, usageType = 'direct-copy', usersWalletAddress = null) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Get all contractors who worked on this project
        const projectContractors = this.getProjectContractors(projectId);
        const feePercentage = this.usageFees[usageType] || this.usageFees['partial-use'];
        
        const compensationBreakdown = [];
        let totalOwed = 0;

        projectContractors.forEach(contractor => {
            const comp = this.calculateCompensation(contractor.walletAddress, projectId);
            const usageFee = comp.grossPay * feePercentage;
            
            compensationBreakdown.push({
                walletAddress: contractor.walletAddress,
                contractorName: contractor.name,
                originalCompensation: comp.grossPay,
                hours: comp.totalHours,
                usageFee: Math.round(usageFee * 100) / 100,
                percentage: (comp.totalHours / project.totalHours * 100).toFixed(1) + '%'
            });
            
            totalOwed += usageFee;
        });

        return {
            projectId: projectId,
            projectName: project.name,
            usageType: usageType,
            feePercentage: (feePercentage * 100) + '%',
            usedByWallet: usersWalletAddress,
            totalOwed: Math.round(totalOwed * 100) / 100,
            contractors: compensationBreakdown,
            calculatedAt: new Date().toISOString(),
            paymentInstructions: this.generatePaymentInstructions(compensationBreakdown)
        };
    }

    /**
     * Register a project with timestamps
     */
    registerProject(projectId, projectData) {
        const project = {
            id: projectId,
            name: projectData.name,
            type: projectData.type || 'open-source',
            description: projectData.description || '',
            startDate: projectData.startDate || new Date().toISOString(),
            endDate: projectData.endDate || null,
            status: projectData.status || 'active',
            totalHours: 0,
            totalCost: 0,
            contractors: new Set(),
            githubUrl: projectData.githubUrl || null,
            samGovContractId: projectData.samGovContractId || null
        };
        
        this.projects.set(projectId, project);
        return project;
    }

    /**
     * Get all contractors who worked on a project
     */
    getProjectContractors(projectId) {
        const contractors = [];
        const entries = this.timeEntries.filter(e => e.projectId === projectId);
        const walletAddresses = new Set(entries.map(e => e.walletAddress));
        
        walletAddresses.forEach(wallet => {
            const contractor = this.contractors.get(wallet);
            if (contractor) {
                contractors.push(contractor);
            }
        });
        
        return contractors;
    }

    /**
     * Generate comprehensive compensation report
     */
    generateCompensationReport(walletAddress) {
        const contractor = this.contractors.get(walletAddress);
        if (!contractor) {
            throw new Error('Contractor not registered');
        }

        // Get all projects this contractor worked on
        const projectIds = new Set(
            this.timeEntries
                .filter(e => e.walletAddress === walletAddress)
                .map(e => e.projectId)
        );

        const projectReports = [];
        let totalOwed = 0;

        projectIds.forEach(projectId => {
            const comp = this.calculateCompensation(walletAddress, projectId);
            projectReports.push(comp);
            totalOwed += comp.netPay;
        });

        return {
            contractor: {
                walletAddress: contractor.walletAddress,
                name: contractor.name,
                role: contractor.role,
                hourlyRate: contractor.hourlyRate
            },
            summary: {
                totalProjects: projectReports.length,
                totalHours: contractor.totalHours,
                totalOwed: Math.round(totalOwed * 100) / 100,
                averageHourlyRate: totalOwed / contractor.totalHours || 0
            },
            projects: projectReports,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Calculate government assistance eligibility
     */
    calculateAssistanceEligibility(walletAddress) {
        const report = this.generateCompensationReport(walletAddress);
        const totalOwed = report.summary.totalOwed;
        
        return {
            walletAddress: walletAddress,
            totalOwed: totalOwed,
            eligibleForAssistance: totalOwed > 1000, // Minimum threshold
            programs: {
                'SAM.gov Contractor Support': totalOwed > 5000,
                'Open Source Developer Grant': totalOwed > 2000,
                'Web3 Builder Assistance': totalOwed > 3000,
                'Veteran Developer Program': totalOwed > 1000
            },
            recommendedActions: this.getAssistanceRecommendations(totalOwed),
            documentationNeeded: [
                'Wallet address verification',
                'GitHub commit history',
                'Project timestamps',
                'Time logs with evidence',
                'SAM.gov contract references (if applicable)'
            ]
        };
    }

    /**
     * Get assistance recommendations based on amount owed
     */
    getAssistanceRecommendations(totalOwed) {
        const recommendations = [];
        
        if (totalOwed > 10000) {
            recommendations.push('File claim with SAM.gov for government contract work');
            recommendations.push('Submit evidence of code reuse to requesting party');
            recommendations.push('Consider legal representation for claims over $10K');
        }
        
        if (totalOwed > 5000) {
            recommendations.push('Apply for Open Source Developer Grant programs');
            recommendations.push('Document all contributions with Git timestamps');
            recommendations.push('Request payment via smart contract escrow');
        }
        
        if (totalOwed > 1000) {
            recommendations.push('Register with government contractor databases');
            recommendations.push('Create detailed time logs with screenshots');
            recommendations.push('Use platform to automate payment requests');
        }
        
        return recommendations;
    }

    /**
     * Generate payment instructions for usage fees
     */
    generatePaymentInstructions(compensationBreakdown) {
        return compensationBreakdown.map(comp => ({
            to: comp.walletAddress,
            amount: comp.usageFee,
            currency: 'USD (or equivalent in SOL/ETH)',
            reference: `Usage fee for ${comp.contractorName} - ${comp.hours}h contribution`,
            paymentMethods: [
                'Crypto wallet transfer',
                'Wire transfer',
                'ACH',
                'Smart contract payment'
            ]
        }));
    }

    /**
     * Import time data from Git commits
     */
    async importFromGitHub(walletAddress, repoUrl, startDate, endDate) {
        // This would call GitHub API to get commit history
        // For now, return mock structure
        console.log(`Importing Git data for ${walletAddress} from ${repoUrl}`);
        
        return {
            success: true,
            commits: 0,
            hoursEstimated: 0,
            message: 'Git import would analyze commits between dates and estimate hours based on complexity'
        };
    }

    /**
     * Update contractor statistics
     */
    updateContractorStats(walletAddress, hours) {
        const contractor = this.contractors.get(walletAddress);
        if (contractor) {
            contractor.totalHours += hours;
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export data for evidence/claims
     */
    exportForClaim(walletAddress) {
        const report = this.generateCompensationReport(walletAddress);
        const assistance = this.calculateAssistanceEligibility(walletAddress);
        
        return {
            ...report,
            assistance,
            exportedAt: new Date().toISOString(),
            documentType: 'Developer Compensation Claim',
            version: '1.0'
        };
    }
}

// Create global instance
window.devCompensation = new DevCompensationCalculator();

// Example usage setup
window.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Developer Compensation Calculator loaded');
    console.log('Market rates configured based on SAM.gov standards');
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevCompensationCalculator;
}
