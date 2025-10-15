/**
 * Faceting Machine Initialization
 * Sets up the complete faceting machine system with 3D visualization and controls
 */

(function() {
  'use strict';
  
  let facetingMachine = null;
  let facetingControls = null;
  let isInitialized = false;
  
  // Wait for dependencies to load
  function waitForDependencies() {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (typeof THREE !== 'undefined' && 
            typeof FacetProcessor !== 'undefined' && 
            typeof FacetingMachineSimulation !== 'undefined' &&
            typeof FacetingControls !== 'undefined') {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }
  
  // Initialize the faceting machine system
  async function initFacetingMachine(containerId = 'faceting-container') {
    if (isInitialized) {
      console.warn('[FacetingMachine] Already initialized');
      return { machine: facetingMachine, controls: facetingControls };
    }
    
    console.log('[FacetingMachine] Waiting for dependencies...');
    await waitForDependencies();
    
    console.log('[FacetingMachine] Initializing system...');
    
    // Create container if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.cssText = `
        position: fixed;
        top: 70px;
        left: 0;
        width: 100%;
        height: calc(100vh - 70px);
        z-index: 1;
      `;
      document.body.appendChild(container);
    }
    
    // Initialize the 3D simulation
    facetingMachine = new FacetingMachineSimulation(containerId);
    
    // Initialize the control panel
    facetingControls = new FacetingControls(facetingMachine);
    
    // Set up keyboard controls
    setupKeyboardControls();
    
    // Add help overlay
    createHelpOverlay();
    
    isInitialized = true;
    console.log('[FacetingMachine] Initialization complete');
    
    return { machine: facetingMachine, controls: facetingControls };
  }
  
  // Keyboard controls for manual operation
  function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
      if (!facetingMachine || !facetingMachine.dopStick) return;
      
      const moveSpeed = 2;
      
      switch(e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          facetingMachine.manualMoveX(-moveSpeed);
          break;
        case 'arrowright':
        case 'd':
          facetingMachine.manualMoveX(moveSpeed);
          break;
        case 'arrowup':
        case 'w':
          facetingMachine.manualMoveY(moveSpeed);
          break;
        case 'arrowdown':
        case 's':
          facetingMachine.manualMoveY(-moveSpeed);
          break;
        case 'q':
          facetingMachine.rotateGemIndex(facetingMachine.gemStone.rotation.y * (180 / Math.PI) - 15);
          break;
        case 'e':
          facetingMachine.rotateGemIndex(facetingMachine.gemStone.rotation.y * (180 / Math.PI) + 15);
          break;
      }
      
      // Update control panel display
      if (facetingControls) {
        facetingControls.updateDisplay();
      }
    });
  }
  
  // Create help overlay
  function createHelpOverlay() {
    const helpBtn = document.createElement('button');
    helpBtn.textContent = '❓';
    helpBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgba(0, 255, 153, 0.9);
      color: #000;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 255, 153, 0.5);
      z-index: 1500;
      transition: transform 0.2s;
    `;
    
    helpBtn.addEventListener('mouseenter', () => {
      helpBtn.style.transform = 'scale(1.1)';
    });
    
    helpBtn.addEventListener('mouseleave', () => {
      helpBtn.style.transform = 'scale(1)';
    });
    
    helpBtn.addEventListener('click', () => {
      showHelpModal();
    });
    
    document.body.appendChild(helpBtn);
  }
  
  // Show help modal with instructions
  function showHelpModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
      animation: fadeIn 0.3s;
    `;
    
    modal.innerHTML = `
      <div style="background: linear-gradient(135deg, #1a1a1a, #2c3e50); padding: 40px; border-radius: 15px; border: 3px solid #00ff99; max-width: 700px; color: #fff; font-family: 'Orbitron', Arial, sans-serif; box-shadow: 0 10px 40px rgba(0, 255, 153, 0.4);">
        <h2 style="margin-top: 0; color: #00ff99; text-align: center; font-size: 28px;">
          🔬 Faceting Machine Guide
        </h2>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #21f3c7; font-size: 18px; margin-bottom: 10px;">🎮 Keyboard Controls</h3>
          <div style="background: rgba(0, 255, 153, 0.1); padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.8;">
            <div><strong>W / ↑</strong> - Raise dop stick (Y-axis up)</div>
            <div><strong>S / ↓</strong> - Lower dop stick (Y-axis down)</div>
            <div><strong>A / ←</strong> - Move dop stick left (X-axis)</div>
            <div><strong>D / →</strong> - Move dop stick right (X-axis)</div>
            <div><strong>Q</strong> - Rotate index counter-clockwise</div>
            <div><strong>E</strong> - Rotate index clockwise</div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #21f3c7; font-size: 18px; margin-bottom: 10px;">⚙️ Machine Components</h3>
          <div style="background: rgba(0, 255, 153, 0.1); padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.8;">
            <div><strong>Dop Stick:</strong> Holds the gem stone at the tip</div>
            <div><strong>X-Axis:</strong> Moves dop stick horizontally</div>
            <div><strong>Y-Axis:</strong> Raises/lowers stone toward wheel</div>
            <div><strong>Grinding Wheel:</strong> Rotating disk with colored laps</div>
            <div><strong>Laps:</strong> Different colors = different grits</div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #21f3c7; font-size: 18px; margin-bottom: 10px;">💎 Grinding Laps (Grit Levels)</h3>
          <div style="background: rgba(0, 255, 153, 0.1); padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.8;">
            <div><span style="display: inline-block; width: 15px; height: 15px; background: #8B4513; margin-right: 8px; border-radius: 3px;"></span><strong>Brown</strong> - Coarse (80 grit)</div>
            <div><span style="display: inline-block; width: 15px; height: 15px; background: #A0522D; margin-right: 8px; border-radius: 3px;"></span><strong>Sienna</strong> - Medium (260 grit)</div>
            <div><span style="display: inline-block; width: 15px; height: 15px; background: #CD853F; margin-right: 8px; border-radius: 3px;"></span><strong>Peru</strong> - Fine (600 grit)</div>
            <div><span style="display: inline-block; width: 15px; height: 15px; background: #DEB887; margin-right: 8px; border-radius: 3px;"></span><strong>Tan</strong> - Pre-Polish (1200 grit)</div>
            <div><span style="display: inline-block; width: 15px; height: 15px; background: #F5F5DC; margin-right: 8px; border-radius: 3px;"></span><strong>Beige</strong> - Polish (3000 grit)</div>
          </div>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #21f3c7; font-size: 18px; margin-bottom: 10px;">🤖 Automated Cutting</h3>
          <div style="background: rgba(0, 255, 153, 0.1); padding: 15px; border-radius: 8px; font-size: 14px; line-height: 1.8;">
            <div>1. Select a design from the dropdown</div>
            <div>2. Click "Start Automated Cut"</div>
            <div>3. Watch as the machine cuts each facet</div>
            <div>4. Machine mirrors real physical movements</div>
          </div>
        </div>
        
        <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; padding: 15px; background: #00ff99; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 16px; margin-top: 20px; font-family: 'Orbitron', Arial, sans-serif;">
          Got it! Let's Cut Some Gems 💎
        </button>
      </div>
    `;
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    document.body.appendChild(modal);
  }
  
  // Export to global scope
  window.initFacetingMachine = initFacetingMachine;
  
  // Auto-initialize if on laboratory page
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (window.location.pathname.includes('laboratory')) {
        initFacetingMachine();
      }
    });
  } else {
    if (window.location.pathname.includes('laboratory')) {
      initFacetingMachine();
    }
  }
})();
