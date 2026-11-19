import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createStorage } from './storage';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'TallyLearn NGO (practice edition)',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  void win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

function registerIpc(): void {
  const storage = createStorage(path.join(app.getPath('userData'), 'companies'));
  ipcMain.handle('storage:list', () => storage.list());
  ipcMain.handle('storage:load', (_e, id: string) => storage.load(id));
  ipcMain.handle('storage:save', (_e, id: string, json: string) => storage.save(id, json));
  ipcMain.handle('storage:remove', (_e, id: string) => storage.remove(id));
  ipcMain.handle('storage:getLast', () => storage.getLast());
  ipcMain.handle('storage:setLast', (_e, id: string) => storage.setLast(id));

  ipcMain.handle('file:saveText', async (e, name: string, text: string) => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined;
    const r = await dialog.showSaveDialog(win!, { defaultPath: name });
    if (r.canceled || !r.filePath) return null;
    fs.writeFileSync(r.filePath, text, 'utf8');
    return r.filePath;
  });
  ipcMain.handle('file:openText', async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined;
    const r = await dialog.showOpenDialog(win!, { properties: ['openFile'], filters: [{ name: 'TallyLearn company', extensions: ['json', 'tlbak'] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    return fs.readFileSync(r.filePaths[0], 'utf8');
  });
  ipcMain.handle('file:exportPdf', async (e, html: string, name: string) => {
    const win = BrowserWindow.fromWebContents(e.sender) ?? undefined;
    const r = await dialog.showSaveDialog(win!, { defaultPath: name, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
    if (r.canceled || !r.filePath) return null;
    const hidden = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false } });
    try {
      await hidden.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
      const pdf = await hidden.webContents.printToPDF({ pageSize: 'A4', printBackground: true });
      fs.writeFileSync(r.filePath, pdf);
      return r.filePath;
    } finally {
      hidden.destroy();
    }
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
