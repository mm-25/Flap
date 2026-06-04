import { useState, useRef, useEffect } from "react";
import { NavItem } from "../hooks/useNavStore";

interface DockProps {
  pinned: NavItem[];
  active: NavItem[];   // currently expanded folders on the canvas
  isPinned: (path: string) => boolean;
  onJump: (path: string) => void;
  onTogglePin: (item: NavItem) => void;
}

function FolderGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 5a2 2 0 012-2h4.586a1 1 0 01.707.293L10.707 5H18a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
        className="folder-icon-path"
      />
    </svg>
  );
}

function ActiveChip({
  item,
  pinned,
  onJump,
  onTogglePin,
}: {
  item: NavItem;
  pinned: boolean;
  onJump: (path: string) => void;
  onTogglePin: (item: NavItem) => void;
}) {
  return (
    <div className="dock__chip" title={item.path} onClick={() => onJump(item.path)}>
      <FolderGlyph />
      <span className="dock__name">{item.name}</span>
      <button
        className={`dock__pin ${pinned ? "dock__pin--on" : ""}`}
        title={pinned ? "Unpin" : "Pin"}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin(item);
        }}
      >
        {pinned ? "★" : "☆"}
      </button>
    </div>
  );
}

// Floating bottom dock. Pin icon opens a dropdown with all pinned folders.
// The bar shows all currently-expanded folders (including pinned ones) so it
// always reflects the live working set on the canvas.
export default function Dock({
  pinned,
  active,
  isPinned,
  onJump,
  onTogglePin,
}: DockProps) {
  const [pinMenuOpen, setPinMenuOpen] = useState(false);
  // ref covers the whole pin-button+dropdown wrapper — click-outside ignores
  // the trigger button itself, preventing the close→reopen toggle race.
  const pinWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (pinWrapRef.current && !pinWrapRef.current.contains(e.target as Node)) {
        setPinMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pinMenuOpen]);

  if (pinned.length === 0 && active.length === 0) return null;

  return (
    <div className="dock">
      {/* ── Pin button (always shown when there are pins) ── */}
      {pinned.length > 0 && (
        <div className="dock__pin-btn-wrap" ref={pinWrapRef}>
          <button
            className={`dock__pin-btn ${pinMenuOpen ? "dock__pin-btn--open" : ""}`}
            title="Pinned folders"
            onClick={() => setPinMenuOpen((v) => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"
                fill={pinMenuOpen ? "var(--color-primary-on-dark)" : "currentColor"}
                opacity={pinMenuOpen ? "1" : "0.75"}
              />
            </svg>
            <span className="dock__pin-count">{pinned.length}</span>
          </button>

          {pinMenuOpen && (
            <div className="dock__pinned-dropdown">
              <div className="dock__pinned-header">Pinned folders</div>
              {pinned.map((item) => (
                <div
                  key={item.path}
                  className="dock__pinned-row"
                  title={item.path}
                  onClick={() => { onJump(item.path); setPinMenuOpen(false); }}
                >
                  <FolderGlyph />
                  <span className="dock__pinned-name">{item.name}</span>
                  <button
                    className="dock__pin dock__pin--on"
                    title="Unpin"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(item);
                    }}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Separator ── */}
      {pinned.length > 0 && active.length > 0 && <div className="dock__sep" />}

      {/* ── Active (expanded) folders — all of them, pinned or not ── */}
      {active.length > 0 && (
        <div className="dock__zone dock__zone--recents" aria-label="Expanded folders">
          {active.map((item) => (
            <ActiveChip
              key={item.path}
              item={item}
              pinned={isPinned(item.path)}
              onJump={onJump}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
