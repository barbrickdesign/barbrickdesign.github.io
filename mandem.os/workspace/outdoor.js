// outdoor.js - Real-world map explorer with interactive grid and game buttons
// Requires Leaflet.js (CDN loaded in outdoor.html)

// --- Map Initialization ---
const map = L.map('geomine-map', {
  center: [33.749, -84.388], // Default: Atlanta, GA
  zoom: 18,
  zoomControl: false,
  attributionControl: false
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 20,
  minZoom: 16,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// --- User Marker ---
let userMarker = null;
function setUserLocation(lat, lng) {
  if (userMarker) {
    userMarker.setLatLng([lat, lng]);
  } else {
    userMarker = L.marker([lat, lng], {icon: L.icon({iconUrl: 'images/player-marker.png', iconSize: [36,36]})}).addTo(map);
  }
  map.setView([lat, lng]);
}

// --- Guy Fawkes Mask 3D Model (floating above user marker) ---
// We'll use a 2D SVG mask as a placeholder for the 3D model for now
// When you want to use the STL, you can load it with Three.js and render to a canvas overlay
function addFloatingMask(lat, lng) {
  // Remove any existing mask
  const existing = document.getElementById('floating-mask');
  if (existing) existing.remove();
  // Project map lat/lng to screen position
  const point = map.latLngToContainerPoint([lat, lng]);
  const mask = document.createElement('div');
  mask.id = 'floating-mask';
  mask.style.position = 'fixed';
  mask.style.left = (point.x - 24) + 'px';
  mask.style.top = (point.y - 64) + 'px';
  mask.style.width = '48px';
  mask.style.height = '48px';
  mask.style.pointerEvents = 'none';
  mask.style.zIndex = 1200;
  mask.innerHTML = `
    <svg viewBox="0 0 64 64" width="48" height="48">
      <ellipse cx="32" cy="32" rx="28" ry="30" fill="#fff" stroke="#222" stroke-width="3"/>
      <path d="M16 36 Q32 52 48 36" stroke="#222" stroke-width="3" fill="none"/>
      <ellipse cx="24" cy="28" rx="4" ry="2.5" fill="#222"/>
      <ellipse cx="40" cy="28" rx="4" ry="2.5" fill="#222"/>
      <path d="M24 44 Q32 48 40 44" stroke="#222" stroke-width="2" fill="none"/>
      <path d="M20 36 Q32 40 44 36" stroke="#222" stroke-width="1.5" fill="none"/>
    </svg>
  `;
  document.body.appendChild(mask);
}

// Update mask position on map move/zoom
map.on('move zoom', function() {
  if (userMarker) {
    const latlng = userMarker.getLatLng();
    addFloatingMask(latlng.lat, latlng.lng);
  }
});

// Also update after geolocation
function setUserLocationWithMask(lat, lng) {
  setUserLocation(lat, lng);
  addFloatingMask(lat, lng);
}

// --- Geolocation ---
function startGeolocationWatcher() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      pos => setUserLocationWithMask(pos.coords.latitude, pos.coords.longitude),
      () => setUserLocationWithMask(33.749, -84.388),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  } else {
    setUserLocationWithMask(33.749, -84.388);
  }
}
startGeolocationWatcher();

