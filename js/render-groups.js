// render-groups.js — groups + tiles grid (square tiles, edit mode, kebab menu)
import {
  $, $$, EDIT_GROUPS, faviconFor, normaliseUrl,
  ensureLogoAttribution, logoDevUrlForDomain,
  escapeHtml, ensureStyle, scheduleIdle, getCache, pruneCaches
} from "./utils.js";

import { STATE, saveState, getSelectedPage } from "./state.js";
import { openLinkModal, deleteGroup, openGroupSizeModal } from "./modals.js";

let groupFlyoutBound = false;

export function toggleGroupEdit(groupId) {
  if (EDIT_GROUPS.has(groupId)) EDIT_GROUPS.delete(groupId);
  else EDIT_GROUPS.add(groupId);
  renderGroups();
}

export function renderGroups() {
  const t0 = performance.now();
  // Track rolling render durations (keep last 30)
  if (!window.__sdPerfRenders) window.__sdPerfRenders = [];
  // lightweight shared cache for uptime robot responses by api key
  if (!window.__uptimeRobotCache) window.__uptimeRobotCache = { store:{}, ts:{} };
  const uptimeCache = window.__uptimeRobotCache;
  const UPTIME_TTL = 60000; // 60s

  // Shared UptimeRobot request manager (rate limiting + backoff)
  // Avoids multiple widgets hammering the API simultaneously and triggering 429s.
  if (!window.__uptimeRobotMgr) {
    window.__uptimeRobotMgr = (() => {
      // --- Rate limiting primitives ---
      const inflight = {};            // apiKey -> Promise
      const nextAllowed = {};         // per-key earliest ms
      const backoff = {};             // per-key exponential backoff ms
      const queue = [];               // pending fetch requests { apiKey, resolve }
      const MIN_INTERVAL = 15000;     // per-key guard (15s)
      const MAX_BACKOFF = 300000;     // 5 min max backoff
      const INITIAL_BACKOFF = 5000;   // initial backoff (5s)
      const MAX_REQ_PER_MIN = 10;     // free plan global cap
      const TOKEN_INTERVAL = 6000;    // 1 token every 6000ms (10/min)
      let tokens = 0;                 // will be set by persisted state or initial fill
      let lastRefill = Date.now();
      const STORAGE_KEY = '__ur_rl_state_v1';
      const STATE_MAX_AGE = 10 * 60 * 1000; // discard persisted state older than 10min

      // Load persisted rate limit state so refresh does not reset allowance
      (function loadPersisted() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (!raw) { tokens = MAX_REQ_PER_MIN; return; }
          const parsed = JSON.parse(raw);
          if (!parsed || typeof parsed !== 'object') { tokens = MAX_REQ_PER_MIN; return; }
          const now = Date.now();
            if (parsed.lastRefill && (now - parsed.lastRefill) < STATE_MAX_AGE) {
              lastRefill = parsed.lastRefill;
              // restore nextAllowed/backoff maps
              if (parsed.nextAllowed && typeof parsed.nextAllowed === 'object') Object.assign(nextAllowed, parsed.nextAllowed);
              if (parsed.backoff && typeof parsed.backoff === 'object') Object.assign(backoff, parsed.backoff);
              // recompute tokens with elapsed time since lastRefill
              const elapsed = now - lastRefill;
              const earned = Math.floor(elapsed / TOKEN_INTERVAL);
              const baseTokens = typeof parsed.tokens === 'number' ? parsed.tokens : 0;
              tokens = Math.min(MAX_REQ_PER_MIN, baseTokens + earned);
              if (earned > 0) lastRefill += earned * TOKEN_INTERVAL;
            } else {
              tokens = MAX_REQ_PER_MIN; // stale or missing
            }
        } catch { tokens = MAX_REQ_PER_MIN; }
      })();

      let persistScheduled = false;
      function persistState() {
        if (persistScheduled) return;
        persistScheduled = true;
        setTimeout(() => {
          persistScheduled = false;
          try {
            const data = {
              tokens,
              lastRefill,
              nextAllowed,
              backoff
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch { /* ignore quota errors */ }
        }, 300); // coalesce rapid changes
      }

      function refillTokens() {
        const now = Date.now();
        const elapsed = now - lastRefill;
        if (elapsed >= TOKEN_INTERVAL) {
          const add = Math.floor(elapsed / TOKEN_INTERVAL);
          if (add > 0) {
            tokens = Math.min(MAX_REQ_PER_MIN, tokens + add);
            lastRefill += add * TOKEN_INTERVAL;
            persistState();
          }
        }
      }

      function attemptDispatch() {
        refillTokens();
  if (!queue.length || tokens <= 0) { persistState(); return; } // nothing to do or no capacity
        // Try to find a request whose key is allowed now
        for (let i = 0; i < queue.length && tokens > 0; i++) {
          const item = queue[i];
            const wait = Math.max(0, (nextAllowed[item.apiKey] || 0) - Date.now());
            if (wait > 0) {
              // Skip this one for now; we will revisit later
              continue;
            }
            // Dispatch this request
            queue.splice(i,1); // remove from queue
            tokens -= 1;
            persistState();
            performFetch(item.apiKey, item.resolve);
            // restart scanning from beginning because queue changed
            i = -1;
        }
        // If we still have items but no immediate dispatch (all waiting on per-key time), schedule a check
        if (queue.length) {
          const soonest = queue.reduce((min, q) => Math.min(min, (nextAllowed[q.apiKey] || Date.now())), Infinity);
          const delay = Math.max(25, soonest - Date.now());
          setTimeout(attemptDispatch, delay);
        }
      }

      function performFetch(apiKey, resolve) {
        const store = uptimeCache.store; const ts = uptimeCache.ts;
        const payload = new URLSearchParams({ api_key: apiKey, format:'json', logs:'0', custom_uptime_ratios:'1' });
        const endpoint = 'https://api.uptimerobot.com/v2/getMonitors';
        const proxyChain = [
          endpoint,
          'https://cors.isomorphic-git.org/' + endpoint,
          'https://corsproxy.io/?' + endpoint,
          'https://api.allorigins.win/raw?url=' + encodeURIComponent(endpoint)
        ];
        const quietPost = (url) => fetch(url, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body: payload.toString() }).catch(()=>null);
        (function tryNext() {
          const url = proxyChain.shift();
          if (!url) {
            resolve(store[apiKey] || { stat:'error' });
            persistState(); attemptDispatch(); return;
          }
          quietPost(url).then(r => {
            if (!r) { tryNext(); return; }
            if (r.status === 429) {
              backoff[apiKey] = Math.min(backoff[apiKey] ? backoff[apiKey]*2 : INITIAL_BACKOFF, MAX_BACKOFF);
              nextAllowed[apiKey] = Date.now() + backoff[apiKey];
              resolve({ stat:'rate_limited' });
              return;
            }
            if (!r.ok) { tryNext(); return; }
            return r.json().then(data => {
              if (data && data.stat === 'ok') {
                store[apiKey] = data; ts[apiKey] = Date.now(); backoff[apiKey] = 0; nextAllowed[apiKey] = Date.now() + MIN_INTERVAL;
                resolve(data);
              } else {
                tryNext();
              }
            }).catch(()=>{ tryNext(); });
          }).catch(()=>{ tryNext(); }).finally(()=>{ persistState(); });
        })();
      }

      function enqueue(apiKey) {
        return new Promise((resolve) => {
          queue.push({ apiKey, resolve });
          attemptDispatch();
        });
      }

      function get(apiKey) {
        const store = uptimeCache.store; const ts = uptimeCache.ts; const now = Date.now();
        // Serve from cache if fresh
        if (store[apiKey] && (now - ts[apiKey] < UPTIME_TTL)) return Promise.resolve(store[apiKey]);
        // Reuse in-flight (either currently fetching or queued) by checking inflight registry
        if (inflight[apiKey]) return inflight[apiKey];
        // If per-key nextAllowed is in future we still queue; queue scanning will delay appropriately
        inflight[apiKey] = enqueue(apiKey).finally(() => { delete inflight[apiKey]; });
        return inflight[apiKey];
      }

      // Background token refill + dispatch (safety)
  setInterval(() => { attemptDispatch(); }, 1000);
  window.addEventListener('beforeunload', () => { try { persistState(); } catch {} });

      return { get };
    })();
  }

  const page = getSelectedPage();
  const container = "#groupsContainer" ? $("#groupsContainer") : null; // existing selection
  if (!container) return;
  // Apply centering preference BEFORE clearing so layout shift is minimal
  container.innerHTML = "";
  if (!page) return; // show nothing when no selected page

  // Ensure global helper reference (legacy calls may reference window.escapeHtml)
  if (!window.escapeHtml) window.escapeHtml = escapeHtml;

  // --- One-time migration: convert legacy 'openweather' widgets to new keyless 'weather' ---
  try {
    page.groups.forEach(gr => {
      if (!Array.isArray(gr.widgets)) return;
      gr.widgets.forEach(w => {
        if (w.type === 'openweather') {
          w.type = 'weather';
          // rename location->city if present
          if (!w.options) w.options = {};
          if (w.options.location && !w.options.city) w.options.city = w.options.location;
          // drop apiKey field
          if (w.options.apiKey) delete w.options.apiKey;
        }
      });
    });
  } catch {}

  // helpers to manage the body-level group flyout
  const closeGroupFlyout = (why = "unknown") => {
    const f = document.getElementById("group-flyout");
    if (f) {
      // console.debug("[group] closeFlyout()", { why });
      f.remove();
    }
    $$(".group-menu-btn[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
  };

  const openGroupFlyout = (btn, group) => {
    closeGroupFlyout("openNew");

    const editing = EDIT_GROUPS.has(group.id);

    const fly = document.createElement("div");
    fly.id = "group-flyout";
    fly.className = "pill-flyout"; // reuse pill flyout styling
    fly.innerHTML = `
      <button class="pill-item" data-cmd="add" data-group-id="${group.id}">Add link</button>
      <button class="pill-item" data-cmd="addWidget" data-group-id="${group.id}">Add widget</button>
      <button class="pill-item" data-cmd="addProgram" data-group-id="${group.id}">Add program</button>

      <button class="pill-item" data-cmd="size" data-group-id="${group.id}">Group size</button>
      <button class="pill-item" data-cmd="toggle" data-group-id="${group.id}">
        ${editing ? "Done editing" : "Edit apps"}
      </button>
      <button class="pill-item danger" data-cmd="delete" data-group-id="${group.id}">Delete group</button>
    `;
    document.body.appendChild(fly);

    // position near the kebab
    const r = btn.getBoundingClientRect();
    fly.style.visibility = "hidden";
    fly.style.display = "grid";
    const fw = fly.offsetWidth;
    const fh = fly.offsetHeight;

    let left = Math.max(8, Math.min(window.innerWidth - fw - 8, r.right - fw));
    let top  = r.bottom + 6;
    if (window.innerHeight - r.bottom < fh + 20) top = r.top - fh - 6;

    fly.style.left = `${left}px`;
    fly.style.top  = `${top}px`;
    fly.style.visibility = "visible";

    btn.setAttribute("aria-expanded", "true");

    fly.addEventListener("click", async (e) => {
      e.stopPropagation();
      const cmd = e.target?.dataset?.cmd;
      if (!cmd) return;

      if (cmd === "add") {
        closeGroupFlyout("add");
        openLinkModal(group.id);
      } else if (cmd === 'addWidget') {
        closeGroupFlyout('addWidget');
        import('./modals.js').then(m => m.openWidgetModal(group.id));
      } else if (cmd === 'addProgram') {
        closeGroupFlyout('addProgram');
        import('./modals.js').then(m => m.openProgramModal(group.id));
      } else if (cmd === "size") {
        closeGroupFlyout('size');
        import('./modals.js').then(m => m.openGroupSizeModal(group.id));
      } else if (cmd === "toggle") {
        closeGroupFlyout("toggle");
        toggleGroupEdit(group.id);
      } else if (cmd === "delete") {
        closeGroupFlyout("delete");
        deleteGroup(group.id); // uses modals.js export
      }
    });
  };

  // Batch group sections to minimize layout/reflow during large renders
  const groupsFragment = document.createDocumentFragment();
  page.groups.forEach((g, gIndex) => {
    const globalEdit = STATE.settings?.editMode !== false;
    const editing = globalEdit && EDIT_GROUPS.has(g.id);

  const wrapper = document.createElement("section");
  wrapper.className = "group" + (g.centered ? ' group-centered' : '');
    wrapper.dataset.groupId = g.id;
    const tileMin = g.tileMin || 120;
    const groupSpan = g.span || 1;
    wrapper.innerHTML = `
   <div class="group-header" ${globalEdit ? 'draggable="true"' : ''}>
     <div class="group-title" ${globalEdit ? 'contenteditable="true"' : ''} spellcheck="false"
       data-action="editGroupTitle" data-group-id="${g.id}">${g.name}</div>
  ${ globalEdit ? `<button class="pill-menu-btn group-menu-btn"
    type="button"
    aria-label="Group options"
    aria-haspopup="menu"
    aria-expanded="false"
    title="Options">⋮</button>` : '' }
   </div>
    ${ !globalEdit ? `<style>
      /* inline scoping to just this group header instance */
      section.group[data-group-id='${g.id}'] .group-header { justify-content: flex-start; }
      section.group[data-group-id='${g.id}'] .group-title { margin-right: 0; }
    </style>` : '' }
      <div class="tiles" data-group-id="${g.id}" style="grid-template-columns:repeat(auto-fill,minmax(${tileMin}px,1fr));"></div>
    `;
    if (!g.centered && groupSpan>1) wrapper.style.gridColumn = `span ${groupSpan}`; // span ignored when centered
    if (g.centered) {
      // force full row; grid-column:1/-1 then auto width with margin auto
      wrapper.style.gridColumn = '1 / -1';
    }

    // Drag groups (kebab should NOT start drag)
  const header = $(".group-header", wrapper);
  // Remove legacy preset style tag if present (cleanup)
  const legacy = document.getElementById('group-width-presets'); if (legacy) legacy.remove();
  const kebab  = $(".group-menu-btn", wrapper);

    // Inline group title editing persistence
    if (globalEdit) {
      const titleEl = $(".group-title", wrapper);
      if (titleEl) {
        titleEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
          e.stopPropagation();
        });
        titleEl.addEventListener('blur', () => {
          let txt = titleEl.textContent.trim();
          if (!txt) txt = 'Group';
          if (txt !== g.name) { g.name = txt; saveState(); }
          titleEl.textContent = txt; // normalize
        });
        // prevent starting a drag when editing text
        titleEl.addEventListener('mousedown', (e) => e.stopPropagation());
      }
    }

    // prevent drag when pressing menu
    if (globalEdit && kebab) {
      ["mousedown", "pointerdown", "touchstart"].forEach(evt =>
        kebab.addEventListener(evt, (e) => e.stopPropagation(), { passive: true })
      );
      kebab.addEventListener("dragstart", (e) => e.preventDefault());
      kebab.addEventListener("click", (e) => {
        e.stopPropagation();
        const expanded = kebab.getAttribute("aria-expanded") === "true";
        if (expanded) {
          closeGroupFlyout("toggleClose");
        } else {
          openGroupFlyout(kebab, g);
        }
      });
    }

    if (globalEdit) header.addEventListener("dragstart", (e) => {
      // Close flyout before dragging
      closeGroupFlyout("groupDrag");
      e.dataTransfer.setData("text/plain", JSON.stringify({ type: "group", id: g.id, fromIndex: gIndex }));
    });
    if (globalEdit) header.addEventListener("dragover", (e) => { e.preventDefault(); wrapper.classList.add("drag-over"); });
    if (globalEdit) header.addEventListener("dragleave", () => wrapper.classList.remove("drag-over"));
    if (globalEdit) header.addEventListener("drop", (e) => {
      e.preventDefault();
      wrapper.classList.remove("drag-over");
      const data = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
      if (data.type !== "group") return;
      const pageRef = getSelectedPage();
      const fromIdx = pageRef.groups.findIndex(x => x.id === data.id);
      const toIdx   = pageRef.groups.findIndex(x => x.id === g.id);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      const [moved] = pageRef.groups.splice(fromIdx, 1);
      pageRef.groups.splice(toIdx, 0, moved);
      saveState();
      renderGroups();
    });

    const tilesEl = $(".tiles", wrapper);

    // Tiles (links) – batched in a fragment
    const linksFragment = document.createDocumentFragment();
    g.links.forEach((l, idx) => {
      const tile = document.createElement("article");
      tile.className = "tile";
      tile.setAttribute("draggable", "true");
      tile.dataset.linkId = l.id;

      Object.assign(tile.style, {
        aspectRatio: "1 / 1",
        position: "relative",
        display: "grid",
        gridTemplateRows: "1fr auto",
        alignItems: "center",
        justifyItems: "center",
        gap: "10px",
        padding: "12px"
      });

      // icon resolve
      const logoKey = (STATE.settings?.logoDevApiKey || "").trim();
      let iconSrc = "";
      if (l.iconType === "logo" && l.logoDomain && logoKey) {
        try { iconSrc = logoDevUrlForDomain(l.logoDomain, logoKey); } catch { iconSrc = ""; }
      }
      if (!iconSrc && l.iconType === "url" && l.iconUrl) iconSrc = l.iconUrl;
      if (!iconSrc && l.iconType === "upload" && l.iconData) iconSrc = l.iconData;
      if (!iconSrc) iconSrc = faviconFor(l.url);

      tile.innerHTML = `
        <div class="tile-icon">${iconSrc ? `<img data-icon-src="${iconSrc}" alt="" loading="lazy" style="opacity:0;transition:opacity .35s ease" />` : ""}</div>
        <div class="tile-title" ${editing ? 'contenteditable="true" data-inline-edit="link"' : ''} style="text-align:center;outline:none;">${l.title || "Untitled"}</div>
        ${ editing ? `
          <div class="tile-edit-hint"
               style="position:top;inset:auto 8px 8px auto; padding:4px 8px;border-radius:8px;border:1px solid var(--border); background:var(--panel);font-size:.7rem;opacity:.85;">Enter to save</div>` : "" }
      `;

      tile.addEventListener("click", (ev) => {
        const sel = window.getSelection(); if (sel && sel.toString()) return;
        if (globalEdit && EDIT_GROUPS.has(g.id)) {
          // If clicking directly in editable title do not open modal
          if (ev.target && ev.target.matches('.tile-title[contenteditable]')) return;
          openLinkModal(g.id, l.id); return; }
        const target = STATE.settings.openInNewTab ? "_blank" : "_self";
        const href = normaliseUrl(l.url); if (!href) return;
        window.open(href, target);
      });
      // Inline title editing handlers
      if (editing) {
        const titleEl = tile.querySelector('.tile-title');
        titleEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
          // Prevent dragging while typing
          e.stopPropagation();
        });
        titleEl.addEventListener('mousedown', (e) => e.stopPropagation());
        titleEl.addEventListener('blur', () => {
          let txt = titleEl.textContent.trim();
          if (!txt) txt = 'Untitled';
          if (txt !== l.title) { l.title = txt; saveState(); }
          titleEl.textContent = txt; // normalize whitespace
        });
      }

      if (globalEdit) tile.addEventListener("dblclick", () => openLinkModal(g.id, l.id));

      tile.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({
          type: "link", id: l.id, fromGroupId: g.id, fromIndex: idx
        }));
      });

      linksFragment.appendChild(tile);
    });
    tilesEl.appendChild(linksFragment);

    // Programs (render after links, before widgets) – use fragment
    if (Array.isArray(g.programs) && g.programs.length) {
      const programsFragment = document.createDocumentFragment();
      g.programs.forEach((p, pIdx) => {
        const tile = document.createElement('article');
        tile.className = 'tile program-tile';
        tile.setAttribute('draggable', 'true');
        tile.dataset.programId = p.id;
        Object.assign(tile.style, { aspectRatio:'1/1', position:'relative', display:'grid', gridTemplateRows:'1fr auto', alignItems:'center', justifyItems:'center', gap:'10px', padding:'12px' });
        // icon decide
        let iconSrc='';
        if (p.iconType==='logo') {
          const key = STATE.settings?.logoDevApiKey?.trim();
          if (key && p.logoDomain) {
            try { iconSrc = logoDevUrlForDomain(p.logoDomain, key); } catch {}
          }
        } else if (p.iconType==='url' && p.iconUrl) iconSrc = p.iconUrl;
        else if (p.iconType==='upload' && p.iconData) iconSrc = p.iconData;
        const iconHtml = iconSrc ? `<img data-icon-src="${iconSrc}" alt="" loading="lazy" style="opacity:0;transition:opacity .35s ease" />` : `<div style="font-weight:700;font-size:1.4rem;">${(p.title||'?')[0]?.toUpperCase()||'?'}<\/div>`;
        tile.innerHTML = `
          <div class="tile-icon">${iconHtml}</div>
          <div class="tile-title" ${editing ? 'contenteditable="true" data-inline-edit="program"' : ''} style="text-align:center;outline:none;">${p.title || 'Program'}</div>
          ${ editing ? `
            <div class="tile-edit-hint"
                 style="position:top;inset:auto 8px 8px auto; padding:4px 8px;border-radius:8px;border:1px solid var(--border); background:var(--panel);font-size:.7rem;opacity:.85;">Enter to save</div>` : '' }
        `;
        tile.addEventListener('click', (ev) => {
          const sel = window.getSelection(); if (sel && sel.toString()) return;
          if (globalEdit && EDIT_GROUPS.has(g.id)) {
            if (ev.target && ev.target.matches('.tile-title[contenteditable]')) return;
            import('./modals.js').then(m => m.openProgramModal(g.id, p.id)); return; }
          const method = p.launchMethod || 'scheme';
          if (method === 'scheme') {
            const schemeVal = p.schemeOrCommand || '';
            if (!schemeVal) return;
            try {
              if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(schemeVal)) {
                window.location.href = schemeVal;
              } else {
                alert('Not a valid URL scheme. Edit the program to adjust.');
              }
            } catch { alert('Unable to launch scheme.'); }
          } else if (method === 'native') {
            if (!p.nativeCommand) { alert('No native command set. Edit the program to add one.'); return; }
            try {
              chrome.runtime.sendMessage({ type:'launchProgram', mode:'native', command:p.nativeCommand, args: p.nativeArgs||[], programId:p.id }, (resp) => {
                if (chrome.runtime.lastError) {
                  alert('Native host not reachable. Install the helper.');
                  return;
                }
                if (!resp || !resp.ok) {
                  alert(resp?.error || 'Native launch failed. Ensure helper installed.');
                }
              });
            } catch {
              alert('Native messaging unavailable in this context.');
            }
          }
        });
        if (editing) {
          const titleEl = tile.querySelector('.tile-title');
          titleEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } e.stopPropagation(); });
          titleEl.addEventListener('mousedown', (e) => e.stopPropagation());
          titleEl.addEventListener('blur', () => {
            let txt = titleEl.textContent.trim();
            if (!txt) txt = 'Program';
            if (txt !== p.title) { p.title = txt; saveState(); }
            titleEl.textContent = txt;
          });
        }
        if (globalEdit) tile.addEventListener('dblclick', () => import('./modals.js').then(m => m.openProgramModal(g.id, p.id)));
        tile.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ type:'program', id:p.id, fromGroupId:g.id, fromIndex:pIdx }));
        });
        programsFragment.appendChild(tile);
      });
      tilesEl.appendChild(programsFragment);
    }

  // Widgets (render after links) - new stacked design (fragment to reduce repaints)
  if (Array.isArray(g.widgets) && g.widgets.length) {
      // ensure shared CSS exists
      ensureStyle('uptime-card-styles', `
          :root { --ur-up:#2ECC71; --ur-down:#E74C3C; --ur-warn:#F1C40F; --ur-deg:#E67E22; }
          .widget.widget-uptime { display:flex; flex-direction:column; gap:6px; padding:10px 8px 14px; background:transparent; border:none; border-radius:6px; width:100%; box-sizing:border-box; }
          .widget.widget-uptime + .widget.widget-uptime { margin-top:2px; }
          section.group .tiles { display:grid; grid-template-columns:repeat(auto-fill,minmax(var(--tile-min,120px),1fr)); gap:14px; }
          /* make uptime widgets always span all tile columns */
          section.group .tiles .widget-uptime { grid-column:1 / -1; }
          .uptime-meta-line { display:grid; grid-template-columns: 1fr auto; align-items:center; font:400 .7rem/1.25 system-ui,sans-serif; gap:12px; }
          .uptime-meta-line.has-delete { grid-template-columns: 1fr auto auto; }
          .uptime-left { display:flex; align-items:center; gap:6px; min-width:0; }
          .uptime-name { font-weight:600; opacity:.9; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .uptime-bullet { opacity:.35; }
          .uptime-pct { font-weight:700; letter-spacing:.5px; color:var(--ur-up); white-space:nowrap; }
          .uptime-pct.tier-warn { color:var(--ur-warn); }
          .uptime-pct.tier-deg { color:var(--ur-deg); }
          .uptime-pct.tier-bad { color:var(--ur-down); }
          .uptime-right { display:flex; align-items:center; gap:8px; color:var(--ur-up); font-weight:600; letter-spacing:.35px; }
          .uptime-right.down { color:var(--ur-down); }
          .uptime-dot { width:10px; height:10px; border-radius:50%; background:var(--ur-up); box-shadow:0 0 0 4px color-mix(in srgb,var(--ur-up) 25%, transparent); }
          .uptime-right.down .uptime-dot { background:var(--ur-down); box-shadow:0 0 0 4px color-mix(in srgb,var(--ur-down) 35%, transparent); animation:dotPulse 1.4s ease-in-out infinite; }
          .uptime-bar-line { height:16px; width:100%; border-radius:3px; background:var(--ur-up); box-shadow:0 0 0 1px rgba(0,0,0,.55) inset,0 0 0 1px rgba(255,255,255,.05); transition:background-color .45s ease, filter .45s ease; }
          .uptime-bar-line.down { background:var(--ur-down); }
          .uptime-bar-line .uptime-seg { display:none; }
          @keyframes dotPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.35); } }
          .uptime-delete-btn { width:20px; height:20px; display:flex; align-items:center; justify-content:center; border-radius:4px; font-size:.65rem; font-weight:600; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.15); color:var(--ur-down); cursor:pointer; }
          .uptime-delete-btn:hover { background:rgba(255,255,255,.18); }
        `);

  // unified caches
  const owCache = getCache('weather');
      const OW_TTL = 10*60*1000; // 10 minutes

  const widgetsFragment = document.createDocumentFragment();
  g.widgets.forEach(w => {
        const wrap = document.createElement('article');
        const isWeather = (w.type === 'weather');
        const isRSS = (w.type === 'rss');
        const isIframe = (w.type === 'iframe');
  const isCovid = (w.type === 'covid');
  wrap.className = 'widget' + (w.type === 'uptime-robot' ? ' widget-uptime' : (isWeather ? ' widget-weather' : (isRSS ? ' widget-rss' : (isIframe ? ' widget-iframe' : (isCovid ? ' widget-covid' : '')))));
        wrap.dataset.widgetId = w.id;

        if (w.type === 'uptime-robot') {
          wrap.innerHTML = `
            <div class="uptime-meta-line${globalEdit ? ' has-delete' : ''}" data-state="loading">
              <div class="uptime-left"><span class="uptime-name">Loading...</span></div>
              ${globalEdit ? '' : ''}
            </div>
            <div class="uptime-bar-line" data-bar></div>`;
  } else if (isWeather) {
          ensureStyle('weather-widget-styles', `
              .widget-weather { position:relative; --ww-fg:var(--fg,#fff); width:fit-content; min-width:180px; }
              .widget-weather .weather-body { display:flex; flex-direction:column; gap:6px; font:500 .7rem/1.2 system-ui,sans-serif; }
              .widget-weather .ww-header { display:flex; align-items:center; gap:6px; font-size:.68rem; font-weight:600; letter-spacing:.35px; }
              .widget-weather .ww-header .ww-title { display:flex; align-items:center; gap:6px; opacity:.9; }
              .widget-weather .ww-header .ww-icon { font-size:.85rem; line-height:1; }
              .widget-weather .ow-main { display:grid; grid-template-columns:auto 1fr; align-items:center; gap:14px; }
              .widget-weather .ow-temp-col { display:flex; flex-direction:column; gap:2px; }
              .widget-weather .ow-temp { font:600 1.8rem/1.05 system-ui,sans-serif; letter-spacing:.5px; }
              .widget-weather .ow-cond-wrap { display:flex; flex-direction:column; align-items:flex-start; gap:2px; }
              .widget-weather .ow-cond { font:600 .63rem/1.1 system-ui,sans-serif; opacity:.85; }
              .widget-weather .ow-icon-big { font-size:1.6rem; line-height:1; filter:drop-shadow(0 1px 2px rgba(0,0,0,.35)); }
              .widget-weather .ow-meta { margin-top:4px; display:grid; grid-template-columns:repeat(2,minmax(90px,1fr)); gap:2px 18px; font-size:.58rem; }
              .widget-weather .ow-meta .ww-col { display:flex; flex-direction:column; gap:2px; }
              .widget-weather .ow-row { display:flex; justify-content:space-between; gap:6px; border-bottom:1px dotted rgba(255,255,255,.07); padding:1px 0 1px; }
              .widget-weather .ow-row:last-child { border-bottom:0; }
              .widget-weather .ow-row span:first-child { font-weight:500; opacity:.72; }
              .widget-weather .ow-row span:last-child { font-variant-numeric:tabular-nums; opacity:.9; }
              .widget-weather.collapsed .ow-meta { display:none; }
              .widget-weather button.ww-toggle-details { background:none; border:0; color:var(--ww-fg); font:500 .55rem system-ui,sans-serif; opacity:.6; cursor:pointer; padding:2px 6px; border-radius:6px; }
              .widget-weather button.ww-toggle-details:hover { opacity:.95; background:rgba(255,255,255,.08); }
              .widget-weather .ww-footer { display:flex; justify-content:center; margin-top:2px; }
              .widget-weather .uptime-delete-btn { position:absolute; top:6px; right:6px; }
              .widget-weather.compact .ow-meta { display:none; }
        /* Fog enhancements */
        .widget-weather.foggy { background:linear-gradient(155deg,color-mix(in srgb,var(--panel-2) 96%,#000),color-mix(in srgb,var(--panel) 86%,#000)); }
        .widget-weather .weather-fog-overlay { position:absolute; inset:0; pointer-events:none; background:
          radial-gradient(circle at 20% 30%, rgba(255,255,255,.14), transparent 65%),
          radial-gradient(circle at 80% 70%, rgba(255,255,255,.10), transparent 70%),
          linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0) 65%);
          mix-blend-mode:screen; opacity:.55; filter:blur(.5px); }
              .widget-weather.foggy .ow-icon-big { font-size:1.9rem; filter:drop-shadow(0 1px 2px rgba(0, 0, 0, 0.86)) grayscale(1) brightness(.78); opacity:.9; color:#b7bcc0; }
        .widget-weather .ow-row.highlight { background:rgba(255,255,255,.06); border-radius:6px; padding:3px 6px; margin:1px 0; }
            `);
          wrap.style.padding = '12px 14px 14px';
          wrap.style.border = '1px solid var(--border)';
          wrap.style.borderRadius = '14px';
          wrap.style.background = 'var(--panel-2)';
          const initUnits = (w.options?.units === 'imperial') ? '°F' : '°C';
          wrap.innerHTML = `<div class="weather-body">
            <div class="ww-header">
              <div class="ww-title"><span class="ww-icon">☁️</span><span class="ow-loc" title="${(w.options?.city||'')||'Location'}">${(w.options?.city||'')||'Location'}</span></div>
              ${globalEdit ? '<button class="uptime-delete-btn" data-act="deleteWidget" title="Remove widget">✕</button>' : ''}
            </div>
            <div class="ow-main">
              <div class="ow-temp-col"><div class="ow-temp">--${initUnits}</div></div>
              <div class="ow-cond-wrap"><div class="ow-icon-big">☁️</div><div class="ow-cond">Loading…</div></div>
            </div>
            <div class="ow-meta"></div>
            <div class="ww-footer"><button class="ww-toggle-details" data-act="wwToggleDetails">Show Less</button></div>
          </div>`;
        } else if (isRSS) {
          // RSS widget styles
          ensureStyle('rss-widget-styles', `
              .widget-rss { --rss-fs-body:.6rem; --rss-fs-desc:.55rem; --rss-fs-title:.63rem; --rss-item-gap:3px; padding:14px 20px 16px; border:1px solid var(--border); border-radius:14px; background:linear-gradient(145deg,var(--panel-2),color-mix(in srgb,var(--panel) 85%,#000)); display:flex; flex-direction:column; gap:10px; width:100%; box-sizing:border-box; position:relative; }
              .widget-rss.size-small { --rss-fs-body:.58rem; --rss-fs-desc:.50rem; --rss-fs-title:.6rem; }
              .widget-rss.size-normal { --rss-fs-body:.62rem; --rss-fs-desc:.54rem; --rss-fs-title:.66rem; }
              .widget-rss.size-large { --rss-fs-body:.7rem; --rss-fs-desc:.63rem; --rss-fs-title:.75rem; --rss-item-gap:5px; }
              .widget-rss.size-xlarge { --rss-fs-body:.8rem; --rss-fs-desc:.7rem; --rss-fs-title:.88rem; --rss-item-gap:8px; }
              section.group .tiles .widget-rss { grid-column:1 / -1; }
              .widget-rss.collapsed { height:auto; }
              .widget-rss .rss-head { display:flex; align-items:center; gap:8px; font:600 .7rem/1.15 system-ui,sans-serif; letter-spacing:.4px; }
              .widget-rss .rss-head .rss-title { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
              .widget-rss .rss-fav { width:16px; height:16px; border-radius:4px; object-fit:contain; background:rgba(255,255,255,.08); display:none; }
              .widget-rss .rss-fav.visible { display:block; }
              .widget-rss .rss-proxy-badge { display:none; font:600 .48rem/1 system-ui,sans-serif; letter-spacing:.5px; padding:3px 5px 2px; border-radius:6px; background:color-mix(in srgb,var(--accent) 35%, var(--panel)); color:var(--text); opacity:.85; }
              .widget-rss.proxy-active .rss-proxy-badge { display:inline-block; }
              .widget-rss .rss-head button { background:none; border:0; cursor:pointer; color:var(--text); opacity:.55; font-size:.6rem; padding:2px 4px; border-radius:5px; }
              .widget-rss .rss-head button:hover { opacity:.95; background:rgba(255,255,255,.08); }
              .widget-rss .rss-body { display:flex; flex-direction:column; gap:var(--rss-item-gap); font:500 var(--rss-fs-body)/1.35 system-ui,sans-serif; max-height:460px; overflow:auto; scrollbar-width:thin; padding-right:6px; }
              .widget-rss.compact .rss-body { gap:4px; }
              .widget-rss .rss-item { display:flex; flex-direction:column; gap:3px; padding:6px 8px 8px; border:1px solid color-mix(in srgb, var(--border) 55%, transparent); border-radius:10px; background:linear-gradient(160deg, color-mix(in srgb, var(--panel-2) 95%, #000), color-mix(in srgb, var(--panel) 88%, #000)); position:relative; }
              .widget-rss .rss-item.new { border-color: color-mix(in srgb, var(--accent) 70%, var(--border)); box-shadow:0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent); }
              .widget-rss .rss-item h4 { margin:0; font:600 var(--rss-fs-title)/1.18 system-ui,sans-serif; letter-spacing:.25px; }
              .widget-rss .rss-item h4 a { color:var(--text); text-decoration:none; }
              .widget-rss .rss-item h4 a:hover { text-decoration:underline; }
              .widget-rss .rss-item .rss-meta { font-size:.52rem; opacity:.6; display:flex; gap:6px; flex-wrap:wrap; }
              .widget-rss .rss-item .rss-desc { font-size:var(--rss-fs-desc); opacity:.82; line-height:1.4; word-break:break-word; overflow-wrap:anywhere; }
              .widget-rss.compact .rss-desc { display:none; }
              .widget-rss .rss-empty { font-size:.58rem; opacity:.6; padding:4px 2px; }
              .widget-rss .rss-footer { display:flex; justify-content:space-between; align-items:center; margin-top:4px; }
              .widget-rss .rss-footer button { background:none; border:0; cursor:pointer; color:var(--text); opacity:.55; font-size:.55rem; padding:2px 6px; border-radius:5px; }
              .widget-rss .rss-footer button:hover { opacity:.95; background:rgba(255,255,255,.08); }
              .widget-rss.collapsed .rss-body { display:none; }
            `);
          const limit = w.options?.limit || 5;
          const compact = !!w.options?.compact;
          const refreshMins = w.options?.refreshMins || 15;
          const highlightNew = !!w.options?.highlightNew;
          const size = w.options?.size || 'large';
      wrap.innerHTML = `<div class="rss-head">
              <button class="rss-collapse" data-act="rssToggle" title="Collapse">▾</button>
              <img class="rss-fav" alt="" />
              <span class="rss-title" title="${w.options?.url||'Feed'}">${(w.options?.title||'Feed')}</span>
        <span class="rss-proxy-badge" title="Using proxy due to CORS">PROXY</span>
              ${globalEdit?'<button class="uptime-delete-btn" data-act="deleteWidget" title="Remove widget">✕</button>':''}
            </div>
            <div class="rss-body"><div class="rss-empty">${w.options?.url?'Loading…':'Configure feed URL'}</div></div>
            <div class="rss-footer"><span class="rss-last" style="opacity:.45;">--</span></div>`;
        } else if (isIframe) {
          // IFrame widget styles (one-time)
          ensureStyle('iframe-widget-styles', `
              .widget-iframe { padding:12px 14px 14px; border:1px solid var(--border); border-radius:14px; background:linear-gradient(140deg,var(--panel-2),color-mix(in srgb,var(--panel) 88%, #000)); display:flex; flex-direction:column; gap:8px; width:100%; box-sizing:border-box; position:relative; }
              section.group .tiles .widget-iframe.full-span { grid-column:1 / -1; }
              .widget-iframe .if-head { display:flex; align-items:center; gap:10px; font:600 .68rem/1.2 system-ui,sans-serif; letter-spacing:.4px; }
              .widget-iframe .if-head .if-title { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; opacity:.85; }
              .widget-iframe .if-head button { background:none; border:0; cursor:pointer; color:var(--text); opacity:.55; font-size:.6rem; padding:2px 6px; border-radius:6px; }
              .widget-iframe .if-head button:hover { opacity:.95; background:rgba(255,255,255,.08); }
              .widget-iframe iframe { width:100%; background:#111; border:1px solid var(--border); border-radius:10px; box-sizing:border-box; }
              .widget-iframe.noborder iframe { border:none; }
              /* lockScroll: cosmetic grayscale + attempt to hide/disable scrollbars (best-effort) */
              .widget-iframe.lock-scroll iframe { filter:grayscale(.05); }
              .widget-iframe .if-msg { font-size:.55rem; opacity:.55; font-weight:500; }
              .widget-iframe.size-small { padding:10px 12px 12px; }
              .widget-iframe.size-normal { }
              .widget-iframe.size-large { padding:16px 20px 20px; }
              .widget-iframe.size-xlarge { padding:20px 24px 24px; }
              .widget-iframe.size-large .if-head, .widget-iframe.size-xlarge .if-head { font-size:.75rem; }
            `);
          const url = (w.options?.url||'').trim();
          let domain = '';
          try { if (url) domain = new URL(url).hostname.replace(/^www\./,''); } catch {}
          const explicitHeight = (w.options && w.options.height!=null) ? parseInt(w.options.height,10) : null;
          const widthOpt = (w.options && w.options.width!=null) ? parseInt(w.options.width,10) : null;
          const allowFullscreen = !!w.options?.allowFullscreen;
          const allowScripts = !!w.options?.allowScripts;
          const allowSameOrigin = !!w.options?.allowSameOrigin;
          const noBorder = !!w.options?.noBorder;
          const lockScroll = !!w.options?.lockScroll;
          const cardSize = w.options?.cardSize || 'normal';
          const spanOpt = w.options?.span || 'full';
          const sandboxFlags = [];
          if (allowScripts) sandboxFlags.push('allow-scripts');
          if (allowSameOrigin) sandboxFlags.push('allow-same-origin');
          // Allow basic forms & popups (optional usability)
          sandboxFlags.push('allow-forms','allow-popups');
          const sandboxAttr = sandboxFlags.join(' ');
          wrap.innerHTML = `
            <div class="if-head">
              <span class="if-icon">🌐</span>
              <span class="if-title" title="${escapeHtml(url||'IFrame')}">${escapeHtml(domain||url||'IFrame')}</span>
              <button class="if-refresh" data-act="iframeRefresh" title="Reload iframe">↻</button>
              ${globalEdit?'<button class="uptime-delete-btn" data-act="deleteWidget" title="Remove widget">✕</button>':''}
            </div>
            ${url?`<iframe src="${escapeHtml(url)}" data-ifrm sandbox="${sandboxAttr}" ${allowFullscreen?'allowfullscreen':''} style="${widthOpt?`width:${widthOpt}px;`:'width:100%;'}"></iframe>`:`<div class="if-msg">Configure iframe URL</div>`}
            ${!url?'' : '<div class="if-msg" data-ifmsg style="display:none;">If content fails to load the site may block embedding (X-Frame-Options / CSP).</div>'}
          `;
          wrap.classList.add('size-'+(cardSize==='small'?'small':cardSize==='large'?'large':cardSize==='xlarge'?'xlarge':'normal'));
          if (noBorder) wrap.classList.add('noborder');
          if (lockScroll) {
            wrap.classList.add('lock-scroll');
            queueMicrotask(()=>{
              const iframeEl2 = wrap.querySelector('iframe[data-ifrm]');
              if (iframeEl2) {
                // Obsolete but still honored in Chromium/WebKit; hides scrollbars for many pages.
                try { iframeEl2.setAttribute('scrolling','no'); } catch {}
                iframeEl2.style.overflow = 'hidden';
                // Try to modify inner body overflow when same-origin (silently fail otherwise)
                try {
                  iframeEl2.addEventListener('load', () => {
                    try {
                      const b = iframeEl2.contentDocument?.body;
                      if (b) { b.style.overflow='hidden'; b.style.overscrollBehavior='none'; }
                    } catch {}
                  });
                } catch {}
              }
            });
          }
          if (spanOpt === 'full') {
            wrap.classList.add('full-span');
          } else if (/^[1-6]$/.test(spanOpt)) {
            // set grid-column to span N (CSS Grid auto-fill allows explicit span)
            wrap.style.gridColumn = `span ${spanOpt}`;
          }
          // Auto height logic
          const iframeEl = wrap.querySelector('iframe[data-ifrm]');
          const resolveSpan = () => {
            if (spanOpt === 'full') return 3; // treat full as large multi-span baseline
            const n = parseInt(spanOpt,10); return isNaN(n)?1:Math.min(6,Math.max(1,n));
          };
          const groupEl = wrap.closest('section.group');
          let tileMin = 120;
          try { const tiles = groupEl?.querySelector('.tiles'); if (tiles) { const m = tiles.style.gridTemplateColumns.match(/minmax\((\d+)px/); if (m) tileMin = parseInt(m[1],10)||tileMin; } } catch {}
          const spanFactor = resolveSpan();
          const base = 340; // base px height
          const dynamicH = Math.round(base + (tileMin-120)*0.9 + (spanFactor-1)*160);
          if (iframeEl) {
            if (w.options?.autoHeight) {
              iframeEl.style.height = dynamicH+ 'px';
            } else if (explicitHeight) {
              iframeEl.style.height = explicitHeight + 'px';
            } else {
              iframeEl.style.height = '480px';
            }
          }
          if (iframeEl) {
            // Show note after a short delay if still blank (cannot reliably detect frame denial across origins)
            setTimeout(()=>{
              try {
                if (!iframeEl.contentDocument || iframeEl.contentDocument.location.href === 'about:blank') {
                  const msg = wrap.querySelector('[data-ifmsg]'); if (msg) msg.style.display='block';
                }
              } catch { const msg = wrap.querySelector('[data-ifmsg]'); if (msg) msg.style.display='block'; }
            }, 2500);
          }
        } else if (isCovid) {
          ensureStyle('covid-widget-styles', `
              .widget-covid { padding:14px 18px 16px; border:1px solid var(--border); border-radius:14px; background:linear-gradient(150deg,var(--panel-2),color-mix(in srgb,var(--panel) 86%,#000)); display:flex; flex-direction:column; gap:10px; width:100%; box-sizing:border-box; position:relative; }
              section.group .tiles .widget-covid { grid-column:1 / -1; }
              .widget-covid .cv-head { display:flex; align-items:center; gap:8px; font:600 .8rem/1.2 system-ui,sans-serif; letter-spacing:.4px; }
              .widget-covid .cv-title { flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
              .widget-covid .cv-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; align-items:stretch; }
              .widget-covid .cv-box { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:14px 10px 12px; background:rgba(0,0,0,.25); border:1px solid color-mix(in srgb,var(--border) 65%, transparent); border-radius:12px; text-align:center; gap:4px; }
              .widget-covid .cv-box h4 { margin:0; font:600 .62rem/1.15 system-ui,sans-serif; letter-spacing:.3px; opacity:.78; }
              .widget-covid .cv-box .cv-val { font:700 1.05rem/1.05 system-ui,sans-serif; letter-spacing:.5px; }
              .widget-covid .cv-confirmed { color:#e3d24e; }
              .widget-covid .cv-recovered { color:#35d07f; }
              .widget-covid .cv-deaths { color:#ff4d4d; }
              .widget-covid .cv-active { color:#ffffff; }
              .widget-covid .cv-meta { font:500 .55rem/1.2 system-ui,sans-serif; opacity:.55; display:flex; justify-content:space-between; }
              .widget-covid .cv-refresh { background:none; border:0; cursor:pointer; color:var(--text); opacity:.55; font-size:.65rem; padding:2px 6px; border-radius:6px; }
              .widget-covid .cv-refresh:hover { opacity:.95; background:rgba(255,255,255,.08); }
            `);
          const country = (w.options?.country||'').trim();
          const refreshMins = w.options?.refreshMins || 60;
          wrap.innerHTML = `
            <div class="cv-head">
              <span class="cv-emoji">☣️</span>
              <span class="cv-title" title="${country?escapeHtml(country):'Global'}">Covid-19 Status</span>
              <button class="cv-refresh" data-act="covidRefresh" title="Refresh">↻</button>
              ${globalEdit?'<button class="uptime-delete-btn" data-act="deleteWidget" title="Remove widget">✕</button>':''}
            </div>
            <div class="cv-grid" data-cvgrid>
              <div class="cv-box"><h4>Total Confirmed</h4><div class="cv-val cv-confirmed">--</div></div>
              <div class="cv-box"><h4>Active Cases</h4><div class="cv-val cv-active">--</div></div>
              <div class="cv-box"><h4>Total Recovered</h4><div class="cv-val cv-recovered">--</div></div>
              <div class="cv-box"><h4>Total Deaths</h4><div class="cv-val cv-deaths">--</div></div>
            </div>
            <div class="cv-meta"><span data-cvupdated>—</span><span>${country?escapeHtml(country):'Global'}</span></div>
          `;
          wrap.dataset.refreshMins = refreshMins;
          // Fetch logic: use disease.sh API (public). Minimal caching window (5m) inside session.
          const CV_TTL = 5*60*1000;
          const cacheKey = country?('c:'+country.toLowerCase()):'global';
          const gridEl = wrap.querySelector('[data-cvgrid]');
          const updatedEl = wrap.querySelector('[data-cvupdated]');
          const setVals = (d) => {
            const boxes = gridEl?.querySelectorAll('.cv-val');
            if (!boxes || boxes.length<4) return;
            function fmt(n){ if(n==null||!isFinite(n)) return '--'; return n.toLocaleString(); }
            boxes[0].textContent = fmt(d.cases);
            boxes[1].textContent = fmt(d.active);
            boxes[2].textContent = fmt(d.recovered);
            boxes[3].textContent = fmt(d.deaths);
            if (updatedEl) {
              const t = d.updated ? new Date(d.updated).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '';
              updatedEl.textContent = t || '—';
            }
          };
          const fetchCovid = (force) => {
            const now = Date.now();
            const c = getCache('covid');
            if (!force && c.store[cacheKey] && (now - c.ts[cacheKey] < CV_TTL)) { setVals(c.store[cacheKey]); schedule(); return; }
            // Endpoint: global or country
            let url = country ? `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(country)}?strict=true` : 'https://disease.sh/v3/covid-19/all';
            fetch(url).then(r=>r.ok?r.json():{__err:true,status:r.status}).then(data=>{
              if(!data || data.__err){ return; }
              c.store[cacheKey]=data; c.ts[cacheKey]=Date.now();
              setVals(data);
            }).catch(()=>{}).finally(()=>{ schedule(); });
          };
          const schedule = () => { clearTimeout(wrap.__cvTimeout); const mins=parseInt(refreshMins,10)||60; wrap.__cvTimeout=setTimeout(()=>fetchCovid(false), mins*60000); };
            scheduleIdle(() => fetchCovid(true));
        } else {
          wrap.style.padding = '12px';
          wrap.style.border = '1px solid var(--border)';
          wrap.style.borderRadius = '12px';
          wrap.style.background = 'var(--panel-2)';
          wrap.innerHTML = `<div class="widget-body"><em style='opacity:.55;'>Loading...</em></div>`;
        }

  const metaLine = wrap.querySelector('.uptime-meta-line');
  const barLine = wrap.querySelector('[data-bar]');

        const renderMonitor = (m) => {
          const ratioVal = parseFloat(m.custom_uptime_ratio || '0');
          const ratioPct = isFinite(ratioVal) ? Math.min(100, Math.max(0, ratioVal)) : 0;
          const isUp = m.status == 2;
          let ratioStr = ratioPct.toFixed(2)+'%';
          let pctClass='';
          if (ratioPct < 90) pctClass='tier-bad'; else if (ratioPct < 97) pctClass='tier-deg'; else if (ratioPct < 99.5) pctClass='tier-warn';
          if (!isUp) { ratioStr = '100%'; pctClass='tier-bad'; }
          metaLine.classList.toggle('has-delete', !!globalEdit);
          metaLine.innerHTML = `
            <div class="uptime-left">
              <span class="uptime-name" title="${m.friendly_name || m.url || m.id}">${m.friendly_name || m.url || m.id}</span>
              <span class="uptime-bullet">•</span>
              <span class="uptime-pct ${pctClass}">${ratioStr}</span>
            </div>
            <div class="uptime-right ${isUp ? '' : 'down'}"><span>${isUp ? 'Service Operational' : 'Service Down'}</span><span class="uptime-dot"></span></div>
            ${globalEdit ? '<button class="uptime-delete-btn" data-act="deleteWidget" title="Remove widget">✕</button>' : ''}`;
          // bar line
          barLine.textContent = '';
          let segments = 100;
          try { const avail = wrap.getBoundingClientRect().width - 80; if (avail>0) segments = Math.min(140, Math.max(80, Math.round(avail/8))); } catch {}
          // smooth transition
          if (!isUp) barLine.classList.add('down'); else barLine.classList.remove('down');
        };

        if (w.type === 'uptime-robot') {
          if (!w.options) w.options = {};
          if (!w.options?.apiKey) {
            metaLine.innerHTML = '<div class="uptime-left"><span class="uptime-name" style="opacity:.6;">Configure widget</span></div>';
          } else {
            const apiKey = w.options.apiKey;
            const applyData = (data) => {
              if (!data || data.stat!=='ok' || !data.monitors?.length) { metaLine.innerHTML = '<div class="uptime-left"><span class="uptime-name" style="opacity:.6;">No monitors</span></div>'; return; }
              if (w.options.monitorIndex == null) { const siblings = g.widgets.filter(x => x.type==='uptime-robot'); w.options.monitorIndex = siblings.indexOf(w); saveState(); }
              const chosen = data.monitors[w.options.monitorIndex % data.monitors.length];
              renderMonitor(chosen);
            };
            const scheduleFetch = () => {
              window.__uptimeRobotMgr.get(apiKey)
                .then(d => {
                  if (d && d.stat === 'rate_limited') {
                    metaLine.innerHTML = '<div class="uptime-left"><span class="uptime-name" style="opacity:.6;">Rate limited…</span></div>';
                  } else if (!d) {
                    metaLine.innerHTML = '<div class="uptime-left"><span class="uptime-name" style="opacity:.6;">Failed</span></div>';
                  } else {
                    applyData(d);
                  }
                })
                .finally(() => {
                  // Adaptive next refresh: base TTL plus light jitter
                  wrap.__uptimeTimeout = setTimeout(scheduleFetch, UPTIME_TTL + Math.random()*4000);
                });
            };
            // kick off
            scheduleFetch();
          }
  } else if (isWeather) {
          if (!(w.options?.city || (w.options?.lat!=null && w.options?.lon!=null))) {
            const bodyEl = wrap.querySelector('.weather-body');
            if (bodyEl) bodyEl.querySelector('.ow-cond').textContent = 'Configure widget';
          } else {
            const units = w.options.units || 'metric';
            const hideDetails = !!w.options.hideDetails;
            const city = (w.options.city || '').trim();
            const hasCoords = (typeof w.options.lat === 'number' && typeof w.options.lon === 'number');
            const lat = hasCoords ? w.options.lat : null;
            const lon = hasCoords ? w.options.lon : null;
            // Display preference: keep the original city text if provided; only fall back to coordinates when no city string exists.
            const locLabel = city || (hasCoords ? `${lat.toFixed(2)},${lon.toFixed(2)}` : '');
            const cacheKey = (hasCoords?('lat:'+lat+'|lon:'+lon):city.toLowerCase())+'|'+units+'|'+(hideDetails?1:0);
            const bodyEl = wrap.querySelector('.weather-body');
            const tempEl = bodyEl.querySelector('.ow-temp');
            const condEl = bodyEl.querySelector('.ow-cond');
            const metaEl = bodyEl.querySelector('.ow-meta');
            const iconBigEl = bodyEl.querySelector('.ow-icon-big');
            const fetchWeather = () => {
              const now = Date.now();
              if (owCache.store[cacheKey] && (now - owCache.ts[cacheKey] < OW_TTL)) {
                applyWeather(owCache.store[cacheKey]);
                schedule();
                return;
              }
              const resolveAndFetch = () => {
                const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(w.options.lat)}&longitude=${encodeURIComponent(w.options.lon)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,weather_code,wind_speed_10m,cloud_cover,visibility&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&temperature_unit=${units==='imperial'?'fahrenheit':'celsius'}&wind_speed_unit=${units==='imperial'?'mph':'ms'}&timezone=auto`;
                condEl.textContent='Loading…'; tempEl.style.opacity='.6';
                fetch(apiUrl).then(r=>r.ok?r.json():{__err:true,status:r.status}).then(data=>{
                  if(!data || data.__err){ condEl.textContent=(data && data.status===404)?'Not found':'Error'; tempEl.style.opacity='.5'; wrap.__owTimeout=setTimeout(fetchWeather,60000); return; }
                  if(!data.current){ condEl.textContent='No data'; tempEl.style.opacity='.5'; wrap.__owTimeout=setTimeout(fetchWeather,60000); return; }
                  owCache.store[cacheKey]=data; owCache.ts[cacheKey]=Date.now();
                  applyWeather(data);
                }).catch(()=>{ condEl.textContent='Error'; tempEl.style.opacity='.5'; wrap.__owTimeout=setTimeout(fetchWeather,60000); }).finally(()=>{ if(!wrap.__owTimeout) schedule(); });
              };
              if (hasCoords) {
                resolveAndFetch();
              } else {
                condEl.textContent='Locating…'; tempEl.style.opacity='.6';
                const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(city)}`;
                fetch(geoUrl).then(r=>r.ok?r.json():{__err:true,status:r.status}).then(g=>{
                  if(!g || g.__err || !g.results || !g.results[0]) { condEl.textContent='Not found'; tempEl.style.opacity='.5'; return; }
                  const r0 = g.results[0];
                  w.options.lat = r0.latitude; w.options.lon = r0.longitude; // persist
                  resolveAndFetch();
                }).catch(()=>{ condEl.textContent='Error'; tempEl.style.opacity='.5'; });
              }
            };
            const applyWeather = (d) => {
              const current = d.current || {};
              const t = Math.round(current.temperature_2m);
              const symbol = units === 'imperial' ? '°F' : '°C';
              tempEl.textContent = (isFinite(t)?t:'--') + symbol;
              const codeMap = { 0:['Clear','☀️'],1:['Mainly Clear','🌤️'],2:['Partly Cloudy','⛅'],3:['Overcast','☁️'],45:['Fog','🌫️'],48:['Fog','🌫️'],51:['Drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Drizzle','🌦️'],61:['Rain','🌧️'],63:['Rain','🌧️'],65:['Heavy Rain','🌧️'],71:['Snow','🌨️'],73:['Snow','🌨️'],75:['Snow','🌨️'],80:['Showers','🌦️'],81:['Showers','🌦️'],82:['Heavy Showers','🌧️'],95:['Thunder','⛈️'],96:['Thunder','⛈️'],99:['Thunder','⛈️'] };
              const code = current.weather_code;
              const pair = codeMap[code] || ['—','☁️'];
              condEl.textContent = pair[0];
              iconBigEl.textContent = pair[1];
              // Fog specific presentation tweaks
              if (code === 45 || code === 48) {
                wrap.classList.add('foggy');
                if (!wrap.querySelector('.weather-fog-overlay')) {
                  const ov = document.createElement('div'); ov.className='weather-fog-overlay'; wrap.appendChild(ov);
                }
              } else {
                wrap.classList.remove('foggy');
              }
              bodyEl.querySelector('.ow-loc').textContent = locLabel || '—';
              if (hideDetails) { metaEl.innerHTML=''; wrap.classList.add('compact','collapsed'); tempEl.style.opacity='1'; bodyEl.querySelector('.ww-toggle-details').textContent='Show More'; return; }
              const feels = current.apparent_temperature!=null ? Math.round(current.apparent_temperature)+symbol : null;
              const humidity = current.relative_humidity_2m!=null ? (current.relative_humidity_2m+'%') : null;
              const pressure = current.pressure_msl!=null ? Math.round(current.pressure_msl)+'hPa' : null;
              const wind = current.wind_speed_10m!=null ? (current.wind_speed_10m + (units==='imperial'?'mph':'m/s')) : null;
              const clouds = current.cloud_cover!=null ? (current.cloud_cover+'%') : null;
              const visibility = current.visibility!=null ? (Math.round(current.visibility/1000)+'km') : null;
              const minT = d?.daily?.temperature_2m_min?.[0];
              const maxT = d?.daily?.temperature_2m_max?.[0];
              const left=[]; if (isFinite(minT)) left.push(['Min Temp', Math.round(minT)+symbol]); if (isFinite(maxT)) left.push(['Max Temp', Math.round(maxT)+symbol]); if (feels) left.push(['Feels Like', feels]);
              const right=[]; if (pressure) right.push(['Pressure', pressure]); if (humidity) right.push(['Humidity', humidity]); if (visibility) right.push(['visibility', visibility]); if (wind) right.push(['wind', wind]); if (clouds) right.push(['clouds', clouds]);
              metaEl.innerHTML = `<div class=\"ww-col\">${left.map(r=>`<div class=\\"ow-row\\"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div><div class=\"ww-col\">${right.map(r=>`<div class=\\"ow-row\\"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}</div>`;
              // Highlight visibility row when very low (<1km) for quick scanning
              if ((code === 45 || code === 48) && current.visibility != null && current.visibility < 1000) {
                const rows = metaEl.querySelectorAll('.ow-row');
                rows.forEach(row => { if (/visibility/i.test(row.textContent)) row.classList.add('highlight'); });
              }
              tempEl.style.opacity='1';
            };
            const schedule = () => { wrap.__owTimeout = setTimeout(fetchWeather, OW_TTL + Math.random()*60000); };
            scheduleIdle(fetchWeather);
          }
        } else if (isRSS) {
          if (!w.options?.url) {
            // nothing else to do
          } else {
            const RSS_TTL = 15*60*1000;
            const url = w.options.url;
            const limit = w.options.limit || 5;
            const compact = !!w.options.compact;
            const highlightNew = !!w.options.highlightNew; // re-declare for this scope (was earlier in markup block)
            const bodyEl = wrap.querySelector('.rss-body');
            const titleEl = wrap.querySelector('.rss-title');
            const cacheKey = url+'|'+limit+'|'+(compact?1:0);
            const parseFeed = (text) => {
              let doc; try { doc = new DOMParser().parseFromString(text, 'application/xml'); } catch { return []; }
              if (!doc) return [];
              const isAtom = !!doc.querySelector('feed > entry');
              const nodes = Array.from(doc.querySelectorAll(isAtom?'feed > entry':'channel > item')).slice(0, limit);
              const items = nodes.map(el => {
                const get = (sel) => (el.querySelector(sel)?.textContent||'').trim();
                const getNs = (sel) => (el.querySelector(sel)?.textContent||'').trim(); // for namespaced fields like content:encoded, dc:date
                const title = get(isAtom?'title':'title');
                let link = '';
                if (isAtom) { link = el.querySelector('link')?.getAttribute('href') || get('link'); }
                else { link = get('link'); }
                // WordPress often has <content:encoded>
                const contentEncoded = getNs('content\\:encoded');
                const descRaw = contentEncoded || get(isAtom?'summary':'description');
                // Clean description while preserving basic spacing
                const desc = descRaw
                  .replace(/<script[\s\S]*?<\/script>/gi,'')
                  .replace(/<style[\s\S]*?<\/style>/gi,'')
                  .replace(/<br\s*\/?>/gi,'\n')
                  .replace(/<p[^>]*>/gi,'\n')
                  .replace(/<[^>]+>/g,'')
                  .replace(/&nbsp;/gi,' ')
                  .replace(/\n{3,}/g,'\n\n')
                  .trim();
                const pub = get(isAtom?'updated':'pubDate') || getNs('dc\\:date');
                const guid = get('guid') || getNs('id');
                return { title, link, desc, pub, guid };
              });
              if (!titleEl.dataset.set) {
                const channelTitle = doc.querySelector(isAtom?'feed > title':'channel > title')?.textContent?.trim();
                if (channelTitle) { titleEl.textContent = channelTitle; titleEl.dataset.set = '1'; }
              }
              return items;
            };
            const renderFeed = (items) => {
              if (!items.length) { bodyEl.innerHTML = '<div class="rss-empty">No items</div>'; return; }
              const seenKey = 'rss_seen_'+(url);
              let seen = [];
              try { seen = JSON.parse(localStorage.getItem(seenKey)||'[]'); } catch {}
              const nowIso = new Date().toISOString();
              bodyEl.innerHTML = items.map(it=>{
                const id = it.guid || it.link || it.title;
                const isNew = highlightNew && !seen.includes(id);
                const descStr = (it.desc||'').replace(/<[^>]+>/g,'').replace(/&nbsp;/gi,' ').trim();
                return `<div class=\"rss-item${isNew?' new':''}\" data-id=\"${escapeHtml(id)}\"><h4><a href=\"${it.link||'#'}\" target=\"_blank\" rel=\"noopener\">${escapeHtml(it.title||'(untitled)')}</a></h4><div class=\"rss-meta\">${it.pub?escapeHtml(it.pub):''}</div>${!compact?`<div class=\"rss-desc\">${escapeHtml(descStr.slice(0,260))}${descStr.length>260?'…':''}</div>`:''}</div>`;
              }).join('');
              // Favicon: set once once we have at least one item or fallback to feed URL domain
              if (!wrap.__rssFavSet) {
                let favDomain='';
                try { const testLink = items[0]?.link || url; favDomain = new URL(testLink).hostname.replace(/^www\./,''); } catch {}
                const favEl = wrap.querySelector('.rss-fav');
                if (favEl && favDomain) {
                  const primary = 'https://logo.dev/'+favDomain+'?size=32';
                  const fallback = 'https://logo.clearbit.com/'+favDomain;
                  favEl.src = primary;
                  favEl.classList.add('visible');
                  favEl.addEventListener('error', ()=>{ if (favEl.src!==fallback) favEl.src=fallback; });
                }
                wrap.__rssFavSet = true;
              }
              // store last render time
              wrap.querySelector('.rss-last').textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
              // schedule auto-refresh
              const mins = parseInt(wrap.dataset.refreshMins,10)||15;
              clearTimeout(wrap.__rssTimeout);
              wrap.__rssTimeout = setTimeout(()=>{ fetchFeed(true); }, mins*60000);
            };
            const fetchFeed = (force) => {
              const now = Date.now();
              const cache = getCache('rss');
              if (!force && cache.store[cacheKey] && (now - cache.ts[cacheKey] < RSS_TTL)) { renderFeed(cache.store[cacheKey]); return; }
              bodyEl.innerHTML = '<div class="rss-empty">Loading…</div>';
              // Proxy decision (persist per host after first CORS failure)
              let host=''; try { host = new URL(url).hostname; } catch {}
              let blockedDomains=[]; try { blockedDomains = JSON.parse(localStorage.getItem('__rssBlockedDomains')||'[]'); } catch {}
              const knownBlockPatterns = [/feedburner\.com$/i,/cybersecuritynews\.com$/i,/cloaked\.com$/i];
              // Detect extension environment: attempting proxy fetches that will CORS-block generates noisy console errors.
              const isExtensionCtx = location.protocol === 'chrome-extension:';
              // Refined proxy strategy & suppression system:
              // Goal: prevent intermittent noisy CORS console errors (like FeedBurner) permanently.
              // Approach:
              //  - Maintain a metadata map of hosts => last failure timestamp (__rssBlockedMeta).
              //  - If a host failed within quiet window (BLOCK_TTL_MS) we skip direct fetch and either use proxy silently or short-circuit.
              //  - Only log diagnostic info when __RSS_DEBUG is set.
              const proxyBases = [ 'https://api.allorigins.win/raw?url=' ];
              const buildProxyUrl = (base, originalUrl) => base + encodeURIComponent(originalUrl);
              const BLOCK_TTL_MS = 6 * 3600 * 1000; // 6 hours quiet period
              let blockedMeta = {};
              try { blockedMeta = JSON.parse(localStorage.getItem('__rssBlockedMeta')||'{}'); } catch {}
              const nowTs = Date.now();
              // Expire stale entries
              let metaDirty=false; Object.keys(blockedMeta).forEach(h=>{ if (!blockedMeta[h] || (nowTs - blockedMeta[h]) > BLOCK_TTL_MS) { delete blockedMeta[h]; metaDirty=true; } });
              if (metaDirty) { try { localStorage.setItem('__rssBlockedMeta', JSON.stringify(blockedMeta)); } catch {}
              }
              const markBlocked = () => { if (host) { blockedMeta[host] = Date.now(); try { localStorage.setItem('__rssBlockedMeta', JSON.stringify(blockedMeta)); } catch {} } };
              const recentlyBlocked = !!blockedMeta[host];
              const hostPatternBlocked = knownBlockPatterns.some(r=>r.test(host));
              const shouldProxyFirst = blockedDomains.includes(host) || hostPatternBlocked || recentlyBlocked;
              if (shouldProxyFirst) { wrap.classList.add('proxy-active'); }
              // If in extension context & blocked: switch to proxy-only mode (no direct fetch) to minimize CORS warnings while still attempting to load.
              const proxyOnly = isExtensionCtx && (hostPatternBlocked || recentlyBlocked);
              // Expanded proxy list (ordered). 'get?url=' variant returns JSON with contents (includes CORS header reliably).
              const extendedProxyBases = [
                ...( /feedburner\.com$/i.test(host) ? ['https://api.rss2json.com/v1/api.json?rss_url='] : []),
                'https://api.allorigins.win/get?url=',
                'https://api.allorigins.win/raw?url=',
                'https://cors.isomorphic-git.org/',
                'https://corsproxy.io/?'
              ];
              const activeProxyBases = proxyOnly ? extendedProxyBases : proxyBases.concat(extendedProxyBases.slice(0));
              const directURL = proxyOnly ? null : url;
              const proxyURLs = activeProxyBases.map(b => buildProxyUrl(b, url));
              const quietFetch = (target) => fetch(target, { cache: 'no-store', mode: 'cors' }).catch(()=>null);
              const doFetch = (target, viaProxy) => quietFetch(target).then(r=>{
                if (!r) throw new Error('CORS');
                const status = r.status;
                const ct = (r.headers.get('content-type')||'').toLowerCase();
                return r.text().then(t=>({status, ct, text:t}));
              }).then(resp=>{
                if (resp.status < 200 || resp.status >= 400) throw new Error('HTTP '+resp.status);
                let items=[]; let titleOverride=null;
                const raw = resp.text.trim();
                const looksJson = raw.startsWith('{') || raw.startsWith('[') || resp.ct.includes('json');
                if (looksJson) {
                  try {
                    const jf = JSON.parse(raw);
                    if (jf && Array.isArray(jf.items)) {
                      items = jf.items.slice(0,limit).map(it=>{
                        const linkVal = it.url || it.link || it.external_url || '';
                        const descVal = (it.content_text || it.content_html || it.description || it.content || '').trim();
                        const pubVal = it.date_published || it.date_modified || it.pubDate || it.pub_date || '';
                        return {
                          title: it.title || '(untitled)',
                          link: linkVal,
                          desc: descVal,
                          pub: pubVal,
                          guid: it.id || it.url || it.link || it.external_url || it.title
                        };
                      });
                      titleOverride = jf.title || jf.feed?.title || null;
                    }
                  } catch(e) { /* fall through to XML parse attempt */ }
                }
                if (!items.length) {
                  // If using allorigins get?url= JSON variant
                  if (looksJson) {
                    try {
                      const ao = JSON.parse(raw);
                      if (ao && ao.contents && typeof ao.contents === 'string') {
                        try { items = parseFeed(ao.contents); } catch {}
                      }
                    } catch {}
                  }
                }
                if (!items.length) { try { items = parseFeed(raw); } catch {} }
                if (!items.length && /<html/i.test(raw)) {
                  // Attempt very loose scrape: look for <h1>/<h2>/<a> clusters
                  const tmp = document.createElement('div'); tmp.innerHTML = raw;
                  const links = Array.from(tmp.querySelectorAll('a[href]')).slice(0,limit);
                  items = links.map(a=>({ title: a.textContent.trim().slice(0,120)||'(link)', link:a.href, desc:'', pub:'', guid:a.href }));
                  if (!titleOverride) { const h = tmp.querySelector('h1,h2,title'); if (h) titleOverride = h.textContent.trim(); }
                }
                if (titleOverride && !titleEl.dataset.set) {
                  titleEl.textContent = titleOverride;
                  titleEl.dataset.set='1';
                }
                if (!items.length && !viaProxy) {
                  const next = proxyURLs.find(pu => pu !== target);
                  if (next) return doFetch(next, true);
                }
                cache.store[cacheKey]=items; cache.ts[cacheKey]=Date.now();
                renderFeed(items);
              }).catch(err=>{
                const corsLike = /Failed to fetch|NetworkError|CORS|blocked by CORS|TypeError: Failed/i.test(err+'');
                if (corsLike) markBlocked();
                if (!bodyEl.__proxyTried && !recentlyBlocked) {
                  bodyEl.__proxyTried = true;
                  wrap.classList.add('proxy-active');
                  const next = proxyURLs.find(pu => !target || pu !== target);
                  if (next) return doFetch(next, true);
                }
                const isFeedBurner = /feedburner\.com/i.test(url);
                bodyEl.innerHTML = `<div class=\"rss-empty\">${corsLike? 'Feed unavailable' : 'Error loading feed'}</div>`;
                if (window.__RSS_DEBUG && !isFeedBurner) console.warn('[RSS] fetch failed', { url, corsLike, err });
              });
              // Launch initial request sequence:
              if (shouldProxyFirst || proxyOnly) {
                // Sequentially attempt proxies until one yields items (or exhaust list)
                let chain = Promise.reject();
                proxyURLs.forEach(pu => { chain = chain.catch(()=> doFetch(pu, true)); });
                if (!proxyOnly && directURL) chain = chain.catch(()=> doFetch(directURL,false));
                chain.catch(()=>{
                  // Last-resort fallback for stubborn feeds (cloaked.com, feedburner.com) using r.jina.ai text proxy.
                  if (/cloaked\.com|feedburner\.com/i.test(url)) {
                    const jinaUrl = 'https://r.jina.ai/' + url.replace(/^https?:\/\//,'https://');
                    quietFetch(jinaUrl).then(r=> r ? r.text() : '').then(txt => {
                      if (!txt) { bodyEl.innerHTML = '<div class="rss-empty">Feed unavailable</div>'; return; }
                      // Heuristic: split lines, filter for sufficiently long content.
                      const lines = txt.split(/\n+/).map(l=>l.trim()).filter(l=>l.length>25).slice(0,10);
                      const items = lines.map((l,i)=>({
                        title: l.slice(0,120),
                        link: url,
                        desc: l,
                        pub: '',
                        guid: 'fallback-'+i
                      }));
                      if (items.length) {
                        cache.store[cacheKey]=items; cache.ts[cacheKey]=Date.now();
                        renderFeed(items);
                      } else {
                        bodyEl.innerHTML = '<div class="rss-empty">Feed unavailable</div>';
                      }
                    }).catch(()=>{ bodyEl.innerHTML = '<div class="rss-empty">Feed unavailable</div>'; });
                  } else {
                    bodyEl.innerHTML = '<div class="rss-empty">Feed unavailable</div>';
                  }
                });
              } else {
                doFetch(directURL,false);
              }
            };
            scheduleIdle(() => fetchFeed());
          }
        }

        wrap.addEventListener('click', (e) => {
          const act = e.target?.dataset?.act;
          if (act === 'deleteWidget') {
            if (!confirm('Remove this widget?')) return;
            const idxW = g.widgets.findIndex(x => x.id === w.id);
            if (idxW>=0) { g.widgets.splice(idxW,1); saveState(); renderGroups(); }
          } else if (act === 'rssRefresh') {
            // force refresh ignoring cache
            try { const cache = getCache('rss'); Object.keys(cache.store).forEach(k=>{ if(k.startsWith((w.options.url||'')+'|')) { delete cache.store[k]; delete cache.ts[k]; } }); } catch {}
            // If host previously blocked & in extension context, skip full re-render fetch attempt to avoid CORS noise.
            try {
              const host = new URL(w.options.url||'').hostname;
              let blockedMeta={}; try { blockedMeta = JSON.parse(localStorage.getItem('__rssBlockedMeta')||'{}'); } catch {}
              const patternBlocked = /feedburner\.com$|cybersecuritynews\.com$|cloaked\.com$/i.test(host);
              if (location.protocol === 'chrome-extension:' && (blockedMeta[host] || patternBlocked)) {
                // Re-run just this widget in proxy-only mode by temporarily marking hostPatternBlocked & recentlyBlocked
                blockedMeta[host] = Date.now(); try { localStorage.setItem('__rssBlockedMeta', JSON.stringify(blockedMeta)); } catch {}
                // Force a minimal re-render (not full groups) to keep scroll state; call internal fetch function if accessible.
                const bodyEl = wrap.querySelector('.rss-body');
                if (bodyEl) bodyEl.innerHTML = '<div class="rss-empty">Loading…</div>';
                // Minimal inline fetch replication (proxy-only path)
                try {
                  const feedUrl = w.options.url;
                  const proxyBases = [ 'https://api.allorigins.win/get?url=', 'https://api.allorigins.win/raw?url=', 'https://cors.isomorphic-git.org/', 'https://corsproxy.io/?' ];
                  const buildProxyUrl = (b,u)=> b + encodeURIComponent(u);
                  const proxyURLs = proxyBases.map(b=>buildProxyUrl(b, feedUrl));
                  const quietFetch = t=>fetch(t).catch(()=>null);
                  const parseAttempt = async () => {
                    for (const pu of proxyURLs) {
                      const r = await quietFetch(pu); if (!r) continue; const txt = await r.text(); let items=[]; let doc;
                      try {
                        if (txt.startsWith('{')) { const ao = JSON.parse(txt); if (ao?.contents) { doc = ao.contents; } }
                      } catch {}
                      const raw = doc||txt; try { items = parseFeed(raw); } catch {}
                      if (items.length) { bodyEl.innerHTML=''; renderFeed(items); return; }
                    }
                    bodyEl.innerHTML = '<div class="rss-empty">Feed unavailable</div>';
                  };
                  parseAttempt();
                } catch {}
                return;
              }
            } catch {}
            renderGroups();
          } else if (act === 'rssToggle') {
            wrap.classList.toggle('collapsed');
            e.target.textContent = wrap.classList.contains('collapsed') ? '▸' : '▾';
          } else if (act === 'rssMarkRead') {
            const items = wrap.querySelectorAll('.rss-item');
            const seenKey = 'rss_seen_'+(w.options.url);
            const ids = Array.from(items).map(i=>i.dataset.id).filter(Boolean);
            try { const prev = JSON.parse(localStorage.getItem(seenKey)||'[]'); const merged = Array.from(new Set([...prev, ...ids])); localStorage.setItem(seenKey, JSON.stringify(merged)); } catch {}
            items.forEach(i=>i.classList.remove('new'));
          } else if (act === 'wwToggleDetails') {
            wrap.classList.toggle('collapsed');
            const btn = e.target;
            if (wrap.classList.contains('collapsed')) { btn.textContent = 'Show More'; }
            else { btn.textContent = 'Show Less'; }
          } else if (act === 'iframeRefresh') {
            const ifrm = wrap.querySelector('iframe[data-ifrm]');
            if (ifrm) {
              try { const src = ifrm.getAttribute('src'); ifrm.setAttribute('src', src); } catch {}
            }
          } else if (act === 'covidRefresh') {
            // Clear cache for this widget's key and re-render groups (simplest refresh path)
            try { const country = (w.options?.country||'').trim(); const cacheKey = country?('c:'+country.toLowerCase()):'global'; const c = getCache('covid'); delete c.store[cacheKey]; delete c.ts[cacheKey]; } catch {}
            renderGroups();
          }
        });

        widgetsFragment.appendChild(wrap);
      }); // end widgets forEach
      tilesEl.appendChild(widgetsFragment);
    } // end if widgets present

    // Link drop targets
    if (globalEdit) tilesEl.addEventListener("dragover", (e) => {
      const dataRaw = e.dataTransfer.getData("text/plain"); if (!dataRaw) return;
      const data = JSON.parse(dataRaw); if (data.type !== "link") return;
      e.preventDefault(); tilesEl.classList.add("drag-over");
    });
    if (globalEdit) tilesEl.addEventListener("dragleave", () => tilesEl.classList.remove("drag-over"));
    if (globalEdit) tilesEl.addEventListener("drop", (e) => {
      e.preventDefault(); tilesEl.classList.remove("drag-over");
      const data = JSON.parse(e.dataTransfer.getData("text/plain") || "{}");
      const pageRef = getSelectedPage();
      const toGroup   = pageRef.groups.find(x => x.id === g.id);
      if (!toGroup) return;

      if (data.type === 'link') {
        const fromGroup = pageRef.groups.find(x => x.id === data.fromGroupId);
        if (!fromGroup) return;
        const fromIdx = fromGroup.links.findIndex(x => x.id === data.id);
        if (fromIdx < 0) return;
        const children = $$(".tile", tilesEl);
        let insertAt = toGroup.links.length;
        for (let i = 0; i < children.length; i++) {
          const rect = children[i].getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) { insertAt = i; break; }
        }
        const [moved] = fromGroup.links.splice(fromIdx, 1);
        if (toGroup === fromGroup) {
          const adj = insertAt > fromIdx ? insertAt - 1 : insertAt;
          toGroup.links.splice(adj, 0, moved);
        } else {
          toGroup.links.splice(insertAt, 0, moved);
        }
      } else if (data.type === 'program') {
        const fromGroup = pageRef.groups.find(x => x.id === data.fromGroupId);
        if (!fromGroup) return;
        if (!Array.isArray(fromGroup.programs)) fromGroup.programs = [];
        if (!Array.isArray(toGroup.programs)) toGroup.programs = [];
        const fromIdx = fromGroup.programs.findIndex(x => x.id === data.id);
        if (fromIdx < 0) return;
        const children = $$(".program-tile", tilesEl);
        let insertAt = toGroup.programs.length;
        for (let i = 0; i < children.length; i++) {
          const rect = children[i].getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) { insertAt = i; break; }
        }
        const [moved] = fromGroup.programs.splice(fromIdx, 1);
        if (toGroup === fromGroup) {
          const adj = insertAt > fromIdx ? insertAt - 1 : insertAt;
          toGroup.programs.splice(adj, 0, moved);
        } else {
          toGroup.programs.splice(insertAt, 0, moved);
        }
      }
      saveState(); renderGroups();
    });

    groupsFragment.appendChild(wrapper);
  });

  // Commit all group sections in one append
  container.appendChild(groupsFragment);

  // Add group card (button-style)
  if (STATE.settings?.editMode !== false) {
    const addCard = document.createElement("button");
    addCard.className = "group-add-card";
    addCard.type = "button";
    addCard.dataset.action = "addGroup";
    addCard.setAttribute("title", "Create a new group");
    addCard.innerHTML = `<span class="group-add-label">Create Group</span>`;
    container.appendChild(addCard);
  }

  // one-time closers for group flyout
  if (!groupFlyoutBound) {
    document.addEventListener("click", () => {
      const f = document.getElementById("group-flyout");
      if (f) f.remove();
      $$(".group-menu-btn[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const f = document.getElementById("group-flyout");
        if (f) f.remove();
        $$(".group-menu-btn[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
      }
    });
    // close on scroll to avoid stale positions
    container.addEventListener("scroll", () => {
      const f = document.getElementById("group-flyout");
      if (f) f.remove();
      $$(".group-menu-btn[aria-expanded='true']").forEach(b => b.setAttribute("aria-expanded", "false"));
    }, { passive: true });

    groupFlyoutBound = true;
  }

  ensureLogoAttribution(STATE);

  // Internal performance tracking (UI panel removed). Keep rolling render times for potential adaptive logic.
  try {
    const elapsed = Math.round((performance.now() - t0));
    window.__sdPerfRenders.push(elapsed);
    if (window.__sdPerfRenders.length > 30) window.__sdPerfRenders.splice(0, window.__sdPerfRenders.length - 30);
  } catch {}

  // --- Lazy icon loading (links + programs) ---------------------------------
  try {
    // Reuse existing observer if present to avoid duplicates across renders
    if (!window.__sdIconObserver) {
      const inView = (entries, obs) => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
            const img = en.target;
            const src = img.getAttribute('data-icon-src');
            if (src) {
              // Guard against double-set; assign real src now
              if (!img.__loaded && !img.src) {
                img.src = src;
              }
            }
            obs.unobserve(img);
        });
      };
      if ('IntersectionObserver' in window) {
        window.__sdIconObserver = new IntersectionObserver(inView, { root:null, rootMargin:'120px 0px 140px', threshold:0.05 });
      } else {
        window.__sdIconObserver = null; // fallback path triggers immediate load below
      }
    }
    const imgs = $$("img[data-icon-src]");
    imgs.forEach(img => {
      // If already loaded (e.g. re-render) just fade in
      if (img.complete && img.naturalWidth > 0 && !img.src) {
        img.src = img.getAttribute('data-icon-src');
      }
      if (window.__sdIconObserver) {
        window.__sdIconObserver.observe(img);
      } else {
        // No observer support: assign immediately
        const s = img.getAttribute('data-icon-src');
        if (s && !img.src) img.src = s;
      }
      if (!img.__fadeBound) {
        img.__fadeBound = true;
        img.addEventListener('load', () => { img.style.opacity = '1'; }, { once:true });
        img.addEventListener('error', () => { img.style.opacity = '.6'; }, { once:true });
      }
    });
  } catch {}

  // --- Opportunistic cache pruning (idle + periodic) ------------------------
  try {
    if (!window.__sdNextCachePrune || Date.now() > window.__sdNextCachePrune) {
      const cfg = window.__sdPruneCfg || { maxAgeMs: 6*60*60*1000, maxEntries: 250 };
      scheduleIdle(() => pruneCaches(cfg));
      // schedule next prune window (randomized a bit to avoid sync across tabs)
      window.__sdNextCachePrune = Date.now() + 30*60*1000 + Math.random()*5*60*1000; // ~30-35 min
    }
  } catch {}
}

