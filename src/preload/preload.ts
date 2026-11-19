import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('tallylearn', { platform: process.platform });
