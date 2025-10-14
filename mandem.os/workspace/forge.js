// Fetch and display live gem list from Merlin's Gem Exchange
async function fetchMerlinGemList() {
  const gemListDiv = document.getElementById('merlin-gem-list');
  try {
    const response = await fetch('https://www.merlinsgembot.com/merlinsgemexchange');
    const html = await response.text();
    // Try to extract gem names from the HTML (assume they are in a table or list)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    // Try to find a table or list of gems
    let gems = [];
    // Try table rows first
    const tables = doc.querySelectorAll('table');
    for (const table of tables) {
      for (const row of table.querySelectorAll('tr')) {
        const cells = row.querySelectorAll('td,th');
        if (cells.length > 0) {
          const name = cells[0].innerText.trim();
          if (name && !gems.includes(name) && name.length < 40) gems.push(name);
        }
      }
    }
    // If no gems found, try list items
    if (gems.length === 0) {
      doc.querySelectorAll('li').forEach(li => {
        const name = li.innerText.trim();
        if (name && !gems.includes(name) && name.length < 40) gems.push(name);
      });
    }
    if (gems.length === 0) {
      gemListDiv.textContent = 'No gem data found.';
    } else {
      gemListDiv.innerHTML = '<ul>' + gems.map(gem => `<li>${gem}</li>`).join('') + '</ul>';
    }
  } catch (e) {
    gemListDiv.textContent = 'Failed to load gem list.';
  }
}

document.addEventListener('DOMContentLoaded', fetchMerlinGemList);

// Forge UI logic
async function fetchForgeAssets() {
  const res = await fetch('/api/models');
  if (!res.ok) return [];
  return await res.json();
}
function renderForgeAssetGrid(models) {
  const grid = document.getElementById('forgeAssetGrid');
  grid.innerHTML = '';
  models.forEach(model => {
    const div = document.createElement('div');
    div.style.width = '140px';
    div.style.background = '#222';
    div.style.borderRadius = '10px';
    div.style.padding = '8px';
    div.style.cursor = 'pointer';
    div.style.boxShadow = '0 2px 8px #0004';
    div.innerHTML = `
      <img src="${model.preview || ''}" alt="preview" style="width:100%;height:90px;object-fit:cover;border-radius:6px;"/>
      <div style="font-size:15px;font-weight:bold;margin:6px 0 2px 0;">${model.name}</div>
      <div style="font-size:12px;color:#aaa;">${model.author || ''}</div>
    `;
    div.onclick = () => showForgeModal(model);
    grid.appendChild(div);
  });
}
function filterForgeAssets(models, query) {
  query = query.toLowerCase();
  return models.filter(m =>
    m.name.toLowerCase().includes(query) ||
    (m.description && m.description.toLowerCase().includes(query)) ||
    (m.author && m.author.toLowerCase().includes(query))
  );
}
let allForgeAssets = [];
async function loadForgeAssets() {
  allForgeAssets = await fetchForgeAssets();
  renderForgeAssetGrid(allForgeAssets);
}
document.getElementById('forgeSearchInput').addEventListener('input', function() {
  const filtered = filterForgeAssets(allForgeAssets, this.value);
  renderForgeAssetGrid(filtered);
});
// Forge modal logic
const forgeModal = document.getElementById('forgeModal');
const closeForgeModal = document.getElementById('closeForgeModal');
const forgeBtn = document.getElementById('forgeBtn');
let selectedForgeModel = null;
function showForgeModal(model) {
  selectedForgeModel = model;
  document.getElementById('forgeModelName').textContent = model.name;
  document.getElementById('forgeModelMeta').innerHTML = `By: ${model.author || 'Unknown'}<br>${model.description || ''}`;
  // Show file size, base price, mint limit
  fetch(`/3DModels/${model.filename}`)
    .then(res => res.blob())
    .then(blob => {
      const fileSize = blob.size;
      const kb = Math.ceil(fileSize / 1024);
      const basePrice = Math.max(1, Math.ceil(kb / 100));
      const mintLimit = Math.max(1, Math.floor(500 / kb));
      document.getElementById('forgeModelMeta').innerHTML += `<br>File size: ${kb} KB<br>Base price: ${basePrice} MGC<br>Mint limit: ${mintLimit}`;
    });
  // Show special ability (random for now)
  const abilities = [
    'Grants bonus XP',
    'Unlocks secret area',
    'Boosts movement speed',
    'Generates MGC daily',
    'Cosmetic effect',
    'Increases inventory space'
  ];
  const special = abilities[Math.floor(Math.random() * abilities.length)];
  document.getElementById('forgeSpecialAbility').textContent = `Special Ability: ${special}`;
  // Load and display the .glb model in Three.js
  const viewer = document.getElementById('forgeModelViewer');
  viewer.innerHTML = '';
  if (!window.THREE || !window.THREE.GLTFLoader) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.132.2/examples/js/loaders/GLTFLoader.js';
    script.onload = () => renderGLBModel(model.filename, viewer);
    document.body.appendChild(script);
  } else {
    renderGLBModel(model.filename, viewer);
  }
  forgeModal.style.display = 'flex';
  document.getElementById('forgeStatusMsg').textContent = '';
}
closeForgeModal.onclick = () => { forgeModal.style.display = 'none'; };
forgeModal.addEventListener('click', e => {
  if (e.target === forgeModal) forgeModal.style.display = 'none';
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
forgeBtn.onclick = async function() {
  if (!selectedForgeModel) return;
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  if (!user || !user.walletAddress) {
    document.getElementById('forgeStatusMsg').textContent = 'You must be logged in to forge.';
    return;
  }
  // Use the same ability as shown
  const specialAbility = document.getElementById('forgeSpecialAbility').textContent.replace('Special Ability: ', '');
  const res = await fetch('/api/forge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      asset_filename: selectedForgeModel.filename,
      owner_wallet: user.walletAddress,
      special_ability: specialAbility
    })
  });
  if (res.ok) {
    document.getElementById('forgeStatusMsg').textContent = 'Asset forged successfully!';
  } else {
    const err = await res.json();
    document.getElementById('forgeStatusMsg').textContent = 'Forge failed: ' + (err.error || 'Unknown error');
  }
};
// Load assets on page load
loadForgeAssets();