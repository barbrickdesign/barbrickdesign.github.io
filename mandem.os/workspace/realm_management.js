// Realm Management UI logic
async function fetchMyRealms(walletAddress) {
  const res = await fetch(`/api/forged-assets?owner_wallet=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return [];
  return await res.json();
}
async function fetchCollabRealms(walletAddress) {
  const res = await fetch(`/api/collab-realms?collaborator=${encodeURIComponent(walletAddress)}`);
  if (!res.ok) return [];
  return await res.json();
}
function renderRealmGrid(realms, gridId, isOwner) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  realms.forEach(realm => {
    const div = document.createElement('div');
    div.style.width = '140px';
    div.style.background = '#222';
    div.style.borderRadius = '10px';
    div.style.padding = '8px';
    div.style.cursor = 'pointer';
    div.style.boxShadow = '0 2px 8px #0004';
    div.innerHTML = `
      <img src="/3DModels/${realm.asset_filename.replace('.glb','.jpg')}" alt="preview" style="width:100%;height:90px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'"/>
      <div style="font-size:15px;font-weight:bold;margin:6px 0 2px 0;">${realm.asset_filename.replace(/_/g,' ').replace('.glb','')}</div>
      <div style="font-size:12px;color:#aaa;">Minted: ${realm.mint_count||0}/${realm.mint_limit||1}</div>
      <div style="font-size:12px;color:#0ff;">${realm.special_ability||''}</div>
    `;
    div.onclick = () => showRealmModal(realm, isOwner);
    grid.appendChild(div);
  });
}
const realmModal = document.getElementById('realmModal');
const closeRealmModal = document.getElementById('closeRealmModal');
function showRealmModal(realm, isOwner) {
  document.getElementById('realmModalName').textContent = realm.asset_filename.replace(/_/g,' ').replace('.glb','');
  document.getElementById('realmModalMeta').innerHTML = `Owner: ${realm.owner_wallet.slice(0,8)}...<br>Special: ${realm.special_ability||''}`;
  // Collaborators (placeholder, to be fetched from backend)
  document.getElementById('realmCollaborators').innerHTML = '<b>Collaborators:</b><br><i>Loading...</i>';
  fetch(`/api/realm-collaborators?realm_id=${realm.id}`).then(res => res.json()).then(collabs => {
    document.getElementById('realmCollaborators').innerHTML = '<b>Collaborators:</b><ul>' +
      collabs.map(c => `<li>${c.wallet} (${c.role})</li>`).join('') + '</ul>';
  });
  // Invite controls (only for owner)
  const inviteControls = document.getElementById('realmInviteControls');
  inviteControls.innerHTML = '';
  if (isOwner) {
    inviteControls.innerHTML = `
      <input id="inviteWalletInput" type="text" placeholder="Wallet address to invite" style="width:70%;padding:6px;" />
      <select id="inviteRoleInput"><option value="builder">Builder</option><option value="decorator">Decorator</option><option value="admin">Admin</option></select>
      <button id="inviteBtn" class="auth-button">Invite</button>
    `;
    document.getElementById('inviteBtn').onclick = async function() {
      const wallet = document.getElementById('inviteWalletInput').value.trim();
      const role = document.getElementById('inviteRoleInput').value;
      if (!wallet) return;
      const res = await fetch('/api/realm-collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realm_id: realm.id, wallet, role })
      });
      if (res.ok) {
        document.getElementById('realmModalStatus').textContent = 'Collaborator invited!';
        showRealmModal(realm, isOwner);
      } else {
        const err = await res.json();
        document.getElementById('realmModalStatus').textContent = 'Invite failed: ' + (err.error || 'Unknown error');
      }
    };
  }
  realmModal.style.display = 'flex';
  document.getElementById('realmModalStatus').textContent = '';
}
closeRealmModal.onclick = () => { realmModal.style.display = 'none'; };
realmModal.addEventListener('click', e => {
  if (e.target === realmModal) realmModal.style.display = 'none';
});
async function loadRealmsUI() {
  const user = JSON.parse(localStorage.getItem('currentUser')||'null');
  if (!user || !user.walletAddress) return;
  const myRealms = await fetchMyRealms(user.walletAddress);
  renderRealmGrid(myRealms, 'myRealmsGrid', true);
  const collabRealms = await fetchCollabRealms(user.walletAddress);
  renderRealmGrid(collabRealms, 'collabRealmsGrid', false);
}
document.addEventListener('DOMContentLoaded', loadRealmsUI);