import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('tallylearn', {
  platform: process.platform,
  storage: {
    list: () => ipcRenderer.invoke('storage:list'),
    load: (id: string) => ipcRenderer.invoke('storage:load', id),
    save: (id: string, json: string) => ipcRenderer.invoke('storage:save', id, json),
    remove: (id: string) => ipcRenderer.invoke('storage:remove', id),
    getLast: () => ipcRenderer.invoke('storage:getLast'),
    setLast: (id: string) => ipcRenderer.invoke('storage:setLast', id),
  },
  files: {
    saveText: (name: string, text: string) => ipcRenderer.invoke('file:saveText', name, text),
    openText: () => ipcRenderer.invoke('file:openText'),
    exportPdf: (html: string, name: string) => ipcRenderer.invoke('file:exportPdf', html, name),
  },
});
