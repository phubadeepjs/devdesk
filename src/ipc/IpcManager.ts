import { ipcMain } from 'electron';

export interface IpcHandler {
  name: string;
  register(): void;
}

export class IpcManager {
  private handlers: IpcHandler[] = [];

  public registerHandler(handler: IpcHandler) {
    this.handlers.push(handler);
    handler.register();
  }

  public registerHandlers(handlers: IpcHandler[]) {
    handlers.forEach(h => this.registerHandler(h));
  }
}
