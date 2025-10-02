/**
 * Configuration for detecting runtime environment
 * Allows the same codebase to run as both web app and desktop app
 */

// Check if building for web or desktop
export const IS_WEB = import.meta.env.VITE_BUILD_TARGET === 'web';

// Check if running in Electron environment
export const IS_ELECTRON = 
  !IS_WEB && 
  typeof window !== 'undefined' && 
  typeof (window as any).electronAPI !== 'undefined';

// App metadata
export const APP_NAME = 'DevDesk';
export const APP_VERSION = '1.0.0';

// Feature flags based on environment
export const FEATURES = {
  // Available in both web and desktop
  jsonFormatter: true,
  jsonSchema: true,
  textCompare: true,
  regexTester: true,
  jsonQuery: true,
  loremIpsum: true,
  
  // Desktop-only features
  repoToContext: IS_ELECTRON,
  autoLaunch: IS_ELECTRON,
  systemTray: IS_ELECTRON,
  fileSystemAccess: IS_ELECTRON,
};

// Log environment info in development
if (import.meta.env.DEV) {
  console.log('[DevDesk Config]', {
    IS_WEB,
    IS_ELECTRON,
    BUILD_TARGET: import.meta.env.VITE_BUILD_TARGET,
    FEATURES,
  });
}

