import { useState, useCallback } from "react";

export interface ShelfItem {
  path: string;
  name: string;
  isDir: boolean;
  extension: string;
}

export type ShelfMode = "copy" | "move";

// Staging tray for copy/move. Holds items collected from anywhere on the
// canvas (multi-source), independent of what's currently mounted.
export function useShelf() {
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [mode, setMode] = useState<ShelfMode>("copy");

  const add = useCallback((item: ShelfItem) => {
    setItems((prev) => (prev.some((p) => p.path === item.path) ? prev : [...prev, item]));
  }, []);

  const remove = useCallback((path: string) => {
    setItems((prev) => prev.filter((p) => p.path !== path));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, mode, setMode, add, remove, clear };
}
