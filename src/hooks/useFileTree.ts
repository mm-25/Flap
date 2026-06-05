import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Node, Edge } from "@xyflow/react";

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  extension: string;
}

const NODE_W = 200;
const NODE_H = 64;
const H_GAP = 24;
const V_GAP = 80;

// ── Tree data structure (separate from react-flow nodes) ──

interface TreeNode {
  id: string;
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  extension: string;
  isExpanded: boolean;
  isRoot: boolean;
  children: TreeNode[];
}

// ── Layout: compute subtree widths, then assign positions ──

function subtreeWidth(node: TreeNode): number {
  if (!node.isExpanded || node.children.length === 0) return NODE_W;
  const childrenW = node.children.reduce((sum, c) => sum + subtreeWidth(c), 0);
  const gaps = (node.children.length - 1) * H_GAP;
  return Math.max(NODE_W, childrenW + gaps);
}

function layoutTree(
  node: TreeNode,
  cx: number, // center-x of this node's allocated band
  y: number,
  onExpand: (id: string, path: string) => void,
  onOpen: (path: string) => void
): { nodes: Node[]; edges: Edge[] } {
  const result: { nodes: Node[]; edges: Edge[] } = { nodes: [], edges: [] };

  // place this node centered in its band
  result.nodes.push({
    id: node.id,
    type: "fsNode",
    position: { x: cx - NODE_W / 2, y },
    data: {
      name: node.name,
      path: node.path,
      isDir: node.isDir,
      size: node.size,
      extension: node.extension,
      isExpanded: node.isExpanded,
      isRoot: node.isRoot,
      parentId: node.isRoot ? undefined : getParentId(node.id),
      onExpand,
      onOpen,
    } as unknown as Record<string, unknown>,
  });

  if (!node.isExpanded || node.children.length === 0) return result;

  // compute each child's subtree width
  const childWidths = node.children.map((c) => subtreeWidth(c));
  const totalChildrenW = childWidths.reduce((a, b) => a + b, 0);
  const totalGaps = (node.children.length - 1) * H_GAP;
  const totalW = totalChildrenW + totalGaps;

  // start placing children from left edge of the band
  let childX = cx - totalW / 2;
  const childY = y + NODE_H + V_GAP;

  for (let i = 0; i < node.children.length; i++) {
    const cw = childWidths[i];
    const childCx = childX + cw / 2;

    // edge from parent to child
    result.edges.push({
      id: `e||${node.id}||${node.children[i].id}`,
      source: node.id,
      target: node.children[i].id,
      style: { stroke: "var(--edge-stroke, rgba(255,255,255,0.1))", strokeWidth: 1 },
    });

    // recurse
    const sub = layoutTree(node.children[i], childCx, childY, onExpand, onOpen);
    result.nodes.push(...sub.nodes);
    result.edges.push(...sub.edges);

    childX += cw + H_GAP;
  }

  return result;
}

function getParentId(nodeId: string): string | undefined {
  const sep = nodeId.lastIndexOf("||");
  if (sep === -1) return undefined;
  // The parent id is everything before the last "||<path>" segment
  // But our IDs are: root||/path for root, parentId||childPath for children
  // So parent is everything before the last ||
  return nodeId.substring(0, sep);
}

// ── Hook ──

