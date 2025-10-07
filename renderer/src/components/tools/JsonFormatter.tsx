import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

  // Find functionality
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLPreElement>(null);
  const inputFindRef = useRef<HTMLInputElement>(null);
  const outputFindRef = useRef<HTMLInputElement>(null);
  const [findInInput, setFindInInput] = useState('');
  const [findInOutput, setFindInOutput] = useState('');
  const [inputMatchIndex, setInputMatchIndex] = useState(0);
  const [outputMatchIndex, setOutputMatchIndex] = useState(0);
  const [showFindInInput, setShowFindInInput] = useState(false);
  const [showFindInOutput, setShowFindInOutput] = useState(false);
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

  // Find helpers
  const getMatches = (text: string, query: string): number[] => {
    if (!query) return [];
    const matches: number[] = [];
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let index = 0;
    while (true) {
      const found = lowerText.indexOf(lowerQuery, index);
      if (found === -1) break;
      matches.push(found);
      index = found + 1;
    }
    return matches;
  };

  const inputMatches = useMemo(() => getMatches(input, findInInput), [input, findInInput]);
  const outputMatches = useMemo(() => getMatches(output, findInOutput), [output, findInOutput]);

  // Navigate to match in input (using native selection)
  const findInInputTextarea = (direction: 1 | -1) => {
    if (!inputMatches.length || !inputRef.current) return;
    const newIndex = (inputMatchIndex + direction + inputMatches.length) % inputMatches.length;
    setInputMatchIndex(newIndex);
    const start = inputMatches[newIndex];
    const end = start + findInInput.length;

    const textarea = inputRef.current;

    // Focus and select FIRST
    textarea.focus();
    textarea.setSelectionRange(start, end);

    // Use percentage-based scrolling with proper centering
    const percentageThrough = start / input.length;
    const targetScrollPosition = percentageThrough * textarea.scrollHeight;

    // Center the match in viewport by subtracting half the visible height
    const centeredScroll = targetScrollPosition - (textarea.clientHeight / 2);

    // Clamp between 0 and max scroll
    const maxScroll = textarea.scrollHeight - textarea.clientHeight;
    textarea.scrollTop = Math.max(0, Math.min(maxScroll, centeredScroll));
  };

  // Navigate to match in output (using <mark> tags + scroll)
  const findInOutputPre = (direction: 1 | -1) => {
    if (!outputMatches.length) return;
    const newIndex = (outputMatchIndex + direction + outputMatches.length) % outputMatches.length;
    setOutputMatchIndex(newIndex);
    // Will scroll after DOM update
  };

  // Highlight output with <mark> tags
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightOutput = (html: string, query: string): string => {
    if (!query) return html;
    const parts = html.split(/(<[^>]+>)/g);
    const re = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] && !parts[i].startsWith('<')) {
        parts[i] = parts[i].replace(re, '<mark class="find-hl">$1</mark>');
      }
    }
    return parts.join('');
  };

  const outputHtml = useMemo(() => {
    const base = syntaxHighlight(output);
    return highlightOutput(base, findInOutput);
  }, [output, findInOutput]);

  // Scroll to current match in output
  useEffect(() => {
    if (outputMatches.length && outputRef.current) {
      const marks = outputRef.current.querySelectorAll('mark.find-hl');
      const mark = marks[outputMatchIndex] as HTMLElement;
      if (mark) {
        mark.scrollIntoView({ block: 'center', behavior: 'auto' }); // instant scroll, no animation
      }
    }
  }, [outputMatchIndex, outputMatches]);

  // Auto-scroll when typing in find boxes (but don't steal focus from find box)
  useEffect(() => {
    if (findInInput && inputMatches.length > 0 && inputRef.current) {
      const start = inputMatches[0];
      const textarea = inputRef.current;

      // Only scroll, don't focus or select to keep focus in find box
      const percentageThrough = start / input.length;
      const targetScrollPosition = percentageThrough * textarea.scrollHeight;
      const centeredScroll = targetScrollPosition - (textarea.clientHeight / 2);
      const maxScroll = textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = Math.max(0, Math.min(maxScroll, centeredScroll));
    }
  }, [findInInput, inputMatches]);

  useEffect(() => {
    if (findInOutput && outputMatches.length > 0 && outputRef.current) {
      // Auto-scroll to first match in output
      const marks = outputRef.current.querySelectorAll('mark.find-hl');
      const mark = marks[0] as HTMLElement;
      if (mark) {
        mark.scrollIntoView({ block: 'center', behavior: 'auto' }); // instant scroll
      }
    }
  }, [findInOutput, outputMatches]);

  // Reset match index when search query changes
  useEffect(() => { setInputMatchIndex(0); }, [findInInput, input]);
  useEffect(() => { setOutputMatchIndex(0); }, [findInOutput, output]);

  // Keyboard shortcuts for find
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F: Open find box for currently focused panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();

        const activeElement = document.activeElement;

        // Check if input textarea or its find box is focused
        const isInputFocused =
          activeElement === inputRef.current ||
          activeElement === inputFindRef.current ||
          inputRef.current?.contains(activeElement);

        // Check if output pre or its find box is focused
        const isOutputFocused =
          activeElement === outputRef.current ||
          activeElement === outputFindRef.current ||
          outputRef.current?.contains(activeElement);

        if (isInputFocused) {
          setShowFindInInput(true);
          setTimeout(() => inputFindRef.current?.focus(), 50);
        } else if (isOutputFocused) {
          setShowFindInOutput(true);
          setTimeout(() => outputFindRef.current?.focus(), 50);
        } else {
          // Default: open input find if nothing is focused
          setShowFindInInput(true);
          setTimeout(() => inputFindRef.current?.focus(), 50);
        }
      }

      // Escape: Close find boxes
      if (e.key === 'Escape') {
        if (showFindInInput || showFindInOutput) {
          e.preventDefault();
          setShowFindInInput(false);
          setShowFindInOutput(false);
          setFindInInput('');
          setFindInOutput('');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showFindInInput, showFindInOutput]);

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    try {
      localStorage.removeItem('jf.input');
    } catch {}
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
            <div className="panel-actions">
              {showFindInInput && (
                <div className="find-box">
                  <input
                    ref={inputFindRef}
                    className="find-input"
                    type="text"
                    placeholder="Find..."
                    value={findInInput}
                    onChange={(e) => setFindInInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        findInInputTextarea(e.shiftKey ? -1 : 1);
                      }
                    }}
                  />
                  <span className="find-count">
                    {inputMatches.length ? `${inputMatchIndex + 1}/${inputMatches.length}` : '0/0'}
                  </span>
                  <button className="btn-icon" onClick={() => findInInputTextarea(-1)}>↑</button>
                  <button className="btn-icon" onClick={() => findInInputTextarea(1)}>↓</button>
                </div>
              )}
              <span className="char-count">{input.length} characters</span>
            </div>
          </div>
          <textarea
            ref={inputRef}
            className="editor-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // If find is active and Enter is pressed, navigate instead of newline
              if (showFindInInput && findInInput && e.key === 'Enter' && inputMatches.length) {
                e.preventDefault();
                findInInputTextarea(e.shiftKey ? -1 : 1);
              }
            }}
            placeholder="Paste your JSON here..."
            spellCheck={false}
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <h3>Output</h3>
            <div className="panel-actions">
              {showFindInOutput && (
                <div className="find-box">
                  <input
                    ref={outputFindRef}
                    className="find-input"
                    type="text"
                    placeholder="Find..."
                    value={findInOutput}
                    onChange={(e) => setFindInOutput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        findInOutputPre(e.shiftKey ? -1 : 1);
                      }
                    }}
                  />
                  <span className="find-count">
                    {outputMatches.length ? `${outputMatchIndex + 1}/${outputMatches.length}` : '0/0'}
                  </span>
                  <button className="btn-icon" onClick={() => findInOutputPre(-1)}>↑</button>
                  <button className="btn-icon" onClick={() => findInOutputPre(1)}>↓</button>
                </div>
              )}
              <span className="char-count">{output.length} characters</span>
            </div>
          </div>
          {output ? (
            <pre
              ref={outputRef}
              className="editor-output"
              dangerouslySetInnerHTML={{ __html: outputHtml }}
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

