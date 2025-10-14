// Remove the following lines:
// import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// ...existing code...
// At the top, add:
const THREE = window.THREE;
const OrbitControls = window.OrbitControls || (window.THREE && window.THREE.OrbitControls);
// ...existing code...

// Import TVDisplay class
const TVDisplay = window.TVDisplay;

let scene, camera, renderer, controls;
let floor, walls = [], ceiling;
let tradingBooths = [];
let centralStructure;
let displayBoards = [];
let portals = []; 
let raycaster, mouse;
let tvDisplays = [];
let holographicDisplays = [];

const exchangeWidth = 100;
const exchangeLength = 100;
const exchangeHeight = 30;

// Error handling function
function showError(message) {
    console.error(message);
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = "Error: " + message;
        errorDiv.style.display = 'block';
    }
}

// Log startup
console.log("Starting Grand Exchange Trade Center scene...");

function init() {
    try {
        // --- Basic Setup ---
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000011); // Dark blue-black background for high-tech feel
        console.log("Scene created");

        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, exchangeHeight * 0.8, exchangeLength * 0.6); 
        console.log("Camera created");

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true; 
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);
        console.log("Renderer created");

        // --- Orbit Controls ---
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 10, 0);
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.minDistance = 10;
        controls.maxDistance = 100;
        console.log("Controls created");

        // --- Lighting ---
        const ambientLight = new THREE.AmbientLight(0x222244, 0.5); // Cool ambient lighting
        scene.add(ambientLight);

        // Multiple directional lights with different colors
        const colors = [0x0044ff, 0x00ffcc, 0xffffff];
        
        colors.forEach((color, index) => {
            const directionalLight = new THREE.DirectionalLight(color, 0.5);
            const angle = (index / colors.length) * Math.PI * 2;
            directionalLight.position.set(Math.sin(angle) * 30, 40, Math.cos(angle) * 30);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 150;
            directionalLight.shadow.camera.left = -exchangeLength / 2;
            directionalLight.shadow.camera.right = exchangeLength / 2;
            directionalLight.shadow.camera.top = exchangeWidth / 2;
            directionalLight.shadow.camera.bottom = -exchangeWidth / 2;
            scene.add(directionalLight);
        });
        
        console.log("Lighting created");

        // --- Raycaster for interaction ---
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // --- Create Scene Elements ---
        createExchangeRoom();
        createCentralHub();
        createTradingBooths();
        createHolographicDisplays();
        createDigitalDisplayBoards();
        createPortals();
        createAmbientEffects();
        console.log("Scene elements created");

        // --- Event Listeners ---
        window.addEventListener('resize', onWindowResize, false);
        window.addEventListener('click', onMouseClick, false);
        window.addEventListener('mousemove', onMouseMove, false);

        // --- Start Animation ---
        animate();
        console.log("Animation started");
    } catch (error) {
        showError(error.message || "Unknown error in initialization");
        console.error("Initialization error:", error);
    }
}

// --- Geometry Creation Functions ---

function createExchangeRoom() {
    console.log("Creating exchange room...");
    
    // Floor - Glossy reflective surface with grid lines
    const floorGeometry = new THREE.CircleGeometry(exchangeWidth / 2, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x003366,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1.0,
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Add grid lines to floor
    const gridHelper = new THREE.GridHelper(exchangeWidth, 100, 0x0088ff, 0x004488);
    gridHelper.position.y = 0.01; // Slightly above floor
    scene.add(gridHelper);

    // Create a curved, dome ceiling
    const ceilingGeometry = new THREE.SphereGeometry(exchangeWidth / 2, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x000033,
        emissive: 0x000011,
        emissiveIntensity: 0.2,
        side: THREE.BackSide,
        metalness: 0.3,
        roughness: 0.7
    });
    ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.y = exchangeHeight;
    ceiling.rotation.x = Math.PI;
    scene.add(ceiling);
    
    // Create a circular wall
    const wallGeometry = new THREE.CylinderGeometry(exchangeWidth / 2, exchangeWidth / 2, exchangeHeight, 64, 1, true);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x001133,
        metalness: 0.7,
        roughness: 0.3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = exchangeHeight / 2;
    wall.receiveShadow = true;
    scene.add(wall);
    walls.push(wall);
    
    // Add digital circuit pattern to walls
    addCircuitPattern(wall);
}

