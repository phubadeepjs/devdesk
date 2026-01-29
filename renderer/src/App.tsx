import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import JsonFormatter from './components/tools/JsonFormatter';
import JsonSchema from './components/tools/JsonSchema';
import TextCompare from './components/tools/TextCompare';
import RegExTester from './components/tools/RegExTester';
import JsonQuery from './components/tools/JsonQuery';
import LoremIpsum from './components/tools/LoremIpsum';
import TimestampConverter from './components/tools/TimestampConverter';
import EncoderDecoder from './components/tools/EncoderDecoder';
import PromptGenerator from './components/tools/PromptGenerator';
import Settings from './components/Settings';
import { SettingsProvider } from './contexts/SettingsContext';
import { FEATURES } from './config';

// Lazy load desktop-only components
const RepoToContext = FEATURES.repoToContext 
  ? React.lazy(() => import('./components/tools/RepoToContext'))
  : null;

const RepoToContextRoute = () => {
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
}

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<JsonFormatter />} />
            <Route path="json-schema" element={<JsonSchema />} />
            <Route path="json-query" element={<JsonQuery />} />
            <Route path="text-compare" element={<TextCompare />} />
            <Route path="regex-tester" element={<RegExTester />} />
            <Route path="lorem-ipsum" element={<LoremIpsum />} />
            <Route path="timestamp-converter" element={<TimestampConverter />} />
            <Route path="base64-encoder" element={<EncoderDecoder />} />
            <Route path="prompt-generator" element={<PromptGenerator />} />
            <Route path="repo-to-context" element={<RepoToContextRoute />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </SettingsProvider>
  );
};

export default App;
