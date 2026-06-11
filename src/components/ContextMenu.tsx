import { useEffect, useRef, useLayoutEffect, useState } from "react";

export interface CtxItem {
  path: string;
  name: string;
  isDir: boolean;
  extension: string;
}

interface ContextMenuProps {
  x: number;
  y: number;
  item: CtxItem | null; // null → right-clicked empty canvas
  onClose: () => void;
  onOpen: (item: CtxItem) => void;
  onQuickLook: (item: CtxItem) => void;
  onReveal: (item: CtxItem) => void;
  onOpenTerminal: (item: CtxItem) => void;
  onGetInfo: (item: CtxItem) => void;
  onRename: (item: CtxItem) => void;
  onDuplicate: (item: CtxItem) => void;
  onAddToTray: (item: CtxItem) => void;
  onNewFolder: (item: CtxItem | null) => void;
  onTrash: (item: CtxItem) => void;
}

type Row =
  | { kind: "item"; label: string; shortcut?: string; danger?: boolean; run: () => void }
  | { kind: "sep" };

export default function ContextMenu(props: ContextMenuProps) {
  const { x, y, item, onClose } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  // close on click-outside / Escape
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [onClose]);

  // keep the menu within the viewport
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (x + r.width > window.innerWidth - 8) left = window.innerWidth - r.width - 8;
    if (y + r.height > window.innerHeight - 8) top = window.innerHeight - r.height - 8;
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [x, y]);

  const wrap = (fn: () => void) => () => {
    fn();
    onClose();
  };

  let rows: Row[] = [];
  if (!item) {
    rows = [{ kind: "item", label: "New Folder", run: wrap(() => props.onNewFolder(null)) }];
  } else {
    const it = item;
    rows = [
      { kind: "item", label: it.isDir ? "Open" : "Open", run: wrap(() => props.onOpen(it)) },
      { kind: "item", label: "Quick Look", shortcut: "Space", run: wrap(() => props.onQuickLook(it)) },
      { kind: "item", label: "Reveal in Finder", run: wrap(() => props.onReveal(it)) },
      { kind: "item", label: "Open in Terminal", run: wrap(() => props.onOpenTerminal(it)) },
      { kind: "item", label: "Get Info", run: wrap(() => props.onGetInfo(it)) },
      { kind: "sep" },
      ...(it.isDir
        ? [{ kind: "item" as const, label: "New Folder", run: wrap(() => props.onNewFolder(it)) }]
        : []),
      { kind: "item", label: "Rename…", run: wrap(() => props.onRename(it)) },
      { kind: "item", label: "Duplicate", run: wrap(() => props.onDuplicate(it)) },
      { kind: "item", label: "Add to Tray", run: wrap(() => props.onAddToTray(it)) },
      { kind: "sep" },
      { kind: "item", label: "Move to Trash", danger: true, run: wrap(() => props.onTrash(it)) },
    ];
  }

  return (
    <div className="ctxmenu" ref={ref} style={{ left: pos.left, top: pos.top }}>
      {rows.map((row, i) =>
        row.kind === "sep" ? (
          <div key={i} className="ctxmenu__sep" />
        ) : (
          <button
            key={i}
            className={`ctxmenu__item ${row.danger ? "ctxmenu__item--danger" : ""}`}
            onClick={row.run}
          >
            <span>{row.label}</span>
            {row.shortcut && <span className="ctxmenu__shortcut">{row.shortcut}</span>}
          </button>
        )
      )}
    </div>
  );
}
