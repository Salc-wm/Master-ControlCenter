// settings.js — render & wire settings panel (import/export/theme/edit mode/logo.dev key)
import { $, on } from "./utils.js";
import { STATE, saveState, saveStateNow, applyTheme } from "./state.js";
import { renderGroups } from "./render-groups.js";
import { FONT_CATALOG, getFontMeta } from './fonts.js';
import { SUPPORTED_LANGUAGES, setLanguage } from "./languages/i18n.js";

/**
 * Render current settings into the slide-out UI.
 * All fields are guarded in case the corresponding controls are not present in the DOM.
 */
export function renderPrefs() {
  const openNew = $("#prefOpenNewTab");
  const themeSel = $("#prefTheme");
  const keyEl   = $("#prefLogoDevKey");
  const editToggle = $("#prefEditMode");
  const pruneAge = $("#prefPruneAge");
  const pruneEntries = $("#prefPruneEntries");
  const perfPanel = $("#prefPerfPanel");
  const fontSel = $('#prefFont');
  const glowToggle = $('#prefGlowEnabled');
  const glowColor = $('#prefGlowColor');
  const languageSel = $("#prefInterfaceLanguage");

  if (openNew)  openNew.checked = !!STATE.settings.openInNewTab;
  if (themeSel) themeSel.value  = STATE.settings.theme ?? "system";
  if (keyEl)    keyEl.value     = STATE.settings.logoDevApiKey || "";
  if (editToggle) editToggle.checked = STATE.settings.editMode !== false; // default true
  if (fontSel) fontSel.value = STATE.settings.selectedFont || 'inter';
  if (glowToggle) glowToggle.checked = STATE.settings.glowEnabled !== false;
  if (glowColor && typeof STATE.settings.glowColor === 'string') glowColor.value = STATE.settings.glowColor;
  // Apply immediately for live preview
  if (STATE.settings.glowColor) document.documentElement.style.setProperty('--glow-color', STATE.settings.glowColor);
  document.body.classList.toggle('disable-glow', STATE.settings.glowEnabled === false);
  // advanced perf settings (stored in localStorage, not STATE)
  try {
    const cfg = JSON.parse(localStorage.getItem('__sdPruneCfg')||'{}');
    if (pruneAge) pruneAge.value = cfg.maxAgeMs ? Math.round(cfg.maxAgeMs/3600000) : '';
    if (pruneEntries) pruneEntries.value = cfg.maxEntries || '';
  } catch {}
  try { if (perfPanel) perfPanel.checked = localStorage.getItem('sdPerfPanel') === '1'; } catch {}
  if (languageSel) {
    const lang = (STATE.settings.interfaceLanguage || 'en').toLowerCase();
    languageSel.value = lang;
  }
}

/**
 * Apply glow color across document. Also recompute ring variables, respect contrast safeguard,
 * and update body class for enabled/disabled state. Mirrors logic in loadState so runtime
 * changes stay consistent.
 */
function applyDynamicGlowColor(raw) {
  // Simple luminance check (duplicated from state.js) keep in sync if that logic changes
  const hex = raw.replace('#','');
  if (hex.length < 6) return; // ignore shorthand for now
  const r = parseInt(hex.slice(0,2),16);
  const g = parseInt(hex.slice(2,4),16);
  const b = parseInt(hex.slice(4,6),16);
  const lum = (0.2126*r + 0.7152*g + 0.0722*b)/255;
  let adjusted = raw;
  if (lum > 0.80) { // too bright -> darken
    const factor = 0.55; // darkening multiplier
    const dr = Math.round(r*factor).toString(16).padStart(2,'0');
    const dg = Math.round(g*factor).toString(16).padStart(2,'0');
    const db = Math.round(b*factor).toString(16).padStart(2,'0');
    adjusted = `#${dr}${dg}${db}`;
  }
  const root = document.documentElement.style;
  root.setProperty('--glow-color', adjusted);
  // Derive ring variables used by components (fallback if CSS hasn't defined them)
  root.setProperty('--glow-ring-1', `0 0 0 1px ${adjusted}55`);
  root.setProperty('--glow-ring-2', `0 0 0 2px ${adjusted}22`);
  root.setProperty('--glow-bloom', `0 0 6px 2px ${adjusted}55`);
}

