import { useCallback } from "react";
import { open } from "@tauri-apps/plugin-dialog";

interface TopNavProps {
  currentPath: string;
  onOpenFolder: (path: string) => void;
  onResetView: () => void;
  onCollapseAll: () => void;
  outlineOpen: boolean;
  onToggleOutline: () => void;
  onShowShortcuts: () => void;
}

export default function TopNav({
  currentPath,
  onOpenFolder,
  onResetView,
  onCollapseAll,
  outlineOpen,
  onToggleOutline,
  onShowShortcuts,
}: TopNavProps) {
  const handleOpen = useCallback(async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === "string") onOpenFolder(selected);
  }, [onOpenFolder]);

  const parts = currentPath.split("/").filter(Boolean);
  const displayPath = parts.length > 3
    ? ["~", "…", ...parts.slice(-2)].join(" / ")
    : currentPath.includes("/Users/")
      ? "~" + (parts.length > 2 ? " / " + parts.slice(-1)[0] : "")
      : currentPath;

  return (
    <nav className="top-nav">
      <div className="top-nav__left">
        <span className="top-nav__logo">Flap</span>
        <span className="top-nav__path">{displayPath}</span>
      </div>
      <div className="top-nav__right">
        <button
          className={`btn-nav ${outlineOpen ? "btn-nav--active" : ""}`}
          onClick={onToggleOutline}
          title="Toggle outline sidebar  ⌘⇧O"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <line x1="5" y1="2" x2="5" y2="12" stroke="currentColor" strokeWidth="1.3" />
          </svg>
          Outline
        </button>
        <button className="btn-nav" onClick={onCollapseAll} title="Collapse all folders  ⌘⇧C">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 5h10M2 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M10 7l2 2-2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Collapse
        </button>
        <button className="btn-nav" onClick={onResetView} title="Fit all nodes in view  ⌘⇧F">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1a6 6 0 100 12A6 6 0 007 1zM4 7h6M7 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Fit view
        </button>
        <button className="btn-nav btn-nav--icon" onClick={onShowShortcuts} title="Keyboard shortcuts  ⌘/">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
            <rect x="3" y="5.5" width="2" height="1.5" rx="0.4" fill="currentColor"/>
            <rect x="6" y="5.5" width="2" height="1.5" rx="0.4" fill="currentColor"/>
            <rect x="9" y="5.5" width="2" height="1.5" rx="0.4" fill="currentColor"/>
            <rect x="4.5" y="8" width="5" height="1.5" rx="0.4" fill="currentColor"/>
          </svg>
        </button>
        <button className="btn-primary" onClick={handleOpen}>
          Open folder
        </button>
      </div>
    </nav>
  );
}
