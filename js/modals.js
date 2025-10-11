// modals.js — all modals + page/group/link CRUD (Logo.dev token kept hidden)
import {
  $, uid, normaliseUrl, faviconFor,
  checkImage, guessDomainCandidates,
  logoDevUrlForDomain, logoDevUrlForSiteUrl
} from "./utils.js";

import { STATE, saveState, saveStateNow, getSelectedPage } from "./state.js";
import { renderGroups } from "./render-groups.js";
import { renderPagesBar } from "./render-pages.js";
import { performResetAll } from "./actions.js";

import { getBestIcon } from './API/findBestIcon.js';
import { handleBrowseFolderClick } from './API/fileSystemAccess.js';

// Generic modal
export function openModal({ title, body, footer }) {
  $("#modalTitle").textContent = title || "";

  const bodyEl = $("#modalBody"); bodyEl.innerHTML = ""; bodyEl.appendChild(body);
  const footEl = $("#modalFooter"); footEl.innerHTML = ""; if (footer) footEl.appendChild(footer);

  $("#modal").hidden = false;
}

export function closeModal() { $("#modal").hidden = true; }

const refreshPage = (close) => {
  renderPagesBar();
  renderGroups();

  if (close) closeModal()
}

// Pages
export function openPageModal(pageId = null) {
  const isEdit = !!pageId;
  const page = isEdit ? STATE.pages.find(p => p.id === pageId) : { name: "" };

  const body = document.createElement("div");
  body.className = "form-grid";
  body.innerHTML = `
    <label for="pgName">Page name</label>
    <input id="pgName" type="text" value="${page?.name || ""}" placeholder="e.g. Media" />
  `;

  const footer = document.createElement("div");
  const btnCancel = document.createElement("button");

  btnCancel.className = "btn"; btnCancel.textContent = "Cancel";
  btnCancel.addEventListener("click", closeModal);

  const btnSave = document.createElement("button");
  btnSave.className = "btn"; btnSave.textContent = isEdit ? "Save" : "Add";
  btnSave.addEventListener("click", async () => {
    const name = $("#pgName").value.trim() || "Untitled";

    if (isEdit) {
      page.name = name;
    } else {
      const p = { id: uid("page"), name, groups: [] };

      STATE.pages.push(p);
      STATE.selectedPageId = p.id;
    }

    await saveStateNow();
    refreshPage(true)
  });

  footer.append(btnCancel, btnSave);
  openModal({ title: isEdit ? "Rename Page" : "Add Page", body, footer });
}

