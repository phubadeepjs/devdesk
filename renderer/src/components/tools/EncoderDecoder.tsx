import React, { useState } from 'react';
import './EncoderDecoder.css';

type EncodingType = 'base64' | 'url' | 'uri' | 'html' | 'escape';

const EncoderDecoder: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encodingType, setEncodingType] = useState<EncodingType>('base64');
  const [error, setError] = useState('');

  const handleEncode = (text: string, type: EncodingType) => {
    try {
      setError('');
      let result = '';
      
      switch (type) {
        case 'base64':
          result = btoa(unescape(encodeURIComponent(text)));
          break;
        case 'url':
          result = encodeURIComponent(text);
          break;
        case 'uri':
          result = encodeURI(text);
          break;
        case 'html':
          result = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
          break;
        case 'escape':
          result = text
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/"/g, '\\"')
            .replace(/'/g, "\\'");
          break;
      }
      
      setOutput(result);
    } catch (err) {
      setError('Encoding failed: ' + (err as Error).message);
      setOutput('');
    }
  };

  const handleDecode = (text: string, type: EncodingType) => {
    try {
      setError('');
      let result = '';
      
      switch (type) {
        case 'base64':
          result = decodeURIComponent(escape(atob(text)));
          break;
        case 'url':
          result = decodeURIComponent(text);
          break;
        case 'uri':
          result = decodeURI(text);
          break;
        case 'html':
          result = text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
          break;
        case 'escape':
          result = text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, '\\');
          break;
      }
      
      setOutput(result);
    } catch (err) {
      setError('Decoding failed: ' + (err as Error).message);
      setOutput('');
    }
  };

  const handleProcess = () => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    if (mode === 'encode') {
      handleEncode(input, encodingType);
    } else {
      handleDecode(input, encodingType);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setError('');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  React.useEffect(() => {
    handleProcess();
  }, [input, mode, encodingType]);

  return (
    <div className="encoder-decoder">
      <div className="tool-header">
        <h2>🔐 Encoder/Decoder</h2>
        <p className="tool-description">
          Encode and decode text using various formats
        </p>
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Mode:</label>
          <div className="mode-toggle">
            <button
              className={mode === 'encode' ? 'active' : ''}
              onClick={() => setMode('encode')}
            >
              Encode
            </button>
            <button
              className={mode === 'decode' ? 'active' : ''}
              onClick={() => setMode('decode')}
            >
              Decode
            </button>
          </div>
        </div>

        <div className="control-group">
          <label>Format:</label>
          <select
            value={encodingType}
            onChange={(e) => setEncodingType(e.target.value as EncodingType)}
          >
            <option value="base64">Base64</option>
            <option value="url">URL Encoding</option>
            <option value="uri">URI Encoding</option>
            <option value="html">HTML Entities</option>
            <option value="escape">Escape String</option>
          </select>
        </div>

        <div className="control-actions">
          <button onClick={swapInputOutput} title="Swap input and output">
            ⇅ Swap
          </button>
          <button onClick={clearAll} title="Clear all">
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="editor-container">
        <div className="editor-panel">
          <div className="panel-header">
            <h3>Input</h3>
            <span className="char-count">{input.length} characters</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={`Enter text to ${mode}...`}
            spellCheck={false}
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <h3>Output</h3>
            <div className="panel-actions">
              <span className="char-count">{output.length} characters</span>
              {output && (
                <button onClick={copyToClipboard} className="btn-copy">
                  📋 Copy
                </button>
              )}
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Output will appear here..."
            spellCheck={false}
          />
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default EncoderDecoder;
