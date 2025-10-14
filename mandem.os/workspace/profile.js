showDebugLog('profile.js loaded and running!');

// Show profile section if user is logged in
function showProfileSection() {
    document.getElementById('profile-section').style.display = 'block';
    updateProfileUI();
}

// Uptime reward config
const UPTIME_REWARD_USD_PER_SEC = 0.01; // $0.01 per second
const MGC_PER_USD = 100; // Example: 100 MGC = $1 (update as needed)

function getMgcPerUsd() {
    // This could be dynamic if you fetch from server or oracle
    return MGC_PER_USD;
}

function getUptimeRewardMgc() {
    return UPTIME_REWARD_USD_PER_SEC * getMgcPerUsd();
}

// Track and reward uptime every second
function startUptimeRewards() {
    setInterval(() => {
        let profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
        if (!profile) return;
        // Add reward
        profile.inGameMGC = (profile.inGameMGC || 0) + getUptimeRewardMgc();
        localStorage.setItem('userProfile', JSON.stringify(profile));
        // Optionally, log the reward
        let txLog = JSON.parse(localStorage.getItem('transactionLog') || '[]');
        txLog.push({
            type: 'Uptime Reward',
            details: { amount: getUptimeRewardMgc().toFixed(2), currency: 'MGC' },
            timestamp: new Date().toLocaleString()
        });
        // Keep log size reasonable
        if (txLog.length > 1000) txLog = txLog.slice(-1000);
        localStorage.setItem('transactionLog', JSON.stringify(txLog));
    }, 1000);
}

function isUserAuthenticated() {
    // Require userLoggedIn flag and currentUser in localStorage
    const loggedIn = localStorage.getItem('userLoggedIn') === 'true';
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return loggedIn && user && user.email;
}

function enforceAuth() {
    if (!isUserAuthenticated()) {
        showDebugLog('Not authenticated, redirecting to login.html');
        window.location.href = 'login.html';
    }
}

// Utility to get/set connected wallets array in userProfile
function getConnectedWallets() {
    let profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    return (profile && Array.isArray(profile.wallets)) ? profile.wallets : (profile && profile.walletAddress ? [profile.walletAddress] : []);
}
function setConnectedWallets(wallets) {
    let profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    if (!profile) return;
    profile.wallets = wallets;
    // Optionally, set the first wallet as primary
    if (wallets.length > 0) profile.walletAddress = wallets[0];
    localStorage.setItem('userProfile', JSON.stringify(profile));
}

// Utility: Check if profile has required info
function profileHasRequiredInfo() {
    let profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    return profile && profile.displayName && profile.email;
}

// Utility: Create or update user profile in backend (placeholder)
async function createOrUpdateUserProfileBackend(profile) {
    // TODO: Replace with real API call
    // await fetch('/api/user/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
}

// Dynamically determine backend API base URL
const API_BASE_URL =
  window.location.origin.includes('localhost') || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000' // Local dev
    : window.location.origin; // Production (same host as frontend)

// Use getApiBaseUrl() for all fetch calls
// Example:
// fetch(`${getApiBaseUrl()}/api/user/profile`, ...)

