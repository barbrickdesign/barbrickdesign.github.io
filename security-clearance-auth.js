/**
 * SECURITY CLEARANCE AUTHENTICATION SYSTEM
 * Integrates White Card (PIV/CAC) for classified contract access
 * Supports all DoD security clearance levels
 */

class SecurityClearanceAuth {
    constructor() {
        this.clearanceLevels = {
            'PUBLIC': 0,
            'CONFIDENTIAL': 1,
            'SECRET': 2,
            'TOP_SECRET': 3,
            'TS_SCI': 4  // Top Secret / Sensitive Compartmented Information
        };
        
        this.currentUser = {
            authenticated: false,
            clearanceLevel: 'PUBLIC',
            cardType: null,
            commonName: null,
            organization: null,
            expirationDate: null,
            caveatCodes: []  // Special access programs
        };
        
        this.pivCardReader = null;
        this.classifiedContracts = [];
    }

    /**
     * Initialize PIV/CAC card reader
     */
    async initializeCardReader() {
        console.log('🔐 Initializing PIV/CAC card reader...');
        
        try {
            // Check if Web Smart Card API is available
            if (!navigator.smartCard) {
                console.warn('⚠️ Smart Card API not available - using simulation mode');
                return this.initializeSimulationMode();
            }
            
            // Request smart card reader access
            this.pivCardReader = await navigator.smartCard.requestReader();
            
            console.log('✅ Card reader initialized successfully');
            return { success: true, mode: 'hardware' };
        } catch (error) {
            console.error('Card reader initialization error:', error);
            return this.initializeSimulationMode();
        }
    }

    /**
     * Initialize simulation mode for testing (no physical card required)
     */
    initializeSimulationMode() {
        console.log('🔧 Running in simulation mode');
        this.pivCardReader = {
            simulated: true,
            readCard: () => this.simulateCardRead()
        };
        return { success: true, mode: 'simulation' };
    }

    /**
     * Read PIV/CAC card
     */
    async readPIVCard() {
        try {
            if (this.pivCardReader?.simulated) {
                return await this.simulateCardRead();
            }
            
            // Real card reading implementation
            const cardData = await this.pivCardReader.read();
            return this.parsePIVCardData(cardData);
        } catch (error) {
            console.error('Card read error:', error);
            throw new Error('Failed to read PIV/CAC card. Please ensure card is inserted properly.');
        }
    }

