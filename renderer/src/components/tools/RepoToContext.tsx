import React, { useState, useEffect } from 'react';
import './RepoToContext.css';
import { useSettings } from '../../contexts/SettingsContext';

const RepoToContext: React.FC = () => {
  const [repoPath, setRepoPath] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [txtPath, setTxtPath] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState<string | null>(null);

  useEffect(() => {
    // Listen for progress updates
    if (window.electronAPI?.onRepoProcessProgress) {
      window.electronAPI.onRepoProcessProgress((text: string) => {
        setOutput(prev => prev + text);
      });
    }
  }, []);

  const processRepository = async () => {
    if (!repoPath.trim()) {
      setOutput('❌ Please enter a repository path\n');
      return;
    }

    if (!window.electronAPI?.processRepo) {
      setOutput('❌ This feature is only available in the Electron app\n');
      return;
    }

    setIsProcessing(true);
    setOutput('🚀 Starting repository processing...\n\n');
    setPdfPath(null);
    setTxtPath(null);
    setOutputDir(null);

    try {
      const result = await window.electronAPI.processRepo(repoPath);
      
      if (result.success) {
        setPdfPath(result.pdfPath);
        setTxtPath(result.txtPath);
        setOutputDir(result.outputDir);
        
        setOutput(prev => prev + '\n\n✅ Processing completed successfully!\n\n');
        setOutput(prev => prev + `📁 Output directory: ${result.outputDir}\n`);
        setOutput(prev => prev + `📄 PDF: ${result.pdfPath}\n`);
        setOutput(prev => prev + `📝 TXT: ${result.txtPath}\n`);
      }
    } catch (err) {
      setOutput(prev => prev + '\n\n❌ Error: ' + (err instanceof Error ? err.message : String(err)) + '\n');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectFolder = async () => {
    if (!window.electronAPI?.selectFolder) {
      setOutput('❌ Folder selection is only available in the Electron app\n');
      return;
    }

    try {
      const selectedPath = await window.electronAPI.selectFolder();
      if (selectedPath) {
        setRepoPath(selectedPath);
      }
    } catch (err) {
      console.error('Failed to select folder:', err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openFile = async (filePath: string) => {
    if (!window.electronAPI?.openFile) return;
    await window.electronAPI.openFile(filePath);
  };

  const openOutputFolder = async () => {
    if (!window.electronAPI?.openFolder || !outputDir) return;
    await window.electronAPI.openFolder(outputDir);
  };

  const { wrapLongLines } = useSettings();

  return (
    <div className={`repo-to-context ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>Repo to Context</h2>
        <p className="tool-description">
          Convert repository to PDF/TXT files
        </p>
      </div>

      <div className="controls">
        <div className="path-input-group">
          <input
            type="text"
            className="path-input"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder="Enter repository path..."
          />
          <button className="btn btn-secondary" onClick={selectFolder}>
            📁 Browse
          </button>
        </div>

        <div className="button-group">
          <button 
            className="btn btn-primary" 
            onClick={processRepository}
            disabled={isProcessing}
          >
            {isProcessing ? '⏳ Processing...' : '🚀 Generate Context'}
          </button>
          {outputDir && (
            <button className="btn btn-secondary" onClick={openOutputFolder}>
              📂 Open Output Folder
            </button>
          )}
        </div>
      </div>

      {(pdfPath || txtPath) && (
        <div className="output-files">
          <h3>Generated Files:</h3>
          <div className="file-buttons">
            {pdfPath && (
              <button className="btn btn-file" onClick={() => openFile(pdfPath)}>
                📄 Open PDF
              </button>
            )}
            {txtPath && (
              <button className="btn btn-file" onClick={() => openFile(txtPath)}>
                📝 Open TXT
              </button>
            )}
          </div>
        </div>
      )}

      <div className="output-container">
        <div className="output-header">
          <h3>Output Log</h3>
          <div className="output-actions">
            <span className="char-count">{output.length} characters</span>
            {output && (
              <button className="btn-icon" onClick={copyToClipboard}>
                📋 Copy
              </button>
            )}
          </div>
        </div>
        <textarea
          className="output-textarea"
          value={output}
          readOnly
          placeholder="Processing log will appear here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default RepoToContext;

