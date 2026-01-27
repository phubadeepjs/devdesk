import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { IS_ELECTRON, FEATURES } from '../config';
import './Settings.css';

const Settings: React.FC = () => {
  const { wrapLongLines, setWrapLongLines } = useSettings();
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (IS_ELECTRON && window.electronAPI?.getAutoLaunch) {
        try {
          const enabled = await window.electronAPI.getAutoLaunch();
          setAutoLaunch(enabled);
        } catch (err) {
          console.error('Failed to load auto-launch setting:', err);
        }
      }
      setLoading(false);
    };

    loadSettings();
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

  if (loading) {
    return <div className="settings-container">Loading...</div>;
  }

  return (
    <div className="settings-container">
      <div className="tool-header">
        <h2>Settings</h2>
        <p className="tool-description">Application preferences and configuration</p>
      </div>

      <div className="settings-section">
        <h3>General</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <span className="setting-label">Wrap Long Lines</span>
            <span className="setting-desc">Wrap text in code editors and output views</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={wrapLongLines}
              onChange={(e) => setWrapLongLines(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {IS_ELECTRON && FEATURES.autoLaunch && (
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Start at Login</span>
              <span className="setting-desc">Automatically start DevDesk when you log in</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={autoLaunch}
                onChange={(e) => handleAutoLaunchChange(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        )}
      </div>

      <div className="settings-section">
         <h3>About</h3>
         <div className="about-info">
             <div className="app-version">Version 1.0.0</div>
             <div className="app-author">Created by Phubadee</div>
         </div>
      </div>
    </div>
  );
};

export default Settings;