// Helper: Fetch user profile from backend (by email or wallet address)
async function fetchUserProfile(identifier) {
    let url;
    if (identifier && identifier.includes && identifier.includes('@')) {
        url = `${getApiBaseUrl()}/api/user/profile?email=${encodeURIComponent(identifier)}`;
    } else {
        url = `${getApiBaseUrl()}/api/user/profile?walletAddress=${encodeURIComponent(identifier)}`;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
}
// Helper: Save user profile to backend
async function saveUserProfileToBackend(profile) {
    const res = await fetch(`${getApiBaseUrl()}/api/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
    });
    return res.ok;
}

// Update profile UI to show editable fields and all wallets
async function updateProfileUI() {
    let user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    let profile = null;
    if (user && (user.email || user.walletAddress)) {
        const identifier = user.email || user.walletAddress;
        profile = await fetchUserProfile(identifier);
        if (profile) localStorage.setItem('userProfile', JSON.stringify(profile));
    } else {
        profile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    }
    const walletBtn = document.getElementById('connect-wallet-btn');
    // Show/hide connect wallet button and display wallet address
    let walletAddress = (user && user.walletAddress) ? user.walletAddress : (profile && profile.walletAddress) ? profile.walletAddress : null;
    if (!walletAddress) {
        document.getElementById('profile-wallet-address').textContent = '-';
        walletBtn.style.display = 'inline-block';
    } else {
        document.getElementById('profile-wallet-address').textContent = walletAddress;
        walletBtn.style.display = 'none';
    }
    if (!user && !profile) return;
    // Prefer displayName/email from user, fallback to profile
    document.getElementById('profile-display-name').textContent = (user && user.displayName) ? user.displayName : (profile && profile.displayName) ? profile.displayName : '-';
    document.getElementById('profile-email').textContent = (user && user.email) ? user.email : (profile && profile.email) ? profile.email : '-';
    // Wallet MGC balance (async)
    let totalMGC = 0;
    let walletMGC = 0;
    if (window.getMGCBalance && walletAddress) {
        document.getElementById('profile-wallet-mgc').textContent = 'Loading...';
        walletMGC = await window.getMGCBalance(walletAddress);
        document.getElementById('profile-wallet-mgc').textContent = walletMGC;
    } else {
        walletMGC = (profile && profile.mgcBalance) ? profile.mgcBalance : 0;
        document.getElementById('profile-wallet-mgc').textContent = walletMGC;
    }
    let inGameMGC = (profile && profile.inGameMGC) ? profile.inGameMGC : 0;
    document.getElementById('profile-ingame-mgc').textContent = inGameMGC;
    totalMGC = Number(walletMGC) + Number(inGameMGC);
    // Display total MGC in the UI
    document.getElementById('profile-total-mgc').textContent = totalMGC;
    // Transaction log (show wallet address if present)
    let txLog = JSON.parse(localStorage.getItem('transactionLog') || '[]');
    let logHtml = txLog.slice(-10).reverse().map(tx => {
        let walletInfo = tx.details.walletAddress ? ` (${tx.details.walletAddress})` : '';
        let reason = tx.details.reason ? ` - ${tx.details.reason}` : '';
        return `<li><b>${tx.type}</b>${walletInfo}: ${tx.details.status || ''}${reason} <span style='font-size:10px;color:#aaa;'>${tx.timestamp}</span></li>`;
    }).join('');
    document.getElementById('profile-transaction-log').innerHTML = logHtml;
    // Editable fields
    document.getElementById('profile-display-name-input').value = (user && user.displayName) ? user.displayName : (profile && profile.displayName) ? profile.displayName : '';
    document.getElementById('profile-email-input').value = (user && user.email) ? user.email : (profile && profile.email) ? profile.email : '';
    // Wallets
    let wallets = getConnectedWallets();
    let walletList = document.getElementById('profile-wallet-list');
    walletList.innerHTML = wallets.map(w => `<li>${w}</li>`).join('');
    // Primary wallet
    walletAddress = wallets.length > 0 ? wallets[0] : null;
    document.getElementById('profile-wallet-address').textContent = walletAddress || '-';
    // Enable/disable connect wallet button based on required info
    if (walletBtn) walletBtn.disabled = !profileHasRequiredInfo();
}

// Save display name
async function saveDisplayName() {
    let val = document.getElementById('profile-display-name-input').value.trim();
    let user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    let profile = null;
    if (user && user.email) {
        profile = await fetchUserProfile(user.email);
        if (profile) {
            profile.displayName = val;
            await saveUserProfileToBackend(profile);
            localStorage.setItem('userProfile', JSON.stringify(profile));
        }
    }
    updateProfileUI();
}
// Save email
async function saveEmail() {
    let val = document.getElementById('profile-email-input').value.trim();
    let user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    let profile = null;
    if (user && user.email) {
        profile = await fetchUserProfile(user.email);
        if (profile) {
            profile.email = val;
            await saveUserProfileToBackend(profile);
            localStorage.setItem('userProfile', JSON.stringify(profile));
        }
    }
    updateProfileUI();
}
// Connect another wallet
async function connectAnotherWallet() {
    if (window.solana && window.solana.isPhantom) {
        try {
            const resp = await window.solana.connect();
            const newWallet = resp.publicKey.toString();
            let wallets = getConnectedWallets();
            if (!wallets.includes(newWallet)) {
                wallets.push(newWallet);
                setConnectedWallets(wallets);
                alert('Wallet connected: ' + newWallet);
            } else {
                alert('Wallet already connected.');
            }
            let user = JSON.parse(localStorage.getItem('currentUser') || 'null');
            let profile = null;
            if (user && user.email) {
                profile = await fetchUserProfile(user.email);
                if (profile) {
                    await saveUserProfileToBackend(profile);
                    localStorage.setItem('userProfile', JSON.stringify(profile));
                }
            }
            updateProfileUI();
        } catch (e) {
            alert('Wallet connection failed.');
        }
    } else {
        alert('Phantom wallet not detected.');
    }
}

// Improved: Connect Phantom wallet and update UI/profile
async function handleConnectWallet() {
    if (!(window.solana && window.solana.isPhantom)) {
        alert('Phantom wallet not detected. Please install Phantom and refresh.');
        return;
    }
    try {
        // Request wallet connection
        const resp = await window.solana.connect();
        const walletAddress = resp.publicKey.toString();
        // Optionally, request a signature for verification
        // const message = `Sign in to Gem Bot Portal: ${new Date().toISOString()}`;
        // const encodedMessage = new TextEncoder().encode(message);
        // await window.solana.signMessage(encodedMessage, { display: 'utf8' });

        // Save to localStorage
        let user = {
            walletAddress,
            displayName: walletAddress,
            email: walletAddress + '@walletuser.com'
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('lastWalletAuth', new Date().toISOString());
        // Fetch or create user profile from backend
        let profile = await fetchUserProfile(walletAddress);
        if (!profile) {
            // Create new profile if not found
            profile = {
                displayName: walletAddress,
                email: walletAddress + '@walletuser.com',
                walletAddress,
                inGameMGC: 0,
                mgcBalance: 0
            };
            await saveUserProfileToBackend(profile);
        }
        localStorage.setItem('userProfile', JSON.stringify(profile));
        // Update UI
        updateProfileUI();
        alert('Phantom wallet connected: ' + walletAddress);
    } catch (err) {
        alert('Phantom wallet connection failed: ' + (err && err.message ? err.message : err));
    }
}

// Log GPS location every second for uptime verification
function startGpsLogging() {
    if (!navigator.geolocation) return;
    setInterval(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                let gpsLog = JSON.parse(localStorage.getItem('gpsLog') || '[]');
                gpsLog.push({
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                });
                // Keep only the last 3600 entries (1 hour at 1/sec)
                if (gpsLog.length > 3600) gpsLog = gpsLog.slice(-3600);
                localStorage.setItem('gpsLog', JSON.stringify(gpsLog));
            },
            (err) => {
                // Optionally log errors or permission denials
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );
    }, 1000);
}

// Update Travel & Leaderboard Stats UI
function updateLeaderboardStatsUI() {
    // Get last leaderboard stats from last sync or local calculation
    const gpsLog = JSON.parse(localStorage.getItem('gpsLog') || '[]');
    const leaderboardStats = {
        distance: gpsLog.length > 1 ? calcTotalDistance(gpsLog) : 0,
        uptime: gpsLog.length,
        lastSync: localStorage.getItem('lastLeaderboardSync') || '-'
    };
    document.getElementById('stat-distance').textContent = leaderboardStats.distance.toFixed(1);
    document.getElementById('stat-uptime').textContent = leaderboardStats.uptime;
    document.getElementById('stat-last-sync').textContent = leaderboardStats.lastSync;
    // Show last 5 locations
    const log = gpsLog.slice(-5).reverse();
    document.getElementById('stat-travel-log').innerHTML = log.map(l => `<li>${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)} <span style='color:#aaa;font-size:10px;'>${new Date(l.timestamp).toLocaleTimeString()}</span></li>`).join('');
    // Show MGC per $1
    let mgcPerUsd = getMgcPerUsd();
    let mgcPerUsdDiv = document.getElementById('stat-mgc-per-usd');
    if (!mgcPerUsdDiv) {
        mgcPerUsdDiv = document.createElement('div');
        mgcPerUsdDiv.id = 'stat-mgc-per-usd';
        document.getElementById('leaderboard-stats').appendChild(mgcPerUsdDiv);
    }
    mgcPerUsdDiv.textContent = `MGC per $1: ${mgcPerUsd}`;
}

// Send GPS log and leaderboard stats to server every minute
async function syncTravelAndLeaderboard() {
    const gpsLog = JSON.parse(localStorage.getItem('gpsLog') || '[]');
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || !user.walletAddress) return;
    const leaderboardStats = {
        distance: gpsLog.length > 1 ? calcTotalDistance(gpsLog) : 0,
        uptime: gpsLog.length,
        lastSync: new Date().toISOString()
    };
    try {
        await fetch(`${getApiBaseUrl()}/api/user/travel-leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                walletAddress: user.walletAddress,
                gpsLog,
                leaderboardStats
            })
        });
        localStorage.setItem('lastLeaderboardSync', leaderboardStats.lastSync);
    } catch (e) {}
    updateLeaderboardStatsUI();
}

