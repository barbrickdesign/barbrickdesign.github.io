// healthcheck.js - small runtime checks appended to the boot log
(function(){
  function writeln(msg){ try{ const el=document.getElementById('bootLog'); const ts=new Date().toISOString().slice(11,23); if(el) el.textContent=(el.textContent||'')+`\n[${ts}] HC: ${msg}`; console.log('[HC]', msg); }catch(e){ console.log('HC write failed', e); } }
  writeln('healthcheck loaded');
  try{ writeln('DOM access ok'); }catch(e){ writeln('DOM access failed: '+e.message); }
  // test dynamic import support
  (async function(){
    try{
      // Attempt a tiny dynamic import via a data URL (some browsers may block import())
      try{
        await import('data:text/javascript,export const __hc = 1');
        writeln('dynamic import succeeded');
      }catch(e){ writeln('dynamic import failed: '+(e?.message||String(e))); }
    }catch(e){ writeln('dynamic import test error: '+(e?.message||String(e))); }
    // test GET to a small CDN resource (qrcode min file) to detect network blocking
    try{
      const r = await fetch('https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js', { method:'GET' });
      writeln('fetch qrcode status: '+(r && r.status));
    }catch(e){ writeln('fetch qrcode failed: '+(e?.message||String(e))); }
  })();
})();
