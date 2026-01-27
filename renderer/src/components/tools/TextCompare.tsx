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

  // Store editor instance to manipulate directly
  const diffEditorRef = useRef<any>(null);

  // Sync refs with state when state changes (e.g. initial load)
  useEffect(() => {
    leftTextRef.current = leftText;
  }, [leftText]);

  useEffect(() => {
    rightTextRef.current = rightText;
  }, [rightText]);

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
    diffEditorRef.current = editor;
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
    // 1. Clear State
    setLeftText('');
    setRightText('');
    
    // 2. Clear Refs
    leftTextRef.current = '';
    rightTextRef.current = '';

    // 3. Clear LocalStorage
    try {
      localStorage.removeItem('tc.leftText');
      localStorage.removeItem('tc.rightText');
    } catch {}

    // 4. DIRECTLY Clear Editor Models (Fixes the issue where text stays visible)
    if (diffEditorRef.current) {
        diffEditorRef.current.getOriginalEditor().setValue('');
        diffEditorRef.current.getModifiedEditor().setValue('');
    }
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
