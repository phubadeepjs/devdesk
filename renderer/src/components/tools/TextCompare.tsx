import React, { useState, useMemo, useEffect, useRef } from 'react';
import './TextCompare.css';
import { useSettings } from '../../contexts/SettingsContext';

interface DiffLine {
  type: 'equal' | 'added' | 'removed';
  leftLine?: string;
  rightLine?: string;
  leftLineNumber?: number;
  rightLineNumber?: number;
  index?: number; // Original index in diffResults
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

  const diffResults = useMemo(() => {
    const leftLines = leftText.split('\n');
    const rightLines = rightText.split('\n');
    const results: DiffLine[] = [];

    if (leftLines.length === 0 && rightLines.length === 0) {
      return results;
    }

    const dp = computeLCS(leftLines, rightLines);
    let i = leftLines.length;
    let j = rightLines.length;

    const diffs: DiffLine[] = [];

    while (i > 0 || j > 0) {
      const leftLine = i > 0 ? leftLines[i - 1] : '';
      const rightLine = j > 0 ? rightLines[j - 1] : '';
      const leftProcessed = processText(leftLine);
      const rightProcessed = processText(rightLine);

      if (i > 0 && j > 0 && leftProcessed === rightProcessed) {
        diffs.unshift({
          type: 'equal',
          leftLine,
          rightLine,
          leftLineNumber: i,
          rightLineNumber: j
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diffs.unshift({
          type: 'added',
          rightLine,
          rightLineNumber: j
        });
        j--;
      } else if (i > 0) {
        diffs.unshift({
          type: 'removed',
          leftLine,
          leftLineNumber: i
        });
        i--;
      }
    }

    return diffs;
  }, [leftText, rightText, ignoreCase, ignoreWhitespace]);

  const stats = useMemo(() => {
    const added = diffResults.filter(d => d.type === 'added').length;
    const removed = diffResults.filter(d => d.type === 'removed').length;
    const equal = diffResults.filter(d => d.type === 'equal').length;

    return { added, removed, equal };
  }, [diffResults]);

  // Get only the diff lines (added/removed) with their original indices
  const diffOnlyLines = useMemo(() => {
    return diffResults
      .map((diff, idx) => ({ ...diff, index: idx }))
      .filter(d => d.type === 'added' || d.type === 'removed');
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
              {diffResults.map((diff, index) => {
                const isDiff = diff.type === 'added' || diff.type === 'removed';
                return (
                  <div 
                    key={index} 
                    className={`diff-line diff-${diff.type}`}
                    ref={(el) => {
                      if (el && isDiff) {
                        diffRefsMap.current.set(index, el);
                      } else if (!isDiff) {
                        diffRefsMap.current.delete(index);
                      }
                    }}
                  >
                    <div className="line-number left-num">
                      {diff.leftLineNumber || ''}
                    </div>
                    <div className="line-content left">
                      {diff.leftLine !== undefined ? diff.leftLine : ''}
                    </div>
                    <div className="line-indicator">
                      {diff.type === 'equal' && '='}
                      {diff.type === 'added' && '+'}
                      {diff.type === 'removed' && '-'}
                    </div>
                    <div className="line-number right-num">
                      {diff.rightLineNumber || ''}
                    </div>
                    <div className="line-content right">
                      {diff.rightLine !== undefined ? diff.rightLine : ''}
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

