import React, { useState, useCallback, useEffect } from 'react';
import './JsonFormatter.css';
import { useSettings } from '../../contexts/SettingsContext';
import JSON5 from 'json5';

const JsonFormatter: React.FC = () => {
  // Load state from localStorage
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem('jf.input') || '';
    } catch {
      return '';
    }
  });
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(() => {
    try {
      const stored = localStorage.getItem('jf.indentSize');
      const num = stored ? Number(stored) : 2;
      return [2, 4, 8].includes(num) ? num : 2;
    } catch {
      return 2;
    }
  });

  const [quoteKeys, setQuoteKeys] = useState<'double' | 'none'>(() => {
    try {
      const stored = localStorage.getItem('jf.quoteKeys');
      return stored === 'none' ? 'none' : 'double';
    } catch {
      return 'double';
    }
  });

  const [mode, setMode] = useState<'beautify' | 'minify'>(() => {
    try {
      const stored = localStorage.getItem('jf.mode');
      return stored === 'minify' ? 'minify' : 'beautify';
    } catch {
      return 'beautify';
    }
  });

  const normalizeObject = (value: any): any => {
    // Ensure we output valid JS object that can be stringified with or without quoted keys
    return value;
  };

  const stringifyWithKeyQuote = (data: any, indent: number): string => {
    if (quoteKeys === 'double') {
      return JSON.stringify(data, null, indent);
    }
    // none: stringify then remove quotes around keys safely
    const json = JSON.stringify(data, null, indent);
    // Regex to remove quotes from object keys: "key": -> key:
    // Handles nesting due to JSON.stringify output (keys always in quotes)
    const pattern = /"([A-Za-z_][A-Za-z0-9_]*)":/g;
    return json.replace(pattern, '$1:');
  };

  const beautifyJson = useCallback(() => {
    try {
      setError('');
      // Try strict JSON first; if fails, fallback to JSON5 to accept relaxed syntax
      let parsed: any;
      try {
        parsed = JSON.parse(input);
      } catch {
        parsed = JSON5.parse(input);
      }
      const formatted = stringifyWithKeyQuote(normalizeObject(parsed), indentSize);
      setOutput(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  }, [input, indentSize, quoteKeys]);

  const minifyJson = useCallback(() => {
    try {
      setError('');
      let parsed: any;
      try {
        parsed = JSON.parse(input);
      } catch {
        parsed = JSON5.parse(input);
      }
      const minified = quoteKeys === 'double'
        ? JSON.stringify(parsed)
        : stringifyWithKeyQuote(parsed, 0).replace(/\n\s*/g, '');
      setOutput(minified);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  }, [input, quoteKeys]);

  const syntaxHighlight = (json: string): string => {
    // Add syntax highlighting with HTML
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return `<span class="${cls}">${match}</span>`;
      });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOutputKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+A or Cmd+A - select all text in this element only
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      e.stopPropagation();
      const selection = window.getSelection();
      const range = document.createRange();
      const target = e.currentTarget;
      range.selectNodeContents(target);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    try {
      localStorage.removeItem('jf.input');
    } catch {}
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInput(text);
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jf.input', input);
    } catch {}
  }, [input]);

  useEffect(() => {
    try {
      localStorage.setItem('jf.indentSize', String(indentSize));
    } catch {}
  }, [indentSize]);

  useEffect(() => {
    try {
      localStorage.setItem('jf.quoteKeys', quoteKeys);
    } catch {}
  }, [quoteKeys]);

  useEffect(() => {
    try {
      localStorage.setItem('jf.mode', mode);
    } catch {}
  }, [mode]);

  // Auto-format when input changes based on mode
  useEffect(() => {
    if (input.trim()) {
      if (mode === 'beautify') {
        beautifyJson();
      } else {
        minifyJson();
      }
    } else {
      setOutput('');
      setError('');
    }
  }, [input, indentSize, quoteKeys, mode, beautifyJson, minifyJson]);

  const toggleMode = () => {
    setMode(prev => prev === 'beautify' ? 'minify' : 'beautify');
  };

  const { wrapLongLines } = useSettings();
  return (
    <div className={`json-formatter ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>JSON Formatter</h2>
        <p className="tool-description">
          Beautify, minify, and validate JSON data
        </p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="indent-size">Indent Size:</label>
          <select
            id="indent-size"
            value={indentSize}
            onChange={(e) => setIndentSize(Number(e.target.value))}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={8}>8 spaces</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="quote-keys">Key Quotes:</label>
          <select
            id="quote-keys"
            value={quoteKeys}
            onChange={(e) => setQuoteKeys(e.target.value as 'double' | 'none')}
          >
            <option value="double">Double quotes</option>
            <option value="none">No quotes (JS object)</option>
          </select>
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={toggleMode}>
            {mode === 'beautify' ? '✨ Beautify' : '🗜️ Minify'}
          </button>
          <button className="btn btn-secondary" onClick={pasteFromClipboard}>
            📋 Paste
          </button>
          <button className="btn btn-danger" onClick={clearAll}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Input</h3>
            <span className="char-count">{input.length} characters</span>
          </div>
          <textarea
            className="editor-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON here..."
            spellCheck={false}
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <h3>Output</h3>
            <div className="panel-actions">
              <span className="char-count">{output.length} characters</span>
              {output && (
                <button className="btn-icon" onClick={copyToClipboard} title="Copy to clipboard">
                  📋 Copy
                </button>
              )}
            </div>
          </div>
          {output ? (
            <pre 
              className="editor-output"
              dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }}
              tabIndex={0}
              onKeyDown={handleOutputKeyDown}
              title="Click to select text, use Ctrl+A to select all, Ctrl+C to copy"
            />
          ) : (
            <div className="editor-placeholder">
              Formatted JSON will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;