// --- Grid Overlay ---
const gridLayer = L.layerGroup().addTo(map);
// Assume userId is available (simulate for now)
const userId = localStorage.getItem('userId') || 'user_' + Math.floor(Math.random()*100000);
localStorage.setItem('userId', userId);
// Assign a unique color to each user
function getUserColor(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 80%, 55%)`;
}

// --- Global Grid/Plot Logic with Lat/Lng Keys and Mineral Hotspots ---
// Utility for canonical plot key
function getPlotKey(lat, lng) {
  return lat.toFixed(6) + '_' + lng.toFixed(6);
}
// Example mineral profiles by region (expand as needed)
const MINERAL_PROFILES = [
  { name: 'Emerald Hotspot', minerals: { emerald: 0.5, quartz: 0.3, iron: 0.2 }, bounds: { minLat: 33.74, maxLat: 33.75, minLng: -84.39, maxLng: -84.38 } },
  { name: 'Gold Vein', minerals: { gold: 0.4, copper: 0.4, quartz: 0.2 }, bounds: { minLat: 33.75, maxLat: 33.76, minLng: -84.39, maxLng: -84.38 } },
  // ...add more regions...
];
function getMineralProfile(lat, lng) {
  for (const prof of MINERAL_PROFILES) {
    if (lat >= prof.bounds.minLat && lat <= prof.bounds.maxLat && lng >= prof.bounds.minLng && lng <= prof.bounds.maxLng) {
      return prof;
    }
  }
  // Default: generic minerals
  return { name: 'Generic', minerals: { quartz: 0.5, iron: 0.3, copper: 0.2 } };
}
// Add or update a plot with mineral profile
function upsertPlot(lat, lng, ownerId, opts = {}) {
  const key = getPlotKey(lat, lng);
  if (!window.plots[key]) {
    window.plots[key] = {
      owners: [],
      linkedTo: [],
      obelisks: [],
      miningPower: 1,
      lastMined: 0,
      rechargeUntil: 0,
      minerals: getMineralProfile(lat, lng).minerals,
      tradeRoutes: [],
      ...opts
    };
  }
  if (ownerId && !window.plots[key].owners.includes(ownerId)) {
    window.plots[key].owners.push(ownerId);
  }
  return window.plots[key];
}

// --- Performance-tuned Grid Logic & Advanced Mining Economy ---
// Update plot size to 1000 sq ft
const PLOT_SIZE_FT2 = 1000;

// Update grid size in degrees for 1000 sq ft
// 1 degree latitude ≈ 364,000 ft
// 1 degree longitude ≈ 288,200 ft at Atlanta's latitude (33.75)
// 1000 sq ft ≈ 31.62 ft x 31.62 ft
const GRID_SIZE_FEET = Math.sqrt(PLOT_SIZE_FT2); // ≈ 31.62 ft
const FEET_PER_DEG_LAT = 364000;
const FEET_PER_DEG_LNG = 288200;
const GRID_SIZE_DEG_LAT = GRID_SIZE_FEET / FEET_PER_DEG_LAT; // ≈ 0.0000869
const GRID_SIZE_DEG_LNG = GRID_SIZE_FEET / FEET_PER_DEG_LNG; // ≈ 0.0001097

// Use average for square grid (optional, or use lat/lng separately for rectangles)
const GRID_SIZE_DEG = (GRID_SIZE_DEG_LAT + GRID_SIZE_DEG_LNG) / 2;

// Use a smaller gridCount for performance, but allow zooming out for more
let gridCount = 7; // 7x7 for local view, can increase for zoomed-out/leaderboard
function drawGrid(centerLat, centerLng, gridSize=GRID_SIZE_DEG, gridCountOverride) {
  gridLayer.clearLayers();
  const count = gridCountOverride || gridCount;
  const half = Math.floor(count/2);
  for (let i = -half; i <= half; i++) {
    for (let j = -half; j <= half; j++) {
      const lat = centerLat + i * gridSize;
      const lng = centerLng + j * gridSize;
      const key = getPlotKey(lat, lng);
      const plot = window.plots[key];
      let color = '#00ff99';
      let fillOpacity = 0.08;
      let dashArray = null;
      let glow = '';
      if (plot) {
        if (plot.owners.length > 0) {
          color = getUserColor(plot.owners[0]);
          fillOpacity = 0.18;
          if (plot.owners.includes(getCurrentUserId())) {
            glow = '0 0 16px 4px #00ff99, 0 0 32px 8px ' + color;
          } else {
            glow = '0 0 10px 2px ' + color;
          }
        }
        if (plot.obelisks.length > 0) {
          dashArray = '6,2';
        }
      }
      const rect = L.rectangle([
        [lat, lng],
        [lat + gridSize, lng + gridSize]
      ], {
        color,
        weight: 2,
        fillOpacity,
        dashArray,
        interactive: true
      }).addTo(gridLayer);
      // Add CSS glow effect
      const el = rect.getElement();
      if (el && glow) el.style.filter = 'drop-shadow(' + glow + ')';
      rect.on('click', () => handlePlotClick(lat, lng, plot));
      // Show obelisk stack visually (emoji for now, 3D model later)
      if (plot && plot.obelisks.length > 0) {
        const obeliskDiv = document.createElement('div');
        obeliskDiv.style.position = 'absolute';
        obeliskDiv.style.left = '50%';
        obeliskDiv.style.top = '50%';
        obeliskDiv.style.transform = 'translate(-50%,-80%)';
        obeliskDiv.style.fontSize = '18px';
        obeliskDiv.style.pointerEvents = 'none';
        obeliskDiv.innerHTML = '🗿'.repeat(plot.obelisks.length);
        rect.getElement().appendChild(obeliskDiv);
      }
      // Particle effect for recently mined plots
      if (plot && Date.now() - plot.lastMined < 10*60*1000) {
        el.style.boxShadow = '0 0 24px 8px #39ff14, 0 0 60px 20px #00ff99';
      }
    }
  }
}

// Update total plots calculation
const EARTH_SURFACE_FT2 = 5.5e15;
function calcTotalPlots() {
  return Math.round(EARTH_SURFACE_FT2 / PLOT_SIZE_FT2);
}

// --- Advanced Mining, Collectibles, and Obelisk Mechanics ---
const BASE_PLOT_PRICE = 1; // $1 base
const BASE_MINING_RATE = 0.01; // MGC/sec
const OBELISK_BOOST = 0.02; // +2% per obelisk
const LINK_BOOST = 0.01; // +1% per linked plot
const GEMSTONE_COST = 10; // 10 cut gems to charge saber

// Collectibles: spawn MGC/minerals randomly in view
function spawnCollectibles(centerLat, centerLng, count=3) {
  if (!window.collectibles) window.collectibles = [];
  window.collectibles.length = 0;
  for (let i = 0; i < count; i++) {
    const lat = centerLat + (Math.random()-0.5)*0.0005;
    const lng = centerLng + (Math.random()-0.5)*0.0005;
    const type = Math.random() < 0.8 ? 'mgc' : 'mineral';
    window.collectibles.push({lat, lng, type, id: 'c'+Date.now()+i});
    const icon = L.divIcon({className:'',html:type==='mgc'?'<span style="color:#00ff99;font-size:2em;">💎</span>':'<span style="color:#fffa65;font-size:2em;">⛏️</span>',iconSize:[32,32]});
    const marker = L.marker([lat, lng], {icon}).addTo(map);
    marker.on('click', () => collectItem(type, marker));
    setTimeout(()=>marker.remove(), 120000); // Despawn after 2 min
  }
}
function collectItem(type, marker) {
  if (type==='mgc') setMgcBalance(getMgcBalance()+Math.floor(Math.random()*5+1));
  // TODO: Add minerals to inventory
  marker.remove();
}
map.on('moveend', () => {
  const center = map.getCenter();
  drawGrid(center.lat, center.lng);
  spawnCollectibles(center.lat, center.lng, 2+Math.floor(Math.random()*2));
});

// --- Mining logic with mineral drops ---
function minePlot(lat, lng, userId) {
  const key = getPlotKey(lat, lng);
  const plot = window.plots[key];
  if (!plot) return { mgc: 0, minerals: {} };
  const now = Date.now();
  if (now < plot.rechargeUntil) return { mgc: 0, minerals: {} };
  const minedMgc = Math.floor(Math.random() * 5 + calcMiningRate(plot));
  plot.lastMined = now;
  plot.rechargeUntil = now + 10 * 60 * 1000; // 10 min recharge
  // Mineral drop logic
  const drops = {};
  for (const [mineral, chance] of Object.entries(plot.minerals)) {
    if (Math.random() < chance) drops[mineral] = (drops[mineral] || 0) + 1;
  }
  // TODO: Add minerals to user inventory, log on-chain
  return { mgc: minedMgc, minerals: drops };
}

// --- Chain Reaction Mining Bonus ---
// If two users cross the same plot within 30 seconds, trigger a double mining event
function checkChainReactionMining(lat, lng) {
  const key = getPlotKey(lat, lng);
  const now = Date.now();
  if (!plotTraffic[key]) return false;
  // Find unique users in last 30s
  const recent = plotTraffic[key].filter(e => now - e.time < 30000);
  const uniqueUsers = new Set(recent.map(e => e.userId));
  if (uniqueUsers.size >= 2) {
    // Trigger chain reaction bonus
    showChainReactionEffect(lat, lng);
    return true;
  }
  return false;
}
function showChainReactionEffect(lat, lng) {
  // Visual: burst effect on map
  const pt = map.latLngToContainerPoint([lat, lng]);
  const el = document.createElement('div');
  el.className = 'chain-reaction-burst';
  el.style.position = 'fixed';
  el.style.left = (pt.x - 32) + 'px';
  el.style.top = (pt.y - 32) + 'px';
  el.style.width = '64px';
  el.style.height = '64px';
  el.style.pointerEvents = 'none';
  el.style.zIndex = 2000;
  el.innerHTML = `<svg width='64' height='64'><circle cx='32' cy='32' r='28' fill='none' stroke='#ff00cc' stroke-width='6' opacity='0.7'/><circle cx='32' cy='32' r='16' fill='none' stroke='#ffd700' stroke-width='4' opacity='0.8'/></svg><div style='position:absolute;top:18px;left:0;width:64px;text-align:center;font-size:18px;color:#ffd700;font-weight:bold;text-shadow:0 0 8px #ff00cc;'>CHAIN!</div>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1200);
  // Toast
  showToast('Chain Reaction Mining! Double rewards!');
}
// Add CSS for burst
if (!document.getElementById('chain-reaction-style')) {
  const style = document.createElement('style');
  style.id = 'chain-reaction-style';
  style.textContent = `.chain-reaction-burst{animation:chain-burst 1.2s;}@keyframes chain-burst{0%{transform:scale(0.5);opacity:0.7;}60%{transform:scale(1.3);opacity:1;}100%{transform:scale(1);opacity:0;}}`;
  document.head.appendChild(style);
}
// Toast helper
function showToast(msg) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(()=>{toast.style.display='none';}, 1800);
}
// Patch mining logic to check for chain reaction
const origMinePlot = minePlot;
minePlot = function(lat, lng, userId) {
  let result = origMinePlot(lat, lng, userId);
  if (checkChainReactionMining(lat, lng)) {
    // Double rewards
    result = { ...result, mgc: result.mgc * 2 };
  }
  return result;
};

