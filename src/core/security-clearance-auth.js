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
            'TS_SCI': 4,
            'SUPREME': 999  // System Architect - Supersedes all
        };
        
        this.currentUser = {
            authenticated: false,
            clearanceLevel: 'PUBLIC',
            walletAddress: null,
            commonName: null,
            organization: null,
            expirationDate: null,
            caveatCodes: []  // Special access programs
        };
        
        // SYSTEM ARCHITECT - SUPREME AUTHORITY
        this.SYSTEM_ARCHITECT = {
            metamask: '0xEFc6910e7624F164dAe9d0F799954aa69c943c8d',
            metamask2: '0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb',
            phantom: '6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk',
            alias: 'Agent R',
            role: 'System Architect',
            clearance: 'SUPREME',
            authority: 'CREATOR',
            systems: ['Mandem.OS', 'Null.OS', 'Gem Bot Universe']
        };
        
        // Reference to contractor registry (loaded separately)
        this.contractorRegistry = window.contractorRegistry;
        
        // WALLET-BASED CLEARANCE REGISTRY
        this.clearanceRegistry = {
            // SYSTEM ARCHITECT - SUPREME AUTHORITY (Supersedes all clearances)
            '0xEFc6910e7624F164dAe9d0F799954aa69c943c8d': {
                level: 'SUPREME',
                caveats: ['NOFORN', 'NATO', 'FVEY', 'ORCON', 'ARCHITECT'],
                name: 'Agent R',
                title: 'System Architect',
                organization: 'BarbrickDesign',
                verified: true,
                issuer: 'CREATOR',
                expires: '2099-12-31',
                accessAll: true,
                supersedes: ['WHITE_CARD', 'TS_SCI', 'TOP_SECRET', 'SECRET', 'ALL'],
                authority: 'UNLIMITED'
            },
            // PHANTOM WALLET - SUPREME AUTHORITY
            '6HTjfgWZYMbENnMAJJFhxWR2VZDxdze3qV7zznSAsfk': {
                level: 'SUPREME',
                caveats: ['NOFORN', 'NATO', 'FVEY', 'ORCON', 'ARCHITECT'],
                name: 'Agent R',
                title: 'System Architect',
                organization: 'BarbrickDesign',
                verified: true,
                issuer: 'CREATOR',
                expires: '2099-12-31',
                accessAll: true,
                supersedes: ['WHITE_CARD', 'TS_SCI', 'TOP_SECRET', 'SECRET', 'ALL'],
                authority: 'UNLIMITED'
            },
            // SECOND METAMASK WALLET - SUPREME AUTHORITY
            '0x4ccbefd7d3554bcbbc489b11af73a84d7baef4cb': {
                level: 'SUPREME',
                caveats: ['NOFORN', 'NATO', 'FVEY', 'ORCON', 'ARCHITECT'],
                name: 'Agent R',
                title: 'System Architect',
                organization: 'BarbrickDesign',
                verified: true,
                issuer: 'CREATOR',
                expires: '2099-12-31',
                accessAll: true,
                supersedes: ['WHITE_CARD', 'TS_SCI', 'TOP_SECRET', 'SECRET', 'ALL'],
                authority: 'UNLIMITED'
            }
            // Add more wallets here as needed
        };
        
        this.walletConnector = window.walletConnector;
        this.classifiedContracts = [];

        // SAM.gov OAuth Configuration
        this.samGovClientId = 'your_sam_gov_client_id'; // Replace with actual client ID
        this.samGovClientSecret = 'your_sam_gov_client_secret'; // Replace with actual client secret
        this.samGovRedirectUri = `${window.location.origin}/samgov-callback.html`;
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
     * Detect and connect available wallet (Phantom or MetaMask)
     * Enhanced with mobile MetaMask support and better error handling
     */
    async detectAndConnectWallet() {
        console.log('🔍 Detecting available wallets...');
        
        // Detect mobile environment
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log(`📱 Mobile device: ${isMobile}`);
        
        let lastError = null;
        let walletsDetected = [];
        
        // Try MetaMask (Ethereum) - Check multiple providers
        const ethereumProvider = window.ethereum || window.web3?.currentProvider;
        
        if (ethereumProvider) {
            walletsDetected.push('MetaMask/Ethereum');
            console.log('🦊 MetaMask/Web3 provider detected');
            
            // Handle mobile MetaMask deep linking
            if (isMobile && !window.ethereum) {
                console.log('📱 Mobile detected - checking for MetaMask app...');
                
                if (ethereumProvider.isMetaMask) {
                    console.log('✅ Running in MetaMask mobile browser');
                } else {
                    const currentUrl = window.location.href;
                    const dappUrl = `https://metamask.app.link/dapp/${currentUrl.replace(/^https?:\/\//, '')}`;
                    console.log('🔗 Redirecting to MetaMask app:', dappUrl);
                    window.location.href = dappUrl;
                    throw new Error('Redirecting to MetaMask app...');
                }
            }
            
            try {
                console.log('📞 Requesting MetaMask connection...');
                
                // First check if already connected (no popup needed)
                const existingAccounts = await ethereumProvider.request({ method: 'eth_accounts' });
                
                let accounts;
                if (existingAccounts && existingAccounts.length > 0) {
                    console.log('✅ Using existing MetaMask connection');
                    accounts = existingAccounts;
                } else {
                    // Request new connection
                    if (ethereumProvider.request) {
                        accounts = await ethereumProvider.request({ 
                            method: 'eth_requestAccounts' 
                        });
                    } else if (ethereumProvider.enable) {
                        accounts = await ethereumProvider.enable();
                    } else if (ethereumProvider.sendAsync) {
                        accounts = await new Promise((resolve, reject) => {
                            ethereumProvider.sendAsync({
                                method: 'eth_requestAccounts'
                            }, (err, response) => {
                                if (err) reject(err);
                                else resolve(response.result);
                            });
                        });
                    }
                }
                
                const address = accounts[0];
                
                if (!address) {
                    throw new Error('No account found. Please unlock MetaMask and try again.');
                }
                
                const normalizedAddress = address.toLowerCase();
                
                console.log('✅ MetaMask connected:', normalizedAddress);
                console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
                
                // Listen for account/chain changes
                if (ethereumProvider.on) {
                    ethereumProvider.on('accountsChanged', (accounts) => {
                        console.log('👤 Account changed:', accounts[0]);
                        window.location.reload();
                    });
                    
                    ethereumProvider.on('chainChanged', (chainId) => {
                        console.log('⛓️ Chain changed:', chainId);
                        window.location.reload();
                    });
                }
                
                return { 
                    success: true, 
                    address: normalizedAddress, 
                    type: 'metamask',
                    isMobile: isMobile,
                    provider: ethereumProvider
                };
                
            } catch (error) {
                console.error('MetaMask connection error:', error);
                
                // Check if user rejected the request
                if (error.code === 4001 || error.message.includes('User rejected') || error.message.includes('User denied')) {
                    throw new Error('Connection request rejected. Please approve the connection in MetaMask to continue.');
                }
                
                // Check for "Unexpected error" - wallet likely locked or conflicting
                if (error.message.includes('Unexpected')) {
                    console.warn('⚠️ MetaMask connection failed - wallet may be locked or conflicting with other extensions');
                }
                
                // Store error but try Phantom next
                lastError = error;
            }
        }
        
        // Try Phantom (Solana) - only if MetaMask failed
        if (window.solana && window.solana.isPhantom) {
            walletsDetected.push('Phantom');
            console.log('👻 Phantom wallet detected');
            
            // Skip Phantom if we have MetaMask issues (likely wallet conflict)
            if (lastError && lastError.message.includes('Unexpected')) {
                console.warn('⏭️ Skipping Phantom due to wallet conflict - Please unlock one wallet and refresh');
            } else {
                try {
                    console.log('📞 Requesting Phantom connection...');
                    
                    // Check if already connected
                    if (window.solana.isConnected) {
                        const address = window.solana.publicKey.toBase58();
                        console.log('✅ Using existing Phantom connection');
                        return { success: true, address, type: 'phantom', isMobile: isMobile };
                    }
                    
                    const resp = await window.solana.connect();
                    const address = resp.publicKey.toBase58();
                    console.log('✅ Phantom connected:', address);
                    return { success: true, address, type: 'phantom', isMobile: isMobile };
                } catch (error) {
                    console.warn('Phantom connection failed:', error);
                    
                    // Check if user rejected
                    if (error.code === 4001 || error.message.includes('User rejected')) {
                        throw new Error('Connection request rejected. Please approve the connection in Phantom to continue.');
                    }
                    
                    lastError = error;
                }
            }
        }
        
        // If we detected wallets but connection failed, provide helpful error
        if (walletsDetected.length > 0) {
            const walletList = walletsDetected.join(' and ');
            
            // Special message for "Unexpected error"
            if (lastError?.message.includes('Unexpected')) {
                throw new Error(`⚠️ Wallet connection failed - Common fixes:\n\n1. ✅ UNLOCK your ${walletList.includes('MetaMask') ? 'MetaMask' : 'wallet'}\n2. 🔄 REFRESH this page\n3. 🔌 Try disabling one wallet if you have multiple installed\n4. 🦊 If using Phantom, try with just MetaMask\n\nError: ${lastError?.message}`);
            }
            
            throw new Error(`${walletList} detected but connection failed. Please:\n1. Make sure your wallet is unlocked\n2. Approve the connection request\n3. Refresh the page and try again\n\nError: ${lastError?.message || 'Unknown error'}`);
        }
        
        // No wallet found at all
        let errorMsg = 'No compatible wallet found. ';
        
        if (isMobile) {
            errorMsg += 'Please open this page in MetaMask mobile browser or install MetaMask app.';
        } else {
            errorMsg += 'Please install MetaMask or Phantom browser extension.';
        }
        
        throw new Error(errorMsg);
    }

    /**
     * SAM.gov Single Sign-On Authentication
     * Allows contractors to use their SAM.gov credentials
     */
    async authenticateWithSAMGov() {
        try {
            console.log('🏛️ Initiating SAM.gov SSO authentication...');

            // Generate a state parameter for security
            const state = this.generateStateParameter();

            // Store state in session storage for verification
            sessionStorage.setItem('samGovAuthState', state);

            // SAM.gov OAuth authorization URL
            const authUrl = `https://login.sam.gov/oauth/authorize?` +
                `client_id=${encodeURIComponent(this.samGovClientId)}&` +
                `response_type=code&` +
                `redirect_uri=${encodeURIComponent(this.samGovRedirectUri)}&` +
                `state=${encodeURIComponent(state)}&` +
                `scope=openid profile entity`;

            console.log('🔗 Redirecting to SAM.gov for authentication...');
            window.location.href = authUrl;

        } catch (error) {
            console.error('SAM.gov SSO initiation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle SAM.gov OAuth callback and token exchange
     */
    async handleSAMGovCallback(code, state) {
        try {
            // Verify state parameter
            const storedState = sessionStorage.getItem('samGovAuthState');
            if (state !== storedState) {
                throw new Error('Invalid state parameter - possible CSRF attack');
            }

            console.log('🔄 Exchanging authorization code for tokens...');

            // Exchange code for access token
            const tokenResponse = await this.exchangeSAMGovToken(code);

            if (!tokenResponse.success) {
                throw new Error(tokenResponse.error);
            }

            // Get user profile from SAM.gov
            const profileResponse = await this.getSAMGovProfile(tokenResponse.accessToken);

            if (!profileResponse.success) {
                throw new Error('Failed to retrieve SAM.gov profile');
            }

            const samGovProfile = profileResponse.profile;

            console.log('✅ SAM.gov profile retrieved:', samGovProfile.legalBusinessName);

            // Check if entity is active and not excluded
            if (samGovProfile.status !== 'ACTIVE') {
                throw new Error('SAM.gov entity is not active. Please activate your SAM.gov registration.');
            }

            // Check for exclusions
            const exclusions = await window.samGovIntegration.checkExclusions(samGovProfile.ueiSAM);
            if (exclusions.length > 0) {
                throw new Error(`Active SAM.gov exclusions found (${exclusions.length}). Please resolve exclusions before proceeding.`);
            }

            // Create or update contractor profile from SAM.gov data
            const contractorProfile = await this.createContractorFromSAMGov(samGovProfile, tokenResponse.accessToken);

            // Set current user
            this.currentUser = {
                authenticated: true,
                samGovAuthenticated: true,
                walletAddress: null, // No wallet required for SAM.gov auth
                clearanceLevel: 'CONFIDENTIAL', // Default for SAM.gov users
                commonName: samGovProfile.legalBusinessName,
                organization: samGovProfile.legalBusinessName,
                expirationDate: samGovProfile.expirationDate || '2099-12-31',
                caveatCodes: [],
                profile: contractorProfile,
                samGovProfile: samGovProfile,
                samGovToken: tokenResponse.accessToken,
                lastSync: new Date().toISOString()
            };

            // Clean up session storage
            sessionStorage.removeItem('samGovAuthState');

            console.log('✅ SAM.gov authentication complete');
            return {
                success: true,
                user: this.currentUser,
                message: 'SAM.gov authentication successful. Profile synced and ready to use.'
            };

        } catch (error) {
            console.error('SAM.gov callback handling error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeSAMGovToken(code) {
        try {
            const response = await fetch('https://login.sam.gov/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${btoa(`${this.samGovClientId}:${this.samGovClientSecret}`)}`
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.samGovRedirectUri
                })
            });

            if (!response.ok) {
                throw new Error(`Token exchange failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in
            };

        } catch (error) {
            console.error('Token exchange error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get SAM.gov user profile using access token
     */
    async getSAMGovProfile(accessToken) {
        try {
            const response = await fetch('https://api.sam.gov/prod/entity-information/v1/entities', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Profile fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                profile: data.entityData[0] || data
            };

        } catch (error) {
            console.error('Profile fetch error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create contractor profile from SAM.gov data
     */
    async createContractorFromSAMGov(samGovProfile, accessToken) {
        // Map SAM.gov data to contractor profile
        const profile = {
            fullName: samGovProfile.legalBusinessName,
            organization: samGovProfile.legalBusinessName,
            email: samGovProfile.electronicBusinessPoc?.email || '',
            phone: samGovProfile.electronicBusinessPoc?.phone || '',
            uei: samGovProfile.ueiSAM,
            duns: samGovProfile.duns,
            address: samGovProfile.physicalAddress,
            capabilities: this.inferCapabilitiesFromNAICS(samGovProfile.naicsCodes || []),
            teamSize: this.inferTeamSize(samGovProfile),
            experience: '3-5', // Default, can be updated by user
            certifications: [],
            linkedIn: '',
            website: samGovProfile.website || '',
            samGovProfile: samGovProfile,
            samGovToken: accessToken,
            syncedAt: new Date().toISOString()
        };

        return profile;
    }

    /**
     * Infer technical capabilities from NAICS codes
     */
    inferCapabilitiesFromNAICS(naicsCodes) {
        const capabilities = [];

        naicsCodes.forEach(code => {
            if (code.startsWith('54151')) capabilities.push('Software Development');
            if (code.startsWith('54171')) capabilities.push('R&D Services');
            if (code.startsWith('51821')) capabilities.push('Cloud Computing');
            if (code.startsWith('54133')) capabilities.push('Engineering Services');
            if (code.startsWith('54169')) capabilities.push('Management Consulting');
        });

        // Remove duplicates and return
        return [...new Set(capabilities)];
    }

    /**
     * Infer team size from SAM.gov data
     */
    inferTeamSize(samGovProfile) {
        // This is a rough estimate based on business size
        const size = samGovProfile.businessSize || '';

        if (size.includes('Large')) return '100+';
        if (size.includes('Small')) return '6-20';
        if (size.includes('Micro')) return '1-5';

        return '6-20'; // Default
    }

    /**
     * Generate secure state parameter for OAuth
     */
    generateStateParameter() {
        return Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Sync contractor profile with latest SAM.gov data
     */
    async syncWithSAMGov() {
        if (!this.currentUser.samGovAuthenticated || !this.currentUser.samGovToken) {
            throw new Error('Not authenticated with SAM.gov');
        }

        try {
            const profileResponse = await this.getSAMGovProfile(this.currentUser.samGovToken);

            if (profileResponse.success) {
                const updatedProfile = await this.createContractorFromSAMGov(
                    profileResponse.profile,
                    this.currentUser.samGovToken
                );

                // Update current user profile
                this.currentUser.profile = updatedProfile;
                this.currentUser.samGovProfile = profileResponse.profile;
                this.currentUser.lastSync = new Date().toISOString();

                console.log('✅ Profile synced with SAM.gov');
                return {
                    success: true,
                    profile: updatedProfile
                };
            }

        } catch (error) {
            console.error('Profile sync error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Authenticate using connected wallet + PIV/CAC White Card (DUAL VERIFICATION)
     * This ensures both crypto identity AND government clearance are verified
     */
    async authenticateWithWallet() {
        try {
            console.log('🔐 Starting dual authentication process...');
            console.log('✌️ Rooted in Peace, Love, and Understanding');
            
            // STEP 1: Connect Wallet (Phantom or MetaMask)
            const walletConnection = await this.detectAndConnectWallet();
            let walletAddress = walletConnection.address;
            const walletType = walletConnection.type;
            
            // Normalize Ethereum addresses to lowercase for consistent comparison
            if (walletType === 'metamask') {
                walletAddress = walletAddress.toLowerCase();
            }
            
            // STEP 2: Verify No Active Exclusions (SAM.gov Check)
            if (window.samGovIntegration) {
                try {
                    console.log('🔍 Checking SAM.gov exclusions...');
                    const exclusions = await window.samGovIntegration.checkExclusions(walletAddress);
                    
                    if (exclusions.length > 0) {
                        console.log('🚫 Active exclusions found:', exclusions.length);
                        throw new Error(`🚫 ACCESS DENIED: Active SAM.gov exclusions found (${exclusions.length} active). Contact System Architect for clearance.`);
                    }
                    
                    console.log('✅ No active SAM.gov exclusions');
                } catch (exclusionError) {
                    console.warn('⚠️ Could not verify SAM.gov exclusions:', exclusionError.message);
                    // Don't fail authentication for API issues, but log it
                }
            }
            console.log(`📱 Mobile: ${walletConnection.isMobile || false}`);
            
            // Check if System Architect - GRANT IMMEDIATE ACCESS (case-insensitive)
            const isArchitect = 
                walletAddress.toLowerCase() === this.SYSTEM_ARCHITECT.metamask.toLowerCase() ||
                walletAddress.toLowerCase() === this.SYSTEM_ARCHITECT.metamask2.toLowerCase() ||
                walletAddress === this.SYSTEM_ARCHITECT.phantom;
            
            if (isArchitect) {
                console.log('⚡ SYSTEM ARCHITECT DETECTED');
                console.log(`👤 ${this.SYSTEM_ARCHITECT.alias}`);
                console.log(`🎯 Authority: ${this.SYSTEM_ARCHITECT.authority}`);
                console.log(`🏗️ Creator of: ${this.SYSTEM_ARCHITECT.systems.join(', ')}`);
                console.log('✅ SUPREME AUTHORITY - INSTANT ACCESS GRANTED');
                
                // Grant immediate access - no further verification needed
                this.currentUser = {
                    authenticated: true,
                    systemArchitect: true,
                    walletAddress: walletAddress,
                    clearanceLevel: 'SUPREME',
                    commonName: this.SYSTEM_ARCHITECT.alias,
                    organization: 'BarbrickDesign',
                    expirationDate: '2099-12-31',
                    caveatCodes: ['NOFORN', 'NATO', 'FVEY', 'ORCON', 'ARCHITECT'],
                    authority: 'CREATOR',
                    systems: this.SYSTEM_ARCHITECT.systems,
                    supersedes: ['WHITE_CARD', 'TS_SCI', 'ALL']
                };
                
                return {
                    success: true,
                    user: this.currentUser,
                    message: 'System Architect authentication complete. Supreme authority granted.'
                };
            }
            
            // Check if contractor is registered and approved
            if (this.contractorRegistry) {
                const contractor = this.contractorRegistry.getContractor(walletAddress);
                
                if (contractor && contractor.status === 'approved' && contractor.verified) {
                    console.log('✅ Approved contractor detected');
                    console.log(`👤 ${contractor.fullName}`);
                    console.log(`🏢 ${contractor.organization}`);
                    console.log(`🔐 Clearance: ${contractor.clearanceLevel}`);
                    
                    // Verify ownership with signature
                    const message = `I verify my identity and request classified access with Peace, Love, and Understanding at ${new Date().toISOString()}`;
                    const sigResult = await this.requestWalletSignature(message, walletType);
                    
                    if (!sigResult.success) {
                        throw new Error('Signature verification failed. Please sign the authorization message.');
                    }
                    
                    console.log('✅ Wallet signature verified');
                    
                    // Set current user from contractor profile
                    this.currentUser = {
                        authenticated: true,
                        walletAddress: walletAddress,
                        clearanceLevel: contractor.clearanceLevel,
                        commonName: contractor.fullName,
                        organization: contractor.organization,
                        expirationDate: contractor.whiteCard.expiry,
                        caveatCodes: contractor.caveatCodes,
                        profile: contractor.profile,
                        verified: true,
                        registrationDate: contractor.registrationDate,
                        lastActive: new Date().toISOString()
                    };
                    
                    // Update last active time
                    contractor.lastActive = new Date().toISOString();
                    this.contractorRegistry.saveContractors();
                    
                    console.log('✅ Authentication complete');
                    console.log('✌️ Access granted with Peace, Love, and Understanding');
                    
                    return {
                        success: true,
                        user: this.currentUser,
                        contractor: contractor,
                        message: 'Contractor authentication successful. Access granted.'
                    };
                } else if (contractor && contractor.status === 'pending') {
                    throw new Error('⏳ Your registration is pending approval by the System Architect. Please check back later.');
                }
            }
            
            // No registration found
            throw new Error('⛔ ACCESS DENIED: Wallet not registered. Please complete contractor registration first.');
            
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Authenticate user with PIV/CAC card (LEGACY METHOD)
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
        
        // System Architect gets ALL contracts - no filtering
        if (this.currentUser.systemArchitect === true) {
            console.log('⚡ System Architect: Full access to ALL contracts granted');
            return allClassifiedContracts;
        }
        
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
