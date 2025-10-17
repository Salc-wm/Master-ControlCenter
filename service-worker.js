// service-worker.js — Background script (MV3)
// Responsibilities:
//  - (Optional) Bridge to native messaging host for launching local programs
//  - Open the dashboard page when the extension icon is clicked
// Notes:
//  - All heavy logic lives in the UI; this worker stays lean to avoid wakeup overhead.
//  - Guards are structured to return early and reduce branching cost when receiving unrelated messages.

const NATIVE_HOST_NAME = 'com.stackdash.launcher';

/**
 * Handle messages from the dashboard UI.
 * Supported:
 *  - launchProgram (mode === 'native'): forwards to native host, returns response
 *  - launchProgram (non-native): acknowledged (scheme handling is in page)
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== 'launchProgram') return; // ignore unrelated messages quickly

  if (msg.mode === 'native') {
    // Native messaging path
    chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, {
      command: msg.command,
      args: Array.isArray(msg.args) ? msg.args : [],
      programId: msg.programId || null,
      ts: Date.now()
    }, (resp) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok:false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(resp || { ok:true });
      }
    });

    return true; // keep channel open for async response
  }

  // Non-native launch (scheme handled directly in content/UI layer)
  sendResponse({ ok:true, handled:'scheme' });
});

// Open dashboard when the user clicks the extension icon.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});
