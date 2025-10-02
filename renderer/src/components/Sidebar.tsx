import React, { useState, useEffect } from 'react';
import { ToolType } from '../App';
import './Sidebar.css';
import { useSettings } from '../contexts/SettingsContext';

interface SidebarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

const tools = [
  { id: 'json-formatter' as ToolType, name: 'JSON Formatter', icon: '{ }' },
  { id: 'json-query' as ToolType, name: 'JSON Query', icon: '🔎' },
  { id: 'text-compare' as ToolType, name: 'Text Compare', icon: '⚖️' },
  { id: 'regex-tester' as ToolType, name: 'RegEx Tester', icon: '🔍' },
  { id: 'lorem-ipsum' as ToolType, name: 'Lorem Ipsum', icon: '📝' },
  { id: 'repo-to-context' as ToolType, name: 'Repo to Context', icon: '📦' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTool, onSelectTool }) => {
  const { wrapLongLines, setWrapLongLines } = useSettings();
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(!!window.electronAPI);
    
    // Load auto-launch state
    if (window.electronAPI?.getAutoLaunch) {
      window.electronAPI.getAutoLaunch().then(enabled => {
        setAutoLaunch(enabled);
      }).catch(() => {
        setAutoLaunch(false);
      });
    }
  }, []);

  const handleAutoLaunchChange = async (checked: boolean) => {
    if (!window.electronAPI?.setAutoLaunch) return;
    
    try {
      const success = await window.electronAPI.setAutoLaunch(checked);
      if (success) {
        setAutoLaunch(checked);
      }
    } catch (err) {
      console.error('Failed to toggle auto-launch:', err);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">🛠️ DevDesk</h1>
        <p className="app-subtitle">Developer Utilities</p>
      </div>
      
      <nav className="sidebar-nav">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`nav-item ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => onSelectTool(tool.id)}
          >
            <span className="nav-icon">{tool.icon}</span>
            <span className="nav-label">{tool.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={wrapLongLines}
            onChange={(e) => setWrapLongLines(e.target.checked)}
          />
          <span style={{ userSelect: 'none' }}>Wrap long lines</span>
        </label>
        {isElectron && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 8 }}>
            <input
              type="checkbox"
              checked={autoLaunch}
              onChange={(e) => handleAutoLaunchChange(e.target.checked)}
            />
            <span style={{ userSelect: 'none' }}>Start when system starts</span>
          </label>
        )}
        <p style={{ marginTop: 10, color: '#666' }}>v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;

