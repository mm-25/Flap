import { useState, useCallback, useEffect } from "react";

export interface NavItem {
  path: string;
  name: string;
}

const RECENTS_KEY = "flap.recents";
const PINNED_KEY = "flap.pinned";
const RECENTS_CAP = 12;

function load(key: string): NavItem[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x) => x && typeof x.path === "string" && typeof x.name === "string"
    );
  } catch {
    return [];
  }
}

function save(key: string, items: NavItem[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

// Recents + pinned folders, keyed by absolute path (stable across sessions;
// node IDs are not — they encode live expansion state). Persisted to localStorage.
export function useNavStore() {
  const [recents, setRecents] = useState<NavItem[]>(() => load(RECENTS_KEY));
  const [pinned, setPinned] = useState<NavItem[]>(() => load(PINNED_KEY));

  useEffect(() => save(RECENTS_KEY, recents), [recents]);
  useEffect(() => save(PINNED_KEY, pinned), [pinned]);

  const recordVisit = useCallback((item: NavItem) => {
    if (!item.path) return;
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.path !== item.path)];
      return next.slice(0, RECENTS_CAP);
    });
  }, []);

  const togglePin = useCallback((item: NavItem) => {
    setPinned((prev) =>
      prev.some((p) => p.path === item.path)
        ? prev.filter((p) => p.path !== item.path)
        : [...prev, item]
    );
  }, []);

  const isPinned = useCallback(
    (path: string) => pinned.some((p) => p.path === path),
    [pinned]
  );

  // clear recents only — pinned folders are kept
  const clearRecents = useCallback(() => setRecents([]), []);

  return { recents, pinned, recordVisit, togglePin, isPinned, clearRecents };
}