/** Ensure required settings keys exist and are valid. */
function normaliseSettingsObject(s) {
  const out = Object.assign(
    {
      openInNewTab: true,
      theme: "system",
      logoDevApiKey: "",
      editMode: true,
      selectedFont: "inter",
      glowEnabled: true,
      glowColor: "#8b1234",
      interfaceLanguage: "en"
    },
    (s && typeof s === "object") ? s : {}
  );

  if (!["system", "light", "dark", "crimson"].includes(out.theme)) out.theme = "system";
  out.openInNewTab = !!out.openInNewTab;
  if (typeof out.logoDevApiKey !== "string") out.logoDevApiKey = "";
  out.editMode = out.editMode !== false; // coerce to boolean default true
  if (typeof out.selectedFont !== 'string' || !out.selectedFont.trim()) out.selectedFont = 'inter';
  out.glowEnabled = out.glowEnabled !== false; // default true
  if (typeof out.glowColor !== 'string' || !/^#([0-9a-f]{3,8})$/i.test(out.glowColor)) out.glowColor = '#8b1234';
  if (typeof out.interfaceLanguage !== 'string') {
    out.interfaceLanguage = 'en';
  } else {
    out.interfaceLanguage = out.interfaceLanguage.toLowerCase();
    if (!SUPPORTED_LANGUAGES.includes(out.interfaceLanguage)) out.interfaceLanguage = 'en';
  }
  // If previous selection points to removed font, fallback to original_default
  const validIds = new Set((window?.FONT_CATALOG || []).map(f=>f.fontName));
  try {
    if (validIds.size && !validIds.has(out.selectedFont)) out.selectedFont = 'original_default';
  } catch {}

  return out;
}

/** Validate/normalise an imported state JSON payload. */
function normaliseImportedState(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid file: not an object");
  if (!Array.isArray(data.pages)) throw new Error("Invalid file: missing pages[]");

  const normalised = { ...data };
  normalised.settings = normaliseSettingsObject(data.settings);

  // Ensure each page/group/links array is well-formed (do not mutate structure beyond safety)
  normalised.pages = data.pages.map(p => ({
    id: p?.id ?? `page_${Math.random().toString(36).slice(2, 8)}`,
    name: typeof p?.name === "string" ? p.name : "Page",
    groups: Array.isArray(p?.groups) ? p.groups.map(g => ({
      id: g?.id ?? `grp_${Math.random().toString(36).slice(2, 8)}`,
      name: typeof g?.name === "string" ? g.name : "Group",
      links: Array.isArray(g?.links) ? g.links.map(l => ({
        id: l?.id ?? `lnk_${Math.random().toString(36).slice(2, 8)}`,
        title: typeof l?.title === "string" ? l.title : "Untitled",
        url: typeof l?.url === "string" ? l.url : "",
        // Include 'logo' type (new) plus legacy values
        iconType: ["auto", "url", "upload", "logo"].includes(l?.iconType) ? l.iconType : "auto",
        iconUrl: typeof l?.iconUrl === "string" ? l.iconUrl : "",
        iconData: typeof l?.iconData === "string" ? l.iconData : "",
        logoDomain: typeof l?.logoDomain === 'string' ? l.logoDomain : ''
      })) : [],
      widgets: Array.isArray(g?.widgets) ? g.widgets.map(w => {
        const type = (typeof w?.type === 'string') ? w.type : 'uptime-robot';
        let opts = (w && typeof w.options === 'object') ? {...w.options} : {};
        if (type === 'covid') {
          if (typeof opts.country !== 'string') opts.country = '';
          if (typeof opts.refreshMins !== 'number' || opts.refreshMins < 5) opts.refreshMins = 60;
        }
        if (type === 'iframe') { // ensure new iframe fields have sane defaults
          if (opts.autoHeight && typeof opts.height === 'number') delete opts.height;
          if (opts.span && typeof opts.span !== 'string' && typeof opts.span !== 'number') delete opts.span;
        }
        return {
          id: w?.id ?? `wdg_${Math.random().toString(36).slice(2,8)}`,
          type,
          options: opts
        };
      }) : [],
      programs: Array.isArray(g?.programs) ? g.programs.map(pr => ({
        id: pr?.id ?? `prg_${Math.random().toString(36).slice(2,8)}`,
        title: typeof pr?.title === 'string' ? pr.title : 'Program',
        launchMethod: typeof pr?.launchMethod === 'string' ? pr.launchMethod : 'scheme',
        schemeOrCommand: typeof pr?.schemeOrCommand === 'string' ? pr.schemeOrCommand : (typeof pr?.scheme === 'string' ? pr.scheme : ''),
        nativeCommand: typeof pr?.nativeCommand === 'string' ? pr.nativeCommand : '',
        nativeArgs: Array.isArray(pr?.nativeArgs) ? pr.nativeArgs : (typeof pr?.nativeArgs === 'string' ? pr.nativeArgs.split(/\s+/).filter(Boolean) : []),
        iconType: ['logo','url','upload'].includes(pr?.iconType) ? pr.iconType : 'logo',
        iconUrl: typeof pr?.iconUrl === 'string' ? pr.iconUrl : '',
        iconData: typeof pr?.iconData === 'string' ? pr.iconData : '',
        logoDomain: typeof pr?.logoDomain === 'string' ? pr.logoDomain : '',
        notes: typeof pr?.notes === 'string' ? pr.notes : ''
      })) : [],
      // Preserve group-level sizing fields (new)
      tileMin: (typeof g?.tileMin === 'number' && g.tileMin > 40) ? g.tileMin : undefined,
      span: (typeof g?.span === 'number' && g.span >=1 && g.span <= 12) ? g.span : undefined
    })) : []
  }));

  // selectedPageId fallback
  if (!normalised.selectedPageId && normalised.pages.length) {
    normalised.selectedPageId = normalised.pages[0].id;
  }

  return normalised;
}

/**
 * Attach settings listeners (null-safe via `on()`).
 * Keeps legacy toggles optional (if you’ve removed them from the HTML, no issue).
 */
export function initSettingsBindings() {
  // Populate font select dynamically (allows future catalog changes without editing HTML)
  const fontSelectEl = document.getElementById('prefFont');
  const fontSearchEl = document.getElementById('prefFontSearch');
  if (fontSelectEl && !fontSelectEl.dataset.populated) {
    const sorted = [...FONT_CATALOG].sort((a,b)=> a.displayName.localeCompare(b.displayName, undefined, {sensitivity:'base'}));
    sorted.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.fontName; opt.textContent = f.displayName;
      fontSelectEl.appendChild(opt);
    });
    fontSelectEl.dataset.populated = '1';
  }

  // Simple fuzzy filtering (case-insensitive contains)
  if (fontSearchEl && fontSelectEl) {
    fontSearchEl.addEventListener('input', ()=>{
      const q = fontSearchEl.value.trim().toLowerCase();
      Array.from(fontSelectEl.options).forEach(o => {
        if (!q) { o.hidden = false; return; }
        const txt = o.textContent.toLowerCase();
        o.hidden = !txt.includes(q);
      });
      // If current selection is hidden due to filter, auto-select first visible
      if (fontSelectEl.selectedOptions[0]?.hidden) {
        const firstVisible = Array.from(fontSelectEl.options).find(o=>!o.hidden);
        if (firstVisible) { fontSelectEl.value = firstVisible.value; fontSelectEl.dispatchEvent(new Event('change')); }
      }
    });
  }

  const ensureFontLoaded = async (fontId) => {
    const meta = getFontMeta(fontId);
    const head = document.head;
    let linkId = 'gf-'+meta.fontName;
    if (meta.provider === 'google' && meta.gf) {
      if (!document.getElementById(linkId)) {
        const l = document.createElement('link');
        l.id = linkId;
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family='+meta.gf+'&display=swap';
        head.appendChild(l);
      }
    }
    // Apply to root via CSS variable so global styles remain centralized
    document.documentElement.style.setProperty('--app-font-stack', meta.cssStack);
  // Dynamic selector accent: derive a color hash from font name to create consistent hue
  const h = [...meta.fontName].reduce((a,c)=>a + c.charCodeAt(0),0) % 360;
  // Removed dynamic accent color; font select now uses fixed burgundy styling
    // Attempt detection after a short delay (FontFaceSet not fully reliable for remote CSS)
    setTimeout(()=>{
      try {
        if (document.documentElement.hasAttribute('data-font-fallback')) return; // already handled
        if (document.fonts && meta.displayName) {
          const checkName = meta.displayName.split(' ')[0];
          const loaded = Array.from(document.fonts).some(ff => ff.family.toLowerCase().includes(checkName.toLowerCase()));
          if (!loaded) throw new Error('font not confirmed loaded');
        }
      } catch {
        document.documentElement.style.setProperty('--app-font-stack', 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif');
        document.documentElement.setAttribute('data-font-fallback','1');
        window.dispatchEvent(new CustomEvent('sdFontFallback', { detail: { error: 'Selected font unavailable, reverted to default font.' } }));
      }
    }, 900);
  };

  // Manual test utility: trigger font fallback path once for verification.
  if (!window.__sdTestFontFallback) {
    window.__sdTestFontFallback = () => {
      if (document.documentElement.hasAttribute('data-font-fallback')) {
        console.info('[font-fallback-test] already in fallback state');
        return false;
      }
      document.documentElement.style.setProperty('--app-font-stack', 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif');
      document.documentElement.setAttribute('data-font-fallback','1');
      const detail = { error: 'Selected font unavailable, reverted to default font. (simulated)' };
      window.dispatchEvent(new CustomEvent('sdFontFallback', { detail }));
      console.info('[font-fallback-test] dispatched simulated sdFontFallback');
      return true;
    };
  }

  // Initial apply (in case of persisted value)
  try { ensureFontLoaded(STATE.settings.selectedFont || 'inter'); } catch {}

  // Simple diagnostic to verify selected font renders distinctly and not blurry (heuristic based on width diffs)
  function testFontReadability(fontId){
    const meta = getFontMeta(fontId);
    const sample = 'Dashboard Quick Vixen Jumps 1234567890';
    const probe = document.createElement('canvas');
    probe.width = 800; probe.height = 80;
    const ctx = probe.getContext('2d');
    // Render with target font
    ctx.font = '24px '+meta.cssStack.split(',')[0].replace(/"/g,'');
    ctx.fillStyle = '#fff';
    ctx.fillText(sample, 10, 40);
    // Compute edge contrast heuristic
    const img = ctx.getImageData(0,0,probe.width,60).data;
    let transitions=0; for(let i=4;i<img.length;i+=4){ // alpha channel skip simplification
      const prev = img[i-4]; const cur = img[i]; if ((prev>200)!==(cur>200)) transitions++; }
    const score = transitions / sample.length;
    return { font: meta.displayName, transitions: transitions, score: score };
  }

  const testBtn = document.getElementById('prefFontTest');
  if (testBtn) {
    testBtn.addEventListener('click', ()=>{
      const current = STATE.settings.selectedFont;
      const diag = testFontReadability(current);
      console.info('[font-test]', diag);
      if (diag.score < 2) {
        console.warn(JSON.stringify({ error: 'Selected font may render poorly (low edge contrast).'}));
      } else {
        console.log(JSON.stringify({ ok: 'Font rendering passed heuristic.' }));
      }
    });
  }
  // Tabs logic (idempotent)
  const tabsRoot = document.querySelector('.settings-tabs');
  if (tabsRoot && !tabsRoot.__wired) {
    tabsRoot.__wired = true;
    const allTabs = Array.from(tabsRoot.querySelectorAll('[role=tab]'));
    const selectTab = (id, focus=false) => {
      allTabs.forEach(t => {
        const active = t.dataset.tab === id;
        t.setAttribute('aria-selected', active ? 'true':'false');
        const panel = document.getElementById('panel-' + t.dataset.tab);
        if (panel) {
          if (active) panel.removeAttribute('hidden'); else panel.setAttribute('hidden','');
        }
      });
      try { localStorage.setItem('__sdSettingsTab', id); } catch {}
      if (focus) {
        const btn = allTabs.find(t=>t.dataset.tab===id); if (btn) btn.focus();
      }
    };
    tabsRoot.addEventListener('click', e => {
      const btn = e.target.closest('[role=tab]');
      if (!btn) return;
      selectTab(btn.dataset.tab);
    });
    tabsRoot.addEventListener('keydown', e => {
      const current = document.activeElement.closest('[role=tab]');
      if (!current) return;
      const idx = allTabs.indexOf(current);
      if (['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') selectTab(allTabs[(idx+1)%allTabs.length].dataset.tab, true);
      else if (e.key === 'ArrowLeft') selectTab(allTabs[(idx-1+allTabs.length)%allTabs.length].dataset.tab, true);
      else if (e.key === 'Home') selectTab(allTabs[0].dataset.tab, true);
      else if (e.key === 'End') selectTab(allTabs[allTabs.length-1].dataset.tab, true);
    });
    // restore last tab
    let last = 'general';
    try { last = localStorage.getItem('__sdSettingsTab') || 'general'; } catch {}
    if (!allTabs.some(t=>t.dataset.tab===last)) last = 'general';
    selectTab(last);
  }
  // Import JSON
  on("#importJsonFile", "change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      console.info('[importJson] top-level keys:', Object.keys(data));
      const normalised = normaliseImportedState(data);
      try {
        const pc = Array.isArray(normalised.pages) ? normalised.pages.length : 0;
        const progc = (normalised.pages || []).reduce((acc,p) => acc + (p.groups || []).reduce((gacc,g) => gacc + ((g.programs||[]).length),0), 0);
        const wgc = (normalised.pages || []).reduce((acc,p) => acc + (p.groups || []).reduce((gacc,g) => gacc + ((g.widgets||[]).length),0), 0);
        console.info('[importJson] normalized counts:', { pages: pc, programs: progc, widgets: wgc });
      } catch(e){}

      // Shallow replace STATE’s top-level keys without breaking references
      Object.keys(STATE).forEach(k => delete STATE[k]);
      Object.assign(STATE, normalised);

      await saveStateNow();
      renderGroups();          // reflect imported pages/groups/links
      renderPrefs();           // reflect imported settings
      applyTheme();            // apply imported theme
      $("#settingsPanel")?.classList.remove("open");
    } catch (err) {
      alert("Import failed: " + (err?.message || String(err)));
    } finally {
      e.target.value = ""; // reset file input
    }
  });

  on("#prefInterfaceLanguage", "change", (e) => {
    const raw = (e.target.value || "en").toLowerCase();
    const lang = SUPPORTED_LANGUAGES.includes(raw) ? raw : "en";
    STATE.settings.interfaceLanguage = lang;
    saveState();
    setLanguage(lang);
  });

  // Optional legacy toggles (OK if the controls were removed from the DOM)
  // (Removed) Link behaviour toggle deleted from UI; retain state key for backward compatibility.

  on("#prefTheme", "change", (e) => {
    STATE.settings.theme = e.target.value;
    applyTheme();
    saveState();
  });

  // Manual glow reset button
  on('#prefGlowReset','click', ()=>{
    const DEFAULT_GLOW = '#8b1234';
    STATE.settings.glowColor = DEFAULT_GLOW;
    const colorInput = document.getElementById('prefGlowColor');
    if (colorInput) colorInput.value = DEFAULT_GLOW;
    applyDynamicGlowColor(DEFAULT_GLOW);
    saveState();
  });

  // NEW: logo.dev publishable key
  on("#prefLogoDevKey", "input", (e) => {
    STATE.settings.logoDevApiKey = e.target.value.trim();
    saveState();
  });

  on("#prefEditMode", "change", (e) => {
    STATE.settings.editMode = !!e.target.checked;
    saveState();
    // re-render groups & pages to hide/show UI affordances
    import("./render-groups.js").then(m => m.renderGroups());
    import("./render-pages.js").then(m => m.renderPagesBar());
  });

  on('#prefFont','change', (e)=>{
    STATE.settings.selectedFont = e.target.value;
    saveState();
    ensureFontLoaded(STATE.settings.selectedFont);
  });

  on('#prefGlowEnabled','change', (e)=>{
    STATE.settings.glowEnabled = !!e.target.checked;
    document.body.classList.toggle('disable-glow', !STATE.settings.glowEnabled);
    if (STATE.settings.glowEnabled && STATE.settings.glowColor) {
      applyDynamicGlowColor(STATE.settings.glowColor);
    }
    saveState();
  });
  on('#prefGlowColor','input', (e)=>{
    const val = e.target.value;
    if (!/^#([0-9a-f]{3,8})$/i.test(val)) return;
    STATE.settings.glowColor = val;
    applyDynamicGlowColor(val);
    saveState();
  });


  on('#prefPruneAge','change',(e)=>{
    const hrs = parseInt(e.target.value,10);
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem('__sdPruneCfg')||'{}'); } catch {}
    if (!cfg || typeof cfg !== 'object') cfg={};
    if (isFinite(hrs) && hrs>0) cfg.maxAgeMs = hrs*3600000; else delete cfg.maxAgeMs;
    localStorage.setItem('__sdPruneCfg', JSON.stringify(cfg));
    window.__sdPruneCfg = cfg; // live apply
  });
  on('#prefPruneEntries','change',(e)=>{
    const val = parseInt(e.target.value,10);
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem('__sdPruneCfg')||'{}'); } catch {}
    if (!cfg || typeof cfg !== 'object') cfg={};
    if (isFinite(val) && val>0) cfg.maxEntries = val; else delete cfg.maxEntries;
    localStorage.setItem('__sdPruneCfg', JSON.stringify(cfg));
    window.__sdPruneCfg = cfg;
  });
  on('#prefPerfPanel','change',(e)=>{
    try {
      if (e.target.checked) localStorage.setItem('sdPerfPanel','1'); else localStorage.removeItem('sdPerfPanel');
    } catch {}
    import('./render-groups.js').then(m=>m.renderGroups());
  });
}