function addCircuitPattern(object) {
    // Create random circuit-like patterns
    const circuitGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    
    const color = new THREE.Color();
    const lineCount = 200;
    
    for (let i = 0; i < lineCount; i++) {
        // Generate a starting point on the cylinder
        const theta = Math.random() * Math.PI * 2;
        const y = Math.random() * exchangeHeight;
        
        const x1 = Math.cos(theta) * (exchangeWidth / 2 - 0.1);
        const z1 = Math.sin(theta) * (exchangeWidth / 2 - 0.1);
        
        // Create branching circuit lines
        createCircuitBranch(x1, y, z1, vertices, colors, 0, 10);
    }
    
    circuitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    circuitGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const circuitMaterial = new THREE.LineBasicMaterial({ 
        vertexColors: true,
        linewidth: 1
    });
    
    const circuitLines = new THREE.LineSegments(circuitGeometry, circuitMaterial);
    scene.add(circuitLines);
}

function createCircuitBranch(x, y, z, vertices, colors, depth, maxDepth) {
    if (depth >= maxDepth) return;
    
    // Select a color based on depth
    const hue = (depth / maxDepth) * 0.3 + 0.6; // Blue to cyan range
    const color = new THREE.Color().setHSL(hue, 1, 0.5 + Math.random() * 0.5);
    
    // Choose a random direction with constraints
    const length = 1 + Math.random() * 3;
    const dx = (Math.random() - 0.5) * 2;
    const dy = (Math.random() - 0.5) * 2;
    const dz = (Math.random() - 0.5) * 2;
    
    // Normalize and scale
    const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const nx = (dx / mag) * length;
    const ny = (dy / mag) * length;
    const nz = (dz / mag) * length;
    
    // Add line segment
    vertices.push(x, y, z);
    vertices.push(x + nx, y + ny, z + nz);
    
    colors.push(color.r, color.g, color.b);
    colors.push(color.r, color.g, color.b);
    
    // Randomly create a branch
    if (Math.random() < 0.6) {
        createCircuitBranch(x + nx, y + ny, z + nz, vertices, colors, depth + 1, maxDepth);
    }
    
    // Randomly create another branch
    if (Math.random() < 0.4) {
        createCircuitBranch(x + nx, y + ny, z + nz, vertices, colors, depth + 1, maxDepth);
    }
}

function createCentralHub() {
    console.log("Creating central hub...");
    
    // Create a central hub group
    const hubGroup = new THREE.Group();
    
    // Central column
    const columnGeometry = new THREE.CylinderGeometry(5, 8, exchangeHeight, 16);
    const columnMaterial = new THREE.MeshStandardMaterial({
        color: 0x001144,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x000066,
        emissiveIntensity: 0.2
    });
    
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.y = exchangeHeight / 2;
    column.castShadow = true;
    hubGroup.add(column);
    
    // Add rings around the column
    for (let i = 0; i < 5; i++) {
        const ringGeometry = new THREE.TorusGeometry(8 + i * 2, 0.5, 16, 100);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaff,
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.3
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = 5 + i * 5;
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = true;
        hubGroup.add(ring);
        
        // Add animation data to the ring
        ring.userData = {
            rotationSpeed: 0.005 * (i % 2 === 0 ? 1 : -1),
            pulseSpeed: 0.02 + i * 0.001,
            pulseTime: Math.random() * Math.PI * 2
        };
    }
    
    // Add floating platforms around the column
    const platformCount = 4;
    for (let i = 0; i < platformCount; i++) {
        const angle = (i / platformCount) * Math.PI * 2;
        const radius = 15;
        
        const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 8);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x66aaff,
            metalness: 0.7,
            roughness: 0.2
        });
        
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(
            Math.cos(angle) * radius,
            5 + i * 6,
            Math.sin(angle) * radius
        );
        platform.castShadow = true;
        hubGroup.add(platform);
        
        // Add a holographic display on each platform
        const holoSize = 2;
        const holoGeometry = new THREE.SphereGeometry(holoSize, 32, 32);
        const holoMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.7
        });
        
        const holo = new THREE.Mesh(holoGeometry, holoMaterial);
        holo.position.set(
            Math.cos(angle) * radius,
            5 + i * 6 + 3,
            Math.sin(angle) * radius
        );
        holo.userData = { 
            type: 'hologram',
            pulseSpeed: 0.03,
            pulseTime: Math.random() * Math.PI * 2
        };
        hubGroup.add(holo);
        holographicDisplays.push(holo);
    }
    
    centralStructure = hubGroup;
    scene.add(centralStructure);
}

