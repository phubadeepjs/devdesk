import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import { FEATURES } from '../config';

const allTools = [
  { id: 'json-formatter', path: '/', name: 'JSON Formatter', icon: '{ }', feature: 'jsonFormatter' },
  { id: 'json-schema', path: '/json-schema', name: 'JSON Schema', icon: '📋', feature: 'jsonSchema' },
  { id: 'json-query', path: '/json-query', name: 'JSON Query', icon: '🔎', feature: 'jsonQuery' },
  { id: 'text-compare', path: '/text-compare', name: 'Text Compare', icon: '⚖️', feature: 'textCompare' },
  { id: 'regex-tester', path: '/regex-tester', name: 'RegEx Tester', icon: '🔍', feature: 'regexTester' },
  { id: 'lorem-ipsum', path: '/lorem-ipsum', name: 'Lorem Ipsum', icon: '📝', feature: 'loremIpsum' },
  { id: 'timestamp-converter', path: '/timestamp-converter', name: 'Timestamp Converter', icon: '⏱️', feature: 'timestampConverter' },
  { id: 'repo-to-context', path: '/repo-to-context', name: 'Repo to Context', icon: '📦', feature: 'repoToContext' },
];

// Filter tools based on available features
const tools = allTools.filter(tool => FEATURES[tool.feature as keyof typeof FEATURES]);

const Sidebar: React.FC = () => {
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
