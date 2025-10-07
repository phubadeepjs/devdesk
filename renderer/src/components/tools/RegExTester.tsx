import React, { useState, useMemo, useEffect } from 'react';
import './RegExTester.css';
import { useSettings } from '../../contexts/SettingsContext';

interface Match {
  fullMatch: string;
  groups: string[];
  index: number;
}

const RegExTester: React.FC = () => {
  const [pattern, setPattern] = useState(() => {
    try {
      return localStorage.getItem('regex.pattern') || '';
    } catch {
      return '';
    }
  });
  const [testText, setTestText] = useState(() => {
    try {
      return localStorage.getItem('regex.testText') || '';
    } catch {
      return '';
    }
  });
  const [flags, setFlags] = useState(() => {
    try {
      return localStorage.getItem('regex.flags') || 'g';
    } catch {
      return 'g';
    }
  });
  const [error, setError] = useState('');
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('regex.pattern', pattern);
    } catch {}
  }, [pattern]);

  useEffect(() => {
    try {
      localStorage.setItem('regex.testText', testText);
    } catch {}
  }, [testText]);

  useEffect(() => {
    try {
      localStorage.setItem('regex.flags', flags);
    } catch {}
  }, [flags]);

  const regexResult = useMemo(() => {
    if (!pattern || !testText) {
      return { matches: [], isValid: true, highlightedText: testText };
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches: Match[] = [];
      let match;

      // Get all matches
      if (flags.includes('g')) {
        const tempRegex = new RegExp(pattern, flags);
        while ((match = tempRegex.exec(testText)) !== null) {
          matches.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index
          });
          // Prevent infinite loop on zero-length matches
          if (match.index === tempRegex.lastIndex) {
            tempRegex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(testText);
        if (match) {
          matches.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index
          });
        }
      }

      // Create highlighted text
      let highlightedText = testText;
      if (matches.length > 0) {
        let offset = 0;
        const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
        
        sortedMatches.forEach((m, idx) => {
          const start = m.index + offset;
          const end = start + m.fullMatch.length;
          const before = highlightedText.slice(0, start);
          const matched = highlightedText.slice(start, end);
          const after = highlightedText.slice(end);
          
          highlightedText = `${before}<span class="regex-match" data-match="${idx + 1}">${matched}</span>${after}`;
          offset += `<span class="regex-match" data-match="${idx + 1}"></span>`.length;
        });
      }

      setError('');
      return { matches, isValid: true, highlightedText };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid regular expression');
      return { matches: [], isValid: false, highlightedText: testText };
    }
  }, [pattern, testText, flags]);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const clearAll = () => {
    setPattern('');
    setTestText('');
    setFlags('g');
    setError('');
    try {
      localStorage.removeItem('regex.pattern');
      localStorage.removeItem('regex.testText');
      localStorage.removeItem('regex.flags');
    } catch {}
  };

  const handleHighlightedKeyDown = (e: React.KeyboardEvent) => {
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

  const loadExample = (example: number) => {
    const examples = [
      {
        name: 'Email',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        text: 'Contact us at support@example.com or info@test.org for more information.'
      },
      {
        name: 'Phone',
        pattern: '\\d{3}-\\d{3}-\\d{4}',
        text: 'Call me at 555-123-4567 or 555-987-6543'
      },
      {
        name: 'URL',
        pattern: 'https?://[^\\s]+',
        text: 'Visit https://example.com or http://test.org for details'
      },
      {
        name: 'Date',
        pattern: '\\d{4}-\\d{2}-\\d{2}',
        text: 'Events on 2024-01-15 and 2024-12-25'
      }
    ];

    if (example >= 0 && example < examples.length) {
      const ex = examples[example];
      setPattern(ex.pattern);
      setTestText(ex.text);
      setFlags('g');
    }
  };

  const { wrapLongLines } = useSettings();

  return (
    <div className={`regex-tester ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>RegEx Tester</h2>
        <p className="tool-description">
          Test and debug regular expressions with live highlighting
        </p>
      </div>

      <div className="controls">
        <div className="pattern-input-group">
          <label htmlFor="pattern">Pattern:</label>
          <div className="pattern-row">
            <div className="pattern-wrapper">
              <span className="pattern-prefix">/</span>
              <input
                id="pattern"
                type="text"
                className="pattern-input"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                onCopy={(e) => {
                  e.preventDefault();
                  const fullPattern = `/${pattern}/${flags}`;
                  navigator.clipboard.writeText(fullPattern);
                }}
                placeholder="Enter regex pattern..."
                spellCheck={false}
              />
              <span className="pattern-suffix">/{flags}</span>
            </div>
          </div>
        </div>

        <div className="flags-group">
          <label>Flags:</label>
          <div className="flags-buttons">
            <button
              className={`flag-btn ${flags.includes('g') ? 'active' : ''}`}
              onClick={() => toggleFlag('g')}
              title="Global - Find all matches"
            >
              g
            </button>
            <button
              className={`flag-btn ${flags.includes('i') ? 'active' : ''}`}
              onClick={() => toggleFlag('i')}
              title="Case Insensitive"
            >
              i
            </button>
            <button
              className={`flag-btn ${flags.includes('m') ? 'active' : ''}`}
              onClick={() => toggleFlag('m')}
              title="Multiline - ^ and $ match line breaks"
            >
              m
            </button>
            <button
              className={`flag-btn ${flags.includes('s') ? 'active' : ''}`}
              onClick={() => toggleFlag('s')}
              title="Dot All - . matches newline"
            >
              s
            </button>
            <button
              className={`flag-btn ${flags.includes('u') ? 'active' : ''}`}
              onClick={() => toggleFlag('u')}
              title="Unicode"
            >
              u
            </button>
            <button
              className={`flag-btn ${flags.includes('y') ? 'active' : ''}`}
              onClick={() => toggleFlag('y')}
              title="Sticky - Match from lastIndex"
            >
              y
            </button>
          </div>
        </div>

        <div className="button-group">
          <div className="examples-dropdown">
            <label>Examples:</label>
            <select onChange={(e) => loadExample(Number(e.target.value))} value="">
              <option value="">Load example...</option>
              <option value="0">📧 Email</option>
              <option value="1">📱 Phone</option>
              <option value="2">🌐 URL</option>
              <option value="3">📅 Date</option>
            </select>
          </div>
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

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Matches:</span>
          <span className="stat-value stat-matches">{regexResult.matches.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Pattern Length:</span>
          <span className="stat-value">{pattern.length}</span>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Test Text</h3>
            <span className="char-count">{testText.length} characters</span>
          </div>
          <textarea
            className="editor-textarea"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test against the pattern..."
            spellCheck={false}
          />
        </div>

        <div className="results-panel">
          <div className="panel-header">
            <h3>Highlighted Results</h3>
          </div>
          <div className="highlighted-text">
            {testText ? (
              <pre 
                dangerouslySetInnerHTML={{ __html: regexResult.highlightedText }}
                tabIndex={0}
                onKeyDown={handleHighlightedKeyDown}
                title="Click to select text, use Ctrl+A to select all, Ctrl+C to copy"
              />
            ) : (
              <div className="empty-state">Enter text to see matches highlighted</div>
            )}
          </div>
        </div>
      </div>

      {regexResult.matches.length > 0 && (
        <div className="matches-panel">
          <div className="matches-panel-header">
            <h3>Matches Detail</h3>
          </div>
          <div className="matches-list">
            {regexResult.matches.map((match, idx) => (
              <div key={idx} className="match-item">
                <div className="match-header">
                  <span className="match-number">Match {idx + 1}</span>
                  <span className="match-index">Index: {match.index}</span>
                </div>
                <div className="match-content">
                  <code>{match.fullMatch}</code>
                </div>
                {match.groups.length > 0 && (
                  <div className="match-groups">
                    <span className="groups-label">Groups:</span>
                    {match.groups.map((group, gIdx) => (
                      <code key={gIdx} className="group-item">
                        ${gIdx + 1}: {group || '(empty)'}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper Section */}
      <div className="help-panel">
        <div
          className="help-header"
          onClick={() => setIsHelpExpanded(!isHelpExpanded)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3>🔍 RegEx Syntax Quick Reference</h3>
          <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isHelpExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
        {isHelpExpanded && (
          <div className="help-content">
            <div className="help-grid">
              <div className="help-item">
                <div className="help-item-header">
                  <code>.</code>
                  <span className="help-badge">Character</span>
                </div>
                <p>Matches any single character except newline</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>\d</code>
                  <span className="help-badge">Character</span>
                </div>
                <p>Matches any digit (0-9)</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>\w</code>
                  <span className="help-badge">Character</span>
                </div>
                <p>Matches any word character (a-z, A-Z, 0-9, _)</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>\s</code>
                  <span className="help-badge">Character</span>
                </div>
                <p>Matches any whitespace character</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>^</code>
                  <span className="help-badge">Anchor</span>
                </div>
                <p>Matches the start of a line</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>$</code>
                  <span className="help-badge">Anchor</span>
                </div>
                <p>Matches the end of a line</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>*</code>
                  <span className="help-badge">Quantifier</span>
                </div>
                <p>Matches 0 or more times</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>+</code>
                  <span className="help-badge">Quantifier</span>
                </div>
                <p>Matches 1 or more times</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>?</code>
                  <span className="help-badge">Quantifier</span>
                </div>
                <p>Matches 0 or 1 time</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>{'{n}'}</code>
                  <span className="help-badge">Quantifier</span>
                </div>
                <p>Matches exactly n times</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>{'{n,m}'}</code>
                  <span className="help-badge">Quantifier</span>
                </div>
                <p>Matches between n and m times</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>[abc]</code>
                  <span className="help-badge">Set</span>
                </div>
                <p>Matches any character in the set</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>[^abc]</code>
                  <span className="help-badge">Set</span>
                </div>
                <p>Matches any character NOT in the set</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>(abc)</code>
                  <span className="help-badge">Group</span>
                </div>
                <p>Capturing group</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>(?:abc)</code>
                  <span className="help-badge">Group</span>
                </div>
                <p>Non-capturing group</p>
              </div>

              <div className="help-item">
                <div className="help-item-header">
                  <code>a|b</code>
                  <span className="help-badge">Alternation</span>
                </div>
                <p>Matches a or b</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(74, 158, 255, 0.1)', borderRadius: '6px', borderLeft: '3px solid #4a9eff' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#4a9eff' }}>Flags:</h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div><code>g</code> - Global: Find all matches</div>
                <div><code>i</code> - Case insensitive</div>
                <div><code>m</code> - Multiline: ^ and $ match line boundaries</div>
                <div><code>s</code> - Dot all: . matches newline</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegExTester;

