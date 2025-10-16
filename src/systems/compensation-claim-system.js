/**
 * COMPENSATION CLAIM SYSTEM FOR DEVELOPERS
 * Handles compensation claims for GitHub projects used in government contracts
 * Integrates with dispute resolution and token distribution systems
 */

class CompensationClaimSystem {
    constructor() {
        this.claims = this.loadClaims();
        this.disputeResolution = window.disputeResolution || null;
        this.tokenDistribution = window.tokenDistribution || null;
    }

    /**
     * Load existing claims from storage
     */
    loadClaims() {
        try {
            const data = localStorage.getItem('compensationClaims');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading compensation claims:', error);
            return [];
        }
    }

    /**
     * Save claims to storage
     */
    saveClaims() {
        try {
            localStorage.setItem('compensationClaims', JSON.stringify(this.claims));
        } catch (error) {
            console.error('Error saving compensation claims:', error);
        }
    }

    /**
     * Submit compensation claim for GitHub project
     */
    async submitCompensationClaim(claimData) {
        try {
            // Validate claim data
            const validation = this.validateClaimData(claimData);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid claim data: ${validation.errors.join(', ')}`
                };
            }

            // Check for duplicate claims
            const existingClaim = this.claims.find(claim =>
                claim.repository.url === claimData.repositoryUrl &&
                claim.samGovContract.id === claimData.contractId
            );

            if (existingClaim) {
                return {
                    success: false,
                    error: 'Claim already exists for this repository and contract'
                };
            }

            // Create claim object
            const claimId = `CLAIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const claim = {
                id: claimId,
                repository: {
                    owner: claimData.repositoryOwner,
                    name: claimData.repositoryName,
                    url: claimData.repositoryUrl,
                    githubId: claimData.githubId,
                    stars: claimData.stars,
                    forks: claimData.forks,
                    language: claimData.language,
                    createdAt: claimData.createdAt,
                    lastUpdated: claimData.lastUpdated
                },
                samGovContract: {
                    id: claimData.contractId,
                    title: claimData.contractTitle,
                    agency: claimData.contractAgency,
                    awardDate: claimData.contractAwardDate,
                    awardAmount: claimData.contractAwardAmount,
                    contractor: claimData.contractContractor,
                    solicitationNumber: claimData.contractSolicitationNumber
                },
                claimDetails: {
                    claimantAddress: claimData.claimantAddress,
                    claimantName: claimData.claimantName,
                    evidence: claimData.evidence || [],
                    description: claimData.description,
                    requestedAmount: claimData.requestedAmount,
                    evidenceStrength: this.assessEvidenceStrength(claimData.evidence)
                },
                status: 'submitted',
                submittedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                disputeId: null,
                resolution: null,
                payoutAmount: null
            };

            // Store claim
            this.claims.push(claim);
            this.saveClaims();

            // Submit to dispute resolution system if available
            if (this.disputeResolution) {
                try {
                    const disputeResult = await this.disputeResolution.submitDispute({
                        type: 'compensation_claim',
                        claimant: claimData.claimantAddress,
                        description: `Compensation claim for GitHub repository ${claimData.repositoryName} used in government contract ${claimData.contractId}`,
                        evidence: claimData.evidence,
                        amount: claimData.requestedAmount,
                        relatedClaimId: claimId
                    });

                    if (disputeResult.success) {
                        claim.disputeId = disputeResult.disputeId;
                        claim.status = 'under_review';
                        this.saveClaims();
                    }
                } catch (error) {
                    console.warn('Dispute resolution submission failed:', error);
                }
            }

            return {
                success: true,
                claimId: claimId,
                claim: claim,
                message: 'Compensation claim submitted successfully'
            };

        } catch (error) {
            console.error('Error submitting compensation claim:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate claim data
     */
    validateClaimData(data) {
        const errors = [];

        if (!data.repositoryUrl) errors.push('Repository URL required');
        if (!data.contractId) errors.push('Contract ID required');
        if (!data.claimantAddress) errors.push('Claimant wallet address required');
        if (!data.claimantName) errors.push('Claimant name required');
        if (!data.requestedAmount || data.requestedAmount <= 0) errors.push('Valid compensation amount required');
        if (!data.evidence || data.evidence.length === 0) errors.push('Evidence required');

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Assess evidence strength for claim
     */
    assessEvidenceStrength(evidence) {
        let strength = 0;
        const evidenceTypes = {};

        evidence.forEach(item => {
            if (!evidenceTypes[item.type]) {
                evidenceTypes[item.type] = 0;
            }
            evidenceTypes[item.type]++;

            // Score based on evidence type and strength
            switch (item.type) {
                case 'timeline':
                    strength += item.strength === 'strong' ? 30 : item.strength === 'moderate' ? 20 : 10;
                    break;
                case 'technical_similarity':
                    strength += item.strength === 'strong' ? 25 : item.strength === 'moderate' ? 15 : 8;
                    break;
                case 'direct_usage':
                    strength += item.strength === 'very_strong' ? 40 : item.strength === 'strong' ? 30 : 20;
                    break;
                case 'documentation':
                    strength += item.strength === 'strong' ? 20 : item.strength === 'moderate' ? 12 : 6;
                    break;
            }
        });

        // Bonus for evidence diversity
        const uniqueTypes = Object.keys(evidenceTypes).length;
        if (uniqueTypes >= 3) strength += 10;
        if (uniqueTypes >= 2) strength += 5;

        return {
            score: Math.min(100, strength),
            level: strength >= 80 ? 'very_strong' : strength >= 60 ? 'strong' : strength >= 40 ? 'moderate' : 'weak',
            evidenceTypes: evidenceTypes,
            uniqueTypes: uniqueTypes
        };
    }

    /**
     * Process claim resolution
     */
    async processClaimResolution(claimId, resolution) {
        try {
            const claim = this.claims.find(c => c.id === claimId);
            if (!claim) {
                return {
                    success: false,
                    error: 'Claim not found'
                };
            }

            // Update claim status
            claim.status = resolution.approved ? 'approved' : 'rejected';
            claim.resolution = resolution;
            claim.resolvedAt = new Date().toISOString();
            claim.lastUpdated = new Date().toISOString();

            if (resolution.approved && resolution.payoutAmount) {
                claim.payoutAmount = resolution.payoutAmount;

                // Process token distribution if available
                if (this.tokenDistribution && resolution.payoutAmount > 0) {
                    try {
                        await this.tokenDistribution.distributeTokens(
                            claim.claimDetails.claimantAddress,
                            resolution.payoutAmount,
                            `Compensation for GitHub project ${claim.repository.name} used in government contract`
                        );
                    } catch (error) {
                        console.error('Token distribution failed:', error);
                    }
                }
            }

            this.saveClaims();

            return {
                success: true,
                claim: claim,
                message: `Claim ${resolution.approved ? 'approved' : 'rejected'} successfully`
            };

        } catch (error) {
            console.error('Error processing claim resolution:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get claims by status
     */
    getClaimsByStatus(status) {
        return this.claims.filter(claim => claim.status === status);
    }

    /**
     * Get claims by claimant
     */
    getClaimsByClaimant(claimantAddress) {
        return this.claims.filter(claim =>
            claim.claimDetails.claimantAddress === claimantAddress
        );
    }

    /**
     * Generate compensation report
     */
    generateCompensationReport() {
        const stats = {
            totalClaims: this.claims.length,
            approvedClaims: this.getClaimsByStatus('approved').length,
            pendingClaims: this.getClaimsByStatus('submitted').length + this.getClaimsByStatus('under_review').length,
            rejectedClaims: this.getClaimsByStatus('rejected').length,
            totalRequested: this.claims.reduce((sum, claim) => sum + (claim.claimDetails.requestedAmount || 0), 0),
            totalApproved: this.claims
                .filter(claim => claim.status === 'approved')
                .reduce((sum, claim) => sum + (claim.payoutAmount || 0), 0),
            averageClaimAmount: 0,
            topClaimants: [],
            evidenceStrengthDistribution: {
                very_strong: 0,
                strong: 0,
                moderate: 0,
                weak: 0
            }
        };

        if (stats.totalClaims > 0) {
            stats.averageClaimAmount = Math.round(stats.totalRequested / stats.totalClaims);
        }

        // Calculate top claimants
        const claimantStats = {};
        this.claims.forEach(claim => {
            const address = claim.claimDetails.claimantAddress;
            if (!claimantStats[address]) {
                claimantStats[address] = {
                    totalClaims: 0,
                    totalRequested: 0,
                    approvedClaims: 0,
                    totalApproved: 0
                };
            }

            claimantStats[address].totalClaims++;
            claimantStats[address].totalRequested += claim.claimDetails.requestedAmount || 0;

            if (claim.status === 'approved') {
                claimantStats[address].approvedClaims++;
                claimantStats[address].totalApproved += claim.payoutAmount || 0;
            }
        });

        stats.topClaimants = Object.entries(claimantStats)
            .map(([address, data]) => ({
                address: address,
                totalClaims: data.totalClaims,
                totalRequested: data.totalRequested,
                approvedClaims: data.approvedClaims,
                totalApproved: data.totalApproved,
                successRate: data.totalClaims > 0 ? (data.approvedClaims / data.totalClaims * 100) : 0
            }))
            .sort((a, b) => b.totalApproved - a.totalApproved)
            .slice(0, 10);

        // Evidence strength distribution
        this.claims.forEach(claim => {
            const strength = claim.claimDetails.evidenceStrength.level;
            stats.evidenceStrengthDistribution[strength]++;
        });

        return {
            summary: stats,
            claims: this.claims,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Auto-detect potential claims from GitHub repositories
     */
    async autoDetectClaims(repositories) {
        const potentialClaims = [];

        for (const repo of repositories) {
            try {
                // Analyze repository for contract potential
                const analysis = await window.githubContractDetector.analyzeRepositoryForContracts(
                    repo.owner.login, repo.name
                );

                if (analysis && analysis.samGovMatches.length > 0) {
                    // Create potential claims for high-confidence matches
                    analysis.samGovMatches.forEach(match => {
                        if (match.matchScore >= 75) {
                            potentialClaims.push({
                                repository: repo,
                                analysis: analysis,
                                samGovMatch: match,
                                autoDetected: true,
                                confidence: match.matchScore,
                                suggestedAction: this.getSuggestedAction(match)
                            });
                        }
                    });
                }
            } catch (error) {
                console.error(`Error auto-detecting claims for ${repo.full_name}:`, error);
            }
        }

        return potentialClaims;
    }

    /**
     * Get suggested action for potential claim
     */
    getSuggestedAction(match) {
        if (match.matchScore >= 90) {
            return 'Strong evidence - submit claim immediately';
        } else if (match.matchScore >= 75) {
            return 'Good evidence - gather additional documentation';
        } else if (match.matchScore >= 60) {
            return 'Moderate evidence - consider consulting legal expert';
        } else {
            return 'Weak evidence - may not qualify for compensation';
        }
    }

    /**
     * Generate claim template for repository
     */
    generateClaimTemplate(repository, samGovOpportunity, matchData) {
        return {
            repositoryUrl: repository.html_url,
            repositoryOwner: repository.owner.login,
            repositoryName: repository.name,
            githubId: repository.id,
            stars: repository.stargazers_count,
            forks: repository.forks_count,
            language: repository.language,
            createdAt: repository.created_at,
            lastUpdated: repository.updated_at,
            contractId: samGovOpportunity.id,
            contractTitle: samGovOpportunity.title,
            contractAgency: samGovOpportunity.agency,
            contractAwardDate: samGovOpportunity.awardDate,
            contractAwardAmount: samGovOpportunity.awardAmount,
            contractContractor: samGovOpportunity.contractor,
            contractSolicitationNumber: samGovOpportunity.solicitationNumber,
            evidence: matchData.matchReasons.map(reason => ({
                type: 'technical_similarity',
                strength: 'strong',
                description: reason
            })),
            description: `GitHub repository ${repository.name} appears to have been used or referenced in government contract ${samGovOpportunity.id}. Evidence includes technical similarities and timeline alignment.`,
            requestedAmount: matchData.compensationEstimate.estimatedAmount,
            evidenceStrength: matchData.compensationEstimate.confidence
        };
    }
}

// Create global instance
window.compensationClaimSystem = new CompensationClaimSystem();

console.log('💰 Compensation Claim System loaded - Developer compensation tracking available');
