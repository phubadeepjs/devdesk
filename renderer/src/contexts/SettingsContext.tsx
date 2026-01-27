import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Settings = {
  wrapLongLines: boolean;
  setWrapLongLines: (value: boolean) => void;
  visibleTools: Record<string, boolean>;
  toggleToolVisibility: (toolId: string) => void;
};

const SettingsContext = createContext<Settings | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wrapLongLines, setWrapLongLines] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('settings.wrapLongLines');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [visibleTools, setVisibleTools] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('settings.visibleTools');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const mountedWrap = React.useRef(false);
  const mountedVisible = React.useRef(false);

  useEffect(() => {
    if (!mountedWrap.current) {
      mountedWrap.current = true;
      return;
    }
    try {
      localStorage.setItem('settings.wrapLongLines', String(wrapLongLines));
    } catch {}
  }, [wrapLongLines]);

  useEffect(() => {
    if (!mountedVisible.current) {
      mountedVisible.current = true;
      return;
    }
    try {
      localStorage.setItem('settings.visibleTools', JSON.stringify(visibleTools));
    } catch {}
  }, [visibleTools]);
  const toggleToolVisibility = (toolId: string) => {
    setVisibleTools(prev => ({
      ...prev,
      [toolId]: prev[toolId] === undefined ? false : !prev[toolId]
    }));
  };

  const value = useMemo(() => ({ 
    wrapLongLines, 
    setWrapLongLines,
    visibleTools,
    toggleToolVisibility
  }), [wrapLongLines, visibleTools]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}


