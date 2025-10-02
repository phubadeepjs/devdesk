import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import JsonFormatter from './components/tools/JsonFormatter';
import TextCompare from './components/tools/TextCompare';
import RepoToContext from './components/tools/RepoToContext';
import RegExTester from './components/tools/RegExTester';
import JsonQuery from './components/tools/JsonQuery';
import LoremIpsum from './components/tools/LoremIpsum';
import './styles/App.css';
import { SettingsProvider } from './contexts/SettingsContext';

export type ToolType = 'json-formatter' | 'text-compare' | 'repo-to-context' | 'regex-tester' | 'json-query' | 'lorem-ipsum';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>('json-formatter');

  const renderTool = () => {
    switch (activeTool) {
      case 'json-formatter':
        return <JsonFormatter />;
      case 'text-compare':
        return <TextCompare />;
      case 'repo-to-context':
        return <RepoToContext />;
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