// --- Obelisk Level Up with Light Saber ---
function canLevelUpObelisk(userInventory) {
  return userInventory.lightSabers > 0 && userInventory.cutGems >= GEMSTONE_COST;
}
function levelUpObelisk(lat, lng, userInventory) {
  if (!canLevelUpObelisk(userInventory)) return false;
  userInventory.lightSabers--;
  userInventory.cutGems -= GEMSTONE_COST;
  const plot = upsertPlot(lat, lng, getCurrentUserId());
  plot.obelisks.push('upgraded');
  // TODO: Log to Solana
  logOnChainAction('levelUpObelisk', {lat, lng, user: getCurrentUserId()});
  drawGrid(lat, lng);
  return true;
}

// --- Plot Click Handler ---
function handlePlotClick(lat, lng, plot) {
  const uid = getCurrentUserId();
  if (plot && plot.owners.includes(uid)) {
    // Mine owned plot
    const mined = minePlot(lat, lng, uid);
    if (mined.mgc > 0) {
      setMgcBalance(getMgcBalance() + mined.mgc);
      logOnChainAction('mine', {lat, lng, mined, user: uid});
      alert(`You mined ${mined.mgc} MGC and found minerals: ${JSON.stringify(mined.minerals)}!`);
    } else {
      alert('Plot is recharging!');
    }
  } else {
    // Claim plot
    upsertPlot(lat, lng, uid);
    setMgcBalance(getMgcBalance() - BASE_PLOT_PRICE);
    logOnChainAction('claim', {lat, lng, user: uid});
    alert('Plot claimed!');
    updatePlotStats();
    drawGrid(lat, lng);
  }
  showPlotDetailsPanel(lat, lng);
}

// --- Phantom Wallet Connection Enforcement for Plot Purchase ---
function isWalletConnected() {
  return !!window.solanaAddress;
}

function requireWalletConnection(action) {
  if (!isWalletConnected()) {
    alert('Please connect your Phantom wallet to purchase plots.');
    if (typeof connectSolanaWallet === 'function') connectSolanaWallet();
    return false;
  }
  return true;
}

// Patch handlePlotClick to require wallet connection
const origHandlePlotClick = handlePlotClick;
handlePlotClick = function(lat, lng, plot) {
  if (!requireWalletConnection()) return;
  origHandlePlotClick(lat, lng, plot);
};

// Ensure Connect Wallet button is visible if not connected
function ensureWalletButton() {
  let btn = document.getElementById('solana-wallet-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'solana-wallet-btn';
    btn.textContent = 'Connect Wallet';
    btn.style.position = 'fixed';
    btn.style.top = '12px';
    btn.style.right = '24px';
    btn.style.zIndex = 3000;
    btn.style.background = '#222';
    btn.style.color = '#00ff99';
    btn.style.border = '2px solid #00ff99';
    btn.style.borderRadius = '8px';
    btn.style.padding = '8px 18px';
    btn.style.fontFamily = 'Orbitron, monospace';
    btn.onclick = connectSolanaWallet;
    document.body.appendChild(btn);
  }
  if (isWalletConnected()) {
    btn.textContent = window.solanaAddress.slice(0, 6) + '...' + window.solanaAddress.slice(-4);
    btn.disabled = true;
  } else {
    btn.textContent = 'Connect Wallet';
    btn.disabled = false;
  }
}
setInterval(ensureWalletButton, 2000);

// --- Keep grid centered on user ---
map.on('moveend', () => {
  const center = map.getCenter();
  drawGrid(center.lat, center.lng);
});

// Initial grid
map.whenReady(() => {
  const center = map.getCenter();
  drawGrid(center.lat, center.lng);
});

// --- Visualize Hotspots on Map ---
function drawHotspotOverlays() {
  MINERAL_PROFILES.forEach(profile => {
    const bounds = [
      [profile.bounds.minLat, profile.bounds.minLng],
      [profile.bounds.maxLat, profile.bounds.maxLng]
    ];
    L.rectangle(bounds, {
      color: '#fffa65',
      weight: 1,
      fillOpacity: 0.07,
      dashArray: '4,4',
      interactive: false
    }).addTo(map).bindTooltip(profile.name, {permanent: false, direction: 'center'});
  });
}
map.whenReady(drawHotspotOverlays);

