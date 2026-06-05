import type { PointerEvent } from "react";
import { ShelfItem, ShelfMode } from "../hooks/useShelf";

interface ShelfProps {
  items: ShelfItem[];
  mode: ShelfMode;
  visible: boolean;
  dropActive: boolean; // a node is being dragged over the shelf
  onSetMode: (m: ShelfMode) => void;
  onRemove: (path: string) => void;
  onClear: () => void;
  onStartDrag: (e: PointerEvent) => void;
}

function Glyph({ isDir }: { isDir: boolean }) {
  return isDir ? (
    <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 5a2 2 0 012-2h4.586a1 1 0 01.707.293L10.707 5H18a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
        className="folder-icon-path"
      />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" fill="var(--text-muted)" opacity="0.8" />
    </svg>
  );
}

// Bottom staging tray. Drag canvas nodes in to collect them, then drag the
// whole batch onto a destination folder. Copy/Move toggle decides the action.
export default function Shelf({
  items,
  mode,
  visible,
  dropActive,
  onSetMode,
  onRemove,
  onClear,
  onStartDrag,
}: ShelfProps) {
  if (!visible) return null;
  const empty = items.length === 0;

  return (
    <div className={`shelf ${dropActive ? "shelf--drop" : ""}`}>
      <div className="shelf__header">
        <span className="shelf__count">
          {empty ? "Drop files here to stage" : `${items.length} item${items.length > 1 ? "s" : ""}`}
        </span>
        {!empty && (
          <>
            <div className="shelf__toggle">
              <button
                className={`shelf__toggle-btn ${mode === "copy" ? "shelf__toggle-btn--on" : ""}`}
                onClick={() => onSetMode("copy")}
              >
                Copy
              </button>
              <button
                className={`shelf__toggle-btn ${mode === "move" ? "shelf__toggle-btn--on" : ""}`}
                onClick={() => onSetMode("move")}
              >
                Move
              </button>
            </div>
            <button className="shelf__clear" onClick={onClear} title="Clear staging tray">
              Clear
            </button>
          </>
        )}
      </div>

      {!empty && (
        <div className="shelf__items">
          {items.map((item) => (
            <div
              key={item.path}
              className="shelf__chip"
              title={item.path}
              onPointerDown={onStartDrag}
            >
              <Glyph isDir={item.isDir} />
              <span className="shelf__name">{item.name}</span>
              <button
                className="shelf__remove"
                title="Remove"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.path);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
