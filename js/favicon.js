// favicon.js — dynamic favicon refresh (CSP compliant)
// Regenerates small PNG sizes for sharper look & cache-busts on tab restore.
(function(){
  function applyFavicons(){
    const head = document.head;
    const svg = head.querySelector("link[rel='icon'][type='image/svg+xml']");
    const png128 = document.getElementById('faviconPng');
    if (png128) {
      const orig = png128.getAttribute('href');
      png128.setAttribute('href', orig.split('?')[0] + '?v=' + Date.now());
    }
    const baseLogical = 'icon/stackdash-128.png';
    const base = (png128 && png128.getAttribute('href')) || baseLogical;
    // Ensure a generic rel=icon (no sizes) exists – some Chromium builds prefer it.
    if (!head.querySelector("link[rel='icon']:not([sizes])")) {
      const generic = document.createElement('link');
      generic.rel = 'icon';
      generic.type = 'image/png';
      generic.href = (typeof chrome !== 'undefined' && chrome.runtime?.getURL) ? chrome.runtime.getURL(baseLogical) + '?v=' + Date.now() : base;
      head.appendChild(generic);
    }
    // Sharper 32px generation.
    const targets = [32];
    targets.forEach(sz => {
      const linkExisting = head.querySelector(`link[rel='icon'][sizes='${sz}x${sz}']`);
      if (!linkExisting) return;
      const img = new Image();
      img.onload = () => {
        if (img.width >= sz) {
          try {
            const c = document.createElement('canvas');
            c.width = c.height = sz;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, sz, sz);
            linkExisting.href = c.toDataURL('image/png');
          } catch {}
        }
      };
      img.onerror = () => { if (svg) linkExisting.href = svg.getAttribute('href'); };
      img.src = base;
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFavicons);
  } else {
    applyFavicons();
  }
  // Re-apply on visibility change (tab restored) – helps some edge cases.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) applyFavicons();
  });
})();
