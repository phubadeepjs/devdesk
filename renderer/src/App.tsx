import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import JsonFormatter from './components/tools/JsonFormatter';
import JsonSchema from './components/tools/JsonSchema';
import TextCompare from './components/tools/TextCompare';
import RegExTester from './components/tools/RegExTester';
import JsonQuery from './components/tools/JsonQuery';
import LoremIpsum from './components/tools/LoremIpsum';
import './styles/App.css';
import { SettingsProvider } from './contexts/SettingsContext';
import { FEATURES } from './config';

// Lazy load desktop-only components
const RepoToContext = FEATURES.repoToContext 
  ? React.lazy(() => import('./components/tools/RepoToContext'))
  : null;

export type ToolType = 'json-formatter' | 'json-schema' | 'text-compare' | 'repo-to-context' | 'regex-tester' | 'json-query' | 'lorem-ipsum';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json-formatter');

  const renderTool = () => {
    switch (activeTool) {
      case 'json-formatter':
        return <JsonFormatter />;
      case 'json-schema':
        return <JsonSchema />;
      case 'text-compare':
        return <TextCompare />;
      case 'repo-to-context':
        if (!FEATURES.repoToContext || !RepoToContext) {
          return (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              gap: '20px',
              color: '#888'
            }}>
              <div style={{ fontSize: '4em' }}>🖥️</div>
              <h2 style={{ color: '#e0e0e0' }}>Desktop Only Feature</h2>
              <p>Repo to Context requires file system access.</p>
              <p>Please use the desktop version of DevDesk.</p>
              <a 
                href="https://github.com/phubadeepjs/devdesk" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  marginTop: '20px',
                  padding: '10px 20px',
                  background: '#0066cc',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none'
                }}
              >
                Download Desktop App
              </a>
            </div>
          );
        }
        return (
          <React.Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
            <RepoToContext />
          </React.Suspense>
        );
      case 'regex-tester':
        return <RegExTester />;
      case 'json-query':
        return <JsonQuery />;
      case 'lorem-ipsum':
        return <LoremIpsum />;
      default:
        return null;
    }
  };

  return (
    <SettingsProvider>
      <div className="app">
        <Sidebar activeTool={activeTool} onSelectTool={setActiveTool} />
        <main className="main-content">
          {renderTool()}
        </main>
      </div>
    </SettingsProvider>
  );
};

export default App;

