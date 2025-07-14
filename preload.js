const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Existing methods
  addPanel: (request) => ipcRenderer.invoke('add-panel', request),
  reopenPanel: (panelId) => ipcRenderer.invoke('reopen-panel', panelId),
  saveContent: (panelId, content) => ipcRenderer.invoke('save-content', panelId, content),
  onStreamData: (callback) => ipcRenderer.on('stream-data', (_event, value) => callback(value)),
  onStreamEnd: (callback) => ipcRenderer.on('stream-end', (_event) => callback()),
  
  // New methods for panel management
  getPanels: () => ipcRenderer.invoke('get-panels'),
  createPanel: (name) => ipcRenderer.invoke('create-panel', name),
  onPanelsUpdate: (callback) => {
    ipcRenderer.on('panels-updated', (_event, panels) => callback(panels));
  },
  
  // Enhancement feature
  enhancePanel: (panelId, userInput) => ipcRenderer.invoke('enhance-panel', panelId, userInput),
  
  // Panel deletion
  deletePanel: (panelId) => ipcRenderer.invoke('delete-panel', panelId)
});
