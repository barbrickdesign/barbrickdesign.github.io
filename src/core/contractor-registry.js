/**
 * CONTRACTOR REGISTRY & MANAGEMENT SYSTEM
 * Handles contractor registration, white card verification, and wallet linking
 * AI-powered contract matching based on clearance and capabilities
 */

class ContractorRegistry {
    constructor() {
        this.STORAGE_KEY = 'contractorRegistry';
        this.PENDING_KEY = 'pendingContractors';
        this.contractors = this.loadContractors();
        this.pendingApprovals = this.loadPendingApprovals();
        
        // System Architect wallets for admin access
        this.SYSTEM_ARCHITECT_WALLETS = [
            '0xEFc6910e7624F164dAe9d0F799954aa69c943c8d',
            '0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb',
            '0x45a328572b2a06484e02EB5D4e4cb6004136eB16'
        ];
        
        // Clearance levels and their numeric values
        this.clearanceLevels = {
            'PUBLIC': 0,
            'CONFIDENTIAL': 1,
            'SECRET': 2,
            'TOP_SECRET': 3,
            'TS_SCI': 4,
            'SUPREME': 999
        };
        
        // Industry capabilities and specializations
        this.capabilities = [
            'Cybersecurity', 'Software Development', 'AI/ML', 'Cloud Computing',
            'Data Analytics', 'Network Engineering', 'Cryptography', 'Hardware Engineering',
            'Satellite Communications', 'Intelligence Analysis', 'Biometrics', 'Drone Technology',
            'Quantum Computing', 'Blockchain', 'IoT', 'Embedded Systems', 'Signal Processing',
            'Radar Systems', 'Electronic Warfare', 'Mission Planning', 'C4ISR', 'SIGINT',
            'Project Management', 'System Architecture', 'DevSecOps', 'Threat Intelligence'
        ];
        
        // Team sizes
        this.teamSizes = ['1-5', '6-20', '21-50', '51-100', '100+'];
        
        // Years of experience ranges
        this.experienceRanges = ['0-2', '3-5', '6-10', '11-15', '16-20', '20+'];
    }