function createTradingBooth(radius, angle) {
    const boothGroup = new THREE.Group();
    
    // Base platform
    const baseGeometry = new THREE.CylinderGeometry(3, 3.5, 0.5, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x444466,
        metalness: 0.7,
        roughness: 0.3
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    boothGroup.add(base);
    
    // Counter/desk
    const counterGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 8);
    const counterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3366cc,
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0x0033cc,
        emissiveIntensity: 0.1
    });
    
    const counter = new THREE.Mesh(counterGeometry, counterMaterial);
    counter.position.y = 1.2;
    counter.castShadow = true;
    boothGroup.add(counter);
    
    // Holographic display
    const displayGeometry = new THREE.CylinderGeometry(1.5, 1.5, 2, 16, 1, true);
    const displayMaterial = new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        emissive: 0x0088ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    
    const display = new THREE.Mesh(displayGeometry, displayMaterial);
    display.position.y = 2.2;
    display.userData = { 
        type: 'terminal',
        rotationSpeed: 0.01,
        interactive: true,
        pulseSpeed: 0.02,
        pulseTime: Math.random() * Math.PI * 2
    };
    boothGroup.add(display);
    holographicDisplays.push(display);
    
    // Position the booth in the exchange
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    boothGroup.position.set(x, 0, z);
    
    // Rotate booth to face center
    boothGroup.rotation.y = Math.atan2(-x, -z);
    
    return boothGroup;
}

function createTradingBooths() {
    console.log("Creating trading booths...");
    
    // Inner ring of trading booths
    const innerRadius = 25;
    const innerCount = 12;
    
    for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * Math.PI * 2;
        const booth = createTradingBooth(innerRadius, angle);
        scene.add(booth);
        tradingBooths.push(booth);
    }
    
    // Outer ring of trading booths
    const outerRadius = 40;
    const outerCount = 20;
    
    for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2;
        const booth = createTradingBooth(outerRadius, angle);
        scene.add(booth);
        tradingBooths.push(booth);
    }
}

function createHolographicDisplays() {
    console.log("Creating holographic displays...");
    
    // Create floating holographic displays
    const displayCount = 8;
    
    for (let i = 0; i < displayCount; i++) {
        const angle = (i / displayCount) * Math.PI * 2;
        const radius = 20;
        
        // Create hologram container
        const holoGroup = new THREE.Group();
        
        // Base emitter
        const emitterGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const emitterMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaff,
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.2
        });
        
        const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
        emitter.position.y = 0.1;
        holoGroup.add(emitter);
        
        // Create holographic projection
        const projectionGeometry = new THREE.SphereGeometry(3, 32, 16);
        const projectionMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.3,
            wireframe: Math.random() > 0.5
        });
        
        const projection = new THREE.Mesh(projectionGeometry, projectionMaterial);
        projection.position.y = 5;
        projection.userData = { 
            type: 'hologram',
            rotationSpeed: 0.01,
            interactive: true,
            pulseSpeed: 0.03,
            pulseTime: Math.random() * Math.PI * 2
        };
        holoGroup.add(projection);
        holographicDisplays.push(projection);
        
        // Add connecting beam
        const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 8);
        const beamMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.3
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.y = 5;
        holoGroup.add(beam);
        
        // Position the holo display
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        holoGroup.position.set(x, 0, z);
        
        scene.add(holoGroup);
    }
}

