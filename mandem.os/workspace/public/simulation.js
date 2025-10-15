/**
 * Gem Bot Simulation - 3D Faceting Machine Visualization
 * Realistic representation of automated gem cutting with dop stick and grinding wheel
 */

class FacetingMachineSimulation {
  constructor(containerId) {
    this.container = document.getElementById(containerId) || document.body;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.dopStick = null;
    this.gemStone = null;
    this.grindingWheel = null;
    this.machine = null;
    
    // Machine components
    this.xAxisRail = null;
    this.yAxisRail = null;
    this.wheelMotor = null;
    
    // Animation
    this.animationId = null;
    this.isRunning = false;
    
    // FacetProcessor instance
    this.processor = new FacetProcessor();
    
    this.init();
  }
  
  init() {
    if (typeof THREE === 'undefined') {
      console.error('[Simulation] THREE.js not loaded');
      return;
    }
    
    this.setupScene();
    this.createMachine();
    this.createLighting();
    this.setupControls();
    this.animate();
    
    console.log('[Simulation] Faceting machine initialized');
  }
  
  setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 50, 200);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(80, 60, 80);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Resize handler
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  createMachine() {
    const machineGroup = new THREE.Group();
    
    // Machine base (heavy steel platform)
    const baseGeometry = new THREE.BoxGeometry(100, 5, 60);
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2c3e50,
      metalness: 0.8,
      roughness: 0.3
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2.5;
    base.castShadow = true;
    base.receiveShadow = true;
    machineGroup.add(base);
    
    // Y-Axis Rail (vertical column)
    const yRailGeometry = new THREE.CylinderGeometry(3, 3, 80, 16);
    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x34495e,
      metalness: 0.9,
      roughness: 0.2
    });
    this.yAxisRail = new THREE.Mesh(yRailGeometry, railMaterial);
    this.yAxisRail.position.set(-30, 40, 0);
    this.yAxisRail.castShadow = true;
    machineGroup.add(this.yAxisRail);
    
    // X-Axis Rail (horizontal arm)
    const xRailGeometry = new THREE.BoxGeometry(70, 4, 4);
    this.xAxisRail = new THREE.Mesh(xRailGeometry, railMaterial);
    this.xAxisRail.position.set(0, 50, 0);
    this.xAxisRail.castShadow = true;
    machineGroup.add(this.xAxisRail);
    
    // Create Dop Stick Assembly
    this.createDopStick(machineGroup);
    
    // Create Grinding Wheel
    this.createGrindingWheel(machineGroup);
    
    // Control Panel
    this.createControlPanel(machineGroup);
    
    this.machine = machineGroup;
    this.scene.add(machineGroup);
  }
  
  createDopStick(parent) {
    const dopGroup = new THREE.Group();
    
    // Dop stick holder (moves on X/Y axes)
    const holderGeometry = new THREE.BoxGeometry(6, 8, 6);
    const holderMaterial = new THREE.MeshStandardMaterial({
      color: 0x7f8c8d,
      metalness: 0.7,
      roughness: 0.3
    });
    const holder = new THREE.Mesh(holderGeometry, holderMaterial);
    holder.castShadow = true;
    dopGroup.add(holder);
    
    // Dop stick (metal rod)
    const stickGeometry = new THREE.CylinderGeometry(0.5, 0.5, 40, 16);
    const stickMaterial = new THREE.MeshStandardMaterial({
      color: 0x95a5a6,
      metalness: 0.9,
      roughness: 0.1
    });
    const stick = new THREE.Mesh(stickGeometry, stickMaterial);
    stick.position.y = -24;
    stick.castShadow = true;
    dopGroup.add(stick);
    
    // Gem stone at tip of dop stick
    const gemGeometry = new THREE.OctahedronGeometry(3, 0);
    const gemMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4fc3f7,
      metalness: 0,
      roughness: 0,
      transparent: true,
      opacity: 0.9,
      transmission: 0.9,
      thickness: 1,
      clearcoat: 1.0,
      clearcoatRoughness: 0
    });
    this.gemStone = new THREE.Mesh(gemGeometry, gemMaterial);
    this.gemStone.position.y = -44;
    this.gemStone.castShadow = true;
    dopGroup.add(this.gemStone);
    
    // Position dop assembly
    dopGroup.position.set(0, 50, 0);
    
    this.dopStick = dopGroup;
    parent.add(dopGroup);
  }
  
  createGrindingWheel(parent) {
    const wheelGroup = new THREE.Group();
    
    // Wheel motor housing
    const motorGeometry = new THREE.CylinderGeometry(8, 10, 12, 32);
    const motorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      metalness: 0.8,
      roughness: 0.3
    });
    this.wheelMotor = new THREE.Mesh(motorGeometry, motorMaterial);
    this.wheelMotor.castShadow = true;
    wheelGroup.add(this.wheelMotor);
    
    // Grinding wheel (disk with lap surface)
    const wheelGeometry = new THREE.CylinderGeometry(20, 20, 3, 64);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Start with coarse lap color
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide
    });
    this.grindingWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    this.grindingWheel.position.y = 7.5;
    this.grindingWheel.castShadow = true;
    this.grindingWheel.receiveShadow = true;
    wheelGroup.add(this.grindingWheel);
    
    // Add lap surface texture rings
    for (let i = 0; i < 5; i++) {
      const ringGeometry = new THREE.TorusGeometry(4 + i * 3, 0.2, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,
        metalness: 0.4,
        roughness: 0.6
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.y = 9;
      ring.rotation.x = Math.PI / 2;
      wheelGroup.add(ring);
    }
    
    // Position wheel assembly
    wheelGroup.position.set(35, 10, 0);
    wheelGroup.rotation.x = Math.PI / 2;
    
    parent.add(wheelGroup);
  }
  
  createControlPanel(parent) {
    // Control panel box
    const panelGeometry = new THREE.BoxGeometry(25, 30, 3);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      metalness: 0.6,
      roughness: 0.4
    });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(-40, 20, -28);
    panel.castShadow = true;
    parent.add(panel);
    
    // Screen (displays cutting info)
    const screenGeometry = new THREE.PlaneGeometry(18, 12);
    const screenMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a472a,
      emissive: 0x0f3d1a,
      emissiveIntensity: 0.5
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(-40, 25, -26.4);
    parent.add(screen);
    
    // Buttons (simulated controls)
    const buttonColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
    for (let i = 0; i < 4; i++) {
      const buttonGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
      const buttonMaterial = new THREE.MeshStandardMaterial({
        color: buttonColors[i],
        emissive: buttonColors[i],
        emissiveIntensity: 0.3
      });
      const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
      button.position.set(-40 + (i - 1.5) * 4, 12, -26.4);
      button.rotation.x = Math.PI / 2;
      parent.add(button);
    }
  }
  
  createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Main spotlight on machine
    const spotlight1 = new THREE.SpotLight(0xffffff, 1.5);
    spotlight1.position.set(50, 80, 50);
    spotlight1.castShadow = true;
    spotlight1.shadow.mapSize.width = 2048;
    spotlight1.shadow.mapSize.height = 2048;
    spotlight1.angle = Math.PI / 4;
    spotlight1.penumbra = 0.3;
    this.scene.add(spotlight1);
    
    // Secondary light
    const spotlight2 = new THREE.SpotLight(0xffffff, 0.8);
    spotlight2.position.set(-50, 60, -30);
    spotlight2.castShadow = true;
    this.scene.add(spotlight2);
    
    // Grinding wheel highlight
    const pointLight = new THREE.PointLight(0xffa500, 0.6, 50);
    pointLight.position.set(35, 10, 0);
    this.scene.add(pointLight);
  }
  
  setupControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.minDistance = 30;
      this.controls.maxDistance = 200;
    }
  }
  
  // Move dop stick on X/Y axes
  moveDopStick(x, y) {
    if (!this.dopStick) return;
    
    // X-axis movement (left-right)
    this.dopStick.position.x = THREE.MathUtils.clamp(x, -30, 30);
    
    // Y-axis movement (up-down / toward wheel)
    // Y=50 is raised, Y=10 is near wheel surface
    this.dopStick.position.y = THREE.MathUtils.clamp(y, 10, 70);
    
    console.log(`[Simulation] Dop moved to X:${this.dopStick.position.x.toFixed(2)}, Y:${this.dopStick.position.y.toFixed(2)}`);
  }
  
  // Change grinding wheel lap color
  changeLapColor(lapType) {
    if (!this.grindingWheel || !this.processor) return;
    
    const color = this.processor.lapColors[lapType];
    if (color) {
      this.grindingWheel.material.color.set(color);
      console.log(`[Simulation] Changed to ${lapType} lap (${this.processor.lapGrits[lapType]} grit)`);
    }
  }
  
  // Rotate grinding wheel
  rotateWheel(speed = 1) {
    if (!this.grindingWheel) return;
    this.grindingWheel.rotation.y += speed * 0.1;
  }
  
  // Rotate gem stone index
  rotateGemIndex(angle) {
    if (!this.gemStone) return;
    this.gemStone.rotation.y = (angle * Math.PI) / 180;
  }
  
  // Automated cutting sequence
  async startAutomatedCutting(designKey) {
    const design = this.processor.loadDesign(designKey);
    if (!design) {
      console.error('[Simulation] Design not found:', designKey);
      return;
    }
    
    console.log('[Simulation] Starting automated cutting:', design.name);
    this.isRunning = true;
    
    for (const facet of design.facets) {
      if (!this.isRunning) break;
      
      console.log(`[Simulation] Cutting facet: ${facet.cut} at ${facet.angle}° / ${facet.index} index`);
      
      // Change lap
      this.changeLapColor(facet.lap);
      
      // Rotate to index position
      this.rotateGemIndex(facet.index);
      
      // Raise dop stick
      await this.animateMove(this.dopStick.position.y, 60, 500);
      
      // Move to cutting position
      const angleRad = (facet.index * Math.PI) / 180;
      const xPos = Math.sin(angleRad) * 15;
      await this.animateMove(this.dopStick.position.x, xPos, 300);
      
      // Lower to wheel
      await this.animateMove(this.dopStick.position.y, 12, 800);
      
      // Cut (dwell)
      await this.delay(1500);
      
      // Raise
      await this.animateMove(this.dopStick.position.y, 60, 500);
    }
    
    console.log('[Simulation] Cutting complete!');
    this.isRunning = false;
  }
  
  // Smooth animation helper
  animateMove(currentVal, targetVal, duration) {
    return new Promise(resolve => {
      const startTime = Date.now();
      const startVal = currentVal;
      const delta = targetVal - startVal;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.easeInOutCubic(progress);
        
        const newVal = startVal + delta * easedProgress;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }
  
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  stopCutting() {
    this.isRunning = false;
    console.log('[Simulation] Cutting stopped');
  }
  
  // Animation loop
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Rotate wheel if machine is running
    if (this.isRunning) {
      this.rotateWheel(2);
    } else {
      this.rotateWheel(0.1); // Slow idle rotation
    }
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }
  
  // Manual controls for testing
  manualMoveX(delta) {
    if (!this.dopStick) return;
    this.dopStick.position.x += delta;
    this.dopStick.position.x = THREE.MathUtils.clamp(this.dopStick.position.x, -30, 30);
  }
  
  manualMoveY(delta) {
    if (!this.dopStick) return;
    this.dopStick.position.y += delta;
    this.dopStick.position.y = THREE.MathUtils.clamp(this.dopStick.position.y, 10, 70);
  }
  
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FacetingMachineSimulation;
} else {
  window.FacetingMachineSimulation = FacetingMachineSimulation;
}