// Collage style page switcher (appears when many pages)
export function openPagesSwitcher() {
  const body = document.createElement("div");
  body.className = "pages-switcher-grid";

  STATE.pages.forEach(p => {
    const btn = document.createElement("button");
    btn.type = "button";

    btn.className = `page-switcher-item${p.id === STATE.selectedPageId ? " active" : ""}`;
    btn.textContent = p.name || "Untitled";

    btn.addEventListener("click", async () => {
      STATE.selectedPageId = p.id;

      await saveStateNow();
      refreshPage(true)
    });

    body.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.type = "button";

  addBtn.className = "page-switcher-item add";
  addBtn.textContent = "+ Add Page";

  addBtn.addEventListener("click", () => {
    closeModal();
    openPageModal();
  });

  body.appendChild(addBtn);
  openModal({ title: "All Pages", body, footer: null });
}

export async function handleDeletePage(pageId) {
  const idx = STATE.pages.findIndex(p => p.id === pageId);
  if (idx < 0) return;
  if (!confirm(`Delete page "${STATE.pages[idx].name}"?`)) return;

  STATE.pages.splice(idx, 1);
  if (!STATE.pages.length) {
    STATE.selectedPageId = null; // explicit empty state
  } else if (STATE.selectedPageId === pageId) {
    STATE.selectedPageId = STATE.pages[Math.max(0, idx - 1)].id;
  }

  await saveStateNow();
  refreshPage()
}

// Groups
export function openGroupModal() {
  const body = document.createElement("div");
  body.className = "form-grid";
  body.innerHTML = `
    <label for="grpName">Group name</label>
    <input id="grpName" type="text" value="New Group" />
    <label for="grpCenterNew" style="margin-top:6px;">Center this group</label>
    <label class="switch" style="justify-self:start;">
      <input id="grpCenterNew" type="checkbox" />
      <span class="switch-track" aria-hidden="true"></span>
      <span class="switch-label-on" aria-hidden="true">On</span>
      <span class="switch-label-off" aria-hidden="true">Off</span>
    </label>
    <small class="muted" style="grid-column:2;">If checked, the group will be horizontally centered on its own row.</small>
  `;

  const footer = document.createElement("div");
  const btnCancel = document.createElement("button");

  btnCancel.className = "btn"; btnCancel.textContent = "Cancel";
  btnCancel.addEventListener("click", closeModal);


  const btnAdd = document.createElement("button");
  btnAdd.className = "btn"; btnAdd.textContent = "Add";
  btnAdd.addEventListener("click", async () => {
    const page = getSelectedPage(); if (!page) return;
    const group = { id: uid("grp"), name: $("#grpName").value.trim() || "Group", links: [], centered: !!$("#grpCenterNew")?.checked };

    page.groups.push(group);
    await saveStateNow(); closeModal(); renderGroups();
  });

  footer.append(btnCancel, btnAdd);
  openModal({ title: "Add Group", body, footer });
}

export function deleteGroup(groupId) {
  const page = getSelectedPage(); if (!page) return;
  const idx = page.groups.findIndex(g => g.id === groupId);
  if (idx < 0) return;
  if (!confirm(`Delete group "${page.groups[idx].name}"?`)) return;
  page.groups.splice(idx, 1);
  saveState(); renderGroups();
}

// Group size (tile scaling) modal
export function openGroupSizeModal(groupId){
  const page = getSelectedPage(); if(!page) return;
  const group = page.groups.find(g=>g.id===groupId); if(!group) return;
  const current = group.tileMin || 120;
  const currentSpan = group.span || 1;
  const body = document.createElement('div');
  body.className = 'form-grid';
  body.innerHTML = `
    <label>Group</label>
    <div style="display:flex;align-items:center;gap:8px;">
      <strong>${group.name || 'Group'}</strong>
    </div>
    <label for="grpTileSize">Tile size</label>
    <select id="grpTileSize">
      <option value="110">Compact</option>
      <option value="120">Normal</option>
      <option value="150">Large</option>
      <option value="180">X-Large</option>
      <option value="220">XX-Large</option>
    </select>
    <label for="grpSpan" style="margin-top:6px;">Column span</label>
    <select id="grpSpan">
      <option value="1">Span 1 (default)</option>
      <option value="2">Span 2</option>
      <option value="3">Span 3</option>
      <option value="4">Span 4</option>
    </select>
    <small class="muted" style="grid-column:2;">Span makes this group card occupy multiple columns in the groups grid to appear wider. Actual width depends on screen size and other groups.</small>
    <label for="grpCenterExisting" style="margin-top:10px;">Center this group</label>
    <label class="switch" style="justify-self:start;">
      <input id="grpCenterExisting" type="checkbox" ${group.centered ? 'checked' : ''} />
      <span class="switch-track" aria-hidden="true"></span>
      <span class="switch-label-on" aria-hidden="true">On</span>
      <span class="switch-label-off" aria-hidden="true">Off</span>
    </label>
    <small class="muted" style="grid-column:2;">Places this group on its own row and centers it. Ignores span.</small>
  `;
  setTimeout(()=>{ const sel = body.querySelector('#grpTileSize'); if(sel) sel.value = String(current); const sp = body.querySelector('#grpSpan'); if (sp) sp.value = String(currentSpan); },0);
  const footer = document.createElement('div');
  const btnCancel = document.createElement('button'); btnCancel.className='btn'; btnCancel.textContent='Cancel'; btnCancel.addEventListener('click', closeModal);
  const btnSave = document.createElement('button'); btnSave.className='btn'; btnSave.textContent='Save'; btnSave.addEventListener('click', async ()=>{
    const val = parseInt(body.querySelector('#grpTileSize').value,10);
    if(!isNaN(val) && [110,120,150,180,220].includes(val)) { group.tileMin = val; }
    const spanVal = parseInt(body.querySelector('#grpSpan').value,10);
    if (!isNaN(spanVal) && spanVal>=1 && spanVal<=4) group.span = spanVal; else delete group.span;
  const centerGroup = body.querySelector('#grpCenterExisting')?.checked;
  if (centerGroup) { group.centered = true; } else { delete group.centered; }
    delete group.groupWidth; delete group.containerWidth; // cleanup legacy
    await saveStateNow(); closeModal(); renderGroups();
  });
  footer.append(btnCancel, btnSave);
  openModal({ title: 'Group Size', body, footer });
}

// Reset confirmation (blank wipe)
export function openResetConfirmModal() {
  const body = document.createElement('div');
  body.style.display = 'grid';
  body.style.gap = '12px';
  body.innerHTML = `
  <p style="margin:0;line-height:1.5;">This will <strong>permanently delete</strong> all pages, groups and links stored locally for Master Control Dashboard. There is no undo.</p>
    <ul style="margin:0 0 4px 18px;padding:0;line-height:1.4;font-size:.9rem;opacity:.85;">
      <li>Pages list will become completely blank</li>
      <li>All groups and app tiles are removed</li>
      <li>Your settings (theme, logo.dev key, edit toggle) are kept</li>
    </ul>
    <p style="margin:0;font-size:.85rem;opacity:.75;">If you have an export, you can re-import it later via Backup &gt; Import JSON.</p>
  `;

  const footer = document.createElement('div');
  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn';
  btnCancel.textContent = 'Cancel';
  btnCancel.addEventListener('click', () => closeModal());

  const btnYes = document.createElement('button');
  btnYes.className = 'btn danger';
  btnYes.textContent = 'Yes, wipe everything';
  btnYes.addEventListener('click', async () => {
    await performResetAll();
    closeModal();
  });

  footer.append(btnCancel, btnYes);
  openModal({ title: 'Confirm Reset', body, footer });
}

/**
 * Links — Logo.dev token remains in STATE.settings.logoDevApiKey and is never
 * rendered into any visible input or stored per-link. We store:
 *   iconType: "logo" and logoDomain: "<domain>"
 * Preview builds the signed URL at runtime using the key.
 */
export function openLinkModal(groupId, linkId = null) {
  const page = getSelectedPage(); if (!page) return;
  const group = page.groups.find(g => g.id === groupId); if (!group) return;

  const isEdit = !!linkId;
  const link = isEdit
    ? group.links.find(l => l.id === linkId)
    : { title: "", url: "", iconType: "auto", iconUrl: "", iconData: "", logoDomain: "" };

  // Handle legacy raw logo.dev URLs (surface as logo mode for editing)
  let uiIconType = link.iconType;
  let uiLogoDomain = link.logoDomain || "";
  if (isEdit && link.iconType === "url" && typeof link.iconUrl === "string") {
    const m = link.iconUrl.match(/img\.logo\.dev\/([^?]+)/i);
    if (m && m[1]) { uiIconType = "logo"; uiLogoDomain = decodeURIComponent(m[1]); }
  }

  const body = document.createElement("div");
  body.className = "form-grid";
  body.innerHTML = `
    <label>Icon preview</label>
    <div id="lnkIconPreview" style="display:flex;align-items:center;gap:12px;">
      <div class="tile-icon" style="width:64px;height:64px;border-radius:12px;display:grid;place-items:center;overflow:hidden;border:1px solid var(--border);background:var(--panel-2)"></div>
      <small class="muted" id="lnkIconInfo"></small>
    </div>

    <label for="lnkTitle">Title</label>
    <input id="lnkTitle" type="text" value="${link.title || ""}" placeholder="e.g. Plex" />

    <label for="lnkUrl">URL</label>
    <input id="lnkUrl" type="url" value="${link.url || ""}" placeholder="https://..." />

    <label for="lnkIconType">Icon</label>
    <select id="lnkIconType">
      <option value="auto">Auto (favicon)</option>
      <option value="logo">Logo.dev (by domain)</option>
      <option value="url">Image URL</option>
      <option value="upload">Upload</option>
    </select>

    <!-- LOGO.DEV (no token shown) -->
    <label for="lnkLogoDomain" class="lnkLogoDomainLabel">Company domain for logo.dev</label>
    <div class="row" id="lnkLogoDomainRow" style="grid-column:2; width:100%;">
      <input id="lnkLogoDomain" type="text" placeholder="e.g. plex.tv" style="flex:1" value="${uiLogoDomain || ""}" />
      <button class="btn" type="button" id="btnFindCompanyLogo">Find logo</button>
    </div>

    <!-- Plain URL image -->
    <label for="lnkIconUrl" class="lnkIconUrlLabel">Image URL <small>(no secrets)</small></label>
    <input id="lnkIconUrl" type="url" value="${link.iconType === "url" ? (link.iconUrl || "") : ""}"
           placeholder="https://example.com/icon.png" style="width:100%;" />

    <!-- Upload -->
    <label for="lnkIconFile" class="lnkIconFileLabel">Upload PNG/JPG</label>
    <input id="lnkIconFile" type="file" accept="image/png,image/jpeg,image/webp" style="width:100%;" />
  `;

  // Initial selection + layout pass
  setTimeout(() => {
    $("#lnkIconType").value = uiIconType || "auto";
    toggleIconInputs();
    updatePreview();
  }, 0);

  // --- helpers ---
  function showPair(labelSel, controlSel, show, controlDisplay = "") {
    const lab = body.querySelector(labelSel);
    const ctl = body.querySelector(controlSel);
    if (lab) lab.style.display = show ? "" : "none";
    if (ctl) ctl.style.display = show ? controlDisplay : "none";
  }

  function toggleIconInputs() {
    const t = $("#lnkIconType").value;
    const showLogo = t === "logo";
    const showUrl  = t === "url";
    const showUp   = t === "upload";

    // Show/hide entire row pairs so the grid never “shifts left”
    showPair(".lnkLogoDomainLabel", "#lnkLogoDomainRow", showLogo, "flex");
    showPair(".lnkIconUrlLabel",    "#lnkIconUrl",       showUrl,  "");
    showPair(".lnkIconFileLabel",   "#lnkIconFile",      showUp,   "");

    // Enable/disable semantics
    $("#lnkIconUrl").disabled = !showUrl;
    $("#lnkIconFile").disabled = !showUp;

    updatePreview();
  }

  function updatePreview() {
    const box = $("#lnkIconPreview .tile-icon"); box.innerHTML = "";
    const t = $("#lnkIconType").value;
    let src = "";

    if (t === "logo") {
      const key = STATE.settings?.logoDevApiKey?.trim();
      const dom = $("#lnkLogoDomain").value.trim();
      src = (key && dom) ? logoDevUrlForDomain(dom, key) : "";
      $("#lnkIconInfo").textContent = dom ? `Logo.dev: ${dom}` : "Enter a domain to fetch a logo";
    } else if (t === "url") {
      src = $("#lnkIconUrl").value.trim();
      $("#lnkIconInfo").textContent = src ? "Custom image URL" : "";
    } else if (t === "upload") {
      src = uploadedDataUrl || "";
      $("#lnkIconInfo").textContent = src ? "Uploaded image" : "";
    } else {
      const u = $("#lnkUrl").value.trim();
      src = u ? faviconFor(u) : "";
      $("#lnkIconInfo").textContent = src ? "Auto favicon" : "Enter URL to fetch favicon";
    }

    if (src) {
      const img = document.createElement("img");
      img.src = src; img.alt = "";
      img.style.width = "86%"; img.style.height = "86%"; img.style.objectFit = "contain";
      box.appendChild(img);
    }
  }

  async function tryTitleLogoLookup() {
    const key = STATE.settings?.logoDevApiKey?.trim();
    const title = $("#lnkTitle").value.trim();
    if (!title || !key) {
      if (!key) $("#lnkIconInfo").textContent = "Tip: add your logo.dev key in Settings to enable automatic logos.";
      return;
    }
    const candidates = guessDomainCandidates(title);
    for (const dom of candidates) {
      const testUrl = logoDevUrlForDomain(dom, key);
      if (await checkImage(testUrl)) {
        $("#lnkIconType").value = "logo";
        $("#lnkLogoDomain").value = dom;
        toggleIconInputs(); // calls updatePreview
        $("#lnkIconInfo").textContent = `Auto from logo.dev (${dom})`;
        return;
      }
    }
    $("#lnkIconType").value = "logo";
    $("#lnkLogoDomain").value = candidates[0] || "";
    toggleIconInputs();
    $("#lnkIconInfo").textContent = "No logo from title. Try entering a company domain.";
  }

  // Events
  body.addEventListener("change", (e) => {
    if (e.target.id === "lnkIconType") toggleIconInputs();
    if (e.target.id === "lnkIconUrl" && $("#lnkIconType").value === "url") updatePreview();
    if (e.target.id === "lnkUrl" && $("#lnkIconType").value === "auto") updatePreview();

    if (e.target.id === "lnkUrl") {
      const key = STATE.settings?.logoDevApiKey?.trim();
      if (key) {
        const logoUrl = logoDevUrlForSiteUrl($("#lnkUrl").value.trim(), key);
        if (logoUrl) {
          const m = logoUrl.match(/img\.logo\.dev\/([^?]+)/i);
          const dom = m && m[1] ? decodeURIComponent(m[1]) : "";
          if (dom) checkImage(logoUrl).then(ok => {
            if (ok) {
              $("#lnkIconType").value = "logo";
              $("#lnkLogoDomain").value = dom;
              toggleIconInputs();
              $("#lnkIconInfo").textContent = "Auto from logo.dev (URL)";
            }
          });
        }
      }
    }
  });

  $("#lnkTitle", body).addEventListener("blur", tryTitleLogoLookup);

  $("#btnFindCompanyLogo", body).addEventListener("click", async () => {
    const dom = $("#lnkLogoDomain").value.trim();
    if (!dom) return;
    const key = STATE.settings?.logoDevApiKey?.trim();
    const url = logoDevUrlForDomain(dom, key);
    if (!url) { $("#lnkIconInfo").textContent = "Add your logo.dev key in Settings first."; return; }
    const ok = await checkImage(url);
    if (ok) {
      $("#lnkIconType").value = "logo";
      toggleIconInputs();
      $("#lnkIconInfo").textContent = `From logo.dev (${dom})`;
    } else {
      $("#lnkIconInfo").textContent = "No logo found for that domain.";
    }
  });

  let uploadedDataUrl = link.iconType === "upload" ? (link.iconData || "") : "";
  $("#lnkIconFile", body)?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 512 * 1024) { alert("Icon too large. Keep it under 512 KB."); e.target.value = ""; return; }
    const fr = new FileReader();
    fr.onload = () => { uploadedDataUrl = fr.result; updatePreview(); };
    fr.readAsDataURL(file);
  });

  // Rehydrate when editing
  setTimeout(() => {
    if (link.iconType === "logo") {
      $("#lnkIconType").value = "logo";
      $("#lnkLogoDomain").value = link.logoDomain || "";
    } else if (link.iconType === "url") {
      $("#lnkIconType").value = uiIconType === "logo" ? "logo" : "url";
      if (uiIconType === "logo") $("#lnkLogoDomain").value = uiLogoDomain || "";
      else $("#lnkIconUrl").value = link.iconUrl || "";
    } else {
      $("#lnkIconType").value = link.iconType || "auto";
    }
    toggleIconInputs();
    updatePreview();
  }, 0);

  // Footer
  const footer = document.createElement("div");
  const btnCancel = document.createElement("button");
  btnCancel.className = "btn"; btnCancel.textContent = "Cancel";
  btnCancel.addEventListener("click", closeModal);

  const btnDelete = document.createElement("button");
  btnDelete.className = "btn danger"; btnDelete.textContent = "Delete";
  if (!isEdit) btnDelete.classList.add("hidden");
  btnDelete.addEventListener("click", async () => {
    if (!confirm(`Delete "${link.title || "link"}"?`)) return;
    const idx = group.links.findIndex(l => l.id === linkId);
    if (idx >= 0) group.links.splice(idx, 1);
    await saveStateNow(); closeModal(); renderGroups();
  });

  const btnSave = document.createElement("button");
  btnSave.className = "btn"; btnSave.textContent = isEdit ? "Save" : "Add";
  btnSave.addEventListener("click", async () => {
    const title = $("#lnkTitle").value.trim() || "Untitled";
    const url = normaliseUrl($("#lnkUrl").value.trim());
    const iconType = $("#lnkIconType").value;

    const payload = { title, url, iconType };

    if (iconType === "logo") {
      payload.logoDomain = $("#lnkLogoDomain").value.trim();
      delete payload.iconUrl; delete payload.iconData;
    } else if (iconType === "url") {
      payload.iconUrl = $("#lnkIconUrl").value.trim();
      delete payload.iconData; delete payload.logoDomain;
    } else if (iconType === "upload") {
      payload.iconData = uploadedDataUrl || link.iconData || "";
      delete payload.iconUrl; delete payload.logoDomain;
    } else { // auto
      delete payload.iconUrl; delete payload.iconData; delete payload.logoDomain;
    }

    if (isEdit) Object.assign(link, payload);
    else group.links.push({ id: uid("lnk"), ...payload });

    await saveStateNow(); closeModal(); renderGroups();
  });

  footer.append(btnCancel, btnDelete, btnSave);
  openModal({ title: isEdit ? "Edit Link" : "Add Link", body, footer });
}

