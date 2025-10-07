import { app, BrowserWindow, Tray, nativeImage, globalShortcut, screen, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import AutoLaunch from 'auto-launch';
import { RepoProcessor } from './utils/repo-processor';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Auto-launch configuration
const autoLauncher = new AutoLaunch({
  name: 'DevDesk',
  path: app.getPath('exe'),
});

function resolveAsset(...segments: string[]): string {
  const base = app.isPackaged
    ? (process.resourcesPath || __dirname)
    : path.join(__dirname, '..');
  return path.join(base, ...segments);
}

function createWindow() {
  // Prefer .icns in production, .png in dev
  const appIconIcnsPath = resolveAsset('assets', 'appIcon.icns');
  const appIconPngPath = resolveAsset('assets', 'appIcon.png');
  const appIcon = app.isPackaged
    ? nativeImage.createFromPath(appIconIcnsPath)
    : nativeImage.createFromPath(appIconPngPath);

  if (process.platform === 'darwin' && !appIcon.isEmpty()) {
    try { app.dock.setIcon(appIcon); } catch {}
  }

  mainWindow = new BrowserWindow({
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
      preload: path.join(__dirname, 'preload.js'),
      devTools: !app.isPackaged
    },
    backgroundColor: '#1e1e1e'
  });

  const rendererPath = path.join(__dirname, '../renderer/dist/index.html');
  mainWindow.loadFile(rendererPath);

  if (process.env.OPEN_DEVTOOLS === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // IPC handlers for auto-launch
  ipcMain.handle('get-auto-launch', async () => {
    try {
      return await autoLauncher.isEnabled();
    } catch {
      return false;
    }
  });

  ipcMain.handle('set-auto-launch', async (_event, enabled: boolean) => {
    try {
      if (enabled) {
        await autoLauncher.enable();
      } else {
        await autoLauncher.disable();
      }
      return true;
    } catch (err) {
      console.error('Failed to set auto-launch:', err);
      return false;
    }
  });

  // Repo to Context handlers
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null;
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Repository Folder'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  ipcMain.handle('process-repo', async (event, repoPath: string) => {
    try {
      // Create output directory in user's documents
      const outputDir = path.join(os.homedir(), 'Documents', 'DevDesk-Output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const repoName = path.basename(repoPath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const pdfPath = path.join(outputDir, `${repoName}_${timestamp}.pdf`);
      const txtPath = path.join(outputDir, `${repoName}_${timestamp}.txt`);

      // Create processor with progress callback
      const processor = new RepoProcessor(repoPath, (message) => {
        event.sender.send('repo-process-progress', message);
      });

      // Generate both PDF and TXT
      await processor.generatePDF(pdfPath);
      await processor.generateText(txtPath);

      return {
        success: true,
        pdfPath,
        txtPath,
        outputDir
      };
    } catch (err) {
      console.error('Failed to process repo:', err);
      throw err;
    }
  });

  ipcMain.handle('open-file', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath);
      return true;
    } catch (err) {
      console.error('Failed to open file:', err);
      return false;
    }
  });

  ipcMain.handle('open-folder', async (_event, folderPath: string) => {
    try {
      await shell.openPath(folderPath);
      return true;
    } catch (err) {
      console.error('Failed to open folder:', err);
      return false;
    }
  });

  try {
    // Try monochrome template icon first (best for macOS menu bar)
    const trayTemplatePath = resolveAsset('assets', 'trayTemplate.png');
    let trayImage = nativeImage.createFromPath(trayTemplatePath);
    let isTemplate = !trayImage.isEmpty();

    if (trayImage.isEmpty()) {
      // Fallback to colored tray.png
      const trayPath = resolveAsset('assets', 'tray.png');
      trayImage = nativeImage.createFromPath(trayPath);
      isTemplate = false;
    }
    if (trayImage.isEmpty()) {
      // Final fallback to app icon png
      trayImage = nativeImage.createFromPath(resolveAsset('assets', 'appIcon.png'));
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

    tray = new Tray(trayImage);
    tray.setToolTip('DevDesk');
    if (process.platform === 'darwin' && trayImage.isEmpty()) {
      try { tray.setTitle('DevDesk'); } catch {}
    }

    const toggleWindow = () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        const cursor = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(cursor);
        const bounds = display.workArea;
        const x = Math.max(bounds.x + bounds.width - 400, bounds.x);
        const y = bounds.y + 60;
        mainWindow.setPosition(Math.floor(x), Math.floor(y), false);
        mainWindow.show();
        mainWindow.focus();
      }
    };
    tray.on('click', toggleWindow);
    tray.on('right-click', toggleWindow);
  } catch {}

  try {
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    if (!app.isPackaged) {
      globalShortcut.register('CommandOrControl+Alt+I', () => {
        if (!mainWindow) return;
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
        } else {
          mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
      });
    }
  } catch {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
    mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch {}
});

