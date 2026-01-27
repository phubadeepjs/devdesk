import { ipcMain, app } from 'electron';
import AutoLaunch from 'auto-launch';
import { IpcHandler } from '../IpcManager';

export class SystemHandler implements IpcHandler {
  name = 'SystemHandler';
  private autoLauncher: AutoLaunch;

  constructor() {
    this.autoLauncher = new AutoLaunch({
        name: 'DevDesk',
        path: app.getPath('exe'),
    });
  }

  register(): void {
    ipcMain.handle('get-auto-launch', async () => {
        try {
          return await this.autoLauncher.isEnabled();
        } catch {
          return false;
        }
    });
    
    ipcMain.handle('set-auto-launch', async (_event, enabled: boolean) => {
        try {
          if (enabled) {
            await this.autoLauncher.enable();
          } else {
            await this.autoLauncher.disable();
          }
          return true;
        } catch (err) {
          console.error('Failed to set auto-launch:', err);
          return false;
        }
    });
  }
}
