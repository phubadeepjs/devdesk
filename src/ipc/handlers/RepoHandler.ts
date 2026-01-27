import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { IpcHandler } from '../IpcManager';
import { RepoProcessor } from '../../utils/repo-processor';

export class RepoHandler implements IpcHandler {
  name = 'RepoHandler';

  register(): void {
    ipcMain.handle('process-repo', async (event, repoPath: string, options?: { formats: string[] }) => {
        try {
          // Default to all formats if not specified
          const formats = options?.formats || ['pdf', 'txt', 'md'];

          // Create output directory in user's documents
          const outputDir = path.join(os.homedir(), 'Documents', 'DevDesk-Output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
    
          const repoName = path.basename(repoPath);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
          
          let pdfPath, txtPath, mdPath;

          // Create processor with progress callback
          const processor = new RepoProcessor(repoPath, (message) => {
            event.sender.send('repo-process-progress', message);
          });
    
          // Generate requested formats
          if (formats.includes('pdf')) {
            pdfPath = path.join(outputDir, `${repoName}_${timestamp}.pdf`);
            await processor.generatePDF(pdfPath);
          }
          
          if (formats.includes('txt')) {
            txtPath = path.join(outputDir, `${repoName}_${timestamp}.txt`);
            await processor.generateText(txtPath);
          }

          if (formats.includes('md')) {
            mdPath = path.join(outputDir, `${repoName}_${timestamp}.md`);
            await processor.generateMarkdown(mdPath);
          }
    
          return {
            success: true,
            pdfPath,
            txtPath,
            mdPath,
            outputDir
          };
        } catch (err) {
          console.error('Failed to process repo:', err);
          throw err;
        }
      });
  }
}
