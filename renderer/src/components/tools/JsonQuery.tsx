import React, { useState, useMemo, useEffect } from 'react';
import './JsonQuery.css';
import { useSettings } from '../../contexts/SettingsContext';
import { JSONPath } from 'jsonpath-plus';

const JsonQuery: React.FC = () => {
  const [jsonInput, setJsonInput] = useState(() => {
    try {
      return localStorage.getItem('jsonquery.input') || '';
    } catch {
      return '';
    }
  });
  const [query, setQuery] = useState(() => {
    try {
      return localStorage.getItem('jsonquery.query') || '$.';
    } catch {
      return '$.';
    }
  });
  const [error, setError] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jsonquery.input', jsonInput);
    } catch {}
  }, [jsonInput]);

  useEffect(() => {
    try {
      localStorage.setItem('jsonquery.query', query);
    } catch {}
  }, [query]);

  const queryResult = useMemo(() => {
    if (!jsonInput || !query) {
      return { result: null, resultStr: '', paths: [], count: 0 };
    }

    try {
      // Parse JSON
      const jsonData = JSON.parse(jsonInput);
      setJsonError('');

      try {
        // Execute JSONPath query
        const result = JSONPath({ path: query, json: jsonData, resultType: 'all' });
        
        const values = result.map((r: any) => r.value);
        const paths = result.map((r: any) => r.path);
        
        const resultStr = JSON.stringify(values, null, 2);
        
        setError('');
        return {
          result: values,
          resultStr,
          paths,
          count: values.length
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSONPath query');
        return { result: null, resultStr: '', paths: [], count: 0 };
      }
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      setError('');
      return { result: null, resultStr: '', paths: [], count: 0 };
    }
  }, [jsonInput, query]);

  const syntaxHighlight = (json: string): string => {
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

  const loadExample = (example: number) => {
    const examples = [
      {
        name: 'Basic',
        json: JSON.stringify({
          store: {
            book: [
              { title: "Book 1", price: 10.99 },
              { title: "Book 2", price: 8.99 },
              { title: "Book 3", price: 12.99 }
            ]
          }
        }, null, 2),
        query: '$.store.book[*].title'
      },
      {
        name: 'Filter',
        json: JSON.stringify({
          products: [
            { name: "Laptop", price: 999, inStock: true },
            { name: "Mouse", price: 25, inStock: false },
            { name: "Keyboard", price: 75, inStock: true }
          ]
        }, null, 2),
        query: '$.products[?(@.inStock==true)].name'
      },
      {
        name: 'Array',
        json: JSON.stringify({
          users: [
            { id: 1, name: "Alice", age: 30 },
            { id: 2, name: "Bob", age: 25 },
            { id: 3, name: "Charlie", age: 35 }
          ]
        }, null, 2),
        query: '$.users[0:2].name'
      },
      {
        name: 'Recursive',
        json: JSON.stringify({
          company: {
            departments: {
              engineering: { budget: 1000000 },
              marketing: { budget: 500000 },
              sales: { budget: 750000 }
            }
          }
        }, null, 2),
        query: '$..budget'
      }
    ];

    if (example >= 0 && example < examples.length) {
      const ex = examples[example];
      setJsonInput(ex.json);
      setQuery(ex.query);
    }
  };

  const clearAll = () => {
    setJsonInput('');
    setQuery('$.');
    setError('');
    setJsonError('');
    try {
      localStorage.removeItem('jsonquery.input');
      localStorage.removeItem('jsonquery.query');
    } catch {}
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(queryResult.resultStr);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleResultKeyDown = (e: React.KeyboardEvent) => {
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

  const copyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const { wrapLongLines } = useSettings();

  return (
    <div className={`json-query ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>JSON Query Tester</h2>
        <p className="tool-description">
          Test JSONPath queries against JSON data
        </p>
      </div>

      <div className="controls">
        <div className="query-input-group">
          <label htmlFor="query">JSONPath Query:</label>
          <div className="query-input-wrapper">
            <input
              id="query"
              type="text"
              className="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="$.path.to.data"
              spellCheck={false}
            />
            {query && (
              <button className="btn-copy-inline" onClick={copyQuery} title="Copy query">
                📋
              </button>
            )}
          </div>
        </div>

        <div className="button-group">
          <div className="examples-dropdown">
            <label>Examples:</label>
            <select onChange={(e) => loadExample(Number(e.target.value))} value="">
              <option value="">Load example...</option>
              <option value="0">📘 Basic Selection</option>
              <option value="1">🔍 Filter</option>
              <option value="2">📊 Array Slice</option>
              <option value="3">🌲 Recursive</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => setQuery('$.')}>
            Reset Query
          </button>
          <button className="btn btn-danger" onClick={clearAll}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {(error || jsonError) && (
        <div className="error-message">
          <strong>Error:</strong> {jsonError || error}
        </div>
      )}

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Results Found:</span>
          <span className="stat-value stat-results">{queryResult.count}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Query Length:</span>
          <span className="stat-value">{query.length}</span>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>JSON Input</h3>
            <span className="char-count">{jsonInput.length} characters</span>
          </div>
          <textarea
            className="editor-textarea"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"key": "value", "array": [1, 2, 3]}'
            spellCheck={false}
          />
        </div>

        <div className="results-panel">
          <div className="panel-header">
            <h3>Query Result</h3>
            <div className="panel-actions">
              {queryResult.resultStr && (
                <button className="btn-icon" onClick={copyResult}>
                  📋 Copy
                </button>
              )}
            </div>
          </div>
          <div className="result-output">
            {queryResult.resultStr ? (
              <pre 
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(queryResult.resultStr) }}
                tabIndex={0}
                onKeyDown={handleResultKeyDown}
                title="Click to select text, use Ctrl+A to select all, Ctrl+C to copy"
              />
            ) : (
              <div className="empty-state">
                {jsonInput ? 'Enter a JSONPath query to see results' : 'Enter JSON data to query'}
              </div>
            )}
          </div>
        </div>
      </div>

      {queryResult.paths.length > 0 && (
        <div className="paths-panel">
          <h3>Matched Paths ({queryResult.paths.length})</h3>
          <div className="paths-list">
            {queryResult.paths.map((path: any, idx: number) => (
              <div key={idx} className="path-item">
                <span className="path-number">#{idx + 1}</span>
                <code className="path-value">{path}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="help-panel">
        <h3>JSONPath Syntax Quick Reference</h3>
        <div className="help-grid">
          <div className="help-item">
            <code>$</code>
            <span>Root object</span>
          </div>
          <div className="help-item">
            <code>@</code>
            <span>Current object (in filters)</span>
          </div>
          <div className="help-item">
            <code>.</code> or <code>[]</code>
            <span>Child operator</span>
          </div>
          <div className="help-item">
            <code>..</code>
            <span>Recursive descent</span>
          </div>
          <div className="help-item">
            <code>*</code>
            <span>Wildcard (all elements)</span>
          </div>
          <div className="help-item">
            <code>[n]</code>
            <span>Array index</span>
          </div>
          <div className="help-item">
            <code>[start:end]</code>
            <span>Array slice</span>
          </div>
          <div className="help-item">
            <code>[?(expr)]</code>
            <span>Filter expression</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonQuery;

