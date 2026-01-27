import { Tray, nativeImage, app, Menu } from 'electron';
import * as path from 'path';
import { WindowManager } from './WindowManager';

export class TrayManager {
  private tray: Tray | null = null;
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
    this.createTray();
  }

  private createTray() {
    try {
      const isPackaged = app.isPackaged;
      const base = isPackaged 
        ? process.resourcesPath 
        : path.join(__dirname, '../../');
        
      const resolveAsset = (name: string) => path.join(base, 'assets', name);

      // Try monochrome template icon first
      const trayTemplatePath = resolveAsset('trayTemplate.png');
      let trayImage = nativeImage.createFromPath(trayTemplatePath);
      let isTemplate = !trayImage.isEmpty();

      if (trayImage.isEmpty()) {
        const trayPath = resolveAsset('tray.png');
        trayImage = nativeImage.createFromPath(trayPath);
        isTemplate = false;
      }
      
      if (trayImage.isEmpty()) {
          trayImage = nativeImage.createFromPath(resolveAsset('appIcon.png'));
      }

      if (trayImage.isEmpty()) {
        trayImage = nativeImage.createEmpty();
      }

      if (process.platform === 'darwin' && !trayImage.isEmpty()) {
        trayImage = trayImage.resize({ width: 20, height: 20 });
        if (isTemplate) {
          try { trayImage.setTemplateImage(true); } catch {}
        }
      }

      this.tray = new Tray(trayImage);
      this.tray.setToolTip('DevDesk');
      
      if (process.platform === 'darwin' && trayImage.isEmpty()) {
        try { this.tray.setTitle('DevDesk'); } catch {}
      }

      // Context menu
      const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Show App', 
            click: () => this.windowManager.toggleWindow() 
        },
        { type: 'separator' },
        { 
            label: 'Quit', 
            click: () => {
                app.quit();
            } 
        }
      ]);

      // Right click menu
      this.tray.setContextMenu(contextMenu);

      // Left click toggle
      this.tray.on('click', () => this.windowManager.toggleWindow());
      
    } catch (err) {
      console.error('Failed to create tray:', err);
    }
  }
}
