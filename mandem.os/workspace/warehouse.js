// Minimal Three.js warehouse scene loader
// Assumes THREE and GLTFLoader are loaded globally via script tags

let scene, camera, renderer, controls;

function initWarehouseScene() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Controls (OrbitControls if available)
    if (window.OrbitControls) {
        controls = new window.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 3, 0);
        controls.update();
    }

    // Load warehouse model
    let GLTFLoader = window.GLTFLoader || (window.THREE && window.THREE.GLTFLoader);
    if (!GLTFLoader) {
        alert('GLTFLoader is not available. Make sure GLTFLoader.js is loaded before warehouse.js');
        return;
    }
    const loader = new GLTFLoader();
    loader.load('3DModels/automated_warehouse_-.glb', (gltf) => {
        const model = gltf.scene;
        model.position.set(0, 0, 0);
        scene.add(model);
        console.log('Warehouse model loaded:', model);
    }, undefined, (err) => {
        alert('Failed to load warehouse model: ' + err.message);
    });

    // Responsive resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
}

window.initWarehouseScene = initWarehouseScene;