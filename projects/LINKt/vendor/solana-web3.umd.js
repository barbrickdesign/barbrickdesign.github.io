// Loader: attempt to import the local browser ESM build and expose a global `solanaWeb3` for legacy code.
// Falls back to a small shim if import fails.
(function(){
  try{
    if(window.solanaWeb3 || window.solana_web3 || window.solana) return;
    const esmPath = './index.browser.esm.js';
    import(esmPath).then(mod => {
      // Normalize exports
      const Connection = mod.Connection || mod.default?.Connection || mod.default || null;
      const PublicKey = mod.PublicKey || mod.default?.PublicKey || mod.default || null;
      const clusterApiUrl = mod.clusterApiUrl || (n=> 'https://api.mainnet-beta.solana.com');
      window.solanaWeb3 = { Connection, PublicKey, clusterApiUrl };
      window.solana_web3 = window.solanaWeb3; window.solanaweb3 = window.solanaWeb3; window.solana = window.solana || {};
      console.log('Local solana ESM loaded and exposed as window.solanaWeb3');
    }).catch(err=>{
      console.warn('Failed to import local solana ESM build', err);
      // Fallback shim
      (function(global){
        function clusterApiUrl(network){ if(network && network.indexOf('devnet')!==-1) return 'https://api.devnet.solana.com'; return 'https://api.mainnet-beta.solana.com'; }
        class PublicKey { constructor(s){ this._s = s; } toBase58(){ return String(this._s); } toString(){ return String(this._s); } }
        class Connection { constructor(url, commitment){ this._url = typeof url === 'function' ? url('mainnet-beta') : (url || clusterApiUrl('mainnet-beta')); this._commitment = commitment || 'confirmed'; }
          async getSignaturesForAddress(pubkey, opts){ const addr = (pubkey && pubkey.toBase58) ? pubkey.toBase58() : String(pubkey); try{ const body = { jsonrpc:'2.0', id:1, method:'getSignaturesForAddress', params:[addr, { limit: opts?.limit||4 }, this._commitment] }; const res = await fetch(this._url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); if(!res.ok) return []; const j = await res.json(); return j && j.result ? j.result : []; }catch(e){ console.warn('vendor Connection.getSignaturesForAddress failed', e); return []; } }
        global.solanaWeb3 = global.solanaWeb3 || {};
        global.solanaWeb3.clusterApiUrl = clusterApiUrl;
        global.solanaWeb3.PublicKey = PublicKey;
        global.solanaWeb3.Connection = Connection;
      })(window);
    });
  }catch(e){ console.warn('solana-web3 loader error', e); }
})();
