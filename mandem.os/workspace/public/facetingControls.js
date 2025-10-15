/**
 * Faceting Machine Control Interface
 * Manual and automated control panel for gem cutting
 */

class FacetingControls {
  constructor(simulation) {
    this.simulation = simulation;
    this.processor = simulation.processor;
    this.controlPanel = null;
    this.init();
  }
  
  init() {
    this.createControlPanel();
    this.attachEventListeners();
    this.updateDisplay();
    console.log('[FacetingControls] Control panel initialized');
  }
  
  createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'faceting-controls';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      width: 320px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 20px;
      border-radius: 12px;
      font-family: 'Orbitron', Arial, sans-serif;
      box-shadow: 0 4px 20px rgba(0, 255, 153, 0.3);
      border: 2px solid #00ff99;
      z-index: 1000;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    panel.innerHTML = `
      <h2 style="margin: 0 0 15px 0; color: #00ff99; font-size: 18px; text-align: center; border-bottom: 2px solid #00ff99; padding-bottom: 10px;">
        🔬 Faceting Machine Control
      </h2>
      
      <!-- Design Selection -->
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; color: #21f3c7; font-size: 13px; font-weight: bold;">
          Select Design:
        </label>
        <select id="design-selector" style="width: 100%; padding: 8px; background: #1a1a1a; color: #fff; border: 1px solid #00ff99; border-radius: 5px; font-family: inherit;">
          <option value="">-- Choose Design --</option>
        </select>
      </div>
      
      <!-- Design Info -->
      <div id="design-info" style="background: rgba(0, 255, 153, 0.1); padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 12px; display: none;">
        <div><strong>Facets:</strong> <span id="facet-count">0</span></div>
        <div><strong>Gem Type:</strong> <span id="gem-type">-</span></div>
        <div><strong>Est. Time:</strong> <span id="est-time">0</span> min</div>
      </div>
      
      <!-- Automated Controls -->
      <div style="margin-bottom: 15px;">
        <h3 style="color: #21f3c7; font-size: 14px; margin-bottom: 8px;">Automated Cutting</h3>
        <button id="start-auto-btn" style="width: 100%; padding: 10px; background: #00ff99; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-bottom: 5px; font-family: inherit;">
          ▶ Start Automated Cut
        </button>
        <button id="stop-auto-btn" style="width: 100%; padding: 10px; background: #ff4444; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: inherit;">
          ⏹ Stop
        </button>
      </div>
      
      <!-- Progress Bar -->
      <div id="progress-container" style="margin-bottom: 15px; display: none;">
        <div style="background: rgba(0, 255, 153, 0.2); border-radius: 10px; overflow: hidden; height: 25px; position: relative;">
          <div id="progress-bar" style="background: linear-gradient(90deg, #00ff99, #21f3c7); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
          <div id="progress-text" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: bold; color: #000; text-shadow: 0 0 5px #fff;">0%</div>
        </div>
        <div id="current-operation" style="margin-top: 5px; font-size: 11px; color: #00ff99; text-align: center;">Ready</div>
      </div>
      
      <!-- Manual Controls -->
      <div style="margin-bottom: 15px;">
        <h3 style="color: #21f3c7; font-size: 14px; margin-bottom: 8px;">Manual Control</h3>
        
        <!-- X-Axis -->
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 3px; font-size: 11px;">X-Axis (Left/Right)</label>
          <div style="display: flex; gap: 5px;">
            <button class="axis-btn" data-axis="x" data-delta="-5" style="flex: 1; padding: 8px; background: #34495e; color: #fff; border: 1px solid #00ff99; border-radius: 4px; cursor: pointer;">◀ Left</button>
            <button class="axis-btn" data-axis="x" data-delta="5" style="flex: 1; padding: 8px; background: #34495e; color: #fff; border: 1px solid #00ff99; border-radius: 4px; cursor: pointer;">Right ▶</button>
          </div>
          <div style="text-align: center; font-size: 10px; color: #888; margin-top: 3px;">Position: <span id="x-pos">0.00</span> mm</div>
        </div>
        
        <!-- Y-Axis -->
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 3px; font-size: 11px;">Y-Axis (Up/Down - Stone to Wheel)</label>
          <div style="display: flex; gap: 5px;">
            <button class="axis-btn" data-axis="y" data-delta="5" style="flex: 1; padding: 8px; background: #34495e; color: #fff; border: 1px solid #00ff99; border-radius: 4px; cursor: pointer;">▲ Raise</button>
            <button class="axis-btn" data-axis="y" data-delta="-5" style="flex: 1; padding: 8px; background: #34495e; color: #fff; border: 1px solid #00ff99; border-radius: 4px; cursor: pointer;">Lower ▼</button>
          </div>
          <div style="text-align: center; font-size: 10px; color: #888; margin-top: 3px;">Height: <span id="y-pos">50.00</span> mm</div>
        </div>
        
        <!-- Lap Selection -->
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 3px; font-size: 11px;">Grinding Lap (Grit)</label>
          <select id="lap-selector" style="width: 100%; padding: 6px; background: #1a1a1a; color: #fff; border: 1px solid #00ff99; border-radius: 4px; font-size: 11px;">
            <option value="coarse">Coarse (80 grit)</option>
            <option value="medium">Medium (260 grit)</option>
            <option value="fine">Fine (600 grit)</option>
            <option value="prePolish">Pre-Polish (1200 grit)</option>
            <option value="polish">Polish (3000 grit)</option>
          </select>
        </div>
        
        <!-- Index Rotation -->
        <div>
          <label style="display: block; margin-bottom: 3px; font-size: 11px;">Index Rotation</label>
          <div style="display: flex; gap: 5px;">
            <button class="rotate-btn" data-angle="-15" style="flex: 1; padding: 8px; background: #34495e; color: #fff; border: 1px solid #00ff99; border-radius: 4px; cursor: pointer;">↶ -15°</button>
            <button class="rotate-btn" data-angle="15" style="flex: 1; padding: 8px; background: #34495e; color: #fff; border: 1px solid #00ff99; border-radius: 4px; cursor: pointer;">15° ↷</button>
          </div>
          <div style="text-align: center; font-size: 10px; color: #888; margin-top: 3px;">Angle: <span id="index-angle">0</span>°</div>
        </div>
      </div>
      
      <!-- Custom Design -->
      <div>
        <h3 style="color: #21f3c7; font-size: 14px; margin-bottom: 8px;">Custom Design</h3>
        <button id="custom-design-btn" style="width: 100%; padding: 10px; background: #6c5ce7; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-family: inherit;">
          ✨ Create Custom Design
        </button>
      </div>
      
      <!-- Machine Status -->
      <div style="margin-top: 15px; padding: 10px; background: rgba(33, 243, 199, 0.1); border-radius: 8px; border: 1px solid #21f3c7;">
        <div style="font-size: 11px;">
          <div><strong>Status:</strong> <span id="machine-status" style="color: #00ff99;">Idle</span></div>
          <div><strong>Wheel Speed:</strong> <span id="wheel-speed">0</span> RPM</div>
          <div><strong>Current Lap:</strong> <span id="current-lap">Coarse</span></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.controlPanel = panel;
    
    // Populate design selector
    this.populateDesignSelector();
  }
  
  populateDesignSelector() {
    const selector = document.getElementById('design-selector');
    const designs = this.processor.getDesignList();
    
    designs.forEach(design => {
      const option = document.createElement('option');
      option.value = design.key;
      option.textContent = `${design.name} (${design.facetCount} facets)`;
      selector.appendChild(option);
    });
  }
  
  attachEventListeners() {
    // Design selection
    document.getElementById('design-selector').addEventListener('change', (e) => {
      this.onDesignSelect(e.target.value);
    });
    
    // Automated controls
    document.getElementById('start-auto-btn').addEventListener('click', () => {
      this.startAutomatedCutting();
    });
    
    document.getElementById('stop-auto-btn').addEventListener('click', () => {
      this.simulation.stopCutting();
      this.hideProgress();
    });
    
    // Manual axis controls
    document.querySelectorAll('.axis-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const axis = e.target.dataset.axis;
        const delta = parseFloat(e.target.dataset.delta);
        this.moveAxis(axis, delta);
      });
    });
    
    // Lap selection
    document.getElementById('lap-selector').addEventListener('change', (e) => {
      this.simulation.changeLapColor(e.target.value);
      this.updateDisplay();
    });
    
    // Index rotation
    document.querySelectorAll('.rotate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const angle = parseFloat(e.target.dataset.angle);
        this.rotateIndex(angle);
      });
    });
    
    // Custom design
    document.getElementById('custom-design-btn').addEventListener('click', () => {
      this.openCustomDesignModal();
    });
  }
  
  onDesignSelect(designKey) {
    if (!designKey) {
      document.getElementById('design-info').style.display = 'none';
      return;
    }
    
    const design = this.processor.loadDesign(designKey);
    if (design) {
      document.getElementById('facet-count').textContent = design.facets.length;
      document.getElementById('gem-type').textContent = design.gemType;
      document.getElementById('est-time').textContent = design.estimatedTime;
      document.getElementById('design-info').style.display = 'block';
    }
  }
  
  async startAutomatedCutting() {
    const designKey = document.getElementById('design-selector').value;
    if (!designKey) {
      alert('Please select a design first');
      return;
    }
    
    this.showProgress();
    document.getElementById('machine-status').textContent = 'Running';
    document.getElementById('machine-status').style.color = '#00ff99';
    
    // Start cutting with progress callback
    const design = this.processor.loadDesign(designKey);
    let facetIndex = 0;
    
    for (const facet of design.facets) {
      const progress = ((facetIndex + 1) / design.facets.length) * 100;
      this.updateProgress(progress, `Cutting: ${facet.cut}`);
      
      // Update machine display
      document.getElementById('current-lap').textContent = this.capitalizeFirst(facet.lap);
      document.getElementById('wheel-speed').textContent = '1500';
      
      facetIndex++;
    }
    
    // Start actual simulation
    await this.simulation.startAutomatedCutting(designKey);
    
    this.updateProgress(100, 'Complete!');
    document.getElementById('machine-status').textContent = 'Idle';
    document.getElementById('wheel-speed').textContent = '0';
    
    setTimeout(() => this.hideProgress(), 3000);
  }
  
  moveAxis(axis, delta) {
    if (axis === 'x') {
      this.simulation.manualMoveX(delta);
      document.getElementById('x-pos').textContent = this.simulation.dopStick.position.x.toFixed(2);
    } else if (axis === 'y') {
      this.simulation.manualMoveY(delta);
      document.getElementById('y-pos').textContent = this.simulation.dopStick.position.y.toFixed(2);
    }
  }
  
  rotateIndex(angle) {
    const current = parseFloat(document.getElementById('index-angle').textContent);
    const newAngle = (current + angle) % 360;
    document.getElementById('index-angle').textContent = newAngle;
    this.simulation.rotateGemIndex(newAngle);
  }
  
  showProgress() {
    document.getElementById('progress-container').style.display = 'block';
  }
  
  hideProgress() {
    document.getElementById('progress-container').style.display = 'none';
  }
  
  updateProgress(percent, operation) {
    document.getElementById('progress-bar').style.width = percent + '%';
    document.getElementById('progress-text').textContent = Math.round(percent) + '%';
    document.getElementById('current-operation').textContent = operation;
  }
  
  updateDisplay() {
    const state = this.processor.getMachineState();
    document.getElementById('x-pos').textContent = state.dopStickPosition.x.toFixed(2);
    document.getElementById('y-pos').textContent = state.dopStickPosition.y.toFixed(2);
    document.getElementById('current-lap').textContent = this.capitalizeFirst(state.currentLap);
  }
  
  openCustomDesignModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;
    
    modal.innerHTML = `
      <div style="background: #1a1a1a; padding: 30px; border-radius: 12px; border: 2px solid #00ff99; max-width: 500px; color: #fff; font-family: 'Orbitron', Arial, sans-serif;">
        <h2 style="margin-top: 0; color: #00ff99;">Create Custom Design</h2>
        <p style="font-size: 13px; color: #aaa;">Define your own facet pattern for unique gem cuts</p>
        
