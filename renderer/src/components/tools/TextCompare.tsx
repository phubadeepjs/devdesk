import React, { useState, useEffect, useRef } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import './TextCompare.css';
import { useSettings } from '../../contexts/SettingsContext';

const TextCompare: React.FC = () => {
  const { wrapLongLines } = useSettings();
  
  // Load state from localStorage for initial render
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

  // Refs to track current content without triggering re-renders
  const leftTextRef = useRef(leftText);
  const rightTextRef = useRef(rightText);

  // Sync refs with state when state changes (e.g. initial load, swap, clear)
  useEffect(() => {
    leftTextRef.current = leftText;
  }, [leftText]);

  useEffect(() => {
    rightTextRef.current = rightText;
  }, [rightText]);

  // Load state from localStorage - logic remains same but we use the refs for updates
  // ... (existing state initialization is fine)

  // Save state to localStorage
  // We remove the useEffect hooks that saved on state change, 
  // and instead save directly in the editor change event to avoid re-renders

  // Add no-scroll class to main content when component is mounted
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('no-scroll');
    }
    return () => {
      if (mainContent) {
        mainContent.classList.remove('no-scroll');
      }
    };
  }, []);

  const handleEditorMount = (editor: any) => {
    const originalEditor = editor.getOriginalEditor();
    const modifiedEditor = editor.getModifiedEditor();

    // Hide the vertical scrollbar on the left editor (Original)
    originalEditor.updateOptions({
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'auto',
        handleMouseWheel: true
      }
    });

    // Update Refs and LocalStorage on change, but DO NOT update State
    originalEditor.onDidChangeModelContent(() => {
        const val = originalEditor.getValue();
        leftTextRef.current = val;
        try { localStorage.setItem('tc.leftText', val); } catch {}
    });

    modifiedEditor.onDidChangeModelContent(() => {
        const val = modifiedEditor.getValue();
        rightTextRef.current = val;
        try { localStorage.setItem('tc.rightText', val); } catch {}
    });
  };

  const clearAll = () => {
    // These actions SHOULD trigger a re-render to update the editor
    setLeftText('');
    setRightText('');
    leftTextRef.current = '';
    rightTextRef.current = '';
    try {
      localStorage.removeItem('tc.leftText');
      localStorage.removeItem('tc.rightText');
    } catch {}
  };

  const swapTexts = () => {
    // Swap using current ref values
    const currentLeft = leftTextRef.current;
    const currentRight = rightTextRef.current;
    
    setLeftText(currentRight);
    setRightText(currentLeft);
    
    leftTextRef.current = currentRight;
    rightTextRef.current = currentLeft;
    
    // Update local storage immediately
    try {
        localStorage.setItem('tc.leftText', currentRight);
        localStorage.setItem('tc.rightText', currentLeft);
    } catch {}
  };

  return (
    <div className="text-compare">
      <div className="tool-header">
        <h2>Text Compare</h2>
        <p className="tool-description">
          Compare two texts and highlight differences using Monaco Editor
        </p>
      </div>

      <div className="controls">
        <div className="control-group"> 
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

      <div className="compare-body">
        <DiffEditor
          height="100%"
          language="text"
          original={leftText}
          modified={rightText}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            wordWrap: wrapLongLines ? 'on' : 'off',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderSideBySide: true,
            originalEditable: true,
            readOnly: false,
            diffWordWrap: 'off',
            overviewRulerBorder: false,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'auto',
              useShadows: false,
              verticalScrollbarSize: 10
            },
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            snippetSuggestions: 'none',
            hover: { enabled: false },
            matchBrackets: 'never',
            renderValidationDecorations: 'off',
            colorDecorators: false,
            padding: { top: 12 }
          }}
        />
      </div>
    </div>
  );
};

export default TextCompare;
