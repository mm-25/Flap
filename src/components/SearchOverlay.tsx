import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Node } from "@xyflow/react";
import { NavItem } from "../hooks/useNavStore";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node[];
  recents: NavItem[];
  pinned: NavItem[];
  isPinned: (path: string) => boolean;
  onJump: (path: string) => void;
  onTogglePin: (item: NavItem) => void;
}

interface Cand {
  name: string;
  path: string;
  isDir: boolean;
  extension: string;
}

// Subsequence fuzzy score. Returns -Infinity for no match; higher is better.
// Rewards word-boundary hits, contiguous streaks, and prefix/exact matches.
function fuzzyScore(q: string, text: string): number {
  const t = text.toLowerCase();
  const ql = q.toLowerCase();
  if (!ql) return 0;
  let ti = 0;
  let score = 0;
  let streak = 0;
  let prev = -2;
  for (let qi = 0; qi < ql.length; qi++) {
    const found = t.indexOf(ql[qi], ti);
    if (found === -1) return -Infinity;
    if (found === 0 || /[/\-_. ]/.test(t[found - 1])) score += 10;
    if (found === prev + 1) {
      streak++;
      score += 5 + streak;
    } else {
      streak = 0;
    }
    score -= found - ti; // gap penalty
    prev = found;
    ti = found + 1;
  }
  if (t.startsWith(ql)) score += 15;
  if (t === ql) score += 30;
  return score;
}

function toCand(item: NavItem): Cand {
  return { name: item.name, path: item.path, isDir: true, extension: "" };
}

export default function SearchOverlay({
  isOpen,
  onClose,
  nodes,
  recents,
  pinned,
  isPinned,
  onJump,
  onTogglePin,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Candidate set for fuzzy search: canvas nodes ∪ pinned ∪ recents (dedup by path).
  // Including recents/pins means collapsed-but-known folders stay findable by name.
  const candidates = useMemo(() => {
    const map = new Map<string, Cand>();
    for (const n of nodes) {
      const d = n.data as any;
      if (!d?.path || map.has(d.path)) continue;
      map.set(d.path, {
        name: d.name ?? "",
        path: d.path,
        isDir: !!d.isDir,
        extension: d.extension ?? "",
      });
    }
    for (const p of pinned) if (!map.has(p.path)) map.set(p.path, toCand(p));
    for (const r of recents) if (!map.has(r.path)) map.set(r.path, toCand(r));
    return Array.from(map.values());
  }, [nodes, pinned, recents]);

  const isEmptyQuery = !query.trim();

  // Empty query → pinned then recents. Otherwise → fuzzy-ranked candidates.
  const results = useMemo(() => {
    if (isEmptyQuery) {
      const seen = new Set<string>();
      const list: Cand[] = [];
      for (const p of pinned)
        if (!seen.has(p.path)) {
          seen.add(p.path);
          list.push(toCand(p));
        }
      for (const r of recents)
        if (!seen.has(r.path)) {
          seen.add(r.path);
          list.push(toCand(r));
        }
      return list.slice(0, 20);
    }
    const q = query.trim();
    return candidates
      .map((c) => ({ c, s: fuzzyScore(q, c.name) }))
      .filter((x) => x.s > -Infinity)
      .sort((a, b) => b.s - a.s)
      .slice(0, 20)
      .map((x) => x.c);
  }, [isEmptyQuery, query, candidates, pinned, recents]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const choose = useCallback(
    (c: Cand) => {
      onJump(c.path);
      onClose();
    },
    [onJump, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        choose(results[selectedIndex]);
      }
    },
    [results, selectedIndex, choose, onClose]
  );

  if (!isOpen) return null;

  const caption = isEmptyQuery && (pinned.length || recents.length) ? "Recent & pinned" : "";
  const emptyMsg = isEmptyQuery ? "No recent folders yet" : "No matches";

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Jump to folder…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="search-kbd">esc</kbd>
        </div>

        <div className="search-results" ref={listRef}>
          {caption && <div className="search-caption">{caption}</div>}
          {results.length === 0 ? (
            <div className="search-empty">{emptyMsg}</div>
          ) : (
            results.map((r, i) => {
              const pinnedNow = isPinned(r.path);
              return (
                <div
                  key={r.path}
                  className={`search-result ${i === selectedIndex ? "search-result--selected" : ""}`}
                  onClick={() => choose(r)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className="search-result__icon">
                    {r.isDir ? (
                      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                        <path
                          d="M2 5a2 2 0 012-2h4.586a1 1 0 01.707.293L10.707 5H18a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
                          className="folder-icon-path"
                        />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                          fill="var(--text-muted)"
                          opacity="0.6"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="search-result__name">{r.name}</span>
                  <span className="search-result__path">
                    {r.path.split("/").slice(-2, -1)[0] || ""}
                  </span>
                  {r.isDir && (
                    <button
                      className={`search-result__pin ${pinnedNow ? "search-result__pin--on" : ""}`}
                      title={pinnedNow ? "Unpin" : "Pin"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin({ path: r.path, name: r.name });
                      }}
                    >
                      {pinnedNow ? "★" : "☆"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
