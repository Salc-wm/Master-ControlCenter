// render-pages.js — pages bar with body-level flyout (Rename/Delete)
// Organized into small helper functions for clarity and maintainability.
import { $, $$ } from "./utils.js";
import { STATE, saveState } from "./state.js";
import { renderGroups } from "./render-groups.js";
import { openPageModal, handleDeletePage } from "./modals.js";
import { t } from "./languages/i18n.js";

// =============================
// Module state / shared caches
// =============================
let flyoutBound = false;          // Ensure global listeners only bound once
let OVERFLOW_PAGES = [];          // Cache of overflow page ids for dropdown
const FLYOUT_ID = "pill-flyout";  // ID for per-page action flyout
const OVERFLOW_POP_ID = "pages-overflow-pop"; // ID for overflow pages popup
const FULL_COLLAPSE_TRIGGER_RATIO = 0.5; // if >50% of pages would overflow -> single dropdown mode

// =============================
// Helper: full collapse (single dropdown listing all pages)
// =============================
function renderFullCollapse(bar, pagesData, globalEdit) {
  // Clear any existing content in the bar
  bar.innerHTML = "";

  const selected = pagesData.find(p => p.id === STATE.selectedPageId) || pagesData[0];
  if (!STATE.selectedPageId && selected) STATE.selectedPageId = selected.id;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "page-pill full-collapse-trigger";
  trigger.setAttribute("aria-haspopup", "true");
  trigger.setAttribute("aria-expanded", "false");
  trigger.title = t("Select page");
  trigger.innerHTML = `<span class="page-name">${selected?.name || t("Untitled")}</span><span class="caret" aria-hidden="true">▾</span>`;
  bar.appendChild(trigger);

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const existing = document.getElementById(OVERFLOW_POP_ID);
    if (existing) { existing.remove(); trigger.setAttribute("aria-expanded", "false"); return; }

    const pop = document.createElement("div");
    pop.id = OVERFLOW_POP_ID;
    pop.className = "pages-overflow-menu floating"; // reuse styling

    pagesData.forEach(page => {
      const id = page.id;
      const row = document.createElement("div");
      row.className = `overflow-item-row${id === STATE.selectedPageId ? " active" : ""}`;
      row.innerHTML = globalEdit ? `
        <button type="button" class="overflow-item main" data-act="select">${(page?.name || t("Untitled"))}</button>
        <div class="overflow-mini-actions">
          <button type="button" class="mini rename" title="${t("Rename")}" data-act="rename">✎</button>
          <button type="button" class="mini delete" title="${t("Delete")}" data-act="delete">✕</button>
        </div>` : `
        <button type="button" class="overflow-item main" data-act="select" style="width:100%;text-align:left;">${(page?.name || t("Untitled"))}</button>`;
      row.addEventListener("click", async (evt) => {
        const act = evt.target?.dataset?.act; if (!act) return; evt.stopPropagation();
        if (act === "select") {
          STATE.selectedPageId = id; saveState();
          renderPagesBar(); renderGroups(); pop.remove();
        } else if (globalEdit && act === "rename") {
          pop.remove(); import("./modals.js").then(m => m.openPageModal(id));
        } else if (globalEdit && act === "delete") {
          pop.remove(); import("./modals.js").then(async m => { await m.handleDeletePage(id); });
        }
      });
      pop.appendChild(row);
    });
    document.body.appendChild(pop);

    // Position centered under trigger (or adjust if near edge)
    const r = trigger.getBoundingClientRect();
    let left = Math.max(8, Math.min(window.innerWidth - pop.offsetWidth - 8, r.left));
    pop.style.left = left + "px";
    pop.style.top = (r.bottom + 8) + "px";
    trigger.setAttribute("aria-expanded", "true");

    const close = () => {
      if (!document.getElementById(OVERFLOW_POP_ID)) return;
      pop.remove(); trigger.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", outside, true);
      window.removeEventListener("resize", resizeClose);
    };
    const outside = (evt) => { if (!pop.contains(evt.target) && evt.target !== trigger) close(); };
    const resizeClose = () => close();
    document.addEventListener("click", outside, true);
    window.addEventListener("resize", resizeClose);
    document.addEventListener("keydown", (evt) => { if (evt.key === "Escape") close(); }, { once: true });
  });
}

// =============================
// Flyout (Rename/Delete) helpers
// =============================
function closeFlyout(bar, why = "unknown") {
  const f = document.getElementById(FLYOUT_ID);
  if (f) {
    console.log("[pill] closeFlyout()", { why });
    f.remove();
  }
  if (bar) {
    $$(".pill-menu-btn[aria-expanded='true']", bar)
      .forEach(b => b.setAttribute("aria-expanded", "false"));
  }
}

