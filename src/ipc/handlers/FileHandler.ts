import { ipcMain, shell, dialog, BrowserWindow } from 'electron';
import { IpcHandler } from '../IpcManager';

export class FileHandler implements IpcHandler {
  name = 'FileHandler';

  register(): void {
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
    
    ipcMain.handle('select-folder', async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (!win) return null;
        
        const result = await dialog.showOpenDialog(win, {
          properties: ['openDirectory'],
          title: 'Select Repository Folder'
        });
        
        if (result.canceled || result.filePaths.length === 0) {
          return null;
        }
        
        return result.filePaths[0];
    });
  }
}
