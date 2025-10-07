import React, { useState, useMemo, useEffect, useRef } from 'react';
import './TextCompare.css';
import { useSettings } from '../../contexts/SettingsContext';

interface DiffRow {
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftContent?: string;
  rightContent?: string;
  leftHtml?: string;
  rightHtml?: string;
  type: 'equal' | 'added' | 'removed' | 'modified';
  index: number;
}

const TextCompare: React.FC = () => {
  // Load state from localStorage
  const [leftText, setLeftText] = useState(() => {
    try {
      return localStorage.getItem('tc.leftText') || '';
    } catch {
      return '';
    }
  });
  const [rightText, setRightText] = useState(() => {
    try {
      return localStorage.getItem('tc.rightText') || '';
    } catch {
      return '';
    }
  });
  const [ignoreCase, setIgnoreCase] = useState(() => {
    try {
      const stored = localStorage.getItem('tc.ignoreCase');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(() => {
    try {
      const stored = localStorage.getItem('tc.ignoreWhitespace');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [currentDiffIndex, setCurrentDiffIndex] = useState(0);
  const diffRefsMap = useRef<Map<number, HTMLDivElement>>(new Map());

  const processText = (text: string): string => {
    let processed = text;
    if (ignoreWhitespace) {
      // Remove ALL whitespace characters (spaces, tabs, newlines, etc.)
      processed = processed.replace(/\s+/g, '');
    }
    if (ignoreCase) {
      processed = processed.toLowerCase();
    }
    return processed;
  };

  // LCS (Longest Common Subsequence) algorithm for better diff
  const computeLCS = (left: string[], right: string[]): number[][] => {
    const m = left.length;
    const n = right.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const leftProcessed = processText(left[i - 1]);
        const rightProcessed = processText(right[j - 1]);

        if (leftProcessed === rightProcessed) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  };

  // Character-level LCS for inline diff
  const computeCharLCS = (left: string, right: string): number[][] => {
    const m = left.length;
    const n = right.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const leftChar = ignoreCase ? left[i - 1].toLowerCase() : left[i - 1];
        const rightChar = ignoreCase ? right[j - 1].toLowerCase() : right[j - 1];

        if (leftChar === rightChar) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp;
  };

  // Generate inline diff HTML for two strings using word-aware diff
  const getInlineDiff = (leftStr: string, rightStr: string): { leftHtml: string; rightHtml: string } => {
    // Try word-level diff first for better results
    const wordBoundaryRegex = /(\s+|[^\w\s]+)/g;

    const leftTokens = leftStr.split(wordBoundaryRegex).filter(t => t.length > 0);
    const rightTokens = rightStr.split(wordBoundaryRegex).filter(t => t.length > 0);

    // If strings are very different or very short, use character-level diff
    if (leftTokens.length < 3 || rightTokens.length < 3) {
      return getCharLevelDiff(leftStr, rightStr);
    }

    // Compute LCS for tokens
    const tokenDp: number[][] = Array(leftTokens.length + 1).fill(null).map(() => Array(rightTokens.length + 1).fill(0));

    for (let i = 1; i <= leftTokens.length; i++) {
      for (let j = 1; j <= rightTokens.length; j++) {
        const leftToken = ignoreCase ? leftTokens[i - 1].toLowerCase() : leftTokens[i - 1];
        const rightToken = ignoreCase ? rightTokens[j - 1].toLowerCase() : rightTokens[j - 1];

        if (leftToken === rightToken) {
          tokenDp[i][j] = tokenDp[i - 1][j - 1] + 1;
        } else {
          tokenDp[i][j] = Math.max(tokenDp[i - 1][j], tokenDp[i][j - 1]);
        }
      }
    }

    // Backtrack to find diff
    let i = leftTokens.length;
    let j = rightTokens.length;
    const leftParts: Array<{ text: string; type: 'equal' | 'removed' }> = [];
    const rightParts: Array<{ text: string; type: 'equal' | 'added' }> = [];

    while (i > 0 || j > 0) {
      const leftToken = i > 0 ? leftTokens[i - 1] : '';
      const rightToken = j > 0 ? rightTokens[j - 1] : '';
      const leftTokenProcessed = ignoreCase && leftToken ? leftToken.toLowerCase() : leftToken;
      const rightTokenProcessed = ignoreCase && rightToken ? rightToken.toLowerCase() : rightToken;

      if (i > 0 && j > 0 && leftTokenProcessed === rightTokenProcessed) {
        leftParts.unshift({ text: leftToken, type: 'equal' });
        rightParts.unshift({ text: rightToken, type: 'equal' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || tokenDp[i][j - 1] >= tokenDp[i - 1][j])) {
        rightParts.unshift({ text: rightToken, type: 'added' });
        j--;
      } else if (i > 0) {
        leftParts.unshift({ text: leftToken, type: 'removed' });
        i--;
      }
    }

    // Merge consecutive characters of same type
    const mergeHtml = (parts: Array<{ text: string; type: string }>): string => {
      const merged: Array<{ text: string; type: string }> = [];
      for (const part of parts) {
        if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
          merged[merged.length - 1].text += part.text;
        } else {
          merged.push({ ...part });
        }
      }
      return merged.map(p => {
        const escaped = p.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        if (p.type === 'removed') {
          return `<span class="char-removed">${escaped}</span>`;
        } else if (p.type === 'added') {
          return `<span class="char-added">${escaped}</span>`;
        }
        return escaped;
      }).join('');
    };

    return {
      leftHtml: mergeHtml(leftParts),
      rightHtml: mergeHtml(rightParts)
    };
  };

  // Character-level diff (fallback)
  const getCharLevelDiff = (leftStr: string, rightStr: string): { leftHtml: string; rightHtml: string } => {
    const dp = computeCharLCS(leftStr, rightStr);
    let i = leftStr.length;
    let j = rightStr.length;

    const leftParts: Array<{ text: string; type: 'equal' | 'removed' }> = [];
    const rightParts: Array<{ text: string; type: 'equal' | 'added' }> = [];

    while (i > 0 || j > 0) {
      const leftChar = i > 0 ? leftStr[i - 1] : '';
      const rightChar = j > 0 ? rightStr[j - 1] : '';
      const leftCharProcessed = ignoreCase && leftChar ? leftChar.toLowerCase() : leftChar;
      const rightCharProcessed = ignoreCase && rightChar ? rightChar.toLowerCase() : rightChar;

      if (i > 0 && j > 0 && leftCharProcessed === rightCharProcessed) {
        leftParts.unshift({ text: leftChar, type: 'equal' });
        rightParts.unshift({ text: rightChar, type: 'equal' });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        rightParts.unshift({ text: rightChar, type: 'added' });
        j--;
      } else if (i > 0) {
        leftParts.unshift({ text: leftChar, type: 'removed' });
        i--;
      }
    }

    // Merge consecutive characters of same type
    const mergeHtml = (parts: Array<{ text: string; type: string }>): string => {
      const merged: Array<{ text: string; type: string }> = [];
      for (const part of parts) {
        if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
          merged[merged.length - 1].text += part.text;
        } else {
          merged.push({ ...part });
        }
      }
      return merged.map(p => {
        const escaped = p.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        if (p.type === 'removed') {
          return `<span class="char-removed">${escaped}</span>`;
        } else if (p.type === 'added') {
          return `<span class="char-added">${escaped}</span>`;
        }
        return escaped;
      }).join('');
    };

    return {
      leftHtml: mergeHtml(leftParts),
      rightHtml: mergeHtml(rightParts)
    };
  };

  const diffResults = useMemo(() => {
    const leftLines = leftText.split('\n');
    const rightLines = rightText.split('\n');

    if (leftLines.length === 0 && rightLines.length === 0) {
      return [];
    }

    const dp = computeLCS(leftLines, rightLines);
    let i = leftLines.length;
    let j = rightLines.length;

    const rows: DiffRow[] = [];
    let rowIndex = 0;

    // Calculate similarity score between two lines (0-1)
    const getSimilarity = (line1: string, line2: string): number => {
      if (!line1 && !line2) return 1;
      if (!line1 || !line2) return 0;

      const charDp = computeCharLCS(line1, line2);
      const lcsLength = charDp[line1.length][line2.length];
      const maxLength = Math.max(line1.length, line2.length);
      return maxLength > 0 ? lcsLength / maxLength : 0;
    };

    while (i > 0 || j > 0) {
      const leftLine = i > 0 ? leftLines[i - 1] : '';
      const rightLine = j > 0 ? rightLines[j - 1] : '';
      const leftProcessed = processText(leftLine);
      const rightProcessed = processText(rightLine);

      if (i > 0 && j > 0 && leftProcessed === rightProcessed) {
        // Lines are exactly equal - show on same row
        rows.unshift({
          leftLineNumber: i,
          rightLineNumber: j,
          leftContent: leftLine,
          rightContent: rightLine,
          type: 'equal',
          index: rowIndex++
        });
        i--;
        j--;
      } else if (i > 0 && j > 0) {
        // Both lines exist but are different
        const similarity = getSimilarity(leftLine, rightLine);

        if (similarity > 0.4) {
          // Lines are similar - show as modified on same row with inline diff
          const { leftHtml, rightHtml } = getInlineDiff(leftLine, rightLine);
          rows.unshift({
            leftLineNumber: i,
            rightLineNumber: j,
            leftContent: leftLine,
            rightContent: rightLine,
            leftHtml,
            rightHtml,
            type: 'modified',
            index: rowIndex++
          });
          i--;
          j--;
        } else {
          // Lines are too different - decide which to show based on LCS
          if (dp[i - 1][j] >= dp[i][j - 1]) {
            // Show removed line on left, empty on right
            rows.unshift({
              leftLineNumber: i,
              leftContent: leftLine,
              type: 'removed',
              index: rowIndex++
            });
            i--;
          } else {
            // Show added line on right, empty on left
            rows.unshift({
              rightLineNumber: j,
              rightContent: rightLine,
              type: 'added',
              index: rowIndex++
            });
            j--;
          }
        }
      } else if (j > 0) {
        // Only right line exists - added
        rows.unshift({
          rightLineNumber: j,
          rightContent: rightLine,
          type: 'added',
          index: rowIndex++
        });
        j--;
      } else if (i > 0) {
        // Only left line exists - removed
        rows.unshift({
          leftLineNumber: i,
          leftContent: leftLine,
          type: 'removed',
          index: rowIndex++
        });
        i--;
      }
    }

    return rows;
  }, [leftText, rightText, ignoreCase, ignoreWhitespace]);

  const stats = useMemo(() => {
    const added = diffResults.filter(d => d.type === 'added').length;
    const removed = diffResults.filter(d => d.type === 'removed').length;
    const modified = diffResults.filter(d => d.type === 'modified').length;
    const equal = diffResults.filter(d => d.type === 'equal').length;

    return { added, removed, modified, equal };
  }, [diffResults]);

  // Get only the diff lines (added/removed/modified) with their original indices
  const diffOnlyLines = useMemo(() => {
    return diffResults.filter(d => d.type === 'added' || d.type === 'removed' || d.type === 'modified');
  }, [diffResults]);

  // Reset current diff index when diff results change
  useEffect(() => {
    setCurrentDiffIndex(0);
  }, [diffResults]);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tc.leftText', leftText);
    } catch {}
  }, [leftText]);

  useEffect(() => {
    try {
      localStorage.setItem('tc.rightText', rightText);
    } catch {}
  }, [rightText]);

  useEffect(() => {
    try {
      localStorage.setItem('tc.ignoreCase', String(ignoreCase));
    } catch {}
  }, [ignoreCase]);

  useEffect(() => {
    try {
      localStorage.setItem('tc.ignoreWhitespace', String(ignoreWhitespace));
    } catch {}
  }, [ignoreWhitespace]);

  const clearAll = () => {
    setLeftText('');
    setRightText('');
    try {
      localStorage.removeItem('tc.leftText');
      localStorage.removeItem('tc.rightText');
    } catch {}
  };

  const swapTexts = () => {
    const temp = leftText;
    setLeftText(rightText);
    setRightText(temp);
  };

  const scrollToDiff = (index: number) => {
    if (index < 0 || index >= diffOnlyLines.length) return;
    
    const diffLine = diffOnlyLines[index];
    if (diffLine && diffLine.index !== undefined) {
      const element = diffRefsMap.current.get(diffLine.index);
      const container = document.querySelector('.diff-results');
      
      if (element && container) {
        // Calculate the position to scroll to
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        
        // Calculate the offset to center the element in the container
        const offset = (elementRect.top - containerRect.top) + scrollTop - (containerRect.height / 2) + (elementRect.height / 2);
        
        // Smooth scroll within the container
        container.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
        
        // Add a highlight effect
        element.classList.add('diff-highlight');
        setTimeout(() => {
          element.classList.remove('diff-highlight');
        }, 1500);
      }
    }
  };

  const goToNextDiff = () => {
    if (diffOnlyLines.length === 0) return;
    const nextIndex = (currentDiffIndex + 1) % diffOnlyLines.length;
    setCurrentDiffIndex(nextIndex);
    scrollToDiff(nextIndex);
  };

  const goToPreviousDiff = () => {
    if (diffOnlyLines.length === 0) return;
    const prevIndex = currentDiffIndex === 0 ? diffOnlyLines.length - 1 : currentDiffIndex - 1;
    setCurrentDiffIndex(prevIndex);
    scrollToDiff(prevIndex);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextDiff();
      } else if (e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        goToPreviousDiff();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDiffIndex, diffOnlyLines]);

  const { wrapLongLines } = useSettings();
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('tc.splitRatio');
      const n = stored ? Number(stored) : 0.5;
      return isFinite(n) && n > 0.15 && n < 0.85 ? n : 0.5;
    } catch {
      return 0.5;
    }
  });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const container = document.getElementById('tc-compare-body');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = Math.min(0.85, Math.max(0.15, y / rect.height));
      setSplitRatio(ratio);
    };
    const handleUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        try { localStorage.setItem('tc.splitRatio', String(splitRatio)); } catch {}
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [splitRatio]);
  return (
    <div className={`text-compare ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>Text Compare</h2>
        <p className="tool-description">
          Compare two texts and highlight differences
        </p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            Ignore Case
          </label>
          <label>
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            Ignore Whitespace
          </label>
        </div>

        <div className="button-group">
          <button className="btn btn-secondary" onClick={swapTexts}>
            ⇄ Swap
          </button>
          <button className="btn btn-danger" onClick={clearAll}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Equal:</span>
          <span className="stat-value stat-equal">{stats.equal}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Modified:</span>
          <span className="stat-value stat-modified">{stats.modified}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Added:</span>
          <span className="stat-value stat-added">{stats.added}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Removed:</span>
          <span className="stat-value stat-removed">{stats.removed}</span>
        </div>
      </div>

      <div
        id="tc-compare-body"
        className="compare-body"
        style={{ gridTemplateRows: `${splitRatio * 100}% 8px ${100 - splitRatio * 100}%` }}
      >
        <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Original Text</h3>
            <div className="panel-actions">
              <span className="char-count">{leftText.length} chars, {leftText.split('\n').length} lines</span>
            </div>
          </div>
          <textarea
            className="editor-textarea"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            placeholder="Enter original text here..."
            spellCheck={false}
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <h3>Modified Text</h3>
            <div className="panel-actions">
              <span className="char-count">{rightText.length} chars, {rightText.split('\n').length} lines</span>
            </div>
          </div>
          <textarea
            className="editor-textarea"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            placeholder="Enter modified text here..."
            spellCheck={false}
          />
        </div>
        </div>

        <div
          className="resizer-horizontal"
          onMouseDown={() => { isDraggingRef.current = true; }}
          title="Drag to resize"
        />

        <div className="diff-container">
        <div className="diff-header">
          <div className="diff-header-left">
            <h3>Comparison Results</h3>
            {diffOnlyLines.length > 0 && (
              <span className="diff-count">
                {diffOnlyLines.length} diff{diffOnlyLines.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
          {diffOnlyLines.length > 0 && (
            <div className="diff-navigation">
              <span className="diff-position">
                {currentDiffIndex + 1} / {diffOnlyLines.length}
              </span>
              <button 
                className="btn-nav" 
                onClick={goToPreviousDiff}
                title="Previous diff (Shift + ↑)"
              >
                ↑ Prev
              </button>
              <button 
                className="btn-nav" 
                onClick={goToNextDiff}
                title="Next diff (Shift + ↓)"
              >
                ↓ Next
              </button>
            </div>
          )}
        </div>
        <div className="diff-results">
          {diffResults.length === 0 ? (
            <div className="empty-state">
              Enter text in both panels to compare
            </div>
          ) : (
            <div className="diff-lines">
              {diffResults.map((row) => {
                const isDiff = row.type === 'added' || row.type === 'removed' || row.type === 'modified';
                return (
                  <div
                    key={row.index}
                    className={`diff-row diff-${row.type}`}
                    ref={(el) => {
                      if (el && isDiff) {
                        diffRefsMap.current.set(row.index, el);
                      } else if (!isDiff) {
                        diffRefsMap.current.delete(row.index);
                      }
                    }}
                  >
                    <div className="line-number left-num">
                      {row.leftLineNumber || ''}
                    </div>
                    <div className={`line-content left ${row.type === 'removed' || row.type === 'modified' ? 'has-content' : ''}`}>
                      {row.type === 'modified' && row.leftHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: row.leftHtml }} />
                      ) : (
                        row.leftContent || ''
                      )}
                    </div>
                    <div className="line-number right-num">
                      {row.rightLineNumber || ''}
                    </div>
                    <div className={`line-content right ${row.type === 'added' || row.type === 'modified' ? 'has-content' : ''}`}>
                      {row.type === 'modified' && row.rightHtml ? (
                        <span dangerouslySetInnerHTML={{ __html: row.rightHtml }} />
                      ) : (
                        row.rightContent || ''
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default TextCompare;