function createDigitalDisplayBoards() {
    console.log("Creating digital display boards...");
    
    // Create large display screens around the perimeter
    const displayCount = 8;
    const radius = exchangeWidth / 2 - 1;
    
    for (let i = 0; i < displayCount; i++) {
        const angle = (i / displayCount) * Math.PI * 2;
        
        // Create display
        const displayWidth = 10;
        const displayHeight = 6;
        
        // Use TVDisplay class
        const tvDisplay = new TVDisplay(
            scene,
            { 
                x: Math.cos(angle) * radius, 
                y: exchangeHeight / 2, 
                z: Math.sin(angle) * radius 
            },
            { x: 0, y: angle + Math.PI, z: 0 },
            { width: displayWidth, height: displayHeight, depth: 0.2 },
            { 
                informational: true,
                marketData: true,
                custom: "GRAND EXCHANGE MARKET PRICES"
            }
        );
        
        tvDisplays.push(tvDisplay);
        
        // Create a floating price board nearby
        const priceBoard = createPriceBoard();
        priceBoard.position.set(
            Math.cos(angle) * (radius - 5),
            5,
            Math.sin(angle) * (radius - 5)
        );
        priceBoard.rotation.y = angle + Math.PI;
        scene.add(priceBoard);
        displayBoards.push(priceBoard);
    }
}

function createPriceBoard() {
    const boardGroup = new THREE.Group();
    
    // Board base
    const baseGeometry = new THREE.BoxGeometry(4, 3, 0.2);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x001133,
        metalness: 0.8,
        roughness: 0.2
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    boardGroup.add(base);
    
    // Create digital price display
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 384;
    
    // Fill with background color
    context.fillStyle = '#001133';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add grid lines
    context.strokeStyle = '#00aaff';
    context.lineWidth = 1;
    
    for (let y = 0; y < canvas.height; y += 32) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
    }
    
    // Add price data
    context.font = '24px monospace';
    context.fillStyle = '#00ffff';
    context.textBaseline = 'middle';
    context.textAlign = 'left';
    
    const commodities = [
        "GEM TOKEN", "NOVA CRYSTAL", "QUANTUM SHARD", "COSMIC DUST", 
        "PLASMA CORE", "VOID ESSENCE", "STELLAR FRAGMENT"
    ];
    
    const prices = [
        "243.67 ▲", "118.25 ▼", "1,453.00 ▲", "76.45 ▼",
        "395.75 ▲", "2,887.10 ▲", "543.20 ▼"
    ];
    
    for (let i = 0; i < commodities.length; i++) {
        const y = 48 + i * 48;
        
        context.fillText(commodities[i], 20, y);
        
        // Change color based on trend
        if (prices[i].includes('▲')) {
            context.fillStyle = '#00ff88';
        } else {
            context.fillStyle = '#ff5500';
        }
        
        context.textAlign = 'right';
        context.fillText(prices[i], canvas.width - 20, y);
        
        // Reset color
        context.fillStyle = '#00ffff';
        context.textAlign = 'left';
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const displayMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        emissive: 0xffffff,
        emissiveIntensity: 0.2
    });
    
    const display = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 3),
        displayMaterial
    );
    display.position.z = 0.11;
    boardGroup.add(display);
    
    return boardGroup;
}

