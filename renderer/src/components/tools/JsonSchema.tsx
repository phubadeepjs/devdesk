import React, { useState, useEffect } from 'react';
import './JsonSchema.css';
import { useSettings } from '../../contexts/SettingsContext';

const JsonSchema: React.FC = () => {
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem('jsonschema.input') || '';
    } catch {
      return '';
    }
  });

  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jsonschema.input', input);
    } catch {}
  }, [input]);

  // Auto-generate schema when input changes
  useEffect(() => {
    if (input.trim()) {
      try {
        setError('');
        const json = JSON.parse(input);
        const schema = inferSchema(json);
        setOutput(JSON.stringify(schema, null, 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid JSON');
        setOutput('');
      }
    } else {
      setOutput('');
      setError('');
    }
  }, [input]);

  const inferSchema = (data: any): any => {
    if (data === null) {
      return { type: 'null' };
    }

    const type = Array.isArray(data) ? 'array' : typeof data;

    switch (type) {
      case 'object':
        const properties: any = {};
        const required: string[] = [];
        
        for (const key in data) {
          properties[key] = inferSchema(data[key]);
          required.push(key);
        }
        
        return {
          type: 'object',
          properties,
          required,
        };

      case 'array':
        if (data.length === 0) {
          return {
            type: 'array',
            items: {},
          };
        }
        return {
          type: 'array',
          items: inferSchema(data[0]),
        };

      case 'string':
        return { type: 'string' };

      case 'number':
        return Number.isInteger(data) ? { type: 'integer' } : { type: 'number' };

      case 'boolean':
        return { type: 'boolean' };

      default:
        return {};
    }
  };

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

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    try {
      localStorage.removeItem('jsonschema.input');
    } catch {}
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

  const { wrapLongLines } = useSettings();

  return (
    <div className={`json-schema ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>JSON Schema Generator</h2>
        <p className="tool-description">
          Generate JSON Schema from JSON data
        </p>
      </div>

      <div className="controls">
        <div className="button-group">
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
            <h3>JSON Data</h3>
            <span className="char-count">{input.length} characters</span>
          </div>
          <textarea
            className="editor-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your JSON data here..."
            spellCheck={false}
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <h3>Generated Schema</h3>
          </div>
          <div className="output-area">
            {output ? (
              <pre 
                className="output-content"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(output) }}
                tabIndex={0}
                onKeyDown={handleOutputKeyDown}
                title="Click to select text, use Ctrl+A to select all, Ctrl+C to copy"
              />
            ) : (
              <div className="empty-state">
                Generated schema will appear here...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="help-panel">
        <div
          className="help-header"
          onClick={() => setIsHelpExpanded(!isHelpExpanded)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <h3>📚 JSON Schema Quick Reference</h3>
          <span style={{ fontSize: '20px', transition: 'transform 0.3s', transform: isHelpExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </div>
        {isHelpExpanded && (
          <div className="help-content">
          <p className="help-intro">
            This tool automatically generates JSON Schema from your JSON data. The schema describes the structure and types of your data.
          </p>
          
          <div className="help-grid">
            <div className="help-item">
              <div className="help-item-header">
                <code>type</code>
                <span className="help-badge">Core</span>
              </div>
              <p>Defines the data type: <strong>string</strong>, <strong>number</strong>, <strong>integer</strong>, <strong>boolean</strong>, <strong>object</strong>, <strong>array</strong>, <strong>null</strong></p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>properties</code>
                <span className="help-badge">Objects</span>
              </div>
              <p>Defines the properties of an object. Each property has its own schema.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>required</code>
                <span className="help-badge">Objects</span>
              </div>
              <p>Array of property names that must be present in the object.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>items</code>
                <span className="help-badge">Arrays</span>
              </div>
              <p>Schema that describes the structure of items in an array.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>minimum / maximum</code>
                <span className="help-badge">Numbers</span>
              </div>
              <p>Define the minimum and maximum values for numbers and integers.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>minLength / maxLength</code>
                <span className="help-badge">Strings</span>
              </div>
              <p>Define the minimum and maximum length constraints for strings.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>pattern</code>
                <span className="help-badge">Strings</span>
              </div>
              <p>Regular expression pattern that a string must match.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>enum</code>
                <span className="help-badge">All Types</span>
              </div>
              <p>Array of allowed values. The value must match one of these.</p>
            </div>

            <div className="help-item">
              <div className="help-item-header">
                <code>format</code>
                <span className="help-badge">Strings</span>
              </div>
              <p>Semantic format: <strong>email</strong>, <strong>uri</strong>, <strong>date</strong>, <strong>date-time</strong>, <strong>ipv4</strong>, <strong>ipv6</strong>, etc.</p>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default JsonSchema;