// --- Game Buttons (Mining Stats, Quick Mine, Jetpack, Purchase Obelisk, Level Up Obelisk) ---
document.getElementById('toggle-stats').onclick = () => {
  const statsPanel = document.getElementById('stats-panel');
  statsPanel.style.display = statsPanel.style.display === 'none' ? 'block' : 'none';
};
document.getElementById('quick-mine').onclick = () => {
  alert('Quick Mine activated! (Implement mining logic here)');
};
document.getElementById('toggle-jetpack').onclick = () => {
  const jetpackUI = document.getElementById('jetpack-ui');
  jetpackUI.style.display = jetpackUI.style.display === 'none' ? 'block' : 'none';
};
document.getElementById('purchase-obelisk').onclick = () => {
  alert('Obelisk purchased! (Implement purchase logic here)');
};
document.getElementById('level-up-obelisk').onclick = () => {
  alert('Obelisk leveled up! (Implement level up logic here)');
};

// --- Joystick Controls for Mobile (move map center) ---
function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
if (isMobileDevice()) {
  if (!document.getElementById('joystick')) {
    const joystick = document.createElement('div');
    joystick.id = 'joystick';
    joystick.style.position = 'fixed';
    joystick.style.bottom = '100px';
    joystick.style.left = '30px';
    joystick.style.zIndex = 200;
    joystick.innerHTML = `
      <button style="width:48px;height:48px;margin:2px;" onclick="window.moveMap(0,-1)">▲</button><br>
      <button style="width:48px;height:48px;margin:2px;" onclick="window.moveMap(-1,0)">◀</button>
      <button style="width:48px;height:48px;margin:2px;" onclick="window.moveMap(1,0)">▶</button><br>
      <button style="width:48px;height:48px;margin:2px;" onclick="window.moveMap(0,1)">▼</button>
    `;
    document.body.appendChild(joystick);
  }
  window.moveMap = function(dx, dy) {
    const center = map.getCenter();
    const gridSize = 0.0001;
    map.panTo([center.lat + dy * gridSize, center.lng + dx * gridSize]);
  };
}

// --- Plot Data Structure and Mining Logic Scaffold ---
// Global plot registry (simulate for now)
window.plots = window.plots || {};
// Link plots for mining boost
function linkPlots(plotKeyA, plotKeyB) {
  if (!window.plots[plotKeyA] || !window.plots[plotKeyB]) return;
  if (!window.plots[plotKeyA].linkedTo.includes(plotKeyB)) window.plots[plotKeyA].linkedTo.push(plotKeyB);
  if (!window.plots[plotKeyB].linkedTo.includes(plotKeyA)) window.plots[plotKeyB].linkedTo.push(plotKeyA);
}
// Calculate mining rate for a plot
function calcMiningRate(plot) {
  let rate = plot.miningPower;
  // Linked plots boost
  rate += plot.linkedTo.length * 0.5;
  // Obelisk boost
  rate += plot.obelisks.length * 1.5;
  // TODO: Add passing user boost, global throttle, etc.
  return rate;
}

// --- Plot Value Calculation and Display in Plot Details Panel ---
function calculatePlotValue(key) {
  const plot = window.plots[key];
  if (!plot) return 1; // base value
  let value = 1; // base value
  // Traffic boost: +0.5 per 10 passes in last 24h
  const traffic = plotTraffic[key] ? plotTraffic[key].filter(e => Date.now() - e.time < 24*60*60*1000).length : 0;
  value += Math.floor(traffic / 10) * 0.5;
  // Special status boost
  if (plot.special) value += 5;
  // Asset link boost
  if (plot.forgedMineral) value += 10;
  // Obelisk boost
  value += (plot.obelisks ? plot.obelisks.length : 0) * 2;
  return value;
}
function getPlotBonuses(key) {
  const plot = window.plots[key];
  if (!plot) return [];
  const bonuses = [];
  if (plot.special) bonuses.push('Special Plot');
  if (plot.forgedMineral) bonuses.push('Forged Mineral Linked');
  if (plot.obelisks && plot.obelisks.length > 0) bonuses.push('Obelisk Boost');
  const traffic = plotTraffic[key] ? plotTraffic[key].filter(e => Date.now() - e.time < 24*60*60*1000).length : 0;
  if (traffic > 20) bonuses.push('High Traffic');
  return bonuses;
}
// Update plot details panel to show value and bonuses
function showPlotDetailsPanel(lat, lng) {
  const panel = document.getElementById('plot-details-panel');
  if (!panel) return;
  panel.style.display = 'block';
  const key = getPlotKey(lat, lng);
  const plot = window.plots[key] || {};
  document.getElementById('obelisks-count').textContent = plot.obelisks ? plot.obelisks.length : 0;
  if (plot.mode) {
    document.getElementById('plot-mode-select').value = plot.mode;
  }
  window.selectedPlotKey = key;
  // Show value and bonuses
  let valueDiv = document.getElementById('plot-value-info');
  if (!valueDiv) {
    valueDiv = document.createElement('div');
    valueDiv.id = 'plot-value-info';
    valueDiv.style.marginTop = '10px';
    valueDiv.style.fontSize = '15px';
    panel.appendChild(valueDiv);
  }
  const value = calculatePlotValue(key);
  const bonuses = getPlotBonuses(key);
  valueDiv.innerHTML = `<b>Plot Value:</b> <span style='color:#ffd700;'>$${value.toFixed(2)}</span><br>` +
    (bonuses.length ? `<b>Bonuses:</b> <span style='color:#00ff99;'>${bonuses.join(', ')}</span>` : '');
}

// --- Solana Wallet Integration (tince/web3.js) ---
let solanaWallet = null;
let solanaAddress = null;
let mgcTokenMint = 'REPLACE_WITH_MGC_TOKEN_MINT'; // TODO: set your MGC SPL token mint address