function createPortals() {
    console.log("Creating portals...");
    
    // Define portal information
    const portalInfo = [
        { name: "To Laboratory", destination: "laboratory.html", color: 0x00ffaa, position: { x: -40, y: 4, z: 0 } },
        { name: "To Warehouse", destination: "warehouse.html", color: 0xff9900, position: { x: 0, y: 4, z: 40 } },
        { name: "To Outdoor", destination: "outdoor.html", color: 0x66ff66, position: { x: 40, y: 4, z: 0 } },
        { name: "To High Cafe", destination: "high_cafe.html", color: 0xff66aa, position: { x: 0, y: 4, z: -40 } }
    ];
    
    portalInfo.forEach(info => {
        // Create portal frame
        const frameGeometry = new THREE.TorusGeometry(3, 0.5, 16, 100);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: info.color,
            emissive: info.color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(info.position.x, info.position.y, info.position.z);
        
        // Orient the portal to face the center
        frame.lookAt(0, frame.position.y, 0);
        
        frame.userData = { 
            type: 'portal', 
            destination: info.destination,
            pulseSpeed: 0.02,
            pulseTime: Math.random() * Math.PI * 2
        };
        
        scene.add(frame);
        portals.push(frame);
        
        // Create portal effect inside the frame
        const portalEffectGeometry = new THREE.CircleGeometry(2.8, 32);
        const portalEffectMaterial = new THREE.MeshBasicMaterial({
            color: info.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        const portalEffect = new THREE.Mesh(portalEffectGeometry, portalEffectMaterial);
        portalEffect.position.copy(frame.position);
        portalEffect.lookAt(0, portalEffect.position.y, 0); // Orient same as frame
        portalEffect.position.x += frame.position.x > 0 ? -0.1 : 0.1;
        portalEffect.position.z += frame.position.z > 0 ? -0.1 : 0.1;
        
        scene.add(portalEffect);
        
        // Add portal label
        addPortalLabel(frame.position, info.name);
    });
}

function addPortalLabel(position, text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 30, 60, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.strokeStyle = '#00aaff';
    context.lineWidth = 2;
    context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    context.font = 'bold 24px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });
    
    const labelGeometry = new THREE.PlaneGeometry(2, 0.5);
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    
    // Position above the portal
    label.position.set(position.x, position.y + 4, position.z);
    
    // Orient the label to face the center
    label.lookAt(0, label.position.y, 0);
    
    scene.add(label);
}

function createAmbientEffects() {
    console.log("Creating ambient effects...");
    
    // Create particle system for floating data bits
    const particleCount = 2000;
    const particleGeometry = new THREE.BufferGeometry();
    
    const positions = [];
    const colors = [];
    const sizes = [];
    
    const color = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
        // Random position within a sphere
        const radius = (exchangeWidth / 2) * 0.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = Math.random() * exchangeHeight;
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        positions.push(x, y, z);
        
        // Random color in blue/cyan range
        color.setHSL(0.55 + Math.random() * 0.15, 1.0, 0.5 + Math.random() * 0.5);
        colors.push(color.r, color.g, color.b);
        
        // Random size
        sizes.push(Math.random() * 2);
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    // Create a custom shader material
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.userData = { type: 'particles' };
    scene.add(particles);
}

function onMouseMove(event) {
    // Update mouse position for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Cast ray
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with interactive objects
    const allInteractiveObjects = [...portals, ...holographicDisplays];
    const intersects = raycaster.intersectObjects(allInteractiveObjects, true);
    
    // Reset cursor
    document.body.style.cursor = 'default';
    
    if (intersects.length > 0) {
        // Show pointer cursor for interactive elements
        document.body.style.cursor = 'pointer';
    }
}

function onMouseClick(event) {
    // Calculate mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Cast ray
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with all interactive objects
    const allInteractiveObjects = [...portals, ...holographicDisplays];
    const intersects = raycaster.intersectObjects(allInteractiveObjects, true);
    
    if (intersects.length > 0) {
        // Find the first object with userData
        for (let i = 0; i < intersects.length; i++) {
            const object = findInteractiveParent(intersects[i].object);
            
            if (object && object.userData) {
                // Portal interaction
                if (object.userData.type === 'portal') {
                    console.log(`Teleporting to ${object.userData.destination}`);
                    
                    // Create a flash effect before teleporting
                    createTeleportEffect(() => {
                        window.location.href = object.userData.destination;
                    });
                    return;
                }
                
                // Hologram interaction
                if (object.userData.type === 'hologram' || object.userData.type === 'terminal') {
                    // Animate the object to show interaction
                    object.userData.interacted = true;
                    
                    // Change color temporarily
                    const originalColor = object.material.color.clone();
                    const originalEmissive = object.material.emissive.clone();
                    
                    object.material.color.set(0xffffff);
                    object.material.emissive.set(0xffffff);
                    
                    setTimeout(() => {
                        object.material.color.copy(originalColor);
                        object.material.emissive.copy(originalEmissive);
                        object.userData.interacted = false;
                    }, 300);
                    
                    return;
                }
            }
        }
    }
}

function findInteractiveParent(object) {
    // Traverse up the parent hierarchy to find interactive objects
    let currentObj = object;
    
    while (currentObj) {
        if (currentObj.userData && 
            (currentObj.userData.interactive || 
             currentObj.userData.type === 'portal' || 
             currentObj.userData.type === 'hologram' ||
             currentObj.userData.type === 'terminal')) {
            return currentObj;
        }
        currentObj = currentObj.parent;
    }
    
    return null;
}

function createTeleportEffect(callback) {
    // Create a colorful flash overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'radial-gradient(circle, rgba(0,255,255,0.8) 0%, rgba(0,20,80,1) 100%)';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    overlay.style.zIndex = '1000';
    document.body.appendChild(overlay);
    
    // Flash effect
    setTimeout(() => {
        overlay.style.opacity = '1';
        
        setTimeout(() => {
            callback();
        }, 500);
    }, 10);
}

// --- Animation Loop ---
function animate() {
    try {
        requestAnimationFrame(animate);
        controls.update();
        
        // Animate central hub rings
        if (centralStructure) {
            centralStructure.children.forEach(child => {
                if (child.userData && child.userData.rotationSpeed) {
                    child.rotation.z += child.userData.rotationSpeed;
                    
                    // Pulse effect
                    if (child.userData.pulseSpeed) {
                        child.userData.pulseTime += child.userData.pulseSpeed;
                        const scale = 1 + Math.sin(child.userData.pulseTime) * 0.05;
                        child.scale.set(scale, scale, scale);
                    }
                }
            });
        }
        
        // Animate holograms
        holographicDisplays.forEach(holo => {
            if (holo.userData && holo.userData.rotationSpeed) {
                holo.rotation.y += holo.userData.rotationSpeed;
                
                // Pulse effect for holograms
                if (holo.userData.pulseSpeed) {
                    holo.userData.pulseTime += holo.userData.pulseSpeed;
                    const opacity = 0.3 + Math.sin(holo.userData.pulseTime) * 0.2;
                    holo.material.opacity = opacity;
                }
            }
        });
        
        // Animate portals
        portals.forEach(portal => {
            if (portal.userData && portal.userData.pulseSpeed) {
                portal.userData.pulseTime += portal.userData.pulseSpeed;
                const emissiveIntensity = 0.5 + Math.sin(portal.userData.pulseTime) * 0.3;
                portal.material.emissiveIntensity = emissiveIntensity;
            }
        });
        
        renderer.render(scene, camera);
    } catch (error) {
        showError(error.message || "Error in animation loop");
        console.error("Animation error:", error);
    }
}

// --- Resize Handler ---
function onWindowResize() {
    try {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (error) {
        showError(error.message || "Error in window resize handler");
        console.error("Resize error:", error);
    }
}

// --- Run ---
try {
    console.log("Initializing...");
    init();
} catch (error) {
    showError(error.message || "Error starting application");
    console.error("Global error:", error);
}

// Grand Exchange UI logic
async function fetchAllForgedAssets() {
  const res = await fetch('/api/forged-assets');
  if (!res.ok) return [];
  return await res.json();
}
function renderExchangeAssetGrid(assets) {
  const grid = document.getElementById('exchangeAssetGrid');
  grid.innerHTML = '';
  assets.forEach(asset => {
    const div = document.createElement('div');
    div.style.width = '140px';
    div.style.background = '#222';
    div.style.borderRadius = '10px';
    div.style.padding = '8px';
    div.style.cursor = 'pointer';
    div.style.boxShadow = '0 2px 8px #0004';
    div.innerHTML = `
      <img src="/3DModels/${asset.asset_filename.replace('.glb','.jpg')}" alt="preview" style="width:100%;height:90px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'"/>
      <div style="font-size:15px;font-weight:bold;margin:6px 0 2px 0;">${asset.asset_filename.replace(/_/g,' ').replace('.glb','')}</div>
      <div style="font-size:12px;color:#aaa;">Minted: ${asset.mint_count}/${asset.mint_limit}</div>
      <div style="font-size:12px;color:#0ff;">${asset.special_ability||''}</div>
      <div style="font-size:12px;color:#fff;">Owner: ${asset.owner_wallet.slice(0,8)}...</div>
    `;
    div.onclick = () => showExchangeModal(asset);
    grid.appendChild(div);
  });
}
function filterExchangeAssets(assets, query) {
  query = query.toLowerCase();
  return assets.filter(a =>
    a.asset_filename.toLowerCase().includes(query) ||
    (a.special_ability && a.special_ability.toLowerCase().includes(query)) ||
    (a.owner_wallet && a.owner_wallet.toLowerCase().includes(query))
  );
}
let allExchangeAssets = [];
async function loadExchangeAssets() {
  allExchangeAssets = await fetchAllForgedAssets();
  renderExchangeAssetGrid(allExchangeAssets);
}
document.getElementById('exchangeSearchInput').addEventListener('input', function() {
  const filtered = filterExchangeAssets(allExchangeAssets, this.value);
  renderExchangeAssetGrid(filtered);
});
// Exchange modal logic
const exchangeModal = document.getElementById('exchangeModal');
const closeExchangeModal = document.getElementById('closeExchangeModal');
let selectedExchangeAsset = null;
function showExchangeModal(asset) {
  selectedExchangeAsset = asset;
  document.getElementById('exchangeModelName').textContent = asset.asset_filename.replace(/_/g,' ').replace('.glb','');
  document.getElementById('exchangeModelMeta').innerHTML = `Minted: ${asset.mint_count}/${asset.mint_limit}<br>Owner: ${asset.owner_wallet.slice(0,8)}...`;
  document.getElementById('exchangeSpecialAbility').textContent = `Special Ability: ${asset.special_ability||''}`;
  // Load and display the .glb model in Three.js
  const viewer = document.getElementById('exchangeModelViewer');
  viewer.innerHTML = '';
  if (!window.THREE || !window.THREE.GLTFLoader) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js';
    script.onload = () => renderGLBModel(asset.asset_filename, viewer);
    document.body.appendChild(script);
  } else {
    renderGLBModel(asset.asset_filename, viewer);
  }
  // Trade controls
  const tradeControls = document.getElementById('exchangeTradeControls');
  tradeControls.innerHTML = '';
  if (asset.mint_count < asset.mint_limit) {
    const tradeBtn = document.createElement('button');
    tradeBtn.textContent = 'Replicate/Trade Asset';
    tradeBtn.className = 'auth-button';
    tradeBtn.onclick = async function() {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (!user || !user.walletAddress) {
        document.getElementById('exchangeStatusMsg').textContent = 'You must be logged in to trade.';
        return;
      }
      const res = await fetch('/api/asset-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forged_asset_id: asset.id,
          from_wallet: asset.owner_wallet,
          to_wallet: user.walletAddress,
          price: 0 // Add price logic if needed
        })
      });
      if (res.ok) {
        document.getElementById('exchangeStatusMsg').textContent = 'Trade/Replication successful!';
        loadExchangeAssets();
      } else {
        const err = await res.json();
        document.getElementById('exchangeStatusMsg').textContent = 'Trade failed: ' + (err.error || 'Unknown error');
      }
    };
    tradeControls.appendChild(tradeBtn);
  } else {
    tradeControls.innerHTML = '<div style="color:#f66;">Mint limit reached. No more trades allowed.</div>';
  }
  exchangeModal.style.display = 'flex';
  document.getElementById('exchangeStatusMsg').textContent = '';
}
closeExchangeModal.onclick = () => { exchangeModal.style.display = 'none'; };
exchangeModal.addEventListener('click', e => {
  if (e.target === exchangeModal) exchangeModal.style.display = 'none';
});
function renderGLBModel(filename, container) {
  container.innerHTML = '';
  const width = container.offsetWidth || 420;
  const height = container.offsetHeight || 320;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width/height, 0.1, 100);
  camera.position.set(0, 1, 2.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);
  const light = new THREE.HemisphereLight(0xffffff, 0x222233, 1.2);
  scene.add(light);
  const loader = new THREE.GLTFLoader();
  loader.load(`/3DModels/${filename}`, function(gltf) {
    const model = gltf.scene;
    scene.add(model);
    animate();
  }, undefined, function(error) {
    container.innerHTML = '<div style="color:#f66;">Failed to load model.</div>';
  });
  function animate() {
    requestAnimationFrame(animate);
    scene.rotation.y += 0.008;
    renderer.render(scene, camera);
  }
}
// Load assets on page load
loadExchangeAssets();