function openFlyout(bar, btn, page) {
  closeFlyout(bar, "openNew");

  // Build the flyout in body
  const fly = document.createElement("div");
  fly.id = FLYOUT_ID;
  fly.className = "pill-flyout";
  fly.innerHTML = `
    <button class="pill-item" data-cmd="rename" data-page-id="${page.id}">${t("Rename")}</button>
    <button class="pill-item danger" data-cmd="delete" data-page-id="${page.id}">${t("Delete")}</button>
  `;
  document.body.appendChild(fly);

  // Position near button (attempt to keep within viewport)
  const r = btn.getBoundingClientRect();
  fly.style.visibility = "hidden";
  fly.style.display = "grid"; // allow measurement
  const fw = fly.offsetWidth;
  const fh = fly.offsetHeight;
  let left = Math.max(8, Math.min(window.innerWidth - fw - 8, r.right - fw));
  let top = r.bottom + 6;
  if (window.innerHeight - r.bottom < fh + 20) top = r.top - fh - 6; // open upwards if cramped
  fly.style.left = `${left}px`;
  fly.style.top = `${top}px`;
  fly.style.visibility = "visible";

  btn.setAttribute("aria-expanded", "true");
  console.log("[pill] openFlyout()", { pageId: page.id, left, top, fw, fh });

  // Item actions
  fly.addEventListener("click", async (e) => {
    e.stopPropagation();
    const cmd = e.target?.dataset?.cmd;
    if (!cmd) return;
    console.log("[pill] flyout command", { cmd, pageId: page.id });
    if (cmd === "rename") {
      closeFlyout(bar, "rename");
      openPageModal(page.id);
    } else if (cmd === "delete") {
      closeFlyout(bar, "delete");
      await handleDeletePage(page.id); // handles state+re-render
    }
  });
}

// =============================
// Main render function
// =============================
/**
 * Render the pages bar (list of pages, active page highlight, kebab menus, overflow handling).
 * Re-renders fully each time for simplicity (state is small). Also wires up one-time global
 * event listeners for flyout dismissal and resize handling.
 */
