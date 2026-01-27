import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { FEATURES } from '../config';
import { allTools } from '../constants/tools';
import { useSettings } from '../contexts/SettingsContext';

const Sidebar: React.FC = () => {
  const { visibleTools } = useSettings();
  
  // Filter tools based on available features AND visibility settings
  const tools = React.useMemo(() => allTools.filter(tool => {
    const isFeatureEnabled = FEATURES[tool.feature as keyof typeof FEATURES];
    const isVisible = visibleTools[tool.id] !== false; // Default to true if undefined
    return isFeatureEnabled && isVisible;
  }), [visibleTools]);
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">🛠️ DevDesk</h1>
        <p className="app-subtitle">Developer Utilities</p>
      </div>
      
      <nav className="sidebar-nav">
        {tools.map((tool) => (
          <NavLink
            key={tool.id}
            to={tool.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{tool.icon}</span>
            <span className="nav-label">{tool.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