// Calculate total distance from GPS log
function calcTotalDistance(log) {
    let dist = 0;
    for (let i = 1; i < log.length; i++) {
        dist += haversine(log[i-1], log[i]);
    }
    return dist;
}

// Haversine formula for distance between two lat/lon points (in meters)
function haversine(a, b) {
    const R = 6371000;
    const toRad = deg => deg * Math.PI / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const x = dLon * Math.cos((lat1 + lat2) / 2);
    return Math.sqrt(dLat * dLat + x * x) * R;
}

// Start syncing every minute
setInterval(syncTravelAndLeaderboard, 60000);

// Update leaderboard stats UI every 1 second
setInterval(updateLeaderboardStatsUI, 1000);

function attachLogoutListener() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && !logoutBtn._listenerAttached) {
        logoutBtn._listenerAttached = true;
        logoutBtn.addEventListener('click', function() {
            showDebugLog('Logout button clicked');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('userLoggedIn');
            localStorage.removeItem('lastWalletAuth');
            showDebugLog('LocalStorage cleared, redirecting to login.html');
            window.location.href = 'login.html';
        });
    }
}

// --- Auto-logout on session end or inactivity ---
function logoutAndRedirect() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('lastWalletAuth');
    window.location.href = 'login.html';
}

// Logout on page refresh (session end)
window.addEventListener('beforeunload', () => {
    logoutAndRedirect();
});

