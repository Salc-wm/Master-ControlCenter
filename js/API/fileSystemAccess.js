const PATH_BLACKLIST_SEGMENTS = [
  'bin/x64/CrashReporter',
  'commonredist',

  '/_redist/',
  '/redist/',
  '/_installer/',
  '/support/',
  '/tools/',
  '/utils/',
  '/binaries/win32/',
  '/binaries/win64/',
  '/directx/',
  '/vcredist/'
]

const EXECUTABLE_BLACKLIST = new Set([
  'crashpad_handler.exe',
  'vc_redist.x64.exe',
  'crashreport.exe',
  'vconsole2.exe',
  'dxsetup.exe',

  'unins000.exe',
  'unins001.exe',
  'unins002.exe',
  'uninstall.exe',
  'uninstaller.exe',

  'vc_redist.x86.exe',
  'vcredist.exe',
  'vcredist_x86.exe',
  'vcredist_x64.exe',

  'dxwebsetup.exe',
  'dotnetfx.exe',
  'oalinst.exe',
  'setup.exe',

  'REDEngineErrorReporter.exe',
  'physx_systemsoftware.exe',
  'ue4prereqsetup_x64.exe',
  'unitycrashhandler64.exe',
  'installermessage.exe',

  'crashhandler.exe',
  'crashreporter.exe',
  'errorreporter.exe',
  'steamerrorreporter.exe',
  'unitycrashhandler32.exe',

  'activation.exe',
  'updater.exe',
  'autoupdater.exe'
])


/**
 * @param {HTMLElement} modalBody
 */
export async function handleBrowseFolderClick(query, modalBody) {
  const groupPathInput = modalBody.querySelector(query);
  groupPathInput.value = 'Processing...';

  let selectionMade = false;

  const onFocusHandler = () => {
    setTimeout(() => {
      if (!selectionMade) groupPathInput.value = '';
    }, 100);
  };

  window.addEventListener('focus', onFocusHandler, { once: true });

  try {
    const fileList = await selectDirectory()
      selectionMade = true;
      window.removeEventListener('focus', onFocusHandler);

      if (!fileList || fileList.length === 0)
        throw new Error('No folder selected or folder is empty.');

      groupPathInput.value = fileList[0].webkitRelativePath.split('/')[0];
      const foundExecutables = findExecutables(fileList);

      if (foundExecutables.length > 0) return foundExecutables

      return []
  } catch (error) {
    selectionMade = true;
    window.removeEventListener('focus', onFocusHandler);

    groupPathInput.value = '';
    return []
  }
}

/**
 * @param {FileList} fileList
 * @returns {Promise<Array<{name: string, installdir: string}>>}
 */
function findExecutables(fileList) {
  const executables = [];

  for (const file of fileList) {
    const program = file.name.toLowerCase().endsWith('.exe')

    if (program) executables.push({
        name: file.name,
        path: file.webkitRelativePath
    });
  }

  const filteredExecutables = executables.filter(exe => {
    const isNameBlacklisted = EXECUTABLE_BLACKLIST.has(exe.name.toLowerCase());
    if (isNameBlacklisted) return false;

    const doubleCheck = EXECUTABLE_BLACKLIST.has(exe.name);
    if (doubleCheck) return false;

    return !PATH_BLACKLIST_SEGMENTS.some(part => exe.path.includes(part));
  });

  return filteredExecutables.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @returns {Promise<FileList>}
 */
const selectDirectory = async () => {
  return new Promise((resolve) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.webkitdirectory = true;

    input.addEventListener('change', () => {
      document.body.removeChild(input);
      resolve(input.files);
    }, { once: true });

    input.style.display = 'none';
    document.body.appendChild(input);

    input.click();
  });
}
