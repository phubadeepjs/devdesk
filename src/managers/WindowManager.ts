import { BrowserWindow, app, screen, nativeImage, shell, globalShortcut } from 'electron';
import * as path from 'path';

export class WindowManager {
  private static instance: WindowManager;
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;

  private constructor() {
    app.on('before-quit', () => {
      this.isQuitting = true;
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      } else {
        this.mainWindow?.show();
      }
    });
  }

  public static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public toggleWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  public showWindow(): void {
    if (!this.mainWindow) return;

    // Previously forced alignment to right side
    // const cursor = screen.getCursorScreenPoint();
    // const display = screen.getDisplayNearestPoint(cursor);
    // const bounds = display.workArea;
    // const x = Math.max(bounds.x + bounds.width - 400, bounds.x);
    // const y = bounds.y + 60;
    // this.mainWindow.setPosition(Math.floor(x), Math.floor(y), false);

    this.mainWindow.show();
    this.mainWindow.focus();
  }

  public registerGlobalShortcut(accelerator: string): boolean {
    // Unregister all global shortcuts to avoid conflicts (or track locally if we had multiple)
    globalShortcut.unregisterAll();

    try {
      const ret = globalShortcut.register(accelerator, () => {
        this.toggleWindow();
      });

      if (!ret) {
        console.warn('Registration failed for shortcut:', accelerator);
      }
      return ret;
    } catch (e) {
      console.error('Failed to register shortcut:', e);
      return false;
    }
  }

  public createWindow(): void {
    if (this.mainWindow) return;

    // Resolve icon path
    const isPackaged = app.isPackaged;
    const resourcesPath = isPackaged ? process.resourcesPath : path.join(__dirname, '../../');
    const appIconPath = path.join(resourcesPath, 'assets', isPackaged ? 'appIcon.icns' : 'appIcon.png');
    
    const appIcon = nativeImage.createFromPath(appIconPath);

    if (process.platform === 'darwin' && !appIcon.isEmpty()) {
       try { app.dock.setIcon(appIcon); } catch {}
    }

    if (process.platform === 'darwin' && !appIcon.isEmpty()) {
       try { app.dock.setIcon(appIcon); } catch {}
    }

    // Attempt to register default if not set
    // This is now handled by initial call from SettingsHandler or lazily
    // But to ensure it works on first run, we can register default here
    // However, better to let the persistence logic handle it. 
    // For now, removing the hardcoded registration.
    
    // Actually, we should probably read the setting here if possible, but that couples it.
    // Let's rely on SettingsHandler calling registerGlobalShortcut on app start? 
    // Wait, SettingsHandler is initialized in main.ts, but when does it register?
    // It's just setting up IPC. 
    // We should probably trigger an initial registration. 
    // We'll update main.ts to trigger it or have SettingsHandler do it in constructor.

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 12, y: 16 },
      icon: !appIcon.isEmpty() ? appIcon : undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
        devTools: !app.isPackaged
      },
      backgroundColor: '#1e1e1e',
      show: false 
    });

    // Load content
    // Determine path similarly to original
    let rendererPath: string;
    if (app.isPackaged) {
      // In production, index.html is likely in a known spot relative to main.js
      rendererPath = path.join(__dirname, '../../renderer/dist/index.html'); 
      this.mainWindow.loadFile(rendererPath);
    } else {
      // In dev, usually load from localhost or file
      // Original code loaded file: path.join(__dirname, '../renderer/dist/index.html');
      // But verify if we want to support HMR later. For now, stick to file as per original for safety, 
      // or assume build:renderer is run.
      // Wait, original was: path.join(__dirname, '../renderer/dist/index.html')
      // My new file is in src/managers/, so __dirname is src/managers/
      // So I need to go up one more level.
      rendererPath = path.join(__dirname, '../../renderer/dist/index.html');
      this.mainWindow.loadFile(rendererPath);
    }
    
    this.mainWindow.on('ready-to-show', () => {
        this.mainWindow?.show();
    });

    if (process.env.OPEN_DEVTOOLS === '1') {
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    }

    this.mainWindow.on('close', (e) => {
      if (!this.isQuitting) {
        e.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Handle external links if needed, or just let them happen
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
  }
}