// --- Partial group diff rendering API ---------------------------------------
// Rerender only a single group by id (replaces its section). Fallback: full render if not found.
export function rerenderGroup(groupId) {
  try {
    const page = getSelectedPage();
    if (!page) return renderGroups();
    const g = page.groups.find(gr => gr.id === groupId);
    if (!g) return renderGroups();
    const container = document.getElementById('groupsContainer');
    if (!container) return renderGroups();
    const existing = container.querySelector(`section.group[data-group-id='${groupId}']`);
    if (!existing) return renderGroups();
    // Create a lightweight fake page object to reuse existing rendering logic for single group
    const fakePage = { groups: [g] };
    // Temporarily stash original selected page swap if required (renderGroups reads getSelectedPage)
    // Instead of hacking global, we inline minimal subset of render logic for this group only.
    const fragment = document.createDocumentFragment();
    // Simplest path: clone current STATE shape & call a mini routine (dup of core path trimmed)
    // To avoid large duplication, we'll call renderGroups() for now if editing state changed structure.
    // Given complexity, implement minimal micro-rerender: remove and reinsert via full renderGroups for now when edit mode is active.
    // Future optimization: extract inner group rendering into a pure function.
    // For now just fallback to full until a safe extraction is done.
    return renderGroups();
  } catch { renderGroups(); }
}
