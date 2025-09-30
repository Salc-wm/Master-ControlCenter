// main.js — application bootstrap (load state, initial render, global listeners)
import { $ } from "./utils.js";
import { loadState, migrateSettings } from "./state.js";
import { renderPagesBar } from "./render-pages.js";
import { renderGroups } from "./render-groups.js";
import { renderPrefs, initSettingsBindings } from "./settings.js";
import { wireClickDelegation } from "./events.js";
import { closeModal } from "./modals.js";

function render() {
  renderPagesBar();   // tabs bar
  renderGroups();     // groups + tiles grid
  renderPrefs();      // sync settings UI
}

(async function init() { // bootstrap IIFE
  await loadState();   // hydrate STATE from storage
  migrateSettings();   // apply migrations (e.g., remove deprecated settings)
  render();            // first paint

  wireClickDelegation();
  initSettingsBindings();
  // Listen for font fallback events and log structured JSON (could be surfaced in UI later)
  window.addEventListener('sdFontFallback', (e)=>{
    if (window.__fontFallbackLogged) return; // log only once per session
    window.__fontFallbackLogged = true;
    const msg = { type: 'font-fallback', ...e.detail };
    // Use console.info (not warn) so it no longer appears as an error/warning in panels
    try { console.info(JSON.stringify(msg)); } catch { console.info('[font-fallback]', msg.error || 'Font fallback'); }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#modal").hidden) closeModal();
  });

  $(".modal-backdrop")?.addEventListener("click", closeModal);

  // Program launch stub (future native messaging hook)
  window.__stackdashLaunchProgram = (program) => { try { chrome.runtime.sendMessage({ type: 'launchProgram', program }); } catch {} };
})();