export function renderPagesBar() {
  const bar = $("#pagesBar");
  bar.innerHTML = "";
  // Clear width constraints each render; we'll re-apply after measuring layout
  bar.style.removeProperty('max-width');

  // Hide/show Add Page button according to global edit mode
  const addPageBtn = document.querySelector('[data-action="addPage"]');
  if (addPageBtn) {
    if (STATE.settings?.editMode === false) addPageBtn.classList.add("hidden");
    else addPageBtn.classList.remove("hidden");
  }

  // Empty state: render nothing (user sees a blank bar) when there are no pages
  if (!STATE.pages.length) {
    if (!flyoutBound) {
      // Bind no-op listeners to maintain consistent code paths (kept minimal)
      document.addEventListener("click", () => {});
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") {} });
      flyoutBound = true;
    }
    return;
  }

  // We'll measure available width to decide overflow
  const pagesData = STATE.pages.slice();
  const globalEdit = STATE.settings?.editMode !== false;
  pagesData.forEach((p) => {
    const pill = document.createElement("div");
    pill.className = `page-pill${p.id === STATE.selectedPageId ? " active" : ""}`;
    pill.dataset.pageId = p.id;
    pill.innerHTML = `
      <span class="page-name">${p.name}</span>
      ${globalEdit ? `<button class="pill-menu-btn" type="button" aria-label="${t("Page options")}" aria-haspopup="menu" aria-expanded="false" title="${t("Options")}">⋮</button>` : ""}
    `;
    if (!globalEdit) pill.style.paddingRight = "12px"; // tighten padding when no menu

    // Select page (ignore kebab)
    pill.addEventListener("click", (e) => {
      if (e.target.closest(".pill-menu-btn")) return;
      console.log("[pill] select page", p.id);
      STATE.selectedPageId = p.id;
      saveState();
      renderPagesBar();
      renderGroups();
    });

    // Kebab -> open flyout
    const menuBtn = $(".pill-menu-btn", pill);
    if (globalEdit && menuBtn) {
      ["mousedown", "pointerdown", "touchstart"].forEach(evt =>
        menuBtn.addEventListener(evt, (e) => e.stopPropagation(), { passive: true })
      );
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const expanded = menuBtn.getAttribute("aria-expanded") === "true";
        console.log("[pill] kebab click", { pageId: p.id, expanded });
        if (expanded) closeFlyout(bar, "toggleClose");
        else openFlyout(bar, menuBtn, p);
      });
    }
    bar.appendChild(pill);
  });

  // After layout, decide if an overflow dropdown is needed
  requestAnimationFrame(() => {
    const topbar = document.querySelector('.topbar');
    const actions = document.querySelector('.topbar-actions');
    const actionsWidth = actions?.getBoundingClientRect().width || 0;
    const sidePadding = 60; // padding + breathing room
    const availableTotal = Math.max(0, (topbar?.getBoundingClientRect().width || bar.clientWidth) - actionsWidth - sidePadding);
    // Constrain bar so it no longer overlaps actions area
    bar.style.maxWidth = availableTotal + 'px';

    const pills = Array.from(bar.querySelectorAll(".page-pill"));
    // Sum natural widths to decide if overflow is needed
    const totalWidth = pills.reduce((sum, p) => sum + p.getBoundingClientRect().width + 10, 0); // include gap heuristic
    const needsCollapse = totalWidth > availableTotal;
    if (!needsCollapse) return;

    const available = availableTotal - 70; // reserve space for trigger + a little gap
    let usedWidth = 0;
    const overflow = [];
    for (const pill of pills) {
      const w = pill.getBoundingClientRect().width + 10; // include gap
      if (overflow.length === 0 && usedWidth + w <= available) usedWidth += w;
      else overflow.push(pill);
    }
    if (!overflow.length) return; // nothing to collapse

    // If majority (>50%) of pages would overflow -> render single dropdown
    if (overflow.length / pills.length >= FULL_COLLAPSE_TRIGGER_RATIO) {
      renderFullCollapse(bar, pagesData, globalEdit);
      return;
    }

    overflow.forEach(p => p.remove());
    OVERFLOW_PAGES = overflow.map(p => p.dataset.pageId);

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "page-pill overflow-trigger";
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    trigger.title = "More pages";
    trigger.textContent = "⋯";
    bar.appendChild(trigger);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const existing = document.getElementById(OVERFLOW_POP_ID);
      if (existing) { existing.remove(); trigger.setAttribute("aria-expanded", "false"); return; }

      const pop = document.createElement("div");
      pop.id = OVERFLOW_POP_ID;
      pop.className = "pages-overflow-menu floating";
      OVERFLOW_PAGES.forEach(id => {
        const page = STATE.pages.find(pg => pg.id === id);
        const row = document.createElement("div");
        row.className = `overflow-item-row${id === STATE.selectedPageId ? " active" : ""}`;
        row.innerHTML = globalEdit ? `
          <button type="button" class="overflow-item main" data-act="select">${(page?.name || "Untitled")}</button>
          <div class="overflow-mini-actions">
            <button type="button" class="mini rename" title="Rename" data-act="rename">✎</button>
            <button type="button" class="mini delete" title="Delete" data-act="delete">✕</button>
          </div>` : `
          <button type="button" class="overflow-item main" data-act="select" style="width:100%;text-align:left;">${(page?.name || "Untitled")}</button>`;
        row.addEventListener("click", async (e) => {
          const act = e.target?.dataset?.act;
          if (!act) return;
          e.stopPropagation();
          if (act === "select") {
            STATE.selectedPageId = id; saveState();
            renderPagesBar(); renderGroups(); pop.remove();
          } else if (globalEdit && act === "rename") {
            pop.remove();
            import("./modals.js").then(m => m.openPageModal(id));
          } else if (globalEdit && act === "delete") {
            pop.remove();
            import("./modals.js").then(async m => { await m.handleDeletePage(id); });
          }
        });
        pop.appendChild(row);
      });
      document.body.appendChild(pop);

      // Position under trigger
      const r = trigger.getBoundingClientRect();
      let left = r.left;
      const desiredRight = left + pop.offsetWidth;
      if (desiredRight > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pop.offsetWidth - 8);
      pop.style.left = left + "px";
      pop.style.top = (r.bottom + 8) + "px";
      trigger.setAttribute("aria-expanded", "true");

      // Close handlers (outside click, resize, Escape)
      const close = (why) => {
        if (!document.getElementById(OVERFLOW_POP_ID)) return;
        pop.remove();
        trigger.setAttribute("aria-expanded", "false");
        document.removeEventListener("click", outside, true);
        window.removeEventListener("resize", resizeClose);
      };
      const outside = (evt) => { if (!pop.contains(evt.target) && evt.target !== trigger) close("outside"); };
      const resizeClose = () => close("resize");
      document.addEventListener("click", outside, true);
      window.addEventListener("resize", resizeClose);
      document.addEventListener("keydown", (evt) => { if (evt.key === "Escape") close("esc"); }, { once: true });
    });
  });

  // One-time outside/escape closers + resize reflow for the flyout
  if (!flyoutBound) {
    document.addEventListener("click", () => closeFlyout(bar, "document"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeFlyout(bar, "esc"); });
    let resizeTimer;
    window.addEventListener("resize", () => {
      closeFlyout(bar, "resize");
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { renderPagesBar(); }, 120);
    });
    bar.addEventListener("scroll", () => closeFlyout(bar, "barScroll"), { passive: true });
    flyoutBound = true;
  }
}
