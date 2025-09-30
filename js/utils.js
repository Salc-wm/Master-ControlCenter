// utils.js — Core utility helpers
// Responsibilities:
//  - DOM selection & safe event binding
//  - ID generation & debounce
//  - URL / favicon / logo.dev helpers
//  - Image pre-flight test
//  - Domain guessing heuristics
//  - Style injection + HTML escaping

/** Query a single DOM element. */
export const $  = (sel, root = document) => root.querySelector(sel);
/** Query all matching elements into an array. */
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Generate a short unique id (non‑secure). */
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

/** Debounce a function; fires after inactivity window. */
export const debounce = (fn, ms = 250) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

// Transient UI flag: groups currently in “Edit Apps” mode
export const EDIT_GROUPS = new Set();

// URL helpers ---------------------------------------------------------------
/** Normalise a user provided URL (add https:// if missing). */
export const normaliseUrl = (url) => {
  if (!url) return "";
  try {
    if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url)) return new URL(`https://${url}`).toString();
    return new URL(url).toString();
  } catch { return (url || "").trim(); }
};

/** Safe event binder – only attaches if element exists. */
export function on(sel, evt, handler, root = document) { const el = root.querySelector(sel); if (el) el.addEventListener(evt, handler); return el; }

/** Return a favicon URL (Google service) for a given website URL. */
export const faviconFor = (url) => { try { const u = new URL(normaliseUrl(url)); return `https://www.google.com/s2/favicons?sz=128&domain=${u.origin}`; } catch { return ""; } };

// logo.dev helpers ---------------------------------------------------------
export function logoDevUrlForDomain(domain, key, size = 128) { const k = (key || "").trim(); if (!k || !domain) return null; return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(k)}&size=${size}`; }
export function logoDevUrlForSiteUrl(siteUrl, key, size = 128) { try { const u = new URL(normaliseUrl(siteUrl)); return logoDevUrlForDomain(u.hostname, key, size); } catch { return null; } }

/** Test-load an image; resolves boolean success within timeout. */
export function checkImage(url, timeoutMs = 2500) { return new Promise((resolve) => { if (!url) return resolve(false); const img = new Image(); let done=false; const finish = ok => { if (!done) { done=true; resolve(ok); } }; const t=setTimeout(()=>finish(false), timeoutMs); img.onload=()=>{ clearTimeout(t); finish(true); }; img.onerror=()=>{ clearTimeout(t); finish(false); }; img.src=url; }); }

/** Guess likely domains from an app/product title for logo.dev convenience. */
export function guessDomainCandidates(title) {
  if (!title) return [];
  const raw = title.trim().toLowerCase();
  const out = new Set();
  if (/[a-z0-9-]+\.[a-z]{2,}$/i.test(raw)) out.add(raw);
  const map = { plex:"plex.tv", jellyfin:"jellyfin.org", unraid:"unraid.net", "home assistant":"home-assistant.io", pihole:"pi-hole.net", synology:"synology.com", qnap:"qnap.com", proxmox:"proxmox.com", docker:"docker.com", grafana:"grafana.com", portainer:"portainer.io", traefik:"traefik.io" };
  if (map[raw]) out.add(map[raw]);
  const slug = raw.replace(/[^a-z0-9]+/g, "");
  if (slug) ["com","io","net","org","tv"].forEach(tld => out.add(`${slug}.${tld}`));
  return [...out];
}

/** Remove (disabled) logo.dev attribution element if present. */
export function ensureLogoAttribution() { const el = document.getElementById("logoDevAttribution"); if (el) el.remove(); }

/** HTML escape untrusted text. */
export const escapeHtml = (str) => (str==null?"":String(str)).replace(/[&<>"']/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));

/** Ensure (idempotently) a single <style> tag with given id exists. */
export function ensureStyle(id, cssContent) { let el = document.getElementById(id); if (!el) { el = document.createElement('style'); el.id = id; el.textContent = cssContent; document.head.appendChild(el); } return el; }

/** Schedule a function when the browser is idle (fallback to short timeout). */
export function scheduleIdle(fn, timeout = 120) {
  try {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(() => { try { fn(); } catch {} }, { timeout });
    }
  } catch {}
  return setTimeout(() => { try { fn(); } catch {} }, Math.min(timeout, 120));
}

/** Unified named cache pool (simple TTL maps). */
export function getCache(name) {
  if (!window.__sdCaches) window.__sdCaches = {};
  if (!window.__sdCaches[name]) window.__sdCaches[name] = { store:{}, ts:{} };
  return window.__sdCaches[name];
}

/**
 * Prune all registered caches created via getCache().
 * Strategy:
 *  - Remove entries older than maxAgeMs.
 *  - If still above maxEntries, remove oldest until within limit.
 * Options (optional): { maxAgeMs:number, maxEntries:number }
 */
export function pruneCaches(opts={}) {
  try {
    const maxAge = typeof opts.maxAgeMs === 'number' ? opts.maxAgeMs : 6*60*60*1000; // 6h default
    const maxEntries = typeof opts.maxEntries === 'number' ? opts.maxEntries : 250;  // per cache
    if (!window.__sdCaches) return;
    const now = Date.now();
    let totalBefore = 0, totalAfter = 0, pruned = 0;
    for (const [cacheName, cache] of Object.entries(window.__sdCaches)) {
      const { store, ts } = cache || {};
      if (!store || !ts) continue;
      const keysBefore = Object.keys(store);
      totalBefore += keysBefore.length;
      // Age eviction
      for (const k of Object.keys(store)) {
        if (!ts[k] || (now - ts[k] > maxAge)) { delete store[k]; delete ts[k]; }
      }
      // Size eviction
      const keys = Object.keys(store);
      if (keys.length > maxEntries) {
        // Sort by timestamp ascending (oldest first)
        keys.sort((a,b) => (ts[a]||0) - (ts[b]||0));
        const toRemove = keys.slice(0, keys.length - maxEntries);
        toRemove.forEach(k => { delete store[k]; delete ts[k]; });
      }
      const keysAfter = Object.keys(store);
      totalAfter += keysAfter.length;
      pruned += Math.max(0, keysBefore.length - keysAfter.length);
      // Optional: mark last prune time
      cache.__lastPrune = now;
    }
    window.__sdCacheStats = {
      lastPrune: now,
      pruned,
      totalEntries: totalAfter,
      caches: Object.keys(window.__sdCaches).length
    };
  } catch { /* silent */ }
}
