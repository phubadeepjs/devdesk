import React, { useState, useEffect } from 'react';
import './LoremIpsum.css';
import { useSettings } from '../../contexts/SettingsContext';

const LoremIpsum: React.FC = () => {
  const [count, setCount] = useState(() => {
    try {
      const stored = localStorage.getItem('lorem.count');
      return stored ? Number(stored) : 3;
    } catch {
      return 3;
    }
  });
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>(() => {
    try {
      const stored = localStorage.getItem('lorem.type');
      return (stored as any) || 'paragraphs';
    } catch {
      return 'paragraphs';
    }
  });
  const [startWithLorem, setStartWithLorem] = useState(() => {
    try {
      const stored = localStorage.getItem('lorem.startWithLorem');
      return stored !== 'false';
    } catch {
      return true;
    }
  });
  const [includeHtml, setIncludeHtml] = useState(() => {
    try {
      const stored = localStorage.getItem('lorem.includeHtml');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [output, setOutput] = useState('');

  // Lorem ipsum word bank
  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
  ];

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lorem.count', String(count));
    } catch {}
  }, [count]);

  useEffect(() => {
    try {
      localStorage.setItem('lorem.type', type);
    } catch {}
  }, [type]);

  useEffect(() => {
    try {
      localStorage.setItem('lorem.startWithLorem', String(startWithLorem));
    } catch {}
  }, [startWithLorem]);

  useEffect(() => {
    try {
      localStorage.setItem('lorem.includeHtml', String(includeHtml));
    } catch {}
  }, [includeHtml]);

  const getRandomWord = (): string => {
    return loremWords[Math.floor(Math.random() * loremWords.length)];
  };

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const generateSentence = (wordCount: number = 10): string => {
    const words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(getRandomWord());
    }
    return capitalize(words.join(' ')) + '.';
  };

  const generateParagraph = (sentenceCount: number = 5): string => {
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence(Math.floor(Math.random() * 10) + 8));
    }
    return sentences.join(' ');
  };

  const generate = () => {
    let result = '';
    
    if (type === 'paragraphs') {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        let para = generateParagraph(Math.floor(Math.random() * 3) + 4);
        
        // First paragraph starts with "Lorem ipsum..." if enabled
        if (i === 0 && startWithLorem) {
          para = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' + para;
        }
        
        if (includeHtml) {
          para = `<p>${para}</p>`;
        }
        
        paragraphs.push(para);
      }
      result = paragraphs.join(includeHtml ? '\n' : '\n\n');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        let sentence = generateSentence(Math.floor(Math.random() * 10) + 8);
        
        if (i === 0 && startWithLorem) {
          sentence = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        }
        
        sentences.push(sentence);
      }
      result = sentences.join(' ');
    } else if (type === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        if (i === 0 && startWithLorem) {
          words.push('lorem');
        } else {
          words.push(getRandomWord());
        }
      }
      result = words.join(' ');
    }

    setOutput(result);
  };

  const clearAll = () => {
    setOutput('');
  };

  const { wrapLongLines } = useSettings();

  return (
    <div className={`lorem-ipsum ${wrapLongLines ? 'wrap-on' : 'wrap-off'}`}>
      <div className="tool-header">
        <h2>Lorem Ipsum Generator</h2>
        <p className="tool-description">
          Generate placeholder text for designs and mockups
        </p>
      </div>

      <div className="controls">
        <div className="control-row">
          <div className="control-group">
            <label htmlFor="count">Count:</label>
            <input
              id="count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="count-input"
            />
          </div>

          <div className="control-group">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'paragraphs' | 'sentences' | 'words')}
              className="type-select"
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
        </div>

        <div className="options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
            />
            <span>Start with "Lorem ipsum..."</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeHtml}
              onChange={(e) => setIncludeHtml(e.target.checked)}
            />
            <span>Wrap with HTML tags</span>
          </label>
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={generate}>
            ✨ Generate
          </button>
          <button className="btn btn-secondary" onClick={clearAll}>
            🗑️ Clear
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Characters:</span>
          <span className="stat-value">{output.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Words:</span>
          <span className="stat-value">{output.split(/\s+/).filter(w => w).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Paragraphs:</span>
          <span className="stat-value">{output.split(/\n\n/).filter(p => p.trim()).length}</span>
        </div>
      </div>

      <div className="output-container">
        <div className="output-header">
          <h3>Generated Text</h3>
        </div>
        <textarea
          className="output-textarea"
          value={output}
          readOnly
          placeholder="Click 'Generate' to create Lorem Ipsum text..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default LoremIpsum;