    /**
     * Load contractors from localStorage
     */
    loadContractors() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading contractors:', error);
            return {};
        }
    }

    /**
     * Load pending approvals from localStorage
     */
    loadPendingApprovals() {
        try {
            const data = localStorage.getItem(this.PENDING_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error loading pending approvals:', error);
            return {};
        }
    }

    /**
     * Save contractors to localStorage
     */
    saveContractors() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.contractors));
        } catch (error) {
            console.error('Error saving contractors:', error);
        }
    }

    /**
     * Save pending approvals to localStorage
     */
    savePendingApprovals() {
        try {
            localStorage.setItem(this.PENDING_KEY, JSON.stringify(this.pendingApprovals));
        } catch (error) {
            console.error('Error saving pending approvals:', error);
        }
    }

    /**
     * Register new contractor with white card credentials
     */
    async registerContractor(registrationData) {
        try {
            console.log('📝 Processing contractor registration...');
            
            // Validate required fields
            const required = ['walletAddress', 'fullName', 'organization', 'clearanceLevel', 
                            'whiteCardNumber', 'whiteCardExpiry', 'email', 'phone', 
                            'capabilities', 'teamSize', 'experience'];
            
            for (const field of required) {
                if (!registrationData[field]) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
            
            // Check if wallet already registered
            if (this.contractors[registrationData.walletAddress]) {
                throw new Error('This wallet address is already registered.');
            }
            
            // Check if already pending approval
            if (this.pendingApprovals[registrationData.walletAddress]) {
                throw new Error('Registration is already pending approval.');
            }
            
            // Validate white card expiration date
            const expiryDate = new Date(registrationData.whiteCardExpiry);
            if (expiryDate < new Date()) {
                throw new Error('White card has expired. Please renew before registering.');
            }
            
            // Validate clearance level
            if (!this.clearanceLevels.hasOwnProperty(registrationData.clearanceLevel)) {
                throw new Error('Invalid clearance level.');
            }
            
            // Create contractor record
            const contractor = {
                walletAddress: registrationData.walletAddress,
                fullName: registrationData.fullName,
                organization: registrationData.organization,
                clearanceLevel: registrationData.clearanceLevel,
                caveatCodes: registrationData.caveatCodes || [],
                whiteCard: {
                    number: registrationData.whiteCardNumber,
                    type: registrationData.whiteCardType || 'PIV/CAC',
                    expiry: registrationData.whiteCardExpiry,
                    issuer: registrationData.whiteCardIssuer || 'DoD'
                },
                contact: {
                    email: registrationData.email,
                    phone: registrationData.phone,
                    preferredContact: registrationData.preferredContact || 'email'
                },
                profile: {
                    capabilities: registrationData.capabilities,
                    teamSize: registrationData.teamSize,
                    experience: registrationData.experience,
                    certifications: registrationData.certifications || [],
                    pastProjects: registrationData.pastProjects || [],
                    linkedIn: registrationData.linkedIn || '',
                    website: registrationData.website || ''
                },
                team: registrationData.team || [],
                registrationDate: new Date().toISOString(),
                status: 'pending',
                verified: false,
                approvedBy: null,
                approvedDate: null,
                lastActive: new Date().toISOString()
            };
            
            // Add to pending approvals
            this.pendingApprovals[registrationData.walletAddress] = contractor;
            this.savePendingApprovals();
            
            console.log('✅ Registration submitted successfully');
            console.log('⏳ Awaiting System Architect approval');
            
            return {
                success: true,
                message: 'Registration submitted successfully. Awaiting approval from System Architect.',
                contractor: contractor
            };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Approve contractor registration (System Architect only)
     */
    async approveContractor(walletAddress, approverWallet) {
        try {
            // Verify approver is System Architect
            if (!this.SYSTEM_ARCHITECT_WALLETS.includes(approverWallet)) {
                throw new Error('⛔ Only System Architect can approve registrations.');
            }
            
            const contractor = this.pendingApprovals[walletAddress];
            if (!contractor) {
                throw new Error('No pending registration found for this wallet.');
            }
            
            // Verify white card credentials (in production, this would call actual verification API)
            const verificationResult = await this.verifyWhiteCard(contractor.whiteCard);
            
            if (!verificationResult.valid) {
                throw new Error('White card verification failed: ' + verificationResult.reason);
            }
            
            // Update contractor status
            contractor.status = 'approved';
            contractor.verified = true;
            contractor.approvedBy = approverWallet;
            contractor.approvedDate = new Date().toISOString();
            
            // Move to active contractors
            this.contractors[walletAddress] = contractor;
            delete this.pendingApprovals[walletAddress];
            
            // Save changes
            this.saveContractors();
            this.savePendingApprovals();
            
            console.log('✅ Contractor approved:', contractor.fullName);
            
            return {
                success: true,
                message: 'Contractor approved successfully.',
                contractor: contractor
            };
        } catch (error) {
            console.error('Approval error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Reject contractor registration (System Architect only)
     */
    async rejectContractor(walletAddress, approverWallet, reason) {
        try {
            // Verify approver is System Architect
            if (!this.SYSTEM_ARCHITECT_WALLETS.includes(approverWallet)) {
                throw new Error('⛔ Only System Architect can reject registrations.');
            }
            
            const contractor = this.pendingApprovals[walletAddress];
            if (!contractor) {
                throw new Error('No pending registration found for this wallet.');
            }
            
            // Remove from pending
            delete this.pendingApprovals[walletAddress];
            this.savePendingApprovals();
            
            console.log('❌ Contractor rejected:', contractor.fullName);
            
            return {
                success: true,
                message: 'Registration rejected.',
                reason: reason
            };
        } catch (error) {
            console.error('Rejection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify white card credentials (simulated - would be real API in production)
     */
    async verifyWhiteCard(whiteCardData) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In production, this would call DoD PIV/CAC verification API
        // For now, basic validation
        
        const expiryDate = new Date(whiteCardData.expiry);
        if (expiryDate < new Date()) {
            return {
                valid: false,
                reason: 'Card has expired'
            };
        }
        
        // Simulate successful verification
        return {
            valid: true,
            verifiedAt: new Date().toISOString()
        };
    }

    /**
     * Get contractor by wallet address
     */
    getContractor(walletAddress) {
        return this.contractors[walletAddress] || null;
    }

    /**
     * Check if contractor is approved
     */
    isApproved(walletAddress) {
        const contractor = this.contractors[walletAddress];
        return contractor && contractor.status === 'approved' && contractor.verified;
    }

    /**
     * Get all pending approvals (System Architect only)
     */
    getPendingApprovals(requestorWallet) {
        if (!this.SYSTEM_ARCHITECT_WALLETS.includes(requestorWallet)) {
            throw new Error('⛔ Only System Architect can view pending approvals.');
        }
        
        return Object.values(this.pendingApprovals);
    }

    /**
     * Get all approved contractors (System Architect only)
     */
    getAllContractors(requestorWallet) {
        if (!this.SYSTEM_ARCHITECT_WALLETS.includes(requestorWallet)) {
            throw new Error('⛔ Only System Architect can view all contractors.');
        }
        
        return Object.values(this.contractors);
    }

    /**
     * AI-POWERED CONTRACT MATCHING ALGORITHM
     * Matches contractors with suitable contracts based on multiple factors
     */
    matchContractsToContractor(walletAddress, availableContracts) {
        const contractor = this.contractors[walletAddress];
        if (!contractor) {
            throw new Error('Contractor not found');
        }
        
        const matches = availableContracts.map(contract => {
            let score = 0;
            const reasons = [];
            
            // 1. CLEARANCE LEVEL MATCH (40 points max)
            const contractClearance = this.clearanceLevels[contract.classification] || 0;
            const contractorClearance = this.clearanceLevels[contractor.clearanceLevel] || 0;
            
            if (contractorClearance >= contractClearance) {
                const clearanceMatch = 40;
                score += clearanceMatch;
                reasons.push(`✅ Clearance: ${contractor.clearanceLevel} meets ${contract.classification} (${clearanceMatch} pts)`);
            } else {
                reasons.push(`❌ Insufficient clearance: Need ${contract.classification}, have ${contractor.clearanceLevel}`);
                return { contract, score: 0, reasons, match: 'insufficient_clearance' };
            }
            
            // 2. CAVEAT/SPECIAL ACCESS MATCH (15 points)
            if (contract.caveats && contract.caveats.length > 0) {
                const hasAllCaveats = contract.caveats.every(caveat => 
                    contractor.caveatCodes.includes(caveat)
                );
                
                if (hasAllCaveats) {
                    score += 15;
                    reasons.push(`✅ Special Access: All caveats met (15 pts)`);
                } else {
                    const missing = contract.caveats.filter(c => !contractor.caveatCodes.includes(c));
                    reasons.push(`⚠️ Missing caveats: ${missing.join(', ')}`);
                }
            }
            
            // 3. CAPABILITY MATCH (25 points max)
            if (contract.requirements && contractor.profile.capabilities) {
                const matchingCapabilities = contract.requirements.filter(req => 
                    contractor.profile.capabilities.some(cap => 
                        req.toLowerCase().includes(cap.toLowerCase()) || 
                        cap.toLowerCase().includes(req.toLowerCase())
                    )
                );
                
                const capabilityScore = Math.min(25, (matchingCapabilities.length / contract.requirements.length) * 25);
                score += capabilityScore;
                
                if (matchingCapabilities.length > 0) {
                    reasons.push(`✅ Capabilities: ${matchingCapabilities.length}/${contract.requirements.length} matched (${capabilityScore.toFixed(0)} pts)`);
                } else {
                    reasons.push(`⚠️ No direct capability match`);
                }
            }
            
            // 4. TEAM SIZE SUITABILITY (10 points)
            const contractValue = contract.value || 0;
            const teamSize = contractor.profile.teamSize;
            
            if ((contractValue >= 50000000 && ['51-100', '100+'].includes(teamSize)) ||
                (contractValue >= 20000000 && contractValue < 50000000 && ['21-50', '51-100'].includes(teamSize)) ||
                (contractValue < 20000000 && ['1-5', '6-20', '21-50'].includes(teamSize))) {
                score += 10;
                reasons.push(`✅ Team size appropriate for contract value (10 pts)`);
            } else {
                reasons.push(`⚠️ Team size may not be optimal for contract scale`);
            }
            
            // 5. EXPERIENCE LEVEL (10 points)
            const experience = contractor.profile.experience;
            const experienceYears = parseInt(experience.split('-')[0]) || 0;
            
            if (experienceYears >= 16) {
                score += 10;
                reasons.push(`✅ Senior experience: ${experience} years (10 pts)`);
            } else if (experienceYears >= 11) {
                score += 8;
                reasons.push(`✅ Advanced experience: ${experience} years (8 pts)`);
            } else if (experienceYears >= 6) {
                score += 6;
                reasons.push(`✅ Mid-level experience: ${experience} years (6 pts)`);
            } else {
                score += 3;
                reasons.push(`⚠️ Entry-level experience: ${experience} years (3 pts)`);
            }
            
            // Determine match quality
            let matchQuality;
            if (score >= 85) matchQuality = 'excellent';
            else if (score >= 70) matchQuality = 'good';
            else if (score >= 50) matchQuality = 'fair';
            else matchQuality = 'poor';
            
            return {
                contract,
                score,
                matchQuality,
                reasons,
                recommendation: this.generateRecommendation(score, matchQuality)
            };
        });
        
        // Sort by score (highest first)
        matches.sort((a, b) => b.score - a.score);
        
        return matches;
    }

    /**
     * Generate recommendation text based on match score
     */
    generateRecommendation(score, quality) {
        if (quality === 'excellent') {
            return '🎯 Highly Recommended - This contract is an excellent match for your capabilities and clearance.';
        } else if (quality === 'good') {
            return '✅ Recommended - Strong alignment with your profile. Consider bidding.';
        } else if (quality === 'fair') {
            return '⚠️ Moderate Match - Some alignment, but may require additional resources or partnerships.';
        } else {
            return '❌ Not Recommended - Limited alignment with your current capabilities.';
        }
    }

    /**
     * Get contractor statistics
     */
    getContractorStats(walletAddress) {
        const contractor = this.contractors[walletAddress];
        if (!contractor) return null;
        
        return {
            registrationDate: contractor.registrationDate,
            clearanceLevel: contractor.clearanceLevel,
            capabilities: contractor.profile.capabilities.length,
            teamSize: contractor.profile.teamSize,
            experience: contractor.profile.experience,
            verified: contractor.verified,
            lastActive: contractor.lastActive
        };
    }

    /**
     * Update contractor profile
     */
    updateContractorProfile(walletAddress, updates) {
        const contractor = this.contractors[walletAddress];
        if (!contractor) {
            throw new Error('Contractor not found');
        }
        
        // Update allowed fields
        if (updates.contact) {
            contractor.contact = { ...contractor.contact, ...updates.contact };
        }
        
        if (updates.profile) {
            contractor.profile = { ...contractor.profile, ...updates.profile };
        }
        
        if (updates.team) {
            contractor.team = updates.team;
        }
        
        contractor.lastActive = new Date().toISOString();
        
        this.saveContractors();
        
        return {
            success: true,
            contractor: contractor
        };
    }
}

// Create global instance
window.contractorRegistry = new ContractorRegistry();

console.log('📋 Contractor Registry System loaded');
