import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.invoke('set-auto-launch', enabled),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  processRepo: (repoPath: string, options?: any) => ipcRenderer.invoke('process-repo', repoPath, options),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  onRepoProcessProgress: (callback: (text: string) => void) => {
    ipcRenderer.on('repo-process-progress', (_event, text) => callback(text));
  }
});

