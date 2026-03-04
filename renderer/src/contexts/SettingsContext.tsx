import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { allTools } from "../constants/tools";

type Settings = {
  wrapLongLines: boolean;
  setWrapLongLines: (value: boolean) => void;
  visibleTools: Record<string, boolean>;
  toggleToolVisibility: (toolId: string) => void;
  toolOrder: string[];
  moveToolUp: (toolId: string) => void;
  moveToolDown: (toolId: string) => void;
  reorderTools: (newOrder: string[]) => void;
};

const SettingsContext = createContext<Settings | undefined>(undefined);

const defaultOrder = allTools.map((t) => t.id);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wrapLongLines, setWrapLongLines] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("settings.wrapLongLines");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  const [visibleTools, setVisibleTools] = useState<Record<string, boolean>>(
    () => {
      try {
        const stored = localStorage.getItem("settings.visibleTools");
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    },
  );

  const [toolOrder, setToolOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("settings.toolOrder");
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        // Merge: keep stored order, append any new tools not yet in the stored list
        const merged = [...parsed.filter((id) => defaultOrder.includes(id))];
        defaultOrder.forEach((id) => {
          if (!merged.includes(id)) merged.push(id);
        });
        return merged;
      }
    } catch {}
    return defaultOrder;
  });

  const mountedWrap = React.useRef(false);
  const mountedVisible = React.useRef(false);
  const mountedOrder = React.useRef(false);

  useEffect(() => {
    if (!mountedWrap.current) {
      mountedWrap.current = true;
      return;
    }
    try {
      localStorage.setItem("settings.wrapLongLines", String(wrapLongLines));
    } catch {}
  }, [wrapLongLines]);

  useEffect(() => {
    if (!mountedVisible.current) {
      mountedVisible.current = true;
      return;
    }
    try {
      localStorage.setItem(
        "settings.visibleTools",
        JSON.stringify(visibleTools),
      );
    } catch {}
  }, [visibleTools]);

  useEffect(() => {
    if (!mountedOrder.current) {
      mountedOrder.current = true;
      return;
    }
    try {
      localStorage.setItem("settings.toolOrder", JSON.stringify(toolOrder));
    } catch {}
  }, [toolOrder]);

  const toggleToolVisibility = (toolId: string) => {
    setVisibleTools((prev) => ({
      ...prev,
      [toolId]: prev[toolId] === undefined ? false : !prev[toolId],
    }));
  };

  const moveToolUp = useCallback((toolId: string) => {
    setToolOrder((prev) => {
      const idx = prev.indexOf(toolId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveToolDown = useCallback((toolId: string) => {
    setToolOrder((prev) => {
      const idx = prev.indexOf(toolId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const reorderTools = useCallback((newOrder: string[]) => {
    setToolOrder(newOrder);
  }, []);

  const value = useMemo(
    () => ({
      wrapLongLines,
      setWrapLongLines,
      visibleTools,
      toggleToolVisibility,
      toolOrder,
      moveToolUp,
      moveToolDown,
      reorderTools,
    }),
    [
      wrapLongLines,
      visibleTools,
      toolOrder,
      moveToolUp,
      moveToolDown,
      reorderTools,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): Settings {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