    /**
     * Simulate card read for demo purposes
     */
    async simulateCardRead() {
        // Simulate card read delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            commonName: 'John Doe',
            organization: 'Department of Defense',
            clearanceLevel: 'SECRET',
            cardType: 'CAC',
            expirationDate: '2026-12-31',
            caveatCodes: ['NATO', 'NOFORN'],
            certificateValid: true
        };
    }

    /**
     * Parse PIV/CAC card data
     */
    parsePIVCardData(cardData) {
        return {
            commonName: cardData.subject.commonName,
            organization: cardData.subject.organization,
            clearanceLevel: this.extractClearanceLevel(cardData),
            cardType: cardData.cardType || 'PIV',
            expirationDate: cardData.expirationDate,
            caveatCodes: this.extractCaveatCodes(cardData),
            certificateValid: cardData.certificateValid
        };
    }

    /**
     * Extract security clearance level from card
     */
    extractClearanceLevel(cardData) {
        // Extract from certificate attributes or organizational unit
        const ou = cardData.subject.organizationalUnit || '';
        
        if (ou.includes('TS/SCI')) return 'TS_SCI';
        if (ou.includes('TOP SECRET')) return 'TOP_SECRET';
        if (ou.includes('SECRET')) return 'SECRET';
        if (ou.includes('CONFIDENTIAL')) return 'CONFIDENTIAL';
        
        return 'PUBLIC';
    }

    /**
     * Extract caveat codes (special access)
     */
    extractCaveatCodes(cardData) {
        const caveats = [];
        const attrs = cardData.attributes || {};
        
        if (attrs.NATO) caveats.push('NATO');
        if (attrs.NOFORN) caveats.push('NOFORN');
        if (attrs.FVEY) caveats.push('FVEY');  // Five Eyes
        if (attrs.ORCON) caveats.push('ORCON');  // Originator Controlled
        
        return caveats;
    }

    /**
     * Authenticate user with PIV/CAC card
     */
    async authenticate() {
        try {
            console.log('🔐 Authenticating with PIV/CAC card...');
            
            // Initialize card reader if needed
            if (!this.pivCardReader) {
                await this.initializeCardReader();
            }
            
            // Read card data
            const cardData = await this.readPIVCard();
            
            // Validate certificate
            if (!cardData.certificateValid) {
                throw new Error('Certificate validation failed. Card may be expired or revoked.');
            }
            
            // Verify expiration
            const expirationDate = new Date(cardData.expirationDate);
            if (expirationDate < new Date()) {
                throw new Error('Card has expired. Please renew your credentials.');
            }
            
            // Update current user
            this.currentUser = {
                authenticated: true,
                clearanceLevel: cardData.clearanceLevel,
                cardType: cardData.cardType,
                commonName: cardData.commonName,
                organization: cardData.organization,
                expirationDate: cardData.expirationDate,
                caveatCodes: cardData.caveatCodes
            };
            
            console.log(`✅ Authenticated: ${cardData.commonName} (${cardData.clearanceLevel})`);
            
            return {
                success: true,
                user: this.currentUser
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if user has required clearance level
     */
    hasRequiredClearance(requiredLevel) {
        if (!this.currentUser.authenticated) return false;
        
        const userLevel = this.clearanceLevels[this.currentUser.clearanceLevel];
        const required = this.clearanceLevels[requiredLevel];
        
        return userLevel >= required;
    }

    /**
     * Check if user has required caveat access
     */
    hasCaveatAccess(requiredCaveats) {
        if (!requiredCaveats || requiredCaveats.length === 0) return true;
        if (!this.currentUser.authenticated) return false;
        
        return requiredCaveats.every(caveat => 
            this.currentUser.caveatCodes.includes(caveat)
        );
    }

    /**
     * Get classified contracts based on clearance
     */
    async getClassifiedContracts(filters = {}) {
        if (!this.currentUser.authenticated) {
            throw new Error('Authentication required to access classified contracts');
        }
        
        // In production, this would call actual classified SAM.gov API
        const allClassifiedContracts = this.getClassifiedContractData();
        
        // Filter by clearance level
        const accessibleContracts = allClassifiedContracts.filter(contract => {
            // Check clearance level
            if (!this.hasRequiredClearance(contract.classification)) {
                return false;
            }
            
            // Check caveat codes
            if (!this.hasCaveatAccess(contract.caveats)) {
                return false;
            }
            
            return true;
        });
        
        return accessibleContracts;
    }

    /**
     * Get classified contract data (mock - would be real API in production)
     */
    getClassifiedContractData() {
        return [
            {
                id: 'CLASS-23-001',
                title: 'Advanced Cryptographic Communication System',
                agency: 'National Security Agency',
                classification: 'TOP_SECRET',
                caveats: ['NOFORN'],
                value: 45000000,
                deadline: '2026-03-15',
                description: 'Development of next-generation encrypted communication platform',
                requirements: ['TS Clearance', 'NOFORN', 'Cryptography Experience'],
                status: 'Open for Bid'
            },
            {
                id: 'CLASS-23-002',
                title: 'Tactical Intelligence Analysis Platform',
                agency: 'Defense Intelligence Agency',
                classification: 'SECRET',
                caveats: ['NATO'],
                value: 28000000,
                deadline: '2026-01-20',
                description: 'AI-powered intelligence analysis and threat assessment system',
                requirements: ['Secret Clearance', 'NATO Access', 'AI/ML Expertise'],
                status: 'Open for Bid'
            },
            {
                id: 'CLASS-23-003',
                title: 'Satellite Communication Security Upgrade',
                agency: 'US Space Force',
                classification: 'TOP_SECRET',
                caveats: ['SCI'],
                value: 67000000,
                deadline: '2026-06-30',
                description: 'Quantum-resistant encryption for satellite communications',
                requirements: ['TS/SCI Clearance', 'Satellite Comm Experience'],
                status: 'Open for Bid'
            },
            {
                id: 'CLASS-23-004',
                title: 'Cyber Defense Operations Center',
                agency: 'US Cyber Command',
                classification: 'SECRET',
                caveats: ['FVEY'],
                value: 35000000,
                deadline: '2025-12-15',
                description: 'Real-time cyber threat detection and response platform',
                requirements: ['Secret Clearance', 'Five Eyes Access', 'Cybersecurity'],
                status: 'Open for Bid'
            },
            {
                id: 'CLASS-23-005',
                title: 'Classified Mission Planning Software',
                agency: 'Special Operations Command',
                classification: 'TS_SCI',
                caveats: ['NOFORN', 'ORCON'],
                value: 52000000,
                deadline: '2026-09-01',
                description: 'Advanced mission planning and execution platform',
                requirements: ['TS/SCI Clearance', 'NOFORN', 'ORCON', 'Military Experience'],
                status: 'Open for Bid'
            },
            {
                id: 'CLASS-23-006',
                title: 'Biometric Security System',
                agency: 'Department of Homeland Security',
                classification: 'CONFIDENTIAL',
                caveats: [],
                value: 18000000,
                deadline: '2025-11-30',
                description: 'Next-gen biometric identification and access control',
                requirements: ['Confidential Clearance', 'Biometrics Experience'],
                status: 'Open for Bid'
            }
        ];
    }

    /**
     * Get user's accessible contract summary
     */
    getAccessSummary() {
        if (!this.currentUser.authenticated) {
            return {
                totalContracts: 0,
                totalValue: 0,
                byClassification: {}
            };
        }
        
        const accessibleContracts = this.getClassifiedContractData().filter(contract => {
            return this.hasRequiredClearance(contract.classification) &&
                   this.hasCaveatAccess(contract.caveats);
        });
        
        const byClassification = {};
        let totalValue = 0;
        
        accessibleContracts.forEach(contract => {
            if (!byClassification[contract.classification]) {
                byClassification[contract.classification] = {
                    count: 0,
                    value: 0
                };
            }
            byClassification[contract.classification].count++;
            byClassification[contract.classification].value += contract.value;
            totalValue += contract.value;
        });
        
        return {
            totalContracts: accessibleContracts.length,
            totalValue: totalValue,
            byClassification: byClassification,
            clearanceLevel: this.currentUser.clearanceLevel,
            caveats: this.currentUser.caveatCodes
        };
    }

    /**
     * Logout and clear authentication
     */
    logout() {
        this.currentUser = {
            authenticated: false,
            clearanceLevel: 'PUBLIC',
            cardType: null,
            commonName: null,
            organization: null,
            expirationDate: null,
            caveatCodes: []
        };
        console.log('🔓 User logged out');
    }
}

// Create global instance
window.securityClearanceAuth = new SecurityClearanceAuth();

console.log('🔐 Security Clearance Authentication System loaded');
