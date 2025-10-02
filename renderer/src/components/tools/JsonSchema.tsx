import React, { useState, useMemo, useEffect } from 'react';
import './JsonSchema.css';
import { useSettings } from '../../contexts/SettingsContext';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const JsonSchema: React.FC = () => {
  const [mode, setMode] = useState<'validate' | 'generate-schema' | 'generate-json'>('validate');
  
  // Separate state for each mode
  const [validateJson, setValidateJson] = useState(() => {
    try {
      return localStorage.getItem('jsonschema.validate.json') || '';
    } catch {
      return '';
    }
  });
  const [validateSchema, setValidateSchema] = useState(() => {
    try {
      return localStorage.getItem('jsonschema.validate.schema') || '';
    } catch {
      return '';
    }
  });
  
  const [generateSchemaInput, setGenerateSchemaInput] = useState(() => {
    try {
      return localStorage.getItem('jsonschema.generateSchema.input') || '';
    } catch {
      return '';
    }
  });
  
  const [generateJsonInput, setGenerateJsonInput] = useState(() => {
    try {
      return localStorage.getItem('jsonschema.generateJson.input') || '';
    } catch {
      return '';
    }
  });
  
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jsonschema.validate.json', validateJson);
    } catch {}
  }, [validateJson]);

  useEffect(() => {
    try {
      localStorage.setItem('jsonschema.validate.schema', validateSchema);
    } catch {}
  }, [validateSchema]);

  useEffect(() => {
    try {
      localStorage.setItem('jsonschema.generateSchema.input', generateSchemaInput);
    } catch {}
  }, [generateSchemaInput]);

  useEffect(() => {
    try {
      localStorage.setItem('jsonschema.generateJson.input', generateJsonInput);
    } catch {}
  }, [generateJsonInput]);

  // Clear output and error when mode changes
  useEffect(() => {
    setOutput('');
    setError('');
  }, [mode]);

  const ajv = useMemo(() => {
    const ajvInstance = new Ajv({ allErrors: true, verbose: true });
    addFormats(ajvInstance);
    return ajvInstance;
  }, []);

  const validateJsonData = () => {
    try {
      setError('');
      const json = JSON.parse(validateJson);
      const schema = JSON.parse(validateSchema);
      
      const validate = ajv.compile(schema);
      const valid = validate(json);

      if (valid) {
        setOutput('✅ Valid! JSON matches the schema.');
      } else {
        const errors = validate.errors?.map((err) => {
          const path = err.instancePath || '/';
          return `• ${path}: ${err.message}`;
        }).join('\n') || 'Unknown validation error';
        
        setOutput(`❌ Validation failed:\n\n${errors}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON or Schema');
      setOutput('');
    }
  };

  const generateSchema = () => {
    try {
      setError('');
      const json = JSON.parse(generateSchemaInput);
      const schema = inferSchema(json);
      setOutput(JSON.stringify(schema, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setOutput('');
    }
  };

  const generateSampleJson = () => {
    try {
      setError('');
      const schema = JSON.parse(generateJsonInput);
      const sample = generateSample(schema);
      setOutput(JSON.stringify(sample, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Schema');
      setOutput('');
    }
  };

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

  const generateSample = (schema: any): any => {
    if (!schema.type) {
      return null;
    }

    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const key in schema.properties) {
            obj[key] = generateSample(schema.properties[key]);
          }
        }
        return obj;

      case 'array':
        return schema.items ? [generateSample(schema.items)] : [];

      case 'string':
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'uri') return 'https://example.com';
        if (schema.format === 'date') return '2024-01-01';
        if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
        if (schema.enum) return schema.enum[0];
        return 'string';

      case 'number':
        return schema.minimum !== undefined ? schema.minimum : 0;

      case 'integer':
        return schema.minimum !== undefined ? schema.minimum : 0;

      case 'boolean':
        return true;

      case 'null':
        return null;

      default:
        return null;
    }
  };

  const handleExecute = () => {
    switch (mode) {
      case 'validate':
        validateJsonData();
        break;
      case 'generate-schema':
        generateSchema();
        break;
      case 'generate-json':
        generateSampleJson();
        break;
    }
  };

  const clearAll = () => {
    switch (mode) {
      case 'validate':
        setValidateJson('');
        setValidateSchema('');
        try {
          localStorage.removeItem('jsonschema.validate.json');
          localStorage.removeItem('jsonschema.validate.schema');
        } catch {}
        break;
      case 'generate-schema':
        setGenerateSchemaInput('');
        try {
          localStorage.removeItem('jsonschema.generateSchema.input');
        } catch {}
        break;
      case 'generate-json':
        setGenerateJsonInput('');
        try {
          localStorage.removeItem('jsonschema.generateJson.input');
        } catch {}
        break;
    }
    setOutput('');
    setError('');
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
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

  const { wrapLongLines } = useSettings();

  return (
    <div className={`json-schema ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>JSON Schema</h2>
        <p className="tool-description">
          Validate, generate schemas, and create sample data
        </p>
      </div>

      <div className="controls">
        <div className="mode-selector">
          <label>Mode:</label>
          <div className="mode-buttons">
            <button
              className={`mode-btn ${mode === 'validate' ? 'active' : ''}`}
              onClick={() => setMode('validate')}
            >
              ✓ Validate
            </button>
            <button
              className={`mode-btn ${mode === 'generate-schema' ? 'active' : ''}`}
              onClick={() => setMode('generate-schema')}
            >
              ⚡ Generate Schema
            </button>
            <button
              className={`mode-btn ${mode === 'generate-json' ? 'active' : ''}`}
              onClick={() => setMode('generate-json')}
            >
              📄 Generate JSON
            </button>
          </div>
        </div>

        <div className="button-group">
          <button className="btn btn-primary btn-action" onClick={handleExecute}>
            {mode === 'validate' ? '✓ Validate' : mode === 'generate-schema' ? '⚡ Generate Schema' : '📄 Generate JSON'}
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

      <div className="mode-info">
        {mode === 'validate' && (
          <p>💡 Enter JSON data and a schema to validate against</p>
        )}
        {mode === 'generate-schema' && (
          <p>💡 Enter JSON data to automatically generate a schema</p>
        )}
        {mode === 'generate-json' && (
          <p>💡 Enter a schema to generate sample JSON data</p>
        )}
      </div>

      <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>
              {mode === 'validate' && 'JSON Data'}
              {mode === 'generate-schema' && 'JSON Data'}
              {mode === 'generate-json' && 'JSON Schema'}
            </h3>
            <span className="char-count">
              {mode === 'validate' && `${validateJson.length} characters`}
              {mode === 'generate-schema' && `${generateSchemaInput.length} characters`}
              {mode === 'generate-json' && `${generateJsonInput.length} characters`}
            </span>
          </div>
          {mode === 'validate' && (
            <textarea
              className="editor-textarea"
              value={validateJson}
              onChange={(e) => setValidateJson(e.target.value)}
              placeholder="Paste your JSON data here..."
              spellCheck={false}
            />
          )}
          {mode === 'generate-schema' && (
            <textarea
              className="editor-textarea"
              value={generateSchemaInput}
              onChange={(e) => setGenerateSchemaInput(e.target.value)}
              placeholder="Paste your JSON data here..."
              spellCheck={false}
            />
          )}
          {mode === 'generate-json' && (
            <textarea
              className="editor-textarea"
              value={generateJsonInput}
              onChange={(e) => setGenerateJsonInput(e.target.value)}
              placeholder="Paste your JSON Schema here..."
              spellCheck={false}
            />
          )}
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <h3>
              {mode === 'validate' && 'JSON Schema'}
              {mode === 'generate-schema' && 'Generated Schema'}
              {mode === 'generate-json' && 'Sample JSON'}
            </h3>
            <div className="panel-actions">
              {mode === 'validate' && (
                <span className="char-count">{validateSchema.length} characters</span>
              )}
              {(mode === 'generate-schema' || mode === 'generate-json') && output && (
                <button className="btn-icon" onClick={copyOutput} title="Copy output">
                  📋 Copy
                </button>
              )}
            </div>
          </div>
          {mode === 'validate' ? (
            <textarea
              className="editor-textarea"
              value={validateSchema}
              onChange={(e) => setValidateSchema(e.target.value)}
              placeholder="Paste your JSON Schema here..."
              spellCheck={false}
            />
          ) : (
            <div className="output-area">
              {output ? (
                <pre 
                  className="output-content"
                  tabIndex={0}
                  onKeyDown={handleOutputKeyDown}
                  title="Click to select text, use Ctrl+A to select all, Ctrl+C to copy"
                >
                  {output}
                </pre>
              ) : (
                <div className="empty-state">
                  {mode === 'generate-schema' ? 'Generated schema will appear here' : 'Sample JSON will appear here'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {mode === 'validate' && output && (
        <div className={`validation-result ${output.startsWith('✅') ? 'success' : 'error'}`}>
          <pre>{output}</pre>
        </div>
      )}

      <div className="help-panel">
        <h3>JSON Schema Quick Reference</h3>
        <div className="help-grid">
          <div className="help-item">
            <code>type</code>
            <span>string, number, integer, boolean, object, array, null</span>
          </div>
          <div className="help-item">
            <code>properties</code>
            <span>Define object properties</span>
          </div>
          <div className="help-item">
            <code>required</code>
            <span>Array of required property names</span>
          </div>
          <div className="help-item">
            <code>items</code>
            <span>Schema for array items</span>
          </div>
          <div className="help-item">
            <code>minimum/maximum</code>
            <span>Numeric constraints</span>
          </div>
          <div className="help-item">
            <code>minLength/maxLength</code>
            <span>String length constraints</span>
          </div>
          <div className="help-item">
            <code>pattern</code>
            <span>Regex pattern for strings</span>
          </div>
          <div className="help-item">
            <code>enum</code>
            <span>Array of allowed values</span>
          </div>
          <div className="help-item">
            <code>format</code>
            <span>email, uri, date, date-time, etc.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonSchema;

