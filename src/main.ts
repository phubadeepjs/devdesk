import { app } from 'electron';
import { WindowManager } from './managers/WindowManager';
import { TrayManager } from './managers/TrayManager';
import { IpcManager } from './ipc/IpcManager';
import { SystemHandler } from './ipc/handlers/SystemHandler';
import { FileHandler } from './ipc/handlers/FileHandler';
import { RepoHandler } from './ipc/handlers/RepoHandler';
import { SettingsHandler } from './ipc/handlers/SettingsHandler';

// Initialize managers
const windowManager = WindowManager.getInstance();
let trayManager: TrayManager | null = null;

app.whenReady().then(() => {
  windowManager.createWindow();
  trayManager = new TrayManager(windowManager);

  // Register IPC handlers
  const ipcManager = new IpcManager();
  ipcManager.registerHandlers([
    new SystemHandler(),
    new FileHandler(),
    new RepoHandler(),
    new SettingsHandler()
  ]);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
});
