import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import { FEATURES } from "../config";
import { allTools } from "../constants/tools";
import { useSettings } from "../contexts/SettingsContext";

const Sidebar: React.FC = () => {
  const { visibleTools, toolOrder } = useSettings();

  // Filter and sort tools based on toolOrder, feature flags, and visibility
  const tools = React.useMemo(() => {
    const filtered = allTools.filter((tool) => {
      const isFeatureEnabled = FEATURES[tool.feature as keyof typeof FEATURES];
      const isVisible = visibleTools[tool.id] !== false;
      return isFeatureEnabled && isVisible;
    });
    // Sort by toolOrder (tools not in order go to the end)
    return [...filtered].sort((a, b) => {
      const ai = toolOrder.indexOf(a.id);
      const bi = toolOrder.indexOf(b.id);
      const aIdx = ai === -1 ? Infinity : ai;
      const bIdx = bi === -1 ? Infinity : bi;
      return aIdx - bIdx;
    });
  }, [visibleTools, toolOrder]);
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
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">{tool.icon}</span>
            <span className="nav-label">{tool.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
