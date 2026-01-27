import { ipcMain, app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { IpcHandler } from '../IpcManager';
import { WindowManager } from '../../managers/WindowManager';

export class SettingsHandler implements IpcHandler {
  name = 'SettingsHandler';
  private settingsPath: string;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'app-settings.json');
    // Register initial shortcut
    const saved = this.getSetting('globalShortcut', 'CommandOrControl+Shift+Space');
    // Defer slighty to ensure app is ready? Constructor is called in whenReady callback, so it's fine.
    // But WindowManager might not be fully ready? It's initialized before.
    setTimeout(() => {
        WindowManager.getInstance().registerGlobalShortcut(saved);
    }, 100);
  }

  register(): void {
    ipcMain.handle('get-global-shortcut', async () => {
      return this.getSetting('globalShortcut', 'CommandOrControl+Shift+Space');
    });

    ipcMain.handle('set-global-shortcut', async (event, shortcut: string) => {
      this.saveSetting('globalShortcut', shortcut);
      
      // Update the actual shortcut
      const windowManager = WindowManager.getInstance();
      windowManager.registerGlobalShortcut(shortcut);
      
      return true;
    });
  }

  private getSetting(key: string, defaultValue: any): any {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return defaultValue;
      }
      const data = fs.readFileSync(this.settingsPath, 'utf8');
      const settings = JSON.parse(data);
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error('Error reading settings:', error);
      return defaultValue;
    }
  }

  private saveSetting(key: string, value: any): void {
    try {
      let settings: any = {};
      if (fs.existsSync(this.settingsPath)) {
        settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
      }
      settings[key] = value;
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}