// Widgets
export function openWidgetModal(groupId, widgetId = null) {
  const page = getSelectedPage(); if (!page) return;
  const group = page.groups.find(g => g.id === groupId); if (!group) return;
  if (!Array.isArray(group.widgets)) group.widgets = [];

  const isEdit = !!widgetId;
  const widget = isEdit ? group.widgets.find(w => w.id === widgetId) : { type: 'uptime-robot', options: { apiKey: '' } };

  const body = document.createElement('div');
  body.className = 'form-grid';
  body.innerHTML = `
    <label for="wdgType">Type</label>
    <select id="wdgType">
      <option value="uptime-robot">Uptime Robot</option>
      <option value="weather">Weather</option>
      <option value="rss">RSS Feed</option>
      <option value="iframe">IFrame</option>
      <option value="covid">Covid-19 Status</option>
    </select>

  <label for="wdgApiKey" data-wlbl-ur>Uptime Robot Read-Only API Key</label>
  <input id="wdgApiKey" type="text" placeholder="(API Key)" value="${widget.type==='uptime-robot' ? (widget.options?.apiKey || '') : ''}" />
    <label for="wdgCity" class="ow-only" style="display:none;">City (City or City,Country)</label>
    <input id="wdgCity" class="ow-only" style="display:none;" type="text" placeholder="London or London,UK" value="${(widget.type==='openweather'||widget.type==='weather') ? (widget.options?.city||widget.options?.location||'') : ''}" />

    <label for="wdgLat" class="ow-only" style="display:none;">Latitude (optional)</label>
    <input id="wdgLat" class="ow-only" style="display:none;" type="number" step="0.0001" placeholder="51.5072" value="${(widget.type==='openweather'||widget.type==='weather') ? (widget.options?.lat ?? '') : ''}" />
    <label for="wdgLon" class="ow-only" style="display:none;">Longitude (optional)</label>
    <input id="wdgLon" class="ow-only" style="display:none;" type="number" step="0.0001" placeholder="-0.1276" value="${(widget.type==='openweather'||widget.type==='weather') ? (widget.options?.lon ?? '') : ''}" />

    <label for="wdgUnits" class="ow-only" style="display:none;">Units</label>
    <select id="wdgUnits" class="ow-only" style="display:none;">
      <option value="metric">Celsius (metric)</option>
      <option value="imperial">Fahrenheit (imperial)</option>
    </select>

    <label for="wdgHideDetails" class="ow-only" style="display:none;">Hide details</label>
    <div class="ow-only" style="display:none;align-items:center;gap:6px;">
      <input id="wdgHideDetails" type="checkbox" ${ (widget.options?.hideDetails ? 'checked' : '') } /> <small class="muted">Hide min/max, wind, humidity, etc.</small>
    </div>

    <label for="wdgRssUrl" class="rss-only" style="display:none;">Feed URL</label>
    <input id="wdgRssUrl" class="rss-only" style="display:none;" type="text" placeholder="https://example.com/feed.xml" value="${widget.type==='rss' ? (widget.options?.url||'') : ''}" />
    <label for="wdgRssLimit" class="rss-only" style="display:none;">Items (max 15)</label>
    <input id="wdgRssLimit" class="rss-only" style="display:none;" type="number" min="1" max="15" value="${widget.type==='rss' ? (widget.options?.limit||5) : 5}" />
    <label for="wdgRssRefresh" class="rss-only" style="display:none;">Refresh (mins)</label>
    <input id="wdgRssRefresh" class="rss-only" style="display:none;" type="number" min="1" max="180" value="${widget.type==='rss' ? (widget.options?.refreshMins||15) : 15}" />
    <label for="wdgRssSize" class="rss-only" style="display:none;">Size</label>
    <select id="wdgRssSize" class="rss-only" style="display:none;">
      <option value="small">Small</option>
      <option value="normal">Normal</option>
      <option value="large">Large</option>
      <option value="xlarge">Extra Large</option>
    </select>
    <label for="wdgRssCompact" class="rss-only" style="display:none;">Compact mode</label>
    <div class="rss-only" style="display:none;align-items:center;gap:6px;">
      <input id="wdgRssCompact" type="checkbox" ${ (widget.type==='rss' && widget.options?.compact ? 'checked' : '') } /> <small class="muted">Hide descriptions</small>
    </div>
    <label for="wdgRssHighlight" class="rss-only" style="display:none;">Highlight new</label>
    <div class="rss-only" style="display:none;align-items:center;gap:6px;">
      <input id="wdgRssHighlight" type="checkbox" ${ (widget.type==='rss' && widget.options?.highlightNew ? 'checked' : '') } /> <small class="muted">Emphasize items not yet seen</small>
    </div>

    <label for="wdgCovidCountry" class="covid-only" style="display:none;">Country (optional)</label>
    <input id="wdgCovidCountry" class="covid-only" style="display:none;" type="text" placeholder="(blank = Global) e.g. US or Germany" value="${widget.type==='covid' ? (widget.options?.country||'') : ''}" />
    <label for="wdgCovidRefresh" class="covid-only" style="display:none;">Refresh (mins)</label>
    <input id="wdgCovidRefresh" class="covid-only" style="display:none;" type="number" min="5" max="360" value="${widget.type==='covid' ? (widget.options?.refreshMins||60) : 60}" />

  <small class="muted ur-note" style="grid-column:2">Uses Uptime Robot v2 JSON API (getMonitors). Key stored locally only.</small>
  <small class="muted ow-note" style="grid-column:2;display:none;">Powered by Open-Meteo (no API key required). Provide city OR latitude+longitude. Lat+lon override city. Data cached ~10m.</small>
  <small class="muted rss-note" style="grid-column:2;display:none;">Simple RSS/Atom fetch (no key). Parsed client-side. Cached ~15m.</small>
    <label for="wdgIframeUrl" class="iframe-only" style="display:none;">IFrame URL</label>
    <input id="wdgIframeUrl" class="iframe-only" style="display:none;" type="text" placeholder="https://example.com/" value="${widget.type==='iframe' ? (widget.options?.url||'') : ''}" />
  <label for="wdgIframeHeight" class="iframe-only" style="display:none;">Height (px) <small style='opacity:.6'>(blank = auto)</small></label>
  <input id="wdgIframeHeight" class="iframe-only" style="display:none;" type="number" min="100" max="2000" placeholder="auto" value="${widget.type==='iframe' && !widget.options?.autoHeight ? (widget.options?.height||'') : ''}" />
  <label for="wdgIframeWidth" class="iframe-only" style="display:none;">Width (px, optional)</label>
  <input id="wdgIframeWidth" class="iframe-only" style="display:none;" type="number" min="100" max="5000" placeholder="(auto full width)" value="${widget.type==='iframe' && widget.options?.width!=null ? (widget.options.width) : ''}" />
    <label class="iframe-only" style="display:none;">Permissions</label>
    <div class="iframe-only" style="display:none;display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
      <label style="display:flex;gap:4px;align-items:center;font-size:.65rem;"><input type="checkbox" id="wdgIframeAllowFullscreen" ${widget.type==='iframe' && widget.options?.allowFullscreen?'checked':''}/> <span>Fullscreen</span></label>
      <label style="display:flex;gap:4px;align-items:center;font-size:.65rem;"><input type="checkbox" id="wdgIframeAllowScripts" ${widget.type==='iframe' && widget.options?.allowScripts?'checked':''}/> <span>Scripts</span></label>
      <label style="display:flex;gap:4px;align-items:center;font-size:.65rem;"><input type="checkbox" id="wdgIframeAllowSameOrigin" ${widget.type==='iframe' && widget.options?.allowSameOrigin?'checked':''}/> <span>Same-Origin</span></label>
      <label style="display:flex;gap:4px;align-items:center;font-size:.65rem;"><input type="checkbox" id="wdgIframeNoBorder" ${widget.type==='iframe' && widget.options?.noBorder?'checked':''}/> <span>No Border</span></label>
      <label style="display:flex;gap:4px;align-items:center;font-size:.65rem;"><input type="checkbox" id="wdgIframeLockScroll" ${widget.type==='iframe' && widget.options?.lockScroll?'checked':''}/> <span>Static (no scroll)</span></label>
    </div>
    <label for="wdgIframeCardSize" class="iframe-only" style="display:none;">Card Size</label>
    <select id="wdgIframeCardSize" class="iframe-only" style="display:none;">
      <option value="small">Small</option>
      <option value="normal">Normal</option>
      <option value="large">Large</option>
      <option value="xlarge">Extra Large</option>
    </select>
    <label for="wdgIframeSpan" class="iframe-only" style="display:none;">Column Span</label>
    <select id="wdgIframeSpan" class="iframe-only" style="display:none;">
      <option value="full">Full Width</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
      <option value="5">5</option>
      <option value="6">6</option>
    </select>
    <small class="muted iframe-note" style="grid-column:2;display:none;">Embeds external page in an iframe. Many sites block framing (X-Frame-Options / CSP). Enable scripts/same-origin only if needed.</small>
  `;

  // Dynamic field visibility based on widget type
  const typeSel = body.querySelector('#wdgType');
  const apiKeyInput = body.querySelector('#wdgApiKey');
//   const locLabel = body.querySelector('.ow-only[label]') || body.querySelector('label[for="wdgLocation"]');
//   const locInput = body.querySelector('#wdgLocation');
  const urLabel = body.querySelector('[data-wlbl-ur]');
  const urNote = body.querySelector('.ur-note');
  const owNote = body.querySelector('.ow-note');
  const isCovid = (t) => t === 'covid';
  function updateWidgetFieldVisibility() {
    const t = typeSel.value;
  const ow = (t === 'weather');
  const isRss = (t === 'rss');
  const isIframe = (t === 'iframe');
  const covid = isCovid(t);
    // labels / notes (ow label removed in keyless mode)
  urLabel && (urLabel.style.display = (ow||isRss||isIframe||covid) ? 'none':'block');
  urNote && (urNote.style.display = (ow||isRss||isIframe||covid) ? 'none':'block');
  owNote && (owNote.style.display = ow ? 'block':'none');
  body.querySelectorAll('.rss-note').forEach(el => { el.style.display = isRss ? 'block':'none'; });
  body.querySelectorAll('.iframe-note').forEach(el => { el.style.display = isIframe ? 'block':'none'; });
  body.querySelectorAll('.ow-only').forEach(el => { el.style.display = ow ? 'block':'none'; });
  body.querySelectorAll('.rss-only').forEach(el => { el.style.display = isRss ? 'block':'none'; });
  body.querySelectorAll('.iframe-only').forEach(el => { el.style.display = isIframe ? 'block':'none'; });
  body.querySelectorAll('.covid-only').forEach(el => { el.style.display = covid ? 'block':'none'; });
    const cityInput = body.querySelector('#wdgCity');
    if (ow && !cityInput.value.trim()) cityInput.value = 'London';
    if (ow) {
      const unitsSel = body.querySelector('#wdgUnits');
      if (isEdit && widget.type==='weather' && widget.options?.units) unitsSel.value = widget.options.units;
    }
    apiKeyInput.placeholder = 'mXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX';
    apiKeyInput.style.display = (ow||isRss||isIframe||covid) ? 'none':'block';
    if (urLabel) urLabel.style.display = (ow||isRss||isIframe||covid) ? 'none':'block';
  }
  typeSel.addEventListener('change', updateWidgetFieldVisibility);
  // Initialize selection if editing different type
  if (isEdit) typeSel.value = widget.type;
  updateWidgetFieldVisibility();

  // Preselect RSS size if editing
  if (isEdit && widget.type==='rss' && widget.options?.size) {
    const szSel = body.querySelector('#wdgRssSize'); if (szSel) szSel.value = widget.options.size; }

  const footer = document.createElement('div');
  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn'; btnCancel.textContent = 'Cancel';
  btnCancel.addEventListener('click', closeModal);

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn danger'; btnDelete.textContent = 'Delete';
  if (!isEdit) btnDelete.classList.add('hidden');
  btnDelete.addEventListener('click', async () => {
    if (!confirm('Delete this widget?')) return;
    const idx = group.widgets.findIndex(w => w.id === widgetId);
    if (idx >= 0) group.widgets.splice(idx, 1);
    await saveStateNow(); closeModal(); renderGroups();
  });

  const btnSave = document.createElement('button');
  btnSave.className = 'btn'; btnSave.textContent = isEdit ? 'Save' : 'Add';
  btnSave.addEventListener('click', async () => {
    let type = $('#wdgType').value;
    let options;
    if (type === 'weather') {
      const city = $('#wdgCity').value.trim();
      const latRaw = $('#wdgLat').value.trim();
      const lonRaw = $('#wdgLon').value.trim();
      let lat = latRaw ? parseFloat(latRaw) : undefined;
      let lon = lonRaw ? parseFloat(lonRaw) : undefined;
      if ((latRaw && isNaN(lat)) || (lonRaw && isNaN(lon))) { alert('Latitude/Longitude must be numbers'); return; }
      if ((!latRaw || !lonRaw) && !city) { alert('Provide a city or both latitude and longitude'); return; }
      const units = $('#wdgUnits').value || 'metric';
      const hideDetails = $('#wdgHideDetails').checked;
      options = { city, units, hideDetails };
      if (latRaw && lonRaw) { options.lat = lat; options.lon = lon; }
      type = 'weather';
    } else if (type === 'rss') {
      const url = $('#wdgRssUrl').value.trim();
      if (!url) { alert('Feed URL required'); return; }
      const limitRaw = parseInt($('#wdgRssLimit').value,10);
      const limit = (!isNaN(limitRaw) && limitRaw>0) ? Math.min(15, limitRaw) : 5;
      const compact = $('#wdgRssCompact').checked;
      const refreshRaw = parseInt($('#wdgRssRefresh').value,10);
      const refreshMins = (!isNaN(refreshRaw) && refreshRaw>=1) ? Math.min(180, refreshRaw) : 15;
      const highlightNew = $('#wdgRssHighlight').checked;
  const size = $('#wdgRssSize').value || 'large';
      options = { url, limit, compact, refreshMins, highlightNew, size };
      type = 'rss';
    } else if (type === 'iframe') {
      const url = $('#wdgIframeUrl').value.trim();
      if (!url) { alert('IFrame URL required'); return; }
      const heightInput = $('#wdgIframeHeight').value.trim();
      let height;
      let autoHeight = false;
      if (heightInput === '') { autoHeight = true; }
      else {
        const heightRaw = parseInt(heightInput,10);
        if (!isNaN(heightRaw) && heightRaw>=100) height = Math.min(2000,heightRaw); else { alert('Height must be blank or a number >=100'); return; }
      }
      const widthRaw = parseInt($('#wdgIframeWidth').value,10);
      const width = (!isNaN(widthRaw) && widthRaw>=100) ? Math.min(5000,widthRaw) : undefined;
      const allowFullscreen = $('#wdgIframeAllowFullscreen').checked;
      const allowScripts = $('#wdgIframeAllowScripts').checked;
      const allowSameOrigin = $('#wdgIframeAllowSameOrigin').checked;
      const noBorder = $('#wdgIframeNoBorder').checked;
    const lockScroll = $('#wdgIframeLockScroll').checked;
      const cardSize = $('#wdgIframeCardSize').value || 'normal';
  const span = $('#wdgIframeSpan').value || 'full';
  options = { url, allowFullscreen, allowScripts, allowSameOrigin, noBorder, lockScroll, cardSize, span };
  if (autoHeight) { options.autoHeight = true; } else { options.height = height; }
      if (width !== undefined) options.width = width;
      type = 'iframe';
    } else if (type === 'covid') {
      const countryRaw = $('#wdgCovidCountry').value.trim();
      const refreshRaw = parseInt($('#wdgCovidRefresh').value,10);
      const refreshMins = (!isNaN(refreshRaw) && refreshRaw>=5) ? Math.min(360, refreshRaw) : 60;
      const country = countryRaw || ''; // blank = global
      options = { country, refreshMins };
      type = 'covid';
    } else { // uptime-robot
      const apiKey = $('#wdgApiKey').value.trim();
      if (!apiKey) { alert('API key required'); return; }
      options = { apiKey };
    }
    if (isEdit) {
      widget.type = type; widget.options = options;
      delete widget.label; delete widget.useProxy;
    } else {
      group.widgets.push({ id: uid('wdg'), type, options });
    }
    await saveStateNow(); closeModal(); renderGroups();
  });

  footer.append(btnCancel, btnDelete, btnSave);
  openModal({ title: isEdit ? 'Edit Widget' : 'Add Widget', body, footer });
}


