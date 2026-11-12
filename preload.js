/* Only the app's own local pages (settings.html, offline.html) use these. */
const { contextBridge, ipcRenderer } = require('electron');

if (location.protocol === 'file:') {
  contextBridge.exposeInMainWorld('goc', {
    get: () => ipcRenderer.invoke('goc:get'),
    save: (url) => ipcRenderer.invoke('goc:save', url),
    retry: () => ipcRenderer.invoke('goc:retry'),
    settings: () => ipcRenderer.invoke('goc:settings'),
    close: () => ipcRenderer.invoke('goc:close')
  });
}
