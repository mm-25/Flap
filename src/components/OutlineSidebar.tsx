import { useMemo } from "react";
import { Node, Edge } from "@xyflow/react";

interface OutlineSidebarProps {
  isOpen: boolean;
  nodes: Node[];
  edges: Edge[];
  onClose: () => void;
  onJump: (path: string) => void;
  onToggleExpand: (id: string, path: string) => void;
  onOpenFile: (path: string) => void;
}

interface OutlineNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  isExpanded: boolean;
  depth: number;
  children: OutlineNode[];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`outline__chevron ${open ? "outline__chevron--open" : ""}`}
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
    >
      <path
        d="M3.5 2L6.5 5L3.5 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RowIcon({ isDir }: { isDir: boolean }) {
  return isDir ? (
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
  );
}

function Row({
  node,
  onJump,
  onToggleExpand,
  onOpenFile,
}: {
  node: OutlineNode;
  onJump: (path: string) => void;
  onToggleExpand: (id: string, path: string) => void;
  onOpenFile: (path: string) => void;
}) {
  return (
    <>
      <div
        className="outline__row"
        style={{ paddingLeft: 8 + node.depth * 14 }}
        title={node.path}
        onClick={() => onJump(node.path)}
        onDoubleClick={() => {
          if (!node.isDir) onOpenFile(node.path);
        }}
      >
        <span
          className="outline__disclosure"
          onClick={(e) => {
            if (node.isDir) {
              e.stopPropagation();
              onToggleExpand(node.id, node.path);
            }
          }}
        >
          {node.isDir && <Chevron open={node.isExpanded} />}
        </span>
        <span className="outline__icon">
          <RowIcon isDir={node.isDir} />
        </span>
        <span className="outline__name">{node.name}</span>
      </div>
      {node.children.map((c) => (
        <Row
          key={c.id}
          node={c}
          onJump={onJump}
          onToggleExpand={onToggleExpand}
          onOpenFile={onOpenFile}
        />
      ))}
    </>
  );
}

// Slide-in tree outline derived from the live react-flow nodes/edges. Mirrors
// canvas expansion state. Click a row to fly the canvas there; chevron toggles
// expand/collapse. A compact list to scroll instead of panning the canvas.
export default function OutlineSidebar({
  isOpen,
  nodes,
  edges,
  onClose,
  onJump,
  onToggleExpand,
  onOpenFile,
}: OutlineSidebarProps) {
  const tree = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n] as const));
    const childrenOf = new Map<string, string[]>();
    for (const e of edges) {
      const arr = childrenOf.get(e.source) ?? [];
      arr.push(e.target);
      childrenOf.set(e.source, arr);
    }
    const root = nodes.find((n) => (n.data as any)?.isRoot);
    if (!root) return null;

    const build = (id: string, depth: number): OutlineNode | null => {
      const n = byId.get(id);
      if (!n) return null;
      const d = n.data as any;
      const children = (childrenOf.get(id) ?? [])
        .map((cid) => build(cid, depth + 1))
        .filter((x): x is OutlineNode => x !== null);
      return {
        id,
        name: d.name ?? "",
        path: d.path ?? "",
        isDir: !!d.isDir,
        isExpanded: !!d.isExpanded,
        depth,
        children,
      };
    };
    return build(root.id, 0);
  }, [nodes, edges]);

  if (!isOpen) return null;

  return (
    <div className="outline">
      <div className="outline__header">
        <span className="outline__title">Outline</span>
        <button className="outline__close" onClick={onClose} title="Hide outline">
          ✕
        </button>
      </div>
      <div className="outline__body">
        {tree ? (
          <Row
            node={tree}
            onJump={onJump}
            onToggleExpand={onToggleExpand}
            onOpenFile={onOpenFile}
          />
        ) : (
          <div className="outline__empty">No folder open</div>
        )}
      </div>
    </div>
  );
}