async function connectSolanaWallet() {
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      solanaWallet = window.solana;
      solanaAddress = resp.publicKey.toString();
      document.getElementById('solana-wallet-btn').textContent = solanaAddress.slice(0, 6) + '...' + solanaAddress.slice(-4);
      document.getElementById('solana-wallet-btn').disabled = true;
      // Use wallet address as userId
      localStorage.setItem('userId', solanaAddress);
      // Fetch and show MGC balance
      fetchUserMgcBalance();
      // Redraw grid to reflect new userId
      const center = map.getCenter();
      drawGrid(center.lat, center.lng);
    } catch (e) {
      alert('Wallet connection failed.');
    }
  } else {
    alert('Phantom wallet not found. Please install Phantom or use a Solana-compatible wallet.');
  }
}

async function fetchUserMgcBalance() {
  if (!solanaAddress) return;
  // Use Solscan API to fetch SPL token balance
  try {
    const res = await fetch(`https://public-api.solscan.io/account/tokens?account=${solanaAddress}`);
    const data = await res.json();
    const mgcToken = data.find(t => t.tokenAddress === mgcTokenMint);
    const balance = mgcToken ? (mgcToken.tokenAmount.uiAmountString || mgcToken.tokenAmount.uiAmount) : '0';
    setMgcBalance(balance);
  } catch (e) {
    setMgcBalance('0');
  }
}

// --- On-Chain Logging for Claims, Mining, and Trades (Solana/tince integration scaffold) ---
async function logOnChainAction(action, details) {
  // Example: POST to backend or tince API for on-chain logging
  // Replace with your actual endpoint and logic
  try {
    await fetch('/api/onchain-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, timestamp: Date.now() })
    });
    console.log('Logged on-chain:', action, details);
  } catch (e) {
    console.warn('Failed to log on-chain:', action, details, e);
  }
}

// --- Trade Route Logging ---
function logTradeRoute(fromLat, fromLng, toLat, toLng, userId) {
  const fromKey = getPlotKey(fromLat, fromLng);
  const toKey = getPlotKey(toLat, toLng);
  if (!window.plots[fromKey]) return;
  if (!window.plots[fromKey].tradeRoutes) window.plots[fromKey].tradeRoutes = [];
  window.plots[fromKey].tradeRoutes.push({ to: toKey, user: userId, time: Date.now() });
  logOnChainAction('tradeRoute', { from: fromKey, to: toKey, user: userId });
}

// --- Visualize Trade Routes on Map ---
function drawTradeRoutes() {
  Object.entries(window.plots).forEach(([fromKey, plot]) => {
    if (plot.tradeRoutes) {
      const [fromLat, fromLng] = fromKey.split('_').map(Number);
      plot.tradeRoutes.forEach(route => {
        const [toLat, toLng] = route.to.split('_').map(Number);
        L.polyline([[fromLat, fromLng], [toLat, toLng]], {
          color: '#ff00cc',
          weight: 2,
          opacity: 0.5,
          dashArray: '6,4',
        }).addTo(map);
      });
    }
  });
}
map.whenReady(drawTradeRoutes);

// --- Forge Integration: Create Solana Wallet for Forged Mineral, Lock MGC ---
async function forgeMineral(mineralType, mgcAmount, forgerWallet) {
  // TODO: Integrate with tince/solana to create a new wallet and lock MGC
  // Simulate for now
  const newWallet = 'SOL_' + Math.random().toString(36).slice(2, 10);
  // Log on-chain
  logOnChainAction('forge', { mineralType, mgcAmount, forger: forgerWallet, newWallet });
  // Distribute to nearby miners (scaffold)
  // ...
  return newWallet;
}

// Add a button for wallet connect (top right)
if (!document.getElementById('solana-wallet-btn')) {
  const btn = document.createElement('button');
  btn.id = 'solana-wallet-btn';
  btn.textContent = 'Connect Wallet';
  btn.style.position = 'fixed';
  btn.style.top = '12px';
  btn.style.right = '24px';
  btn.style.zIndex = 3000;
  btn.style.background = '#222';
  btn.style.color = '#00ff99';
  btn.style.border = '2px solid #00ff99';
  btn.style.borderRadius = '8px';
  btn.style.padding = '8px 18px';
  btn.style.fontFamily = 'Orbitron, monospace';
  btn.onclick = connectSolanaWallet;
  document.body.appendChild(btn);
}

// --- Helper to get current userId ---
function getCurrentUserId() {
  return solanaAddress || userId;
}

// --- Contextual Panel Logic ---

// 1. Plot Details Panel: Show when a plot is selected
function hidePlotDetailsPanel() {
  const panel = document.getElementById('plot-details-panel');
  if (panel) panel.style.display = 'none';
  window.selectedPlotKey = null;
}
// Optionally hide panel when clicking outside (simple version)
document.addEventListener('click', function(e) {
  const panel = document.getElementById('plot-details-panel');
  if (panel && panel.style.display === 'block' && !panel.contains(e.target) && !e.target.classList.contains('action-btn')) {
    hidePlotDetailsPanel();
  }
});

// 2. Player Privacy Panel: Show from a button/menu
function showPlayerPrivacyPanel() {
  const panel = document.getElementById('player-privacy-panel');
  if (panel) panel.style.display = 'block';
}
function hidePlayerPrivacyPanel() {
  const panel = document.getElementById('player-privacy-panel');
  if (panel) panel.style.display = 'none';
}
// Example: Add a button to open privacy panel (top right, below wallet)
if (!document.getElementById('privacy-btn')) {
  const btn = document.createElement('button');
  btn.id = 'privacy-btn';
  btn.textContent = 'Privacy';
  btn.style.position = 'fixed';
  btn.style.top = '52px';
  btn.style.right = '24px';
  btn.style.zIndex = 3000;
  btn.style.background = '#222';
  btn.style.color = '#00ff99';
  btn.style.border = '2px solid #00ff99';
  btn.style.borderRadius = '8px';
  btn.style.padding = '6px 14px';
  btn.style.fontFamily = 'Orbitron, monospace';
  btn.onclick = showPlayerPrivacyPanel;
  document.body.appendChild(btn);
}
// Hide privacy panel when clicking outside
if (document.getElementById('player-privacy-panel')) {
  document.addEventListener('click', function(e) {
    const panel = document.getElementById('player-privacy-panel');
    if (panel && panel.style.display === 'block' && !panel.contains(e.target) && e.target.id !== 'privacy-btn') {
      hidePlayerPrivacyPanel();
    }
  });
}

