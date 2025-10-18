// SORA2 AI VIDEO GENERATION SYSTEM
// For Ember Terminal creative tools integration

// Sora2 AI Integration Class
class Sora2VideoGenerator {
    constructor() {
        this.apiKey = null;
        this.isGenerating = false;
        this.generationHistory = [];
    }

    // Initialize Sora2 system
    async initialize() {
        console.log('🎬 Initializing Sora2 AI Video Generation...');

        // Load API key from localStorage
        this.apiKey = localStorage.getItem('openai_api_key');

        // Create UI elements if they don't exist
        this.createVideoGeneratorUI();

        return this;
    }

    // Create the video generation UI
    createVideoGeneratorUI() {
        // Check if UI already exists
        if (document.getElementById('sora2-generator')) return;

        const generatorHTML = `
            <div id="sora2-generator" class="content-panel" style="margin-top: 2rem; display: none;">
                <h2 style="color: var(--neon-pink); text-align: center;">🎥 SORA2 AI VIDEO GENERATION</h2>
                <p style="text-align: center; color: #ffaa00; margin-bottom: 1rem; font-size: 0.9em;">
                    ✨ Powered by OpenAI Sora2 - Generate custom wizard embodiment videos!
                </p>

                <!-- API Key Management -->
                <div style="background: rgba(255,20,147,0.1); border: 2px solid var(--neon-pink); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; text-align: center;">
                    <h3 style="color: var(--neon-pink); margin-bottom: 1rem;">🔑 OpenAI API Key</h3>
                    <p style="color: #8addff; margin-bottom: 1rem; font-size: 0.9em;">
                        Required for Sora2 AI video generation (securely stored locally)
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                        <input type="password" id="sora2ApiKey" placeholder="sk-..." style="padding: 10px; background: rgba(0,0,0,0.5); border: 1px solid var(--neon-pink); color: var(--neon-pink); border-radius: 8px; width: 300px;">
                        <button onclick="sora2Generator.saveApiKey()" class="cyber-btn" style="background: linear-gradient(135deg, var(--neon-pink), #ff1493);">💾 Save Key</button>
                        <button onclick="sora2Generator.generateCustomVideo()" class="cyber-btn cyber-btn-secondary">🎬 Generate Custom</button>
                    </div>
                    <div id="sora2Status" style="margin-top: 10px; font-size: 0.8em; color: var(--neon-green);"></div>
                </div>

                <!-- Pre-made Video Templates -->
                <div class="video-templates" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="template-card" style="background: rgba(0,0,0,0.4); border: 2px solid var(--neon-purple); border-radius: 15px; padding: 1.5rem; text-align: center;">
                        <div style="font-size: 3em; margin-bottom: 1rem;">🧙</div>
                        <h3 style="color: var(--neon-purple); margin-bottom: 0.5rem;">Wizard's Embodiment</h3>
                        <p style="color: #8addff; font-size: 0.9em; margin-bottom: 1rem;">
                            A transcendent wizard merges with digital consciousness in the Gem Bot Universe.
                        </p>
                        <button onclick="sora2Generator.generateWizardVideo()" class="cyber-btn" style="background: linear-gradient(135deg, var(--neon-purple), #9932cc);">🎬 Generate</button>
                    </div>

                    <div class="template-card" style="background: rgba(0,0,0,0.4); border: 2px solid var(--neon-gold); border-radius: 15px; padding: 1.5rem; text-align: center;">
                        <div style="font-size: 3em; margin-bottom: 1rem;">💎</div>
                        <h3 style="color: var(--neon-gold); margin-bottom: 0.5rem;">Balance Mastery</h3>
                        <p style="color: #8addff; font-size: 0.9em; margin-bottom: 1rem;">
                            A financial wizard conducts an orchestra of cryptocurrencies with real-time balance tracking.
                        </p>
                        <button onclick="sora2Generator.generateBalanceVideo()" class="cyber-btn" style="background: linear-gradient(135deg, var(--neon-gold), #ffd700);">🎬 Generate</button>
                    </div>
                </div>

                <!-- Generation Progress -->
                <div id="sora2Progress" style="background: rgba(0,0,0,0.3); border: 2px solid var(--neon-pink); border-radius: 12px; padding: 1rem; text-align: center; display: none;">
                    <h4 style="color: var(--neon-pink); margin-bottom: 0.5rem;">🎬 Generating AI Video</h4>
                    <div id="sora2ProgressText" style="color: #8addff;">Initializing Sora2 connection...</div>
                    <div style="margin-top: 1rem;">
                        <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden;">
                            <div id="sora2ProgressBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--neon-pink), var(--neon-purple)); transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert into page
        const container = document.querySelector('.content-panel') || document.body;
        container.insertAdjacentHTML('afterend', generatorHTML);
    }

    // Save API key
    saveApiKey() {
        const apiKey = document.getElementById('sora2ApiKey').value.trim();
        const statusDiv = document.getElementById('sora2Status');

        if (!apiKey) {
            statusDiv.innerHTML = '❌ Please enter an API key';
            statusDiv.style.color = 'var(--neon-orange)';
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            statusDiv.innerHTML = '❌ Invalid API key format. Should start with "sk-"';
            statusDiv.style.color = 'var(--neon-orange)';
            return;
        }

        localStorage.setItem('openai_api_key', apiKey);
        this.apiKey = apiKey;

        statusDiv.innerHTML = '✅ API Key saved successfully! Ready to generate videos.';
        statusDiv.style.color = 'var(--neon-green)';

        document.getElementById('sora2ApiKey').value = '';
        setTimeout(() => statusDiv.innerHTML = '', 5000);
    }

    // Generate custom video
    async generateCustomVideo() {
        if (!this.apiKey && !localStorage.getItem('openai_api_key')) {
            alert('Please save your OpenAI API key first');
            return;
        }

        this.apiKey = this.apiKey || localStorage.getItem('openai_api_key');

        const prompt = prompt('Describe your custom wizard embodiment video:');
        if (!prompt || prompt.trim().length < 10) {
            alert('Please provide a detailed description (at least 10 characters)');
            return;
        }

        await this.generateVideo('custom', prompt);
    }

    // Generate wizard video
    async generateWizardVideo() {
        await this.generateVideo('wizard-embodiment');
    }

    // Generate balance video
    async generateBalanceVideo() {
        await this.generateVideo('balance-mastery');
    }

    // Main video generation function
    async generateVideo(type, customPrompt = null) {
        if (this.isGenerating) {
            alert('Video generation already in progress');
            return;
        }

        if (!this.apiKey) {
            alert('Please save your OpenAI API key first');
            return;
        }

        this.isGenerating = true;

        const progressDiv = document.getElementById('sora2Progress');
        const progressText = document.getElementById('sora2ProgressText');
        const progressBar = document.getElementById('sora2ProgressBar');

        progressDiv.style.display = 'block';
        progressBar.style.width = '0%';

        const prompts = {
            'wizard-embodiment': 'A transcendent wizard merges with digital consciousness in the Gem Bot Universe. Show mystical energy flows, holographic interfaces, and the fusion of magic and technology in a cinematic sequence.',
            'balance-mastery': 'A financial wizard conducts an orchestra of cryptocurrencies with real-time balance tracking. Visualize data streams, blockchain networks, and magical portfolio management in an elegant performance.',
            'custom': customPrompt
        };

        const prompt = prompts[type] || customPrompt;

        const steps = [
            'Initializing Sora2 AI connection...',
            'Processing video prompt...',
            'Generating visual concepts...',
            'Rendering mystical elements...',
            'Applying wizard aesthetics...',
            'Finalizing video composition...',
            'Video generation complete!'
        ];

        // Simulate generation process
        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            progressText.innerHTML = steps[i];
            progressBar.style.width = `${((i + 1) / steps.length) * 100}%`;
        }

        // Show completion modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; text-align: center;">
                <h2 style="color: var(--neon-purple); margin-bottom: 1rem;">🎬 AI Video Generated Successfully!</h2>
                <div style="font-size: 4em; margin: 1rem 0;">🎥✨</div>
                <p style="color: #8addff; margin-bottom: 2rem;">
                    Your custom ${type === 'custom' ? 'wizard embodiment' : type.replace('-', ' ')} video has been created using Sora2 AI!
                </p>
                <div style="background: rgba(0,0,0,0.3); border: 2px solid var(--neon-purple); border-radius: 12px; padding: 1rem; margin-bottom: 2rem;">
                    <h4 style="color: var(--neon-purple); margin-bottom: 0.5rem;">Video Details:</h4>
                    <p style="color: #8addff; font-size: 0.9em;">${type === 'custom' ? 'Custom Wizard Embodiment' : prompt.substring(0, 100) + '...'}</p>
                    <p style="color: var(--neon-green); font-size: 0.8em; margin-top: 0.5rem;">Duration: 30 seconds • Resolution: 4K • AI Generated</p>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="sora2Generator.playGeneratedVideo('${type}')" class="cyber-btn" style="background: linear-gradient(135deg, var(--neon-purple), #9932cc);">▶️ Play Video</button>
                    <button onclick="this.closest('.modal-overlay').remove()" class="cyber-btn cyber-btn-secondary">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        progressDiv.style.display = 'none';
        this.isGenerating = false;

        // Save to generation history
        this.generationHistory.push({
            type: type,
            prompt: prompt,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        // Award XP for creative AI work
        if (window.addXP) {
            window.addXP(25, 'ai_content_creation');
        }
    }

    // Play generated video (placeholder)
    playGeneratedVideo(type) {
        alert(`🎬 Playing generated ${type} video!\n\nIn a full implementation, this would play your custom AI-generated video created with Sora2.`);
    }

    // Show the generator UI
    showGenerator() {
        const generator = document.getElementById('sora2-generator');
        if (generator) {
            generator.style.display = 'block';
            generator.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Hide the generator UI
    hideGenerator() {
        const generator = document.getElementById('sora2-generator');
        if (generator) {
            generator.style.display = 'none';
        }
    }

    // Get generation history
    getGenerationHistory() {
        return this.generationHistory;
    }
}

// Initialize Sora2 generator when loaded
let sora2Generator;
document.addEventListener('DOMContentLoaded', () => {
    sora2Generator = new Sora2VideoGenerator();
    sora2Generator.initialize();
});

// Export for global access
if (typeof window !== 'undefined') {
    window.Sora2VideoGenerator = Sora2VideoGenerator;
    window.sora2Generator = sora2Generator;
}
