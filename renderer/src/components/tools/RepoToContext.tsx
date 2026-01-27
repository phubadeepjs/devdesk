import React, { useState, useEffect } from 'react';
import './RepoToContext.css';
import { useSettings } from '../../contexts/SettingsContext';

const RepoToContext: React.FC = () => {
  const [repoPath, setRepoPath] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [txtPath, setTxtPath] = useState<string | null>(null);
  const [mdPath, setMdPath] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Listen for progress updates
    if (window.electronAPI?.onRepoProcessProgress) {
      window.electronAPI.onRepoProcessProgress((text: string) => {
        setOutput(prev => prev + text);
      });
    }
  }, []);

  const processRepository = async (formatOverride?: string) => {
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
    setPdfPath(null);
    setTxtPath(null);
    setMdPath(null);
    setOutputDir(null);

    const targetFormat = formatOverride || selectedFormat;

    try {
      const formats = targetFormat === 'all' 
        ? ['pdf', 'txt', 'md'] 
        : [targetFormat];

      const result = await window.electronAPI.processRepo(repoPath, { formats });
      
      if (result.success) {
        setPdfPath(result.pdfPath || null);
        setTxtPath(result.txtPath || null);
        setMdPath(result.mdPath || null);
        setOutputDir(result.outputDir);
        
        setOutput(prev => prev + '\n\n✅ Processing completed successfully!\n\n');
        setOutput(prev => prev + `📁 Output directory: ${result.outputDir}\n`);
        if (result.pdfPath) setOutput(prev => prev + `📄 PDF: ${result.pdfPath}\n`);
        if (result.txtPath) setOutput(prev => prev + `📝 TXT: ${result.txtPath}\n`);
        if (result.mdPath) setOutput(prev => prev + `📝 MD: ${result.mdPath}\n`);
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
          <div className="dropdown-container">
            <button 
              className="btn btn-primary dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={isProcessing}
            >
              {isProcessing ? '⏳ Processing...' : (
                <>
                  {selectedFormat === 'all' && '🚀 Generate All'}
                  {selectedFormat === 'pdf' && '📄 Generate PDF'}
                  {selectedFormat === 'txt' && '📝 Generate TXT'}
                  {selectedFormat === 'md' && '📝 Generate MD'}
                  <span className="dropdown-arrow">▼</span>
                </>
              )}
            </button>
            
            {isDropdownOpen && !isProcessing && (
              <div className="dropdown-menu">
                <button className={`dropdown-item ${selectedFormat === 'all' ? 'active' : ''}`} onClick={() => { setSelectedFormat('all'); setIsDropdownOpen(false); processRepository('all'); }}>
                  🚀 All Formats
                </button>
                <button className={`dropdown-item ${selectedFormat === 'pdf' ? 'active' : ''}`} onClick={() => { setSelectedFormat('pdf'); setIsDropdownOpen(false); processRepository('pdf'); }}>
                  📄 PDF Only
                </button>
                <button className={`dropdown-item ${selectedFormat === 'txt' ? 'active' : ''}`} onClick={() => { setSelectedFormat('txt'); setIsDropdownOpen(false); processRepository('txt'); }}>
                  📝 Text Only
                </button>
                <button className={`dropdown-item ${selectedFormat === 'md' ? 'active' : ''}`} onClick={() => { setSelectedFormat('md'); setIsDropdownOpen(false); processRepository('md'); }}>
                  📝 Markdown Only
                </button>
              </div>
            )}
          </div>
          {outputDir && (
            <button className="btn btn-secondary" onClick={openOutputFolder}>
              📂 Open Output Folder
            </button>
          )}
        </div>
      </div>

      {(pdfPath || txtPath || mdPath) && (
        <div className="output-files">
          <h3>Generated Files:</h3>
          <div className="file-buttons">
            {pdfPath && (
              <button className="btn btn-file" onClick={() => openFile(pdfPath)}>
                📄 Open PDF file
              </button>
            )}
            {txtPath && (
              <button className="btn btn-file" onClick={() => openFile(txtPath)}>
                📝 Open Text file
              </button>
            )}
            {mdPath && (
              <button className="btn btn-file" onClick={() => openFile(mdPath)}>
                📝 Open Markdown file
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

