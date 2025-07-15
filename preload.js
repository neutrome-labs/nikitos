const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Panel creation and content streaming
  addPanel: (request) => ipcRenderer.invoke('add-panel', request),
  saveContent: (panelId, content) => ipcRenderer.invoke('save-content', panelId, content),
  onStreamData: (callback) => ipcRenderer.on('stream-data', (_event, value) => callback(value)),
  onStreamEnd: (callback) => ipcRenderer.on('stream-end', (_event) => callback()),
  
  // Applet management methods
  getApplets: () => ipcRenderer.invoke('get-applets'),
  onAppletsUpdate: (callback) => {
    ipcRenderer.on('applets-updated', (_event, applets) => callback(applets));
  },
  deleteApplet: (appletId) => ipcRenderer.invoke('delete-applet', appletId),
  reopenApplet: (appletId) => ipcRenderer.invoke('reopen-applet', appletId),
  
  // Enhancement feature
  enhancePanel: (panelId, userInput) => ipcRenderer.invoke('enhance-panel', panelId, userInput),
  
  // Import functionality
  getAvailablePanels: () => ipcRenderer.invoke('get-available-panels'),
  importPanel: (panelId) => ipcRenderer.invoke('import-panel', panelId)
});
