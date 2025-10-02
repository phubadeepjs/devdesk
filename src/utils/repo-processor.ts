import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

interface FileInfo {
  path: string;
  relativePath: string;
  content: string;
}

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next', 'out', '.nuxt', 
  '__pycache__', '.venv', 'venv', 'env', '.DS_Store', 'package-lock.json',
  'yarn.lock', '.idea', '.vscode', 'coverage', '.cache'
];

export class RepoProcessor {
  private repoPath: string;
  private files: FileInfo[] = [];
  private progressCallback?: (message: string) => void;

  constructor(repoPath: string, progressCallback?: (message: string) => void) {
    this.repoPath = repoPath;
    this.progressCallback = progressCallback;
  }

  private log(message: string) {
    if (this.progressCallback) {
      this.progressCallback(message);
    }
  }

  private shouldExclude(filePath: string): boolean {
    const parts = filePath.split(path.sep);
    return EXCLUDE_PATTERNS.some(pattern => parts.includes(pattern));
  }

  private isTextFile(filePath: string): boolean {
    const textExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.json', '.css', '.scss', '.html', 
      '.md', '.txt', '.yml', '.yaml', '.xml', '.py', '.java', '.c', '.cpp',
      '.h', '.go', '.rs', '.php', '.rb', '.sh', '.bash', '.sql', '.env',
      '.gitignore', '.dockerignore', 'Dockerfile', 'Makefile'
    ];
    
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    
    return textExtensions.includes(ext) || 
           textExtensions.some(e => basename.endsWith(e));
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      const stats = fs.statSync(filePath);
      
      // Skip files larger than 1MB
      if (stats.size > 1024 * 1024) {
        return '[File too large to process]';
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EISDIR') {
        return '[Directory]';
      }
      return `[Error reading file: ${(err as Error).message}]`;
    }
  }

  private async scanDirectory(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.repoPath, fullPath);

      if (this.shouldExclude(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && this.isTextFile(fullPath)) {
        const content = await this.readFileContent(fullPath);
        this.files.push({
          path: fullPath,
          relativePath,
          content
        });
      }
    }
  }

  private generateFileTree(dirPath: string, prefix: string = ''): string {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let tree = '';

    const filteredEntries = entries.filter(entry => {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.repoPath, fullPath);
      return !this.shouldExclude(relativePath);
    });

    filteredEntries.forEach((entry, index) => {
      const isLast = index === filteredEntries.length - 1;
      const symbol = isLast ? '+-- ' : '|-- ';
      tree += prefix + symbol + entry.name + '\n';

      if (entry.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '|   ');
        const fullPath = path.join(dirPath, entry.name);
        tree += this.generateFileTree(fullPath, newPrefix);
      }
    });

    return tree;
  }

  async generatePDF(outputPath: string): Promise<void> {
    this.log('📁 Scanning repository...\n');
    await this.scanDirectory(this.repoPath);
    
    this.log(`✅ Found ${this.files.length} files\n`);
    this.log('📄 Generating PDF...\n');

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title
    const repoName = path.basename(this.repoPath);
    doc.fontSize(24).text(repoName, { align: 'center' });
    doc.moveDown(2);

    // Repository Structure
    doc.addPage();
    doc.fontSize(16).text('Repository Structure', { underline: true });
    doc.moveDown();
    
    const tree = this.generateFileTree(this.repoPath);
    doc.fontSize(8).font('Courier').text(tree);

    // Files content
    let processedCount = 0;
    for (const file of this.files) {
      processedCount++;
      
      if (processedCount % 10 === 0) {
        this.log(`Processing: ${processedCount}/${this.files.length} files\n`);
      }

      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text(`File: ${file.relativePath}`, {
        underline: true
      });
      doc.moveDown();

      doc.fontSize(8).font('Courier').text(file.content, {
        lineGap: 2
      });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        this.log('✅ PDF generated successfully!\n');
        resolve();
      });
      stream.on('error', reject);
    });
  }

  async generateText(outputPath: string): Promise<void> {
    this.log('📝 Generating text file...\n');
    
    if (this.files.length === 0) {
      await this.scanDirectory(this.repoPath);
    }

    let content = '';
    const repoName = path.basename(this.repoPath);
    
    content += `Repository: ${repoName}\n`;
    content += '='.repeat(50) + '\n\n';

    // Repository Structure
    content += 'Repository Structure:\n';
    content += '-'.repeat(50) + '\n';
    content += this.generateFileTree(this.repoPath);
    content += '\n\n';

    // Files content
    content += 'Files:\n';
    content += '='.repeat(50) + '\n\n';

    for (const file of this.files) {
      content += `File: ${file.relativePath}\n`;
      content += '-'.repeat(50) + '\n';
      content += file.content + '\n';
      content += '\n' + '='.repeat(50) + '\n\n';
    }

    fs.writeFileSync(outputPath, content, 'utf-8');
    this.log('✅ Text file generated successfully!\n');
  }
}