// Programs (local or protocol schemes; launching native executables requires a helper outside MV3)
export function openProgramModal(groupId, programId = null) {
  const page = getSelectedPage(); if (!page) return;
  const group = page.groups.find(g => g.id === groupId); if (!group) return;
  if (!Array.isArray(group.programs)) group.programs = [];

  const isEdit = !!programId;
  const program = isEdit ? group.programs.find(p => p.id === programId)
    : { title: '', schemeOrCommand: '', launchMethod: 'scheme', typeMethod: 'exe', groupPath: '', nativeCommand: '', nativeArgs: [], iconType: 'logo', iconUrl: '', iconData: '', logoDomain: '', notes: '' };

  const body = document.createElement('div');
  body.className = 'form-grid';
  body.innerHTML = `
    <p>Icon preview</p>
    <div id="prgIconPreview" style="display:flex;align-items:center;gap:12px;">
      <div class="tile-icon" style="width:64px;height:64px;border-radius:12px;display:grid;place-items:center;overflow:hidden;border:1px solid var(--border);background:var(--panel-2)"></div>
      <small class="muted" id="prgIconInfo"></small>
    </div>

    <label for="prgTitle">Title</label>
    <input id="prgTitle" type="text" value="${program.title || ''}" placeholder="e.g. VS Code" />

    <label for="prgLaunchMethod">Launch method</label>
    <select id="prgLaunchMethod">
      <option value="puff">Puff / Protocol</option>
      <option value="scheme">URL Scheme / Protocol</option>
      <option value="native">Native Command (helper)</option>
    </select>

    <label for="typeMethod">Type method</label>
    <select id="typeMethod">
      <option value="exe">Executable</option>
      <option value="group_exe">Group executables</option>
    </select>

    <label for="prgGroupPath" class="prgGroupPathLabel" style="display: none;">Folder Path</label>
    <div id="prgGroupPathRow" class="row" display: none;">
        <input id="prgGroupPath" type="text" placeholder="e.g. C:\\Program Files\\Steam\\steamapps\\common" style="flex:1" value="${program.groupPath || ''}" readonly />
        <button class="btn" type="button" id="btnBrowseFolder">Browse</button>
    </div>

    <label for="prgScheme" class="prgSchemeLabel">URL Scheme / Protocol</label>
    <input id="prgScheme" type="text" value="${program.schemeOrCommand || ''}" placeholder="e.g. spotify:// or code://" />

    <label for="prgNativeCmd" class="prgNativeCmdLabel">Native command</label>
    <input id="prgNativeCmd" type="text" value="${program.nativeCommand || ''}" placeholder="e.g. wireshark" />

    <label for="prgNativeArgs" class="prgNativeArgsLabel">Arguments (space separated)</label>
    <input id="prgNativeArgs" type="text" value="${(program.nativeArgs || []).join(' ')}" placeholder="--foo bar" />

    <label for="prgIconType">Icon</label>
    <select id="prgIconType">
      <option value="auto">Auto</option>
      <option value="logo">Logo.dev (by domain)</option>
      <option value="url">Image URL</option>
      <option value="upload">Upload</option>
    </select>

    <label for="prgLogoDomain" class="prgLogoDomainLabel">Company domain for logo.dev</label>
    <div class="row" id="prgLogoDomainRow" style="grid-column:2; width:100%;">
      <input id="prgLogoDomain" type="text" placeholder="e.g. code.visualstudio.com" style="flex:1" value="${program.logoDomain || ''}" />
      <button class="btn" type="button" id="btnProgramFindLogo">Find logo</button>
    </div>

    <label for="prgIconUrl" class="prgIconUrlLabel">Image URL</label>
    <input id="prgIconUrl" type="url" value="${program.iconType === 'url' ? (program.iconUrl || '') : ''}" placeholder="https://example.com/icon.png" style="width:100%;" />

    <label for="prgIconFile" class="prgIconFileLabel">Upload PNG/JPG</label>
    <input id="prgIconFile" type="file" accept="image/png,image/jpeg,image/webp" style="width:100%;" />

    <label for="prgNotes">Notes</label>
    <textarea id="prgNotes" rows="2" placeholder="Optional description or instructions">${program.notes || ''}</textarea>
  `;

  const footerNote = document.createElement('span');
  footerNote.id = 'modalErrorNote'
  footerNote.style.display = 'none';

  footerNote.style.color = '#787878'
  footerNote.style.fontSize = '12px'

  footerNote.style.marginRight = 'auto'
  footerNote.style.alignSelf = 'center'

  footerNote.style.padding = '4px 8px'
  footerNote.style.borderRadius = '6px'
  footerNote.style.border = '1px solid #080808'
  footerNote.style.backgroundColor = '#121212';


  const typeMethodSelect = body.querySelector('#typeMethod');
  const schemeInput = body.querySelector('#prgScheme');

  const groupPathLabel = body.querySelector('.prgGroupPathLabel');
  const groupPathRow = body.querySelector('#prgGroupPathRow');

  const updateTypeMethodView = () => {
    if (typeMethodSelect.value === 'group_exe') {
      schemeInput.readOnly = true;

      schemeInput.value = '';
      schemeInput.placeholder = 'Auto Protocol, based on name: .exe(puffl://cs puffl://Spotify puffl://re8)...';

      groupPathLabel.style.display = 'block';
      groupPathRow.style.display = 'flex';
    } else {
      schemeInput.readOnly = false;
      schemeInput.placeholder = 'e.g. spotify:// or code://';

      groupPathLabel.style.display = 'none';
      groupPathRow.style.display = 'none';
    }
  };

  let foundExecutablesList = [];
  const groupPathInput = body.querySelector('#prgGroupPath')

  typeMethodSelect.value = program.typeMethod || 'exe'
  updateTypeMethodView()
  typeMethodSelect.addEventListener('change', updateTypeMethodView)

  let uploadedDataUrl = program.iconType === 'upload' ? (program.iconData || '') : ''

  function updatePreview() {
    const box = body.querySelector('#prgIconPreview .tile-icon')
    box.innerHTML=''
    let src=''

    const t = body.querySelector('#prgIconType').value;
    if (t==='logo') {
      const key = STATE.settings?.logoDevApiKey?.trim();
      const dom = body.querySelector('#prgLogoDomain').value.trim();

      if (key && dom) src = logoDevUrlForDomain(dom, key);
      body.querySelector('#prgIconInfo').textContent = dom ? `Logo.dev: ${dom}` : 'Enter domain for logo';
    } else if (t==='url') {
      src = body.querySelector('#prgIconUrl').value.trim();
      body.querySelector('#prgIconInfo').textContent = src ? 'Custom image URL' : '';
    } else if (t==='upload') {
      src = uploadedDataUrl;
      body.querySelector('#prgIconInfo').textContent = src ? 'Uploaded image' : '';
    }

    if (src) {
      const img = document.createElement('img');
      img.src = src
      img.alt=''

      img.style.width='86%'
      img.style.height='86%'

      img.style.objectFit='contain'
      box.appendChild(img)
    }
  }

  function toggleIconInputs(){
    const t = body.querySelector('#prgIconType').value;
    body.querySelector('.prgLogoDomainLabel').style.display = t==='logo' ? '' : 'none';
    body.querySelector('#prgLogoDomainRow').style.display = t==='logo' ? 'flex' : 'none';
    body.querySelector('.prgIconUrlLabel').style.display = t==='url' ? '' : 'none';
    body.querySelector('#prgIconUrl').style.display = t==='url' ? '' : 'none';
    body.querySelector('.prgIconFileLabel').style.display = t==='upload' ? '' : 'none';
    body.querySelector('#prgIconFile').style.display = t==='upload' ? '' : 'none';

    updatePreview();
  }

  function toggleLaunchMethodInputs(){
    const lm = body.querySelector('#prgLaunchMethod').value;
    const showScheme = lm === 'scheme';

    body.querySelector('.prgSchemeLabel').style.display = showScheme ? '' : 'none';
    body.querySelector('#prgScheme').style.display = showScheme ? '' : 'none';
    body.querySelector('.prgNativeCmdLabel').style.display = !showScheme ? '' : 'none';
    body.querySelector('#prgNativeCmd').style.display = !showScheme ? '' : 'none';
    body.querySelector('.prgNativeArgsLabel').style.display = !showScheme ? '' : 'none';
    body.querySelector('#prgNativeArgs').style.display = !showScheme ? '' : 'none';
  }

  body.addEventListener('change', (e) => {
    if (e.target.id==='prgIconType' || e.target.id==='prgIconUrl' || e.target.id==='prgLogoDomain') toggleIconInputs();
    if (e.target.id==='prgLaunchMethod') toggleLaunchMethodInputs();
    // no auto mode now
  });

  // Auto logo detection from title (similar to link modal)
  async function tryProgramTitleLogoLookup() {
    const key = STATE.settings?.logoDevApiKey?.trim();
    const title = body.querySelector('#prgTitle').value.trim();
    if (!title || !key) return;

    const candidates = guessDomainCandidates(title);
    for (const dom of candidates) {
      const testUrl = logoDevUrlForDomain(dom, key);
      if (await checkImage(testUrl)) {
        body.querySelector('#prgIconType').value = 'logo';
        body.querySelector('#prgLogoDomain').value = dom;
        toggleIconInputs();

        body.querySelector('#prgIconInfo').textContent = `Auto from logo.dev (${dom})`;
        return;
      }
    }
  }

  body.querySelector('#prgTitle').addEventListener('blur', tryProgramTitleLogoLookup);

  // no auto mode title live update required
  body.querySelector('#prgIconFile').addEventListener('change', (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    if (file.size > 512*1024) { alert('Icon too large (max 512KB)'); e.target.value=''; return; }
    const fr = new FileReader(); fr.onload=()=>{ uploadedDataUrl = fr.result; updatePreview(); }; fr.readAsDataURL(file);
  });

  setTimeout(() => {
    body.querySelector('#prgIconType').value = program.iconType || 'logo';
    body.querySelector('#prgLaunchMethod').value = program.launchMethod || 'scheme';
    toggleIconInputs(); toggleLaunchMethodInputs(); updatePreview();
  },0);

  const footer = document.createElement('div');
  const btnCancel = document.createElement('button'); btnCancel.className='btn'; btnCancel.textContent='Cancel'; btnCancel.addEventListener('click', closeModal);
  const btnDelete = document.createElement('button'); btnDelete.className='btn danger'; btnDelete.textContent='Delete'; if(!isEdit) btnDelete.classList.add('hidden');
  btnDelete.dataset.action = 'delete';

  const btnSave = document.createElement('button'); btnSave.className='btn'; btnSave.textContent = isEdit ? 'Save' : 'Add';
  btnSave.dataset.action = 'save';


  const createPuffProtocol = (filename) => {
    if (!filename || typeof filename !== 'string') return ''

    const nameWithoutExe = filename.replace(/\.exe$/i, '');
    return `puffl://${nameWithoutExe}`;
  }

  const formatTitle = (filename) => {
    if (!filename) return ''

    let result = filename.replace(/\.exe$/i, '').replace(/_|-|\./g, ' ');
    result = result
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-z\d])([A-Z])/g, '$1 $2')

    return result.replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
  }

  body.addEventListener('click', async (e) => {
    if (e.target.id === 'btnBrowseFolder') {
      footerNote.textContent = ''
      groupPathInput.style.outline = ''

      const executables = await handleBrowseFolderClick('#prgGroupPath', body)
      footerNote.style.display = 'inline'

      if (executables && executables.length > 0) {
        foundExecutablesList = executables;
        footerNote.textContent = executables.length + ': games found'

        return
      }

      groupPathInput.style.outline = '1px solid #7f0000'
      footerNote.textContent = 'No executable apps were found in the selected folder.'
    } else if (e.target.id === 'btnProgramFindLogo') {
      const dom = body.querySelector('#prgLogoDomain').value.trim(); if(!dom) return;
      const key = STATE.settings?.logoDevApiKey?.trim();
      const url = logoDevUrlForDomain(dom, key);

      if (!url) { body.querySelector('#prgIconInfo').textContent = 'Add your logo.dev key in Settings first.'; return; }
      const ok = await checkImage(url);

      if (ok) {
        body.querySelector('#prgIconType').value = 'logo';
        toggleIconInputs();
        body.querySelector('#prgIconInfo').textContent = `From logo.dev (${dom})`;
      } else {
        body.querySelector('#prgIconInfo').textContent = 'No logo for that domain.';
      }
    }
  })

  footer.addEventListener('click', async (event) => {
    const action = event.target.dataset.action

    if (action === 'delete') {
      if (!confirm('Delete this program?')) return

      const idx = group.programs.findIndex(p => p.id === programId); if (idx>=0) group.programs.splice(idx,1)
      await saveStateNow(); closeModal(); renderGroups()
    } else if (action === 'save') {
      const typeMethod = body.querySelector('#typeMethod').value;

      if (typeMethod === 'group_exe') {
        if (foundExecutablesList.length === 0) {
          footerNote.textContent = ''
          footerNote.style.display = 'inline'

          footerNote.textContent = 'with the group option it is not possible to add empty frames.'
          return
        }

        const iconType = body.querySelector('#prgIconType').value;
        const payload = { iconType };

        if (iconType === 'logo') {
          payload.logoDomain = body.querySelector('#prgLogoDomain').value.trim()

          delete payload.iconUrl
          delete payload.iconData
        } else if (iconType === 'url' || iconType === 'auto') {
          if (iconType === 'url') {
            payload.iconUrl = body.querySelector('#prgIconUrl').value.trim()
          }

          delete payload.iconData
          delete payload.logoDomain
        } else if (iconType === 'upload') {
          payload.iconData = uploadedDataUrl

          delete payload.iconUrl
          delete payload.logoDomain
        }

        const programPromises = foundExecutablesList.map(async (executable) => {
          const name = formatTitle(executable.name);

          if (iconType === 'auto') {
            const iconUrl = await getBestIcon(name)

            payload.iconType = 'url'
            payload.iconUrl = iconUrl
          }

          return {
            id: uid('prg'),

            title: name,
            launchMethod: 'scheme',
            schemeOrCommand: createPuffProtocol(executable.name),

            iconType: iconType,
            ...payload,

            notes: body.querySelector('#prgNotes').value.trim()
          }
        })

        const modals = await Promise.all(programPromises);
        group.programs.push(...modals);
      } else {
        const title = body.querySelector('#prgTitle').value.trim() || 'Program';
        const launchMethod = body.querySelector('#prgLaunchMethod').value;
        const schemeOrCommand = body.querySelector('#prgScheme').value.trim();

        const nativeCommand = body.querySelector('#prgNativeCmd').value.trim();
        const nativeArgs = body.querySelector('#prgNativeArgs').value.trim().split(/\s+/).filter(Boolean);

        const iconType = body.querySelector('#prgIconType').value;
        const notes = body.querySelector('#prgNotes').value.trim();
        const payload = { title, launchMethod, iconType, notes };

        if (launchMethod === 'scheme') {
          payload.schemeOrCommand = schemeOrCommand;
          delete payload.nativeCommand
          delete payload.nativeArgs

        } else if (launchMethod === 'native') {
          payload.nativeCommand = nativeCommand
          payload.nativeArgs = nativeArgs

          delete payload.schemeOrCommand
        } else {
          payload.nativeCommand = nativeCommand
          payload.nativeArgs = nativeArgs

          delete payload.schemeOrCommand
        }

        if (iconType === 'logo') {
          payload.logoDomain = body.querySelector('#prgLogoDomain').value.trim()
          delete payload.iconUrl; delete payload.iconData;
        } else if (iconType === 'url' || iconType === 'auto') {
          if (iconType === 'url') {
            payload.iconUrl = body.querySelector('#prgIconUrl').value.trim()
          } else {
            const iconUrl = getBestIcon(title)
            payload.iconUrl = iconUrl
          }

          payload.iconUrl = body.querySelector('#prgIconUrl').value.trim()
          delete payload.iconData; delete payload.logoDomain
        } else if (iconType === 'upload') {
          payload.iconData = uploadedDataUrl
          delete payload.iconUrl; delete payload.logoDomain
        }

        if (isEdit) Object.assign(program, payload)
        else group.programs.push({ id: uid('prg'), ...payload })
      }

      await saveStateNow(); closeModal(); renderGroups();
    }
  });

  footer.append(footerNote, btnCancel, btnDelete, btnSave);
  openModal({ title: isEdit ? 'Edit Program' : 'Add Program', body, footer });
}