export function useFileTree(
  onExpand: (id: string, path: string) => void,
  onOpen: (path: string) => void
) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const treeRef = useRef<TreeNode | null>(null);
  const onExpandRef = useRef(onExpand);
  onExpandRef.current = onExpand;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  // walk tree to find a node by id
  const findNode = useCallback((id: string, root: TreeNode | null): TreeNode | null => {
    if (!root) return null;
    if (root.id === id) return root;
    for (const child of root.children) {
      const found = findNode(id, child);
      if (found) return found;
    }
    return null;
  }, []);

  // re-layout entire tree from root and push to react-flow state
  const relayout = useCallback(() => {
    if (!treeRef.current) return;
    const { nodes: n, edges: e } = layoutTree(
      treeRef.current,
      0,
      0,
      (id, path) => onExpandRef.current(id, path),
      (path) => onOpenRef.current(path)
    );
    setNodes(n);
    setEdges(e);
  }, []);

  const expandNode = useCallback(
    async (nodeId: string, path: string) => {
      const treeNode = findNode(nodeId, treeRef.current);
      if (!treeNode) return;

      if (treeNode.isExpanded) {
        // collapse: clear children, mark unexpanded
        treeNode.isExpanded = false;
        treeNode.children = [];
        relayout();
        return;
      }

      // expand: read dir, add children to tree, relayout
      let entries: FileEntry[] = [];
      try {
        entries = await invoke<FileEntry[]>("read_dir", { path });
      } catch {
        return;
      }

      treeNode.isExpanded = true;
      treeNode.children = entries.map((entry) => ({
        id: `${nodeId}||${entry.path}`,
        name: entry.name,
        path: entry.path,
        isDir: entry.is_dir,
        size: entry.size,
        extension: entry.extension,
        isExpanded: false,
        isRoot: false,
        children: [],
      }));

      relayout();
    },
    [findNode, relayout]
  );

  const loadRoot = useCallback(
    async (path: string, _expandCb: (id: string, p: string) => void) => {
      const rootId = `root||${path}`;
      treeRef.current = {
        id: rootId,
        name: path.split("/").pop() || path,
        path,
        isDir: true,
        size: 0,
        extension: "",
        isExpanded: false,
        isRoot: true,
        children: [],
      };
      relayout();
    },
    [relayout]
  );

  // Reveal a folder by absolute path: expand every ancestor from root down,
  // then return the deterministic node id for that path (or null if unreachable).
  // Additive over expandNode — does not touch the layout algorithm.
  const revealPath = useCallback(
    async (targetPath: string): Promise<string | null> => {
      const root = treeRef.current;
      if (!root || !targetPath.startsWith(root.path)) return null;

      // Ordered ancestor abs-paths from root → target.
      // root=/a, target=/a/b/c  →  ["/a", "/a/b", "/a/b/c"]
      const chain: string[] = [root.path];
      if (targetPath !== root.path) {
        const rest = targetPath.slice(root.path.length).split("/").filter(Boolean);
        let acc = root.path.replace(/\/$/, "");
        for (const seg of rest) {
          acc = `${acc}/${seg}`;
          chain.push(acc);
        }
      }

      // Walk down, expanding any collapsed level as we go.
      let cursor: TreeNode = root;
      let id = root.id;
      for (let i = 1; i < chain.length; i++) {
        if (!cursor.isExpanded || cursor.children.length === 0) {
          let entries: FileEntry[] = [];
          try {
            entries = await invoke<FileEntry[]>("read_dir", { path: cursor.path });
          } catch {
            break;
          }
          const parent = cursor;
          parent.isExpanded = true;
          parent.children = entries.map((entry) => ({
            id: `${parent.id}||${entry.path}`,
            name: entry.name,
            path: entry.path,
            isDir: entry.is_dir,
            size: entry.size,
            extension: entry.extension,
            isExpanded: false,
            isRoot: false,
            children: [],
          }));
        }
        const child = cursor.children.find((c) => c.path === chain[i]);
        if (!child) break;
        cursor = child;
        id = child.id;
      }

      relayout();
      return id;
    },
    [relayout]
  );

  // Re-read an expanded folder's contents and reconcile in place — used after
  // file operations (rename / duplicate / new folder / trash) so the canvas
  // reflects disk. Existing children keep their expansion + subtree.
  const refreshFolder = useCallback(
    async (folderPath: string) => {
      const root = treeRef.current;
      if (!root) return;
      const findByPath = (node: TreeNode): TreeNode | null => {
        if (node.path === folderPath) return node;
        for (const c of node.children) {
          const f = findByPath(c);
          if (f) return f;
        }
        return null;
      };
      const node = findByPath(root);
      if (!node || !node.isExpanded) return;

      let entries: FileEntry[] = [];
      try {
        entries = await invoke<FileEntry[]>("read_dir", { path: folderPath });
      } catch {
        return;
      }
      const existing = new Map(node.children.map((c) => [c.path, c]));
      node.children = entries.map((entry) => {
        const prev = existing.get(entry.path);
        if (prev) return prev; // keep expansion + subtree
        return {
          id: `${node.id}||${entry.path}`,
          name: entry.name,
          path: entry.path,
          isDir: entry.is_dir,
          size: entry.size,
          extension: entry.extension,
          isExpanded: false,
          isRoot: false,
          children: [],
        };
      });
      relayout();
    },
    [relayout]
  );

  // Collapse every expanded node back to root-only state.
  const collapseAll = useCallback(() => {
    if (!treeRef.current) return;
    const collapse = (node: TreeNode) => {
      node.isExpanded = false;
      node.children = [];
    };
    collapse(treeRef.current);
    relayout();
  }, [relayout]);

  return { nodes, edges, expandNode, loadRoot, revealPath, collapseAll, refreshFolder };
}
