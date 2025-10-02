import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Settings = {
  wrapLongLines: boolean;
  setWrapLongLines: (value: boolean) => void;
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

  useEffect(() => {
    try {
      localStorage.setItem('settings.wrapLongLines', String(wrapLongLines));
    } catch {}
  }, [wrapLongLines]);

  const value = useMemo(() => ({ wrapLongLines, setWrapLongLines }), [wrapLongLines]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}


