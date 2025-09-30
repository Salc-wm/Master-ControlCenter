// actions.js — global actions (export/import/reset)
import { STATE, DEFAULT_STATE, saveStateNow } from "./state.js"; // DEFAULT_STATE kept for possible extended reset flows

/** Export current dashboard state (merging persisted + in‑memory). */
export async function exportJson() {
  // Read persisted state first to include any debounced writes
  let persisted = null;
  try {
    const res = await chrome.storage.local.get(['state']);
    persisted = res?.state ?? null;
  } catch {
    persisted = null;
  }
  // Merge persisted and in-memory STATE to prefer the most complete arrays
  const mem = STATE || {};
  const base = persisted && typeof persisted === 'object' ? structuredClone(persisted) : {};
  const toExport = structuredClone(base);
  // Helper: choose array from memory if it appears more complete
  if (!Array.isArray(toExport.pages) || (Array.isArray(mem.pages) && (mem.pages.length > (toExport.pages?.length||0)))) {
    toExport.pages = structuredClone(mem.pages || []);
  }
  // Ensure settings present (prefer memory if persisted lacks keys)
  toExport.settings = Object.assign({}, persisted?.settings || {}, mem.settings || {});
  // Ensure selectedPageId present
  if (!toExport.selectedPageId && mem.selectedPageId) toExport.selectedPageId = mem.selectedPageId;
  // Debugging info: log counts so you can confirm programs/widgets included
  let pageCount = 0, programCount = 0, widgetCount = 0;
  try {
    pageCount = Array.isArray(toExport.pages) ? toExport.pages.length : 0;
    programCount = (toExport.pages || []).reduce((acc, p) => acc + (p.groups || []).reduce((gacc, g) => gacc + ((g.programs||[]).length), 0), 0);
    widgetCount = (toExport.pages || []).reduce((acc, p) => acc + (p.groups || []).reduce((gacc, g) => gacc + ((g.widgets||[]).length), 0), 0);
    console.info(`[exportJson] pages=${pageCount} programs=${programCount} widgets=${widgetCount}`);
  } catch (e) { /* ignore */ }

  const data = JSON.stringify(toExport, null, 2);
  const a = document.createElement("a");
  const when = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const jsonFilename = `homelab-dashboard-${when}.json`;
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
  a.href = dataUri; a.download = jsonFilename; a.click();

  if (pageCount === 0 || (programCount === 0 && widgetCount === 0)) {
    alert('Exported file appears empty: no pages or no programs/widgets found. Check that changes were saved before exporting.');
  }
}

/** Hard reset pages + selection (settings preserved). */
export async function performResetAll() {
  STATE.pages = [];
  STATE.selectedPageId = null;
  await saveStateNow();
  const { renderPagesBar } = await import('./render-pages.js');
  const { renderGroups } = await import('./render-groups.js');
  renderPagesBar();
  renderGroups();
}

// Backward compatibility: existing code may call handleResetAll directly
/** UI handler: delegates to modal confirm if available. */
export async function handleResetAll() {
  // Delegate to new modal-based confirmation if modals.js is loaded
  try {
    const mod = await import('./modals.js');
    if (typeof mod.openResetConfirmModal === 'function') {
      mod.openResetConfirmModal();
      return;
    }
  } catch {}
  if (confirm('This will erase all pages, groups and links. Continue?')) {
    await performResetAll();
  }
}
