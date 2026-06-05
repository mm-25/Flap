import { useState, useRef, useEffect, useCallback } from "react";
import { ShelfItem } from "./useShelf";

export type DragTarget =
  | { type: "shelf" }
  | { type: "folder"; path: string }
  | null;

export interface DragState {
  kind: "node" | "shelf";
  items: ShelfItem[];
  x: number;
  y: number;
  target: DragTarget;
}

interface Pending {
  kind: "node" | "shelf";
  items: ShelfItem[];
  startX: number;
  startY: number;
}

interface Options {
  onStageItems: (items: ShelfItem[]) => void;
  onDropOnFolder: (folderPath: string, items: ShelfItem[]) => void;
}

const THRESHOLD = 8; // px before a press becomes a drag (matches nodeClickDistance)

// Custom pointer-based drag layer. Two sources:
//  - "node": a canvas file/folder → drop on the shelf to stage it
//  - "shelf": staged items → drop on a folder node to copy/move them in
// Hit-testing is done with elementFromPoint (the ghost is pointer-events:none).
export function useDragController(options: Options) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  const set = (d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const hitTest = (x: number, y: number, kind: "node" | "shelf"): DragTarget => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    if (kind === "node") {
      return el.closest(".shelf") ? { type: "shelf" } : null;
    }
    const node = el.closest(".fs-node") as HTMLElement | null;
    if (node && node.dataset.isdir === "true") {
      return { type: "folder", path: node.dataset.path || "" };
    }
    return null;
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingRef.current;
      if (!pending && !dragRef.current) return;
      if (pending && !dragRef.current) {
        if (Math.hypot(e.clientX - pending.startX, e.clientY - pending.startY) < THRESHOLD) return;
        document.body.classList.add("is-dragging");
        set({
          kind: pending.kind,
          items: pending.items,
          x: e.clientX,
          y: e.clientY,
          target: hitTest(e.clientX, e.clientY, pending.kind),
        });
        return;
      }
      const cur = dragRef.current!;
      set({ ...cur, x: e.clientX, y: e.clientY, target: hitTest(e.clientX, e.clientY, cur.kind) });
    };

    const finish = () => {
      const cur = dragRef.current;
      pendingRef.current = null;
      document.body.classList.remove("is-dragging");
      if (cur) {
        if (cur.kind === "node" && cur.target?.type === "shelf") {
          optsRef.current.onStageItems(cur.items);
        } else if (cur.kind === "shelf" && cur.target?.type === "folder") {
          optsRef.current.onDropOnFolder(cur.target.path, cur.items);
        }
        set(null);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pendingRef.current = null;
        document.body.classList.remove("is-dragging");
        if (dragRef.current) set(null);
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const startNodeDrag = useCallback((e: React.PointerEvent, item: ShelfItem) => {
    if (e.button !== 0) return;
    pendingRef.current = { kind: "node", items: [item], startX: e.clientX, startY: e.clientY };
  }, []);

  const startShelfDrag = useCallback((e: React.PointerEvent, items: ShelfItem[]) => {
    if (e.button !== 0 || items.length === 0) return;
    pendingRef.current = { kind: "shelf", items, startX: e.clientX, startY: e.clientY };
  }, []);

  return { drag, startNodeDrag, startShelfDrag };
}
