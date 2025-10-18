/**
 * Sora2 Video Generation System for BarbrickDesign
 * Allows users to contribute API keys and generate wizard embodiment videos
 */

// Prevent redeclaration
if (typeof SoraVideoGenerator === 'undefined') {

class SoraVideoGenerator {
    constructor() {
        this.apiKey = null;
        this.generatedVideos = JSON.parse(localStorage.getItem('sora-generated-videos') || '[]');
        this.userApiKeys = JSON.parse(localStorage.getItem('user-api-keys') || '[]');
        this.wizardPrompts = this.getWizardPrompts();
    }

    /**
     * Initialize the video generator
     */
    init() {
        this.loadUserApiKey();
        this.setupUI();
        this.updateVideoGallery();
    }

    /**
     * Get predefined wizard embodiment prompts
     */
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

    /**
     * Set up the API key management UI
     */
    setupUI() {
        // Create API key modal
        this.createApiKeyModal();
        // Add generate buttons to existing video cards
        this.addGenerationButtons();
    }

    /**
     * Create the API key input modal
     */
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
                    max-width: 500px; color: #e4e4e4; box-shadow: 0 0 50px rgba(0,255,255,0.3);">
                    <h2 style="color: #ffd700; text-align: center; margin-bottom: 20px;">🔑 Sora2 API Key</h2>
                    <p style="color: #8addff; margin-bottom: 20px; line-height: 1.6;">
                        Contribute your OpenAI API key to help generate amazing wizard embodiment videos for the platform.
                        Your key will be stored locally and used only for video generation.
                    </p>
                    <input type="password" id="sora-api-key-input" placeholder="sk-..." style="
                        width: 100%; padding: 12px; margin-bottom: 20px; background: rgba(20,20,20,0.9);
                        border: 1px solid #ffd700; color: #ffd700; border-radius: 8px; font-family: monospace;">
                    <div style="display: flex; gap: 10px;">
                        <button id="sora-save-key" style="
                            flex: 1; background: linear-gradient(45deg, #ffd700, #ffaa00);
                            border: none; color: #000; padding: 12px; border-radius: 8px;
                            font-weight: bold; cursor: pointer;">Save Key</button>
                        <button id="sora-cancel-key" style="
                            flex: 1; background: rgba(255,255,255,0.1); border: 1px solid #8addff;
                            color: #8addff; padding: 12px; border-radius: 8px; cursor: pointer;">Cancel</button>
                    </div>
                    <div style="margin-top: 15px; font-size: 0.8em; color: #cccccc; text-align: center;">
                        Keys are stored locally only. Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" style="color: #ffd700;">platform.openai.com</a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('sora-save-key').addEventListener('click', () => this.saveApiKey());
        document.getElementById('sora-cancel-key').addEventListener('click', () => this.hideApiModal());
    }

    /**
     * Add generation buttons to video cards
     */
    addGenerationButtons() {
        const videoCards = document.querySelectorAll('.video-card');
        videoCards.forEach((card, index) => {
            const title = card.querySelector('h3').textContent;
            const button = document.createElement('button');
            button.className = 'cyber-btn sora-generate-btn';
            button.textContent = '🎬 Generate with Sora2';
            button.style.cssText = `
                margin-top: 10px; width: 100%; background: linear-gradient(45deg, #ff00ff, #00ffff);
                border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer;
                font-family: 'Orbitron', sans-serif; font-size: 0.8em;
            `;
            button.addEventListener('click', () => this.generateVideoForCard(title));
            card.appendChild(button);
        });
    }

    /**
     * Show the API key modal
     */
    showApiModal() {
        document.getElementById('sora-api-modal').style.display = 'flex';
        document.getElementById('sora-api-key-input').focus();
    }

    /**
     * Hide the API key modal
     */
    hideApiModal() {
        document.getElementById('sora-api-modal').style.display = 'none';
        document.getElementById('sora-api-key-input').value = '';
    }

    /**
     * Save the API key
     */
    saveApiKey() {
        const key = document.getElementById('sora-api-key-input').value.trim();
        if (!key.startsWith('sk-')) {
            alert('❌ Invalid API key format. OpenAI keys start with "sk-"');
            return;
        }

        this.apiKey = key;
        this.userApiKeys.push({
            key: key,
            added: new Date().toISOString(),
            user: 'current-user' // Could be enhanced with user identification
        });
        localStorage.setItem('user-api-keys', JSON.stringify(this.userApiKeys));
        this.hideApiModal();
        alert('✅ API key saved! You can now generate videos.');
    }

    /**
     * Load saved API key
     */
    loadUserApiKey() {
        if (this.userApiKeys.length > 0) {
            this.apiKey = this.userApiKeys[this.userApiKeys.length - 1].key;
        }
    }

    /**
     * Generate video for a specific card
     */
    async generateVideoForCard(title) {
        if (!this.apiKey) {
            this.showApiModal();
            return;
        }

        // Find the prompt for this video
        const promptKey = Object.keys(this.wizardPrompts).find(key =>
            this.wizardPrompts[key].title === title
        );

        if (!promptKey) {
            alert('❌ No prompt found for this video');
            return;
        }

        const promptData = this.wizardPrompts[promptKey];
        await this.generateVideo(promptData.prompt, promptData.duration, promptData.size, title);
    }

    /**
     * Generate a video using Sora2 API
     */
    async generateVideo(prompt, duration, size, title) {
        try {
            console.log('🎬 Generating video:', title);

            // Show loading state
            this.showLoading(title);

            // Make API call to Sora2
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

            // Poll for completion
            await this.pollVideoStatus(data.id, title);

        } catch (error) {
            console.error('Video generation failed:', error);
            alert(`❌ Video generation failed: ${error.message}`);
            this.hideLoading();
        }
    }

    /**
     * Poll for video generation status
     */
    async pollVideoStatus(videoId, title) {
        const maxAttempts = 60; // 10 minutes max
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

                // Wait 10 seconds before next poll
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

    /**
     * Download and save the generated video
     */
    async downloadAndSaveVideo(videoId, title) {
        try {
            const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            const blob = await response.blob();

            // Convert blob to base64 for localStorage (limited size)
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

    /**
     * Save generated video to localStorage
     */
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

    /**
     * Update the video gallery with generated videos
     */
    updateVideoGallery() {
        const videoCards = document.querySelectorAll('.video-card');

        this.generatedVideos.forEach(video => {
            // Find the corresponding card
            const card = Array.from(videoCards).find(card =>
                card.querySelector('h3').textContent === video.title
            );

            if (card) {
                // Replace iframe with generated video
                const iframe = card.querySelector('iframe');
                if (iframe) {
                    const videoElement = document.createElement('video');
                    videoElement.src = video.data;
                    videoElement.controls = true;
                    videoElement.style.width = '100%';
                    videoElement.style.maxHeight = '200px';
                    iframe.parentNode.replaceChild(videoElement, iframe);
                }

                // Update description to show it's generated
                const desc = card.querySelector('p');
                if (desc) {
                    desc.textContent += ' (Generated with Sora2 AI)';
                    desc.style.color = '#00ff00';
                }
            }
        });
    }

    /**
     * Show loading state
     */
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

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('sora-loading');
        if (loading) loading.remove();
    }

    /**
     * Get generated videos
     */
    getGeneratedVideos() {
        return this.generatedVideos;
    }

    /**
     * Clear all generated videos
     */
    clearGeneratedVideos() {
        this.generatedVideos = [];
        localStorage.removeItem('sora-generated-videos');
        this.updateVideoGallery();
    }
}

// Global instance
window.soraVideoGenerator = new SoraVideoGenerator();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.soraVideoGenerator) {
        window.soraVideoGenerator.init();
    }
});

} // End of redeclaration prevention