        <label style="display: block; margin-top: 15px; margin-bottom: 5px;">Design Name:</label>
        <input type="text" id="custom-name" placeholder="e.g., My Special Cut" style="width: 100%; padding: 8px; background: #2c3e50; color: #fff; border: 1px solid #00ff99; border-radius: 4px;">
        
        <label style="display: block; margin-top: 15px; margin-bottom: 5px;">Gem Type:</label>
        <input type="text" id="custom-gem-type" placeholder="e.g., Diamond, Sapphire" style="width: 100%; padding: 8px; background: #2c3e50; color: #fff; border: 1px solid #00ff99; border-radius: 4px;">
        
        <label style="display: block; margin-top: 15px; margin-bottom: 5px;">JSON Facet Data:</label>
        <textarea id="custom-facets" placeholder='[{"angle": 40.75, "index": 96, "cut": "pavilion_main", "lap": "coarse"}]' rows="6" style="width: 100%; padding: 8px; background: #2c3e50; color: #fff; border: 1px solid #00ff99; border-radius: 4px; font-family: monospace; font-size: 11px;"></textarea>
        
        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button id="save-custom-btn" style="flex: 1; padding: 10px; background: #00ff99; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Save Design</button>
          <button id="cancel-custom-btn" style="flex: 1; padding: 10px; background: #95a5a6; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('save-custom-btn').addEventListener('click', () => {
      const name = document.getElementById('custom-name').value;
      const gemType = document.getElementById('custom-gem-type').value;
      const facetsJSON = document.getElementById('custom-facets').value;
      
      try {
        const facets = JSON.parse(facetsJSON);
        const key = this.processor.createCustomDesign(name, facets, gemType);
        alert(`Custom design "${name}" created successfully!`);
        this.populateDesignSelector();
        document.getElementById('design-selector').value = key;
        this.onDesignSelect(key);
        document.body.removeChild(modal);
      } catch (e) {
        alert('Invalid JSON format. Please check your facet data.');
      }
    });
    
    document.getElementById('cancel-custom-btn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FacetingControls;
} else {
  window.FacetingControls = FacetingControls;
}