// Logout after 5 minutes of inactivity
let inactivityTimeout;
function resetInactivityTimer() {
    if (inactivityTimeout) clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
        logoutAndRedirect();
    }, 5 * 60 * 1000); // 5 minutes
}
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer);
});
resetInactivityTimer();

document.addEventListener('DOMContentLoaded', () => {
    enforceAuth(); // Always check auth on page load
    let user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user && user.walletAddress) {
        showProfileSection();
    }
    document.getElementById('profile-deposit-btn').addEventListener('click', async () => {
        let amt = parseFloat(document.getElementById('profile-deposit-amount').value);
        if (window.depositMGC && amt > 0) {
            await window.depositMGC(amt);
            updateProfileUI();
        }
    });
    document.getElementById('profile-withdraw-btn').addEventListener('click', async () => {
        let amt = parseFloat(document.getElementById('profile-withdraw-amount').value);
        if (window.withdrawMGC && amt > 0) {
            await window.withdrawMGC(amt);
            updateProfileUI();
        }
    });
    // Real-time profile UI update every 1 second
    setInterval(updateProfileUI, 1000);
    document.getElementById('connect-wallet-btn').addEventListener('click', handleConnectWallet);
    document.getElementById('save-display-name').addEventListener('click', saveDisplayName);
    document.getElementById('save-email').addEventListener('click', saveEmail);
    document.getElementById('connect-another-wallet-btn').addEventListener('click', connectAnotherWallet);
    attachLogoutListener();
    // Fallback: observe DOM for late-added logout button
    const observer = new MutationObserver(() => attachLogoutListener());
    observer.observe(document.body, { childList: true, subtree: true });
    startGpsLogging();
    startUptimeRewards();
    // Enforce auth on all pages except home/login
    const openPage = window.location.pathname.split('/').pop();
    if (!['index.html', '', 'login.html'].includes(openPage)) {
        enforceAuth();
    }
});

// User Forged Assets Gallery
async function fetchUserForgedAssets(walletAddress) {
  const res = await fetch(`/api/forged-assets?owner_wallet=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return [];
  return await res.json();
}
function renderForgedAssetsGallery(assets) {
  const grid = document.getElementById('forgedAssetsGrid');
  grid.innerHTML = '';
  assets.forEach(asset => {
    const div = document.createElement('div');
    div.style.width = '140px';
    div.style.background = '#222';
    div.style.borderRadius = '10px';
    div.style.padding = '8px';
    div.style.cursor = 'default';
    div.style.boxShadow = '0 2px 8px #0004';
    div.innerHTML = `
      <img src="/3DModels/${asset.asset_filename.replace('.glb','.jpg')}" alt="preview" style="width:100%;height:90px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'"/>
      <div style="font-size:15px;font-weight:bold;margin:6px 0 2px 0;">${asset.asset_filename.replace(/_/g,' ').replace('.glb','')}</div>
      <div style="font-size:12px;color:#aaa;">Minted: ${asset.mint_count}/${asset.mint_limit}</div>
      <div style="font-size:12px;color:#0ff;">${asset.special_ability||''}</div>
    `;
    grid.appendChild(div);
  });
}
async function loadUserForgedAssets() {
  const user = JSON.parse(localStorage.getItem('currentUser')||'null');
  if (!user || !user.walletAddress) return;
  const assets = await fetchUserForgedAssets(user.walletAddress);
  renderForgedAssetsGallery(assets);
}
document.addEventListener('DOMContentLoaded', loadUserForgedAssets);
