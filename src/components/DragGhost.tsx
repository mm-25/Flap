import { ShelfItem } from "../hooks/useShelf";

interface DragGhostProps {
  items: ShelfItem[];
  x: number;
  y: number;
  active: boolean; // over a valid drop target
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

export default function DragGhost({ items, x, y, active }: DragGhostProps) {
  const first = items[0];
  if (!first) return null;
  return (
    <div className={`drag-ghost ${active ? "drag-ghost--active" : ""}`} style={{ left: x + 12, top: y + 12 }}>
      <Glyph isDir={first.isDir} />
      <span className="drag-ghost__name">{first.name}</span>
      {items.length > 1 && <span className="drag-ghost__badge">{items.length}</span>}
    </div>
  );
}