// --- Trail Visibility Setting Logic ---
// Load and save the 'Show My Trail to Others' setting
function getShowTrailPublic() {
  return localStorage.getItem('showTrailPublic') === 'true';
}
function setShowTrailPublic(val) {
  localStorage.setItem('showTrailPublic', val ? 'true' : 'false');
}
// Initialize checkbox state on panel open
function initTrailVisibilityCheckbox() {
  const cb = document.getElementById('showTrailPublic');
  if (!cb) return;
  cb.checked = getShowTrailPublic();
  cb.onchange = function() {
    setShowTrailPublic(cb.checked);
  };
}
// Call this when privacy panel is shown
const origShowPlayerPrivacyPanel = showPlayerPrivacyPanel;
showPlayerPrivacyPanel = function() {
  origShowPlayerPrivacyPanel();
  setTimeout(initTrailVisibilityCheckbox, 0);
};

// --- Location Logs in Profile Panel ---
function renderLocationLogsProfile(logs) {
  let html = '<h3 style="margin-top:0;color:#00ff99;">Location Logs</h3>';
  if (!logs || logs.length === 0) {
    html += '<p>No location logs found.</p>';
  } else {
    html += '<ul style="max-height:180px;overflow-y:auto;padding-left:1em;">';
    logs.forEach(log => {
      html += `<li><b>${log.location}</b> <span style='color:#888;font-size:0.9em;'>(${new Date(log.timestamp).toLocaleString()})</span></li>`;
    });
    html += '</ul>';
  }
  const logDiv = document.getElementById('locationLogsProfile');
  if (logDiv) logDiv.innerHTML = html;
}
async function fetchAndShowLocationLogsProfile() {
  const user = JSON.parse(localStorage.getItem('userProfile') || '{}');
  if (!user.walletAddress) return;
  try {
    const res = await fetch(`/api/location-logs/${user.walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    const logs = await res.json();
    renderLocationLogsProfile(logs);
  } catch (e) {
    renderLocationLogsProfile([]);
  }
}
// Show/hide logs in profile panel
const showLocationLogsBtn = document.getElementById('showLocationLogsBtn');
if (showLocationLogsBtn) {
  showLocationLogsBtn.onclick = function() {
    const logsDiv = document.getElementById('locationLogsProfile');
    if (logsDiv.style.display === 'block') {
      logsDiv.style.display = 'none';
      showLocationLogsBtn.textContent = 'Show Location Logs';
    } else {
      fetchAndShowLocationLogsProfile();
      logsDiv.style.display = 'block';
      showLocationLogsBtn.textContent = 'Hide Location Logs';
    }
  };
}
// Hide floating locationLogs panel by default
const floatingLogs = document.getElementById('locationLogs');
if (floatingLogs) floatingLogs.style.display = 'none';

// 3. Bulk Buy Panel: Show only in jetpack mode & zoomed out
function updateBulkBuyPanel() {
  const panel = document.getElementById('bulk-buy-panel');
  const jetpackUI = document.getElementById('jetpack-ui');
  if (!panel || !jetpackUI) return;
  // Show if jetpack is visible and map is zoomed out (zoom <= 16)
  if (jetpackUI.style.display === 'block' && map.getZoom() <= 16) {
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}
// Update on jetpack toggle and map zoom
const origToggleJetpack = document.getElementById('toggle-jetpack').onclick;
document.getElementById('toggle-jetpack').onclick = function() {
  if (origToggleJetpack) origToggleJetpack();
  updateBulkBuyPanel();
};
map.on('zoomend', updateBulkBuyPanel);

// --- Plot Mode Toggle ---
document.getElementById('toggle-plot-mode').onclick = function() {
  if (!window.selectedPlotKey) return;
  const plot = window.plots[window.selectedPlotKey];
  if (!plot) return;
  // Toggle mode
  plot.mode = plot.mode === 'offence' ? 'defence' : 'offence';
  document.getElementById('plot-mode-select').value = plot.mode;
  // Optionally update UI or save to backend
  alert('Plot mode toggled to ' + plot.mode + '!');
};
document.getElementById('plot-mode-select').onchange = function() {
  if (!window.selectedPlotKey) return;
  const plot = window.plots[window.selectedPlotKey];
  if (!plot) return;
  plot.mode = this.value;
  // Optionally update UI or save to backend
};
// --- Player Visibility Toggle ---
document.getElementById('player-visibility-select').onchange = function(e) {
  const value = e.target.value;
  localStorage.setItem('playerVisibility', value);
  if (value === 'hidden') {
    alert('You are now hidden from other players.');
  } else {
    alert('You are now visible to other players.');
  }
};
// --- Bulk Plot Purchase ---
document.getElementById('buy-grid-plots').onclick = function() {
  // Example: claim all visible grid plots
  const bounds = map.getBounds();
  let claimed = 0;
  for (const key in window.plots) {
    const [lat, lng] = key.split('_').map(Number);
    if (bounds.contains([lat, lng])) {
      upsertPlot(lat, lng, getCurrentUserId());
      claimed++;
    }
  }
  alert('Bought ' + claimed + ' plots in grid!');
  updatePlotStats && updatePlotStats();
  drawGrid(map.getCenter().lat, map.getCenter().lng);
};

// --- Player Movement Trail, Mining, and Anti-Bot Logic ---

// Movement state
let lastPlayerPos = null;
let lastMoveTime = null;
let idleTimer = null;
let homeBase = null;
let homeBaseStart = null;
let idleStart = null;
let movementTrail = []; // {lat, lng, time, speed, color, flag}
const TRAIL_DURATION = 10 * 60 * 1000; // 10 minutes
const IDLE_LIGHTUP_INTERVAL = 15000; // 15s
const IDLE_TIME = 2 * 60 * 1000; // 2 min
const HOME_BASE_TIME = 60 * 60 * 1000; // 1 hour
const MULTI_DAY_HOME = 2 * 24 * 60 * 60 * 1000; // 2 days
const SPEED_THRESHOLDS = { slow: 0.5, normal: 2, fast: 10 }; // mph
const plotTraffic = {}; // key: plotKey, value: [{time, userId, speed}]

function toRad(deg) { return deg * Math.PI / 180; }
function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function logMovement(lat, lng, speed) {
  const userId = getCurrentUserId();
  const time = Date.now();
  // Log for anti-bot
  fetch('/api/movement-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, lat, lng, speed, time })
  });
  // Track traffic for plot
  const key = getPlotKey(lat, lng);
  if (!plotTraffic[key]) plotTraffic[key] = [];
  plotTraffic[key].push({ time, userId, speed });
  // Clean up old traffic
  plotTraffic[key] = plotTraffic[key].filter(e => time - e.time < 24*60*60*1000);
}

function getTrailColor(speed) {
  if (speed < SPEED_THRESHOLDS.slow) return 'blue';
  if (speed < SPEED_THRESHOLDS.normal) return 'gold';
  if (speed < SPEED_THRESHOLDS.fast) return 'orange';
  return 'red';
}

function emitTrailParticles(lat, lng, color, flag) {
  // Use a div overlay for particles
  const id = 'trail-particles-' + getPlotKey(lat, lng);
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = 1500;
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.left = '-100px';
    el.style.top = '-100px';
    document.body.appendChild(el);
  }
  // Project to screen
  const pt = map.latLngToContainerPoint([lat, lng]);
  el.style.left = (pt.x - 20) + 'px';
  el.style.top = (pt.y - 20) + 'px';
  el.innerHTML = `<div class='trail-particle' style='width:40px;height:40px;pointer-events:none;animation:trail-pop 1.2s;${flag?"border:2px solid red;box-shadow:0 0 12px 4px red;":""}'>
    <span style='color:${color};font-size:2em;'>${flag?"🚩":color=="gold"?"💰":color=="blue"?"💧":color=="orange"?"⚡":""}</span>
  </div>`;
  setTimeout(()=>{ if(el) el.innerHTML=''; }, 1200);
}

// Add CSS for particle animation
if (!document.getElementById('trail-particle-style')) {
  const style = document.createElement('style');
  style.id = 'trail-particle-style';
  style.textContent = `
  @keyframes trail-pop { 0%{transform:scale(0.5);opacity:0.7;} 60%{transform:scale(1.2);opacity:1;} 100%{transform:scale(1);opacity:0;} }
  .trail-particle { position:absolute; left:0; top:0; pointer-events:none; }
  `;
  document.head.appendChild(style);
}

function updateTrail() {
  const now = Date.now();
  movementTrail = movementTrail.filter(e => now - e.time < TRAIL_DURATION);
  // Optionally update plot tint for high traffic
  for (const key in plotTraffic) {
    const traffic = plotTraffic[key].filter(e => now - e.time < 24*60*60*1000);
    if (traffic.length > 0) {
      const [lat, lng] = key.split('_').map(Number);
      const rect = gridLayer.getLayers().find(r => getPlotKey(r.getBounds().getSouthWest().lat, r.getBounds().getSouthWest().lng) === key);
      if (rect && rect.getElement()) {
        const intensity = Math.min(traffic.length/20, 1);
        rect.getElement().style.background = `rgba(255,215,0,${intensity*0.3})`;
      }
    }
  }
}
setInterval(updateTrail, 5000);

// --- Movement Logging for Steps, Miles, Fly Time, and Stats ---
// User stats structure
window.userStats = window.userStats || {
  steps: 0,
  miles: 0,
  flyTime: 0,
  lastAltitude: 0,
  lastUpdate: Date.now(),
};

function logMovementStats(lat, lng, speed, altitude) {
  const now = Date.now();
  // Walking pace: < 4 mph
  if (speed > 0.1 && speed < 4) {
    // Estimate steps: 1 mile ~ 2000 steps
    const dist = speed * ((now - window.userStats.lastUpdate) / 3600000); // miles
    window.userStats.steps += Math.round(dist * 2000);
    window.userStats.miles += dist;
  } else if (speed >= 4 && speed < 100) {
    // Driving
    const dist = speed * ((now - window.userStats.lastUpdate) / 3600000); // miles
    window.userStats.miles += dist;
  }
  // Fly time: altitude > 20 meters (simulate, as geolocation may not provide altitude)
  if (altitude && altitude > 20) {
    window.userStats.flyTime += (now - window.userStats.lastUpdate) / 1000; // seconds
  }
  window.userStats.lastAltitude = altitude || 0;
  window.userStats.lastUpdate = now;
  // Send to backend for leaderboard
  fetch('/api/user-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: getCurrentUserId(),
      steps: window.userStats.steps,
      miles: window.userStats.miles,
      flyTime: window.userStats.flyTime,
      timestamp: now
    })
  });
}
// Hook into onPlayerMove
const origOnPlayerMove = onPlayerMove;
onPlayerMove = function(newLat, newLng, altitude) {
  const now = Date.now();
  if (lastPlayerPos) {
    const dist = haversine(lastPlayerPos.lat, lastPlayerPos.lng, newLat, newLng);
    const dt = (now - lastMoveTime) / 3600000; // hours
    const speed = dt > 0 ? dist / dt : 0; // mph
    logMovementStats(newLat, newLng, speed, altitude);
  }
  origOnPlayerMove(newLat, newLng, altitude);
};

function onPlayerMove(newLat, newLng) {
  const now = Date.now();
  if (lastPlayerPos) {
    const dist = haversine(lastPlayerPos.lat, lastPlayerPos.lng, newLat, newLng);
    const dt = (now - lastMoveTime) / 3600000; // hours
    const speed = dt > 0 ? dist / dt : 0; // mph
    const color = getTrailColor(speed);
    const flag = speed > SPEED_THRESHOLDS.fast;
    movementTrail.push({lat: lastPlayerPos.lat, lng: lastPlayerPos.lng, time: now, speed, color, flag});
    emitTrailParticles(lastPlayerPos.lat, lastPlayerPos.lng, color, flag);
    logMovement(lastPlayerPos.lat, lastPlayerPos.lng, speed);
    // Mining logic
    if (speed > SPEED_THRESHOLDS.normal) {
      // Auto-mine
      handlePlotClick(lastPlayerPos.lat, lastPlayerPos.lng, window.plots[getPlotKey(lastPlayerPos.lat, lastPlayerPos.lng)]);
    }
    if (flag) {
      // Plant red flag for bot detection
      // Already handled in emitTrailParticles
    }
    // Home base logic
    if (homeBase && haversine(homeBase.lat, homeBase.lng, newLat, newLng) > 0.01) {
      homeBase = null; homeBaseStart = null;
    }
  }
  lastPlayerPos = {lat: newLat, lng: newLng};
  lastMoveTime = now;
  idleStart = now;
}

// Geolocation update hook
function watchPlayerPosition() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      pos => {
        onPlayerMove(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
  }
}
watchPlayerPosition();

// Idle logic
setInterval(() => {
  const now = Date.now();
  if (lastMoveTime && now - lastMoveTime > IDLE_TIME) {
    // Light up random nearby tiles
    const center = lastPlayerPos || map.getCenter();
    for (let i = 0; i < 3; i++) {
      const lat = center.lat + (Math.random()-0.5)*0.0002;
      const lng = center.lng + (Math.random()-0.5)*0.0002;
      emitTrailParticles(lat, lng, 'gold', false);
      // Allow click-mine
      const key = getPlotKey(lat, lng);
      if (!window.idleMineTiles) window.idleMineTiles = {};
      window.idleMineTiles[key] = {lat, lng, time: now};
    }
  }
  // Home base logic
  if (lastMoveTime && now - lastMoveTime > HOME_BASE_TIME) {
    if (!homeBase) {
      homeBase = lastPlayerPos;
      homeBaseStart = now;
    }
    // Multi-day home base
    if (homeBase && homeBaseStart && now - homeBaseStart > MULTI_DAY_HOME) {
      // Enable auto-mining for all plots in area
      // (simulate: just auto-mine all nearby plots)
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const lat = homeBase.lat + i*0.000018;
          const lng = homeBase.lng + j*0.000018;
          handlePlotClick(lat, lng, window.plots[getPlotKey(lat, lng)]);
        }
      }
    }
  }
}, IDLE_LIGHTUP_INTERVAL);

// Click-mine for idle tiles
map.on('click', function(e) {
  if (!window.idleMineTiles) return;
  const key = getPlotKey(e.latlng.lat, e.latlng.lng);
  if (window.idleMineTiles[key]) {
    handlePlotClick(e.latlng.lat, e.latlng.lng, window.plots[key]);
    delete window.idleMineTiles[key];
  }
});

// --- Shared Trail Data Structure and Rendering ---
// Simulate a global shared trails object (in production, this would be synced via backend/websocket)
window.sharedTrails = window.sharedTrails || {};

// Add/update current user's trail in sharedTrails if sharing is enabled
function updateSharedTrail() {
  if (getShowTrailPublic()) {
    const userId = getCurrentUserId();
    // Only keep the last 10 minutes of trail
    const now = Date.now();
    const myTrail = movementTrail.filter(e => now - e.time < TRAIL_DURATION);
    window.sharedTrails[userId] = myTrail;
  } else {
    // Remove from shared trails if not sharing
    delete window.sharedTrails[getCurrentUserId()];
  }
}
setInterval(updateSharedTrail, 5000);

// Simulate other users' shared trails (for demo, random walk agents)
if (!window.simulatedTrailAgents) {
  window.simulatedTrailAgents = [
    { id: 'agentA', color: '#21f3c7', lat: 33.749, lng: -84.388, trail: [] },
    { id: 'agentB', color: '#ff00cc', lat: 33.750, lng: -84.389, trail: [] }
  ];
  setInterval(() => {
    window.simulatedTrailAgents.forEach(agent => {
      // Random walk
      agent.lat += (Math.random() - 0.5) * 0.00008;
      agent.lng += (Math.random() - 0.5) * 0.00008;
      agent.trail.push({ lat: agent.lat, lng: agent.lng, time: Date.now(), color: agent.color });
      // Keep only last 10 min
      agent.trail = agent.trail.filter(e => Date.now() - e.time < TRAIL_DURATION);
      window.sharedTrails[agent.id] = agent.trail;
    });
  }, 4000);
}

// Draw all shared trails on the map
let sharedTrailLayers = {};
function renderSharedTrails() {
  // Remove old layers
  Object.values(sharedTrailLayers).forEach(layer => map.removeLayer(layer));
  sharedTrailLayers = {};
  Object.entries(window.sharedTrails).forEach(([userId, trail]) => {
    if (!trail || trail.length < 2) return;
    // Don't show own trail if not sharing
    if (userId === getCurrentUserId() && !getShowTrailPublic()) return;
    const latlngs = trail.map(e => [e.lat, e.lng]);
    const color = trail[0].color || '#00ff99';
    const poly = L.polyline(latlngs, {
      color: color,
      weight: 5,
      opacity: 0.5,
      dashArray: '8,8',
      lineCap: 'round',
      interactive: false
    }).addTo(map);
    sharedTrailLayers[userId] = poly;
  });
}
setInterval(renderSharedTrails, 5000);

// --- Leaderboard Panel Logic ---
function fetchAndShowLeaderboard() {
  const content = document.getElementById('leaderboard-content');
  content.textContent = 'Loading...';
  fetch('/api/leaderboard')
    .then(res => res.json())
    .then(data => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        content.innerHTML = '<p>No leaderboard data.</p>';
        return;
      }
      let html = '<table style="width:100%;color:#00ff99;font-size:15px;">';
      html += '<tr><th style="text-align:left;">Player</th><th>Steps</th><th>Miles</th><th>Fly Time</th></tr>';
      data.forEach(row => {
        html += `<tr><td>${row.name || row.userId}</td><td>${row.steps||0}</td><td>${(row.miles||0).toFixed(2)}</td><td>${Math.round(row.flyTime||0)}s</td></tr>`;
      });
      html += '</table>';
      content.innerHTML = html;
    })
    .catch(() => { content.innerHTML = '<p>Failed to load leaderboard.</p>'; });
}
const leaderboardPanel = document.getElementById('leaderboard-panel');
const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
if (showLeaderboardBtn) {
  showLeaderboardBtn.onclick = function() {
    if (leaderboardPanel.style.display === 'block') {
      leaderboardPanel.style.display = 'none';
    } else {
      leaderboardPanel.style.display = 'block';
      fetchAndShowLeaderboard();
    }
  };
}