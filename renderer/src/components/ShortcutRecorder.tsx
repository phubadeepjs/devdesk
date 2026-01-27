
import React, { useState, useEffect, useRef } from 'react';

interface ShortcutRecorderProps {
  value: string;
  onChange: (shortcut: string) => void;
}

export const ShortcutRecorder: React.FC<ShortcutRecorderProps> = ({ value, onChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKey, setCurrentKey] = useState<string>(value);

  // Focus ref to capture keyboard events
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentKey(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isRecording) return;

    const keys: string[] = [];
    
    // Modifiers
    if (e.metaKey || e.ctrlKey) keys.push('CommandOrControl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');

    // Key code
    // Ignore modifier keys themselves as the "main" key
    if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        // Just modifiers pressed
    } else {
        // Convert some keys to Electron Accelerator format if needed
        let key = e.key.toUpperCase();
        if (key === ' ') key = 'Space';
        if (key === 'ARROWUP') key = 'Up';
        if (key === 'ARROWDOWN') key = 'Down';
        if (key === 'ARROWLEFT') key = 'Left';
        if (key === 'ARROWRIGHT') key = 'Right';
        
        keys.push(key);
    }
    
    const shortcutString = keys.join('+');
    setCurrentKey(shortcutString);
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
      // If we released a key and we have a valid shortcut (at least one modifier or standard key?)
      // Actually Electron shortcuts usually need modifiers.
      // But let's just finish recording on first key up or maybe validation?
      // Standard behavior: user types combo, releasing keys finishes it?
      // Or they press "Enter" to Confirm? 
      // Let's rely on user clicking "Stop" or clicking away?
      // Better: detecting when all keys are released?
      
      // For now, let's keep it simple: We just update the display while pressing.
      // User must click "Save" or we auto-save on successful combo?
      
      // Implementation choice: Text box that is read-only. When clicked, it becomes "Recording...".
      // User presses keys. "CommandOrControl+Shift+K".
      // Then user clicks away or presses Enter to set it.
      
      if (!isRecording) return;
      
      if (e.key === 'Enter') {
          stopRecording();
          onChange(currentKey);
      }
      if (e.key === 'Escape') {
          stopRecording();
          setCurrentKey(value); // Revert
      }
  };

  const startRecording = () => {
    setIsRecording(true);
    setCurrentKey('Type shortcut...');
    if (inputRef.current) inputRef.current.focus();
  };

  const stopRecording = () => {
    setIsRecording(false);
    // If it was just modifiers or empty, revert?
    if (currentKey === 'Type shortcut...' || currentKey === '') {
        setCurrentKey(value);
    } else {
        onChange(currentKey);
    }
  };

  return (
    <div className="shortcut-recorder">
      <div 
        ref={inputRef}
        className={`shortcut-display ${isRecording ? 'recording' : ''}`}
        onClick={startRecording}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => {
            // Optional: stop recording on blur?
            // stopRecording(); 
        }}
        tabIndex={0}
      >
        {currentKey || 'Click to record'}
      </div>
      {isRecording && (
          <div className="shortcut-actions">
           <button className="small-btn" onMouseDown={(e) => { e.preventDefault(); stopRecording(); }}>Done</button>
          </div>
      )}
      <style>{`
        .shortcut-recorder {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .shortcut-display {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            padding: 8px 12px;
            border-radius: 6px;
            min-width: 150px;
            text-align: center;
            cursor: pointer;
            user-select: none;
            font-family: monospace;
            font-size: 14px;
        }
        .shortcut-display.recording {
            border-color: var(--accent-color);
            background: rgba(var(--accent-rgb), 0.1);
            color: var(--accent-color);
            outline: none;
        }
        .small-btn {
            padding: 4px 8px;
            font-size: 12px;
            background: var(--accent-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};
