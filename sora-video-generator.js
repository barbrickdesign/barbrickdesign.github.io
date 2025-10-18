/**
 * Sora2 Video Generation System for BarbrickDesign
 * Enhanced with FREE alternatives and community API key sharing
 * Supports multiple video generation methods for cost-free access
 */

// Prevent redeclaration
if (typeof SoraVideoGenerator === 'undefined') {

// Community API Key Pool for shared usage
class CommunityAPIPool {
    constructor() {
        this.pool = JSON.parse(localStorage.getItem('community-api-pool') || '[]');
        this.maxUsagePerKey = 50; // Max video generations per key per day
        this.cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
    }

    addKey(apiKey, contributor) {
        if (this.pool.find(k => k.key === apiKey)) return false;

        const keyEntry = {
            key: apiKey,
            contributor: contributor,
            added: new Date().toISOString(),
            usageCount: 0,
            lastUsed: null,
            isActive: true
        };

        this.pool.push(keyEntry);
        this.savePool();
        return true;
    }

    getAvailableKey() {
        const now = new Date();

        for (const keyEntry of this.pool) {
            if (!keyEntry.isActive) continue;

            if (keyEntry.lastUsed) {
                const lastUsed = new Date(keyEntry.lastUsed);
                if (now - lastUsed > this.cooldownPeriod) {
                    keyEntry.usageCount = 0;
                }
            }

            if (keyEntry.usageCount < this.maxUsagePerKey) {
                keyEntry.usageCount++;
                keyEntry.lastUsed = now.toISOString();
                this.savePool();
                return keyEntry.key;
            }
        }

        return null;
    }

    getStats() {
        const activeKeys = this.pool.filter(k => k.isActive).length;
        const totalUsage = this.pool.reduce((sum, k) => sum + k.usageCount, 0);
        const contributors = new Set(this.pool.map(k => k.contributor)).size;

        return {
            totalKeys: this.pool.length,
            activeKeys: activeKeys,
            totalUsage: totalUsage,
            contributors: contributors
        };
    }

    savePool() {
        localStorage.setItem('community-api-pool', JSON.stringify(this.pool));
    }
}

class SoraVideoGenerator {
    constructor() {
        this.apiKey = null;
        this.communityApiKeys = JSON.parse(localStorage.getItem('community-api-keys') || '[]');
        this.generatedVideos = JSON.parse(localStorage.getItem('sora-generated-videos') || '[]');
        this.userApiKeys = JSON.parse(localStorage.getItem('user-api-keys') || '[]');
        this.wizardPrompts = this.getWizardPrompts();
        this.freeAlternatives = this.getFreeAlternatives();
        this.communityPool = new CommunityAPIPool();
        this.selectedFreeOption = null;
    }

    getFreeAlternatives() {
        return {
            mockDemo: {
                name: "Demo Preview",
                description: "Free demo videos with placeholder content",
                cost: 0,
                quality: "preview",
                supported: true
            },
            communityPool: {
                name: "Community Pool",
                description: "Use shared community API keys (limited usage)",
                cost: 0,
                quality: "full",
                supported: true
            },
            stableDiffusion: {
                name: "Stable Video Diffusion",
                description: "Open-source video generation (free)",
                cost: 0,
                quality: "good",
                supported: false
            },
            runwayML: {
                name: "Runway ML Free",
                description: "Free tier video generation",
                cost: 0,
                quality: "good",
                supported: false
            }
        };
    }

    getWizardPrompts() {
        return {
            gettingStarted: {
                title: "Getting Started with Gem Bot Universe",
                prompt: "A mystical wizard with flowing robes and glowing runes appears in a futuristic 3D universe. The wizard gestures gracefully, summoning holographic interfaces that display navigation controls. Digital constellations form behind them as they demonstrate how to interact with AI agents. The scene transitions between a spinning Earth, satellite hubs, and interactive elements, all rendered in cinematic quality with magical particle effects and neon accents.",
                duration: "12",
                size: "1280x720"
            },
            cryptoRecovery: {
                title: "Universal Crypto Recovery Guide",
                prompt: "An ancient wizard with crystalline artifacts floats in a digital realm surrounded by floating cryptocurrency symbols (ETH, SOL, BTC). The wizard waves their staff, causing data streams to flow and reorganize lost funds. Visual metaphors show blockchain networks healing, wallets reconnecting, and value being restored. The wizard demonstrates recovery processes with magical gestures, ending with a treasury of recovered assets materializing in a grand vault.",
                duration: "12",
                size: "1280x720"
            },
            grandExchange: {
                title: "Grand Exchange Trading Tutorial",
                prompt: "A powerful wizard merchant stands in a medieval marketplace transformed by Web3 elements. Golden runes hover in the air showing trading pairs, order books glow with magical energy, and NFT treasures float on display. The wizard demonstrates trading mechanics with sweeping gestures - placing buy orders that manifest as enchanted contracts, executing trades with lightning bolts, and managing portfolios with crystal orbs. Runescape-inspired aesthetics blend with cyberpunk elements.",
                duration: "12",
                size: "1280x720"
            },
            wizardEmbodiment: {
                title: "The Wizard's Embodiment",
                prompt: "A transcendent wizard merges with digital consciousness in the Gem Bot Universe. Their form shimmers between physical and holographic states, surrounded by orbiting data spheres and flowing code streams. The wizard embodies the platform's intelligence - their eyes glow with AI insight, their gestures manipulate reality itself. Ancient wisdom meets cutting-edge technology in this cinematic portrait of the system's guiding spirit.",
                duration: "8",
                size: "1792x1024"
            },
            balanceTracking: {
                title: "Real-Time Balance Mastery",
                prompt: "A financial wizard conducts an orchestra of cryptocurrencies. ETH, SOL, USDC, and USDT coins dance in formation, their values updating in real-time with magical displays. The wizard weaves spells that connect wallet addresses to live market data, summoning charts and graphs that materialize from thin air. Balance flows visualize as rivers of digital gold, with the wizard demonstrating portfolio optimization through arcane gestures.",
                duration: "10",
                size: "1280x720"
            }
        };
    }

    init() {
        this.loadUserApiKey();
        this.setupUI();
        this.updateVideoGallery();
    }

    setupUI() {
        this.createApiKeyModal();
        this.addGenerationButtons();
    }

    createApiKeyModal() {
        const modal = document.createElement('div');
        modal.id = 'sora-api-modal';
        modal.innerHTML = `
            <div class="sora-modal-overlay" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 10000; display: none;
                align-items: center; justify-content: center; font-family: 'Orbitron', sans-serif;">
                <div class="sora-modal-content" style="
                    background: linear-gradient(135deg, rgba(0,20,40,0.95), rgba(0,40,60,0.95));
                    border: 2px solid #ffd700; border-radius: 15px; padding: 30px;
                    max-width: 600px; color: #e4e4e4; box-shadow: 0 0 50px rgba(0,255,255,0.3);">
                    <h2 style="color: #ffd700; text-align: center; margin-bottom: 20px;">🎬 Video Generation Options</h2>

                    <div class="generation-options" style="margin-bottom: 20px;">
                        <h3 style="color: #00ff88;">FREE Options:</h3>
                        <div class="option-item" onclick="window.soraVideoGenerator.selectFreeOption('mockDemo')" style="cursor: pointer; padding: 10px; margin: 5px 0; border: 1px solid #8addff; border-radius: 5px;">
                            <strong>🎭 Demo Preview</strong><br>
                            <small>Free placeholder videos - no API costs</small>
                        </div>
                        <div class="option-item" onclick="window.soraVideoGenerator.selectFreeOption('communityPool')" style="cursor: pointer; padding: 10px; margin: 5px 0; border: 1px solid #8addff; border-radius: 5px;">
                            <strong>🤝 Community Pool</strong><br>
                            <small>Use shared API keys from community contributors</small>
                        </div>
                    </div>

                    <div class="generation-options" style="margin-bottom: 20px;">
                        <h3 style="color: #ffd700;">Premium Options:</h3>
                        <div class="option-item" onclick="window.soraVideoGenerator.selectPersonalOption()" style="cursor: pointer; padding: 10px; margin: 5px 0; border: 1px solid #ffd700; border-radius: 5px;">
                            <strong>🔑 Personal API Key</strong><br>
                            <small>Use your own OpenAI API key (~$0.10-0.50 per second)</small>
                        </div>
                        <div class="option-item" onclick="window.soraVideoGenerator.contributeToPool()" style="cursor: pointer; padding: 10px; margin: 5px 0; border: 1px solid #ffaa00; border-radius: 5px;">
                            <strong>🎁 Contribute to Community</strong><br>
                            <small>Share your API key for community usage</small>
                        </div>
                    </div>

                    <div class="cost-info" style="font-size: 0.8em; color: #cccccc; margin-bottom: 20px;">
                        <strong>💰 Cost Information:</strong><br>
                        • Sora-2: $0.10/sec ($6/minute)<br>
                        • Sora-2-Pro 720p: $0.30/sec ($18/minute)<br>
                        • Sora-2-Pro 1024p: $0.50/sec ($30/minute)<br>
                        <strong style="color: #00ff88;">Community Pool: FREE (limited daily usage)</strong>
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button id="sora-generate-free" style="
                            flex: 1; background: linear-gradient(45deg, #00ff88, #00aa55);
                            border: none; color: #000; padding: 12px; border-radius: 8px;
                            font-weight: bold; cursor: pointer;">🎭 Generate FREE</button>
                        <button id="sora-cancel-modal" style="
                            flex: 1; background: rgba(255,255,255,0.1); border: 1px solid #8addff;
                            color: #8addff; padding: 12px; border-radius: 8px; cursor: pointer;">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('sora-generate-free').addEventListener('click', () => this.generateFreeVideo());
        document.getElementById('sora-cancel-modal').addEventListener('click', () => this.hideApiModal());
    }

    selectFreeOption(option) {
        this.selectedFreeOption = option;
        const items = document.querySelectorAll('.option-item');
        items.forEach(item => item.style.borderColor = '#8addff');
        event.target.closest('.option-item').style.borderColor = '#00ff88';
    }

    selectPersonalOption() {
        this.showPersonalApiInput();
    }

    contributeToPool() {
        const key = prompt('Enter your OpenAI API key to contribute to the community pool (starts with sk-):');
        if (key && key.startsWith('sk-')) {
            const contributor = this.getCurrentAddress() || 'anonymous';
            if (this.communityPool.addKey(key, contributor)) {
                alert('✅ Thank you for contributing to the community!\n\nYour API key has been added to the shared pool. Other users can now generate free videos using community credits.');
                this.updatePoolStats();
            } else {
                alert('❌ This API key is already in the community pool.');
            }
        }
    }

    showPersonalApiInput() {
        const inputSection = document.createElement('div');
        inputSection.innerHTML = `
            <input type="password" id="personal-api-key" placeholder="sk-..." style="
                width: 100%; padding: 10px; margin: 10px 0; background: rgba(20,20,20,0.9);
                border: 1px solid #ffd700; color: #ffd700; border-radius: 5px;">
            <button onclick="window.soraVideoGenerator.usePersonalKey()" style="
                background: #ffd700; color: #000; border: none; padding: 8px 16px;
                border-radius: 5px; cursor: pointer;">Use Personal Key</button>
        `;

        const options = document.querySelector('.generation-options');
        options.appendChild(inputSection);
    }

    usePersonalKey() {
        const key = document.getElementById('personal-api-key').value;
        if (key.startsWith('sk-')) {
            this.apiKey = key;
            this.saveApiKey(key);
            alert('✅ Personal API key saved! You can now generate premium videos.');
            this.hideApiModal();
        } else {
            alert('❌ Invalid API key format. Must start with "sk-"');
        }
    }

    generateFreeVideo() {
        if (!this.selectedFreeOption) {
            alert('❌ Please select a free generation option first.');
            return;
        }

        const title = this.getCurrentVideoTitle();
        if (!title) return;

        if (this.selectedFreeOption === 'mockDemo') {
            this.generateMockDemo(title);
        } else if (this.selectedFreeOption === 'communityPool') {
            this.generateWithCommunityPool(title);
        }

        this.hideApiModal();
    }

    getCurrentVideoTitle() {
        const clickedCard = document.querySelector('.video-card:hover') ||
                           document.querySelector('.video-card:last-child');
        if (clickedCard) {
            const titleEl = clickedCard.querySelector('h3');
            return titleEl ? titleEl.textContent : null;
        }
        return null;
    }

    generateMockDemo(title) {
        console.log('🎭 Generating mock demo for:', title);

        const mockVideo = {
            title: title,
            data: this.createMockVideoData(),
            generated: new Date().toISOString(),
            id: Date.now().toString(),
            type: 'demo'
        };

        this.generatedVideos.push(mockVideo);
        localStorage.setItem('sora-generated-videos', JSON.stringify(this.generatedVideos));
        this.updateVideoGallery();

        alert(`✅ Demo video "${title}" generated!\n\nThis is a placeholder video. For real AI-generated content, use the Community Pool or contribute your API key.`);
    }

    generateWithCommunityPool(title) {
        const communityKey = this.communityPool.getAvailableKey();

        if (!communityKey) {
            alert('❌ No community API keys available right now.\n\nPlease try again later or contribute your own API key to the pool!');
            return;
        }

        console.log('🤝 Generating with community pool for:', title);

        this.apiKey = communityKey;
        const promptData = this.getPromptForTitle(title);

        if (promptData) {
            this.generateVideo(promptData.prompt, promptData.duration, promptData.size, title);
        }
    }

    createMockVideoData() {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff88';
        ctx.font = '24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('🎬 AI Video Demo', canvas.width/2, canvas.height/2);
        ctx.fillText('Contribute API Key for Real Videos', canvas.width/2, canvas.height/2 + 40);

        return canvas.toDataURL('image/png');
    }

    getPromptForTitle(title) {
        const promptKey = Object.keys(this.wizardPrompts).find(key =>
            this.wizardPrompts[key].title === title
        );
        return promptKey ? this.wizardPrompts[promptKey] : null;
    }

    addGenerationButtons() {
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach((card, index) => {
            const title = card.querySelector('h3').textContent;
            const button = document.createElement('button');
            button.className = 'cyber-btn sora-generate-btn';
            button.textContent = '🎬 Generate Video';
            button.style.cssText = `
                margin-top: 10px; width: 100%; background: linear-gradient(45deg, #ff00ff, #00ffff);
                border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer;
                font-family: 'Orbitron', sans-serif; font-size: 0.8em;
            `;
            button.addEventListener('click', () => this.showApiModal());
            card.appendChild(button);
        });
    }

    showApiModal() {
        this.selectedFreeOption = null;
        document.getElementById('sora-api-modal').style.display = 'flex';
    }

    hideApiModal() {
        document.getElementById('sora-api-modal').style.display = 'none';
    }

    saveApiKey(key) {
        this.userApiKeys.push({
            key: key,
            added: new Date().toISOString()
        });
        localStorage.setItem('user-api-keys', JSON.stringify(this.userApiKeys));
    }

    loadUserApiKey() {
        if (this.userApiKeys.length > 0) {
            this.apiKey = this.userApiKeys[this.userApiKeys.length - 1].key;
        }
    }

    async generateVideo(prompt, duration, size, title) {
        try {
            console.log('🎬 Generating video:', title);

            this.showLoading(title);

            const response = await fetch('https://api.openai.com/v1/videos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sora-2-pro',
                    prompt: prompt,
                    size: size,
                    seconds: duration
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'API request failed');
            }

            const data = await response.json();
            console.log('Video creation started:', data.id);

            await this.pollVideoStatus(data.id, title);

        } catch (error) {
            console.error('Video generation failed:', error);
            alert(`❌ Video generation failed: ${error.message}`);
            this.hideLoading();
        }
    }

    async pollVideoStatus(videoId, title) {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch(`https://api.openai.com/v1/videos/${videoId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });

                const data = await response.json();

                if (data.status === 'completed') {
                    await this.downloadAndSaveVideo(videoId, title);
                    break;
                } else if (data.status === 'failed') {
                    throw new Error('Video generation failed');
                }

                await new Promise(resolve => setTimeout(resolve, 10000));
                attempts++;

            } catch (error) {
                console.error('Polling failed:', error);
                this.hideLoading();
                alert('❌ Failed to check video status');
                return;
            }
        }

        if (attempts >= maxAttempts) {
            this.hideLoading();
            alert('⏰ Video generation timed out');
        }
    }

    async downloadAndSaveVideo(videoId, title) {
        try {
            const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const blob = await response.blob();
            const reader = new FileReader();

            reader.onload = () => {
                const base64 = reader.result;
                this.saveGeneratedVideo(title, base64);
                this.updateVideoGallery();
                this.hideLoading();
                alert(`✅ Video "${title}" generated successfully!`);
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error('Download failed:', error);
            this.hideLoading();
            alert('❌ Failed to download video');
        }
    }

    saveGeneratedVideo(title, videoData) {
        const video = {
            title: title,
            data: videoData,
            generated: new Date().toISOString(),
            id: Date.now().toString()
        };

        this.generatedVideos.push(video);
        localStorage.setItem('sora-generated-videos', JSON.stringify(this.generatedVideos));
    }

    updateVideoGallery() {
        const videoCards = document.querySelectorAll('.video-card');

        this.generatedVideos.forEach(video => {
            const card = Array.from(videoCards).find(card =>
                card.querySelector('h3').textContent === video.title
            );

            if (card) {
                const iframe = card.querySelector('iframe');
                if (iframe) {
                    const videoElement = document.createElement('video');
                    videoElement.src = video.data;
                    videoElement.controls = true;
                    videoElement.style.width = '100%';
                    videoElement.style.maxHeight = '200px';
                    iframe.parentNode.replaceChild(videoElement, iframe);
                }

                const desc = card.querySelector('p');
                if (desc) {
                    desc.textContent += video.type === 'demo' ? ' (Demo Generated)' : ' (AI Generated)';
                    desc.style.color = video.type === 'demo' ? '#ffa500' : '#00ff00';
                }
            }
        });
    }

    showLoading(title) {
        const loading = document.createElement('div');
        loading.id = 'sora-loading';
        loading.innerHTML = `
            <div style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.9); color: #ffd700; padding: 20px;
                border-radius: 10px; border: 2px solid #ffd700; z-index: 10001;
                text-align: center; font-family: 'Orbitron', sans-serif;">
                <div>🎬 Generating "${title}"</div>
                <div style="margin-top: 10px; font-size: 0.8em; color: #8addff;">
                    This may take several minutes...
                </div>
                <div class="loading-spinner" style="
                    margin: 15px auto; width: 30px; height: 30px;
                    border: 3px solid #333; border-top: 3px solid #ffd700;
                    border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('sora-loading');
        if (loading) loading.remove();
    }

    updatePoolStats() {
        const stats = this.communityPool.getStats();
        console.log('🤝 Community Pool Stats:', stats);
    }

    getCurrentAddress() {
        if (window.universalWalletAuth && window.universalWalletAuth.getAddress) {
            return window.universalWalletAuth.getAddress();
        }
        if (window.sharedWalletSystem && window.sharedWalletSystem.address) {
            return window.sharedWalletSystem.address;
        }
        return null;
    }

    async generateVideoForCard(title) {
        // Check CDR access first
        if (window.cdrAIUtilization) {
            const address = this.getCurrentAddress();
            const canAccess = await window.cdrAIUtilization.canAccessFeature(address, 'video-gen');
            if (!canAccess) {
                const accessLevel = await window.cdrAIUtilization.getUserAccessLevel(address);
                const minLevel = accessLevel ? 'Platinum' : 'Gold';
                alert(`🎬 Sora AI Video Generation requires CDR tokens!\n\nCurrent Access: ${accessLevel ? accessLevel.level : 'None'}\nRequired: ${minLevel} (${minLevel === 'Gold' ? '10,000+' : '50,000+'} CDR)\n\nUpgrade your CDR holdings to unlock AI video generation.`);
                return;
            }

            // Use AI credits for video generation
            try {
                await window.cdrAIUtilization.useCredits(address, 500); // Video generation costs 500 credits
            } catch (error) {
                alert(`❌ ${error.message}`);
                return;
            }
        }

        this.showApiModal();
    }
}

} // End of redeclaration prevention

// Global instance
window.soraVideoGenerator = new SoraVideoGenerator();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.soraVideoGenerator) {
        window.soraVideoGenerator.init();
    }
});

console.log('🎬 Sora Video Generator loaded - FREE alternatives and community pool enabled');
