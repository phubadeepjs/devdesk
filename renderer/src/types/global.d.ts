declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      getAutoLaunch: () => Promise<boolean>;
      setAutoLaunch: (enabled: boolean) => Promise<boolean>;
      selectFolder: () => Promise<string | null>;
      processRepo: (repoPath: string) => Promise<{
        success: boolean;
        pdfPath: string;
        txtPath: string;
        outputDir: string;
      }>;
      openFile: (filePath: string) => Promise<boolean>;
      openFolder: (folderPath: string) => Promise<boolean>;
      onRepoProcessProgress: (callback: (text: string) => void) => void;
    };
  }
}

export {};

