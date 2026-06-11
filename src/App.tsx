import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";

import FsNodeComponent from "./components/FsNode";
import TopNav from "./components/TopNav";
import SearchOverlay from "./components/SearchOverlay";
import Dock from "./components/Dock";
import OutlineSidebar from "./components/OutlineSidebar";
import SelectionPill from "./components/SelectionPill";
import ShortcutsModal from "./components/ShortcutsModal";
import ContextMenu, { CtxItem } from "./components/ContextMenu";
import PromptDialog from "./components/PromptDialog";
import InfoModal, { ItemInfo } from "./components/InfoModal";
import Shelf from "./components/Shelf";
import DragGhost from "./components/DragGhost";
import { DragContext } from "./components/dragContext";
import { useFileTree } from "./hooks/useFileTree";
import { useColorScheme } from "./hooks/useColorScheme";
import { useNavStore } from "./hooks/useNavStore";
import { useShelf, ShelfItem } from "./hooks/useShelf";
import { useDragController } from "./hooks/useDragController";

const nodeTypes: NodeTypes = { fsNode: FsNodeComponent };

function FlowCanvas() {
  const [currentPath, setCurrentPath] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  // broader multi-selection (marquee + shift-click). Always includes selectedPath when set.
  const [selectionSet, setSelectionSet] = useState<Set<string>>(() => new Set());
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: CtxItem | null } | null>(null);
  const [prompt, setPrompt] = useState<{
    title: string;
    initialValue: string;
    confirmLabel: string;
    selectStem?: boolean;
    onConfirm: (value: string) => void;
  } | null>(null);
  const [infoItem, setInfoItem] = useState<ItemInfo | null>(null);
  const scheme = useColorScheme();
  const dotColor = scheme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)";
  const { fitView } = useReactFlow();
  const expandCbRef = useRef<(id: string, path: string) => void>(() => {});
  const { recents, pinned, recordVisit, togglePin, isPinned } = useNavStore();
  const shelf = useShelf();

  // open file with default macOS app
  const handleOpenFile = useCallback(async (path: string) => {
    try {
      await openPath(path);
    } catch (err) {
      console.error("[App] openPath failed:", err);
      alert(`Could not open file:\n${path}\n\n${err}`);
    }
  }, []);

  const { nodes, edges, expandNode, loadRoot, revealPath, collapseAll, refreshFolder } = useFileTree(
    useCallback((id: string, path: string) => {
      expandCbRef.current(id, path);
    }, []),
    handleOpenFile
  );

  // ── Fly-to primitive (shared by search palette, dock, future breadcrumbs) ──
  const flyToNodeId = useCallback(
    (id: string) => {
      fitView({ nodes: [{ id }], padding: 0.5, duration: 500, maxZoom: 1.5 });
    },
    [fitView]
  );

  // currently expanded folders → shown in dock as live working-set chips
  const expandedFolders = useMemo(() =>
    nodes
      .filter((n) => (n.data as any)?.isDir && (n.data as any)?.isExpanded)
      .map((n) => {
        const d = n.data as any;
        return { path: d.path as string, name: d.name as string };
      }),
    [nodes]
  );

  // keep latest nodes + edges available in event handlers without stale closures
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  // latest selection, read by spacebar + arrow key handlers
  const selectedPathRef = useRef<string | null>(null);
  selectedPathRef.current = selectedPath;

  // derive selected item's display data for the SelectionPill. Shows a
  // count when more than one item is selected (multi-select via marquee /
  // shift-click); otherwise shows the focused single item.
  const selectedItem = useMemo(() => {
    const multiCount = selectionSet.size;
    if (multiCount > 1) {
      return { name: `${multiCount} items`, path: "", isDir: false, extension: "", count: multiCount };
    }
    if (!selectedPath) return null;
    const n = nodes.find((nd) => (nd.data as any)?.path === selectedPath);
    if (!n) return null;
    const d = n.data as any;
    return { name: d.name ?? "", path: d.path ?? "", isDir: !!d.isDir, extension: d.extension ?? "", count: 1 };
  }, [nodes, selectedPath, selectionSet]);

  const flyToPath = useCallback(
    async (path: string, name?: string) => {
      recordVisit({ path, name: name ?? path.split("/").pop() ?? path });
      const mounted = nodesRef.current.find((n) => (n.data as any)?.path === path);
      if (mounted) {
        flyToNodeId(mounted.id);
        return;
      }
      // collapsed → expand ancestors, then fly once relayout commits
      const id = await revealPath(path);
      if (id) setTimeout(() => flyToNodeId(id), 80);
    },
    [recordVisit, flyToNodeId, revealPath]
  );

  // react-flow level click handlers
  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: { id: string; data: Record<string, unknown> }) => {
      const d = node.data as any;
      const path = d.path as string | undefined;
      // shift = multi-select toggle. React-flow handles the selection update;
      // we just skip focus + expand so a shift-click doesn't open the folder.
      if (e.shiftKey) return;
      setSelectedPath(path ?? null);
      if (d.isDir) {
        expandCbRef.current(node.id, d.path);
        recordVisit({ path: d.path, name: d.name });
      }
    },
    [recordVisit]
  );

  // Sync react-flow's selection (single click / marquee / shift-click) into
  // our path-keyed selectionSet so the drag layer can act on it.
  const handleSelectionChange = useCallback(
    ({ nodes: selNodes }: { nodes: Array<{ data?: any }> }) => {
      const paths = new Set<string>();
      for (const n of selNodes) {
        const p = (n.data as any)?.path;
        if (p) paths.add(p);
      }
      setSelectionSet(paths);
    },
    []
  );

  const handleNodeDoubleClick = useCallback(
    (_e: React.MouseEvent, node: { data: Record<string, unknown> }) => {
      const d = node.data as any;
      if (!d.isDir && d.path) handleOpenFile(d.path);
    },
    [handleOpenFile]
  );

  // ── Right-click context menu ──
  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: { data: Record<string, unknown> }) => {
      e.preventDefault();
      const d = node.data as any;
      setSelectedPath(d.path ?? null);
      setCtxMenu({
        x: e.clientX,
        y: e.clientY,
        item: { path: d.path, name: d.name, isDir: !!d.isDir, extension: d.extension ?? "" },
      });
    },
    []
  );

  const handlePaneContextMenu = useCallback((e: React.MouseEvent | MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY, item: null });
  }, []);

  const parentDir = (p: string) => p.slice(0, p.lastIndexOf("/")) || "/";

  // ── File operations ──
  const ctxOpen = useCallback((item: CtxItem) => {
    setSelectedPath(item.path);
    if (item.isDir) {
      const n = nodesRef.current.find((nd) => (nd.data as any)?.path === item.path);
      if (n) expandCbRef.current(n.id, item.path);
    } else {
      handleOpenFile(item.path);
    }
  }, [handleOpenFile]);

  const ctxReveal = useCallback((item: CtxItem) => {
    invoke("reveal_in_finder", { path: item.path }).catch((e) =>
      console.error("[App] reveal failed:", e)
    );
  }, []);

  const ctxOpenTerminal = useCallback((item: CtxItem) => {
    const dir = item.isDir ? item.path : item.path.slice(0, item.path.lastIndexOf("/")) || "/";
    invoke("open_terminal", { path: dir }).catch((e) =>
      console.error("[App] open_terminal failed:", e)
    );
  }, []);

  const ctxQuickLook = useCallback((item: CtxItem) => {
    invoke("quick_look", { path: item.path }).catch((e) =>
      console.error("[App] quick_look failed:", e)
    );
  }, []);

  const ctxGetInfo = useCallback((item: CtxItem) => {
    invoke<ItemInfo>("get_info", { path: item.path })
      .then(setInfoItem)
      .catch((e) => console.error("[App] get_info failed:", e));
  }, []);

  const ctxRename = useCallback((item: CtxItem) => {
    setPrompt({
      title: `Rename "${item.name}"`,
      initialValue: item.name,
      confirmLabel: "Rename",
      selectStem: !item.isDir,
      onConfirm: async (newName) => {
        try {
          const newPath = await invoke<string>("rename_entry", { path: item.path, newName });
          await refreshFolder(parentDir(item.path));
          setSelectedPath(newPath);
        } catch (err) {
          alert(`Could not rename:\n${err}`);
        }
      },
    });
  }, [refreshFolder]);

  const ctxDuplicate = useCallback(async (item: CtxItem) => {
    try {
      const newPath = await invoke<string>("duplicate_entry", { path: item.path });
      await refreshFolder(parentDir(item.path));
      setSelectedPath(newPath);
    } catch (err) {
      alert(`Could not duplicate:\n${err}`);
    }
  }, [refreshFolder]);

  const ctxNewFolder = useCallback((item: CtxItem | null) => {
    // destination: clicked folder → inside it; file → its parent; pane → root
    const dir = item ? (item.isDir ? item.path : parentDir(item.path)) : currentPath;
    if (!dir) return;
    setPrompt({
      title: "New Folder",
      initialValue: "untitled folder",
      confirmLabel: "Create",
      onConfirm: async (name) => {
        try {
          const created = await invoke<string>("create_folder", { parentDir: dir, name });
          // ensure the target dir is expanded so the new folder is visible
          const dirNode = nodesRef.current.find((n) => (n.data as any)?.path === dir);
          const dirExpanded = dirNode && (dirNode.data as any)?.isExpanded;
          if (dirNode && !dirExpanded) {
            expandCbRef.current(dirNode.id, dir);
          } else {
            await refreshFolder(dir);
          }
          setTimeout(() => setSelectedPath(created), 100);
        } catch (err) {
          alert(`Could not create folder:\n${err}`);
        }
      },
    });
  }, [currentPath, refreshFolder]);

  const ctxTrash = useCallback(async (item: CtxItem) => {
    try {
      await invoke("move_to_trash", { path: item.path });
      if (selectedPathRef.current === item.path) setSelectedPath(null);
      await refreshFolder(parentDir(item.path));
    } catch (err) {
      alert(`Could not move to Trash:\n${err}`);
    }
  }, [refreshFolder]);

  const ctxAddToTray = useCallback((item: CtxItem) => {
    shelf.add(item);
  }, [shelf]);

  // ── Drag-to-tray copy/move ──
  const handleStageItems = useCallback((items: ShelfItem[]) => {
    items.forEach(shelf.add);
  }, [shelf]);

  // make a collapsed destination show its new contents after an op
  const revealResultsIn = useCallback(async (dir: string) => {
    const dirNode = nodesRef.current.find((n) => (n.data as any)?.path === dir);
    if (dirNode && !(dirNode.data as any)?.isExpanded) {
      expandCbRef.current(dirNode.id, dir);
    } else {
      await refreshFolder(dir);
    }
  }, [refreshFolder]);

  // Drop on folder. Source = "shelf" honours the shelf Copy/Move toggle.
  // Source = "node" (direct drag from canvas) is always a MOVE (Finder-style
  // spatial intent). Holding the shelf for multi-destination only applies to
  // the shelf flow.
  const handleDropOnFolder = useCallback(
    async (folderPath: string, items: ShelfItem[], source: "node" | "shelf") => {
      const mode: "copy" | "move" = source === "node" ? "move" : shelf.mode;
      const cmd = mode === "move" ? "move_entry" : "copy_entry";
      for (const it of items) {
        try {
          await invoke(cmd, { src: it.path, destDir: folderPath });
        } catch (err) {
          alert(`Could not ${mode} "${it.name}":\n${err}`);
        }
      }
      await revealResultsIn(folderPath);
      if (mode === "move") {
        const parents = new Set(items.map((i) => parentDir(i.path)));
        for (const p of parents) await refreshFolder(p);
        if (source === "shelf") shelf.clear();
      }
    },
    [shelf, refreshFolder, revealResultsIn]
  );

  const selectionSetRef = useRef(selectionSet);
  selectionSetRef.current = selectionSet;

  // If the grabbed node is part of the current selection, drag the whole
  // selection together. Otherwise drag just the one node.
  const resolveNodeDragItems = useCallback((item: ShelfItem): ShelfItem[] => {
    const sel = selectionSetRef.current;
    if (!sel.has(item.path) || sel.size <= 1) return [item];
    const out: ShelfItem[] = [];
    for (const n of nodesRef.current) {
      const d = n.data as any;
      if (d?.path && sel.has(d.path)) {
        out.push({ path: d.path, name: d.name, isDir: !!d.isDir, extension: d.extension ?? "" });
      }
    }
    return out.length ? out : [item];
  }, []);

  const { drag, startNodeDrag, startShelfDrag } = useDragController({
    onStageItems: handleStageItems,
    onDropOnFolder: handleDropOnFolder,
    resolveNodeDragItems,
  });

  const dragCtx = useMemo(() => ({ startNodeDrag }), [startNodeDrag]);
  const dropTargetPath = drag?.target?.type === "folder" ? drag.target.path : null;

  // inject isSelected + isDropTarget into node data for FsNode rendering
  const displayNodes = useMemo(
    () => nodes.map((n) => {
      const path = (n.data as any).path as string | undefined;
      return {
        ...n,
        data: {
          ...n.data,
          isSelected: path ? selectionSet.has(path) : false,
          isDropTarget: path === dropTargetPath,
        },
      };
    }),
    [nodes, selectionSet, dropTargetPath]
  );

  // ── React Flow controlled state ──
  // react-flow REQUIRES onNodesChange to apply node measurements; without it,
  // edges can't be positioned and fitView (search / dock / arrow-nav) no-ops.
  // Our computed layout stays the source of truth; we sync it in while
  // preserving react-flow's measured sizes (keyed by node id).
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(displayNodes);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(edges);

  useEffect(() => {
    setRfNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      return displayNodes.map((n) => {
        const old = prevById.get(n.id);
        // keep react-flow's measured dimensions; take our position + data
        return old
          ? { ...old, position: n.position, data: n.data, type: n.type }
          : n;
      });
    });
  }, [displayNodes, setRfNodes]);

  useEffect(() => {
    setRfEdges(edges);
  }, [edges, setRfEdges]);

  useEffect(() => {
    expandCbRef.current = (id, path) => expandNode(id, path);
  }, [expandNode]);

  // sidebar row expand/collapse — same path as a canvas folder click
  const handleOutlineToggleExpand = useCallback(
    (id: string, path: string) => {
      expandCbRef.current(id, path);
      recordVisit({ path, name: path.split("/").pop() ?? path });
    },
    [recordVisit]
  );

  const initRootRef = useRef<((path: string) => Promise<void>) | null>(null);
  initRootRef.current = async (path: string) => {
    await loadRoot(path, (id, p) => expandCbRef.current(id, p));
    setCurrentPath(path);
    setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 150);
  };

  const initRoot = useCallback((path: string) => initRootRef.current?.(path), []);

  useEffect(() => {
    invoke<string>("get_home_dir").then((home) => initRoot(home));
  }, [initRoot]);

  // Manual reload — re-read the current root from disk (picks up external changes)
  const handleReload = useCallback(() => {
    if (currentPath) {
      setSelectedPath(null);
      setSelectionSet(new Set());
      initRoot(currentPath);
    }
  }, [currentPath, initRoot]);

  // Global ⌘-shortcut handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      // ⌘F / ⌘P → jump palette
      if (!e.shiftKey && (k === "f" || k === "p")) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      // ⌘⇧F → fit view
      if (e.shiftKey && k === "f") {
        e.preventDefault();
        fitView({ padding: 0.3, duration: 400 });
        return;
      }
      // ⌘⇧O → toggle outline
      if (e.shiftKey && k === "o") {
        e.preventDefault();
        setOutlineOpen((v) => !v);
        return;
      }
      // ⌘⇧C → collapse all
      if (e.shiftKey && k === "c") {
        e.preventDefault();
        collapseAll();
        setSelectedPath(null);
        setSelectionSet(new Set());
        setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 80);
        return;
      }
      // ⌘R → reload current root from disk
      if (!e.shiftKey && k === "r") {
        e.preventDefault();
        handleReload();
        return;
      }
      // ⌘/ → shortcuts reference
      if (!e.shiftKey && e.key === "/") {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fitView, collapseAll, handleReload]);

  // SPACE → macOS Quick Look preview of the selected item
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (!selectedPathRef.current) return;
      e.preventDefault();
      invoke("quick_look", { path: selectedPathRef.current }).catch((err) =>
        console.error("[App] quick_look failed:", err)
      );
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Arrow-key navigation between nodes.
  // Left/Right → prev/next sibling (sorted by canvas x position).
  // Up → parent folder.
  // Down → child closest to parent's centre x (i.e. the "middle" one).
  // Enter → expand/collapse folder, or open file.
  useEffect(() => {
    const KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"]);
    const handler = (e: KeyboardEvent) => {
      if (!KEYS.has(e.key)) return;
      if (searchOpen) return; // palette owns arrow keys when open
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      const path = selectedPathRef.current;
      const allNodes = nodesRef.current;
      const allEdges = edgesRef.current;

      // Enter with no selection → do nothing
      if (e.key === "Enter" && !path) return;

      // If nothing selected, pick the root node on any arrow
      if (!path) {
        const root = allNodes.find((n) => (n.data as any)?.isRoot);
        if (root) {
          e.preventDefault();
          const d = root.data as any;
          setSelectedPath(d.path);
          flyToNodeId(root.id);
        }
        return;
      }

      const currentNode = allNodes.find((n) => (n.data as any)?.path === path);
      if (!currentNode) return;

      const parentEdge = allEdges.find((ed) => ed.target === currentNode.id);
      const parentNode = parentEdge ? allNodes.find((n) => n.id === parentEdge.source) : null;

      // siblings: all children of the same parent, sorted by x
      const siblings = parentEdge
        ? allEdges
            .filter((ed) => ed.source === parentEdge.source)
            .map((ed) => allNodes.find((n) => n.id === ed.target))
            .filter((n): n is typeof currentNode => !!n)
            .sort((a, b) => a.position.x - b.position.x)
        : [currentNode];
      const sibIdx = siblings.findIndex((n) => n.id === currentNode.id);

      // children sorted by x
      const children = allEdges
        .filter((ed) => ed.source === currentNode.id)
        .map((ed) => allNodes.find((n) => n.id === ed.target))
        .filter((n): n is typeof currentNode => !!n)
        .sort((a, b) => a.position.x - b.position.x);

      let target: typeof currentNode | null = null;

      if (e.key === "ArrowLeft") {
        target = sibIdx > 0 ? siblings[sibIdx - 1] : null;
      } else if (e.key === "ArrowRight") {
        target = sibIdx < siblings.length - 1 ? siblings[sibIdx + 1] : null;
      } else if (e.key === "ArrowUp") {
        target = parentNode ?? null;
      } else if (e.key === "ArrowDown") {
        if (children.length > 0) {
          // pick child whose x is closest to the current node's centre
          const cx = currentNode.position.x + 100; // NODE_W/2 ≈ 100
          target = children.reduce((best, c) =>
            Math.abs(c.position.x - cx) < Math.abs(best.position.x - cx) ? c : best
          );
        } else {
          // folder not yet expanded → trigger expand, then select first child after relayout
          const d = currentNode.data as any;
          if (d.isDir) {
            e.preventDefault();
            expandCbRef.current(currentNode.id, d.path);
            setTimeout(() => {
              const fresh = nodesRef.current;
              const firstChild = edgesRef.current
                .filter((ed) => ed.source === currentNode.id)
                .map((ed) => fresh.find((n) => n.id === ed.target))
                .filter((n): n is NonNullable<typeof n> => !!n)
                .sort((a, b) => a.position.x - b.position.x)[0];
              if (firstChild) {
                const fd = firstChild.data as any;
                setSelectedPath(fd.path);
                flyToNodeId(firstChild.id);
              }
            }, 120);
          }
          return;
        }
      } else if (e.key === "Enter") {
        const d = currentNode.data as any;
        e.preventDefault();
        if (d.isDir) {
          expandCbRef.current(currentNode.id, d.path);
        } else if (d.path) {
          handleOpenFile(d.path);
        }
        return;
      }

      if (target) {
        e.preventDefault();
        const d = target.data as any;
        setSelectedPath(d.path);
        flyToNodeId(target.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen, flyToNodeId, handleOpenFile]);

  return (
    <div className="app">
      <TopNav
        currentPath={currentPath}
        onOpenFolder={initRoot}
        onResetView={() => fitView({ padding: 0.3, duration: 400 })}
        onReload={handleReload}
        onCollapseAll={() => { collapseAll(); setSelectedPath(null); setSelectionSet(new Set()); setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 80); }}
        outlineOpen={outlineOpen}
        onToggleOutline={() => setOutlineOpen((v) => !v)}
        onShowShortcuts={() => setShortcutsOpen((v) => !v)}
      />
      <div className="canvas-wrapper">
        <SelectionPill item={selectedItem} />
        <DragContext.Provider value={dragCtx}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          panOnScroll
          nodesDraggable={false}
          zoomOnDoubleClick={false}
          nodeClickDistance={8}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneContextMenu={handlePaneContextMenu}
          onPaneClick={() => { setSelectedPath(null); setSelectionSet(new Set()); }}
          selectionOnDrag
          panOnDrag={false}
          selectionKeyCode={null}
          multiSelectionKeyCode="Shift"
          defaultEdgeOptions={{ animated: false }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color={dotColor}
          />
          <MiniMap
            className="flap-minimap"
            pannable
            zoomable
            nodeColor={(n) => {
              const d = n.data as any;
              if (d?.isRoot) return "var(--color-primary-on-dark)";
              if (d?.isExpanded) return "var(--color-primary)";
              if (d?.isDir) return "var(--text-muted)";
              return "var(--border-node)";
            }}
            maskColor="rgba(0,0,0,0.35)"
            ariaLabel="Canvas overview"
          />
        </ReactFlow>
        </DragContext.Provider>
        <Dock
          pinned={pinned}
          active={expandedFolders}
          isPinned={isPinned}
          onJump={(p) => flyToPath(p)}
          onTogglePin={togglePin}
        />
        <OutlineSidebar
          isOpen={outlineOpen}
          nodes={nodes}
          edges={edges}
          onClose={() => setOutlineOpen(false)}
          onJump={(p) => flyToPath(p)}
          onToggleExpand={handleOutlineToggleExpand}
          onOpenFile={handleOpenFile}
        />
        <Shelf
          items={shelf.items}
          mode={shelf.mode}
          visible={shelf.items.length > 0 || drag?.kind === "node"}
          dropActive={drag?.kind === "node" && drag.target?.type === "shelf"}
          onSetMode={shelf.setMode}
          onRemove={shelf.remove}
          onClear={shelf.clear}
          onStartDrag={(e) => startShelfDrag(e, shelf.items)}
        />
      </div>
      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          item={ctxMenu.item}
          onClose={() => setCtxMenu(null)}
          onOpen={ctxOpen}
          onQuickLook={ctxQuickLook}
          onReveal={ctxReveal}
          onOpenTerminal={ctxOpenTerminal}
          onGetInfo={ctxGetInfo}
          onRename={ctxRename}
          onDuplicate={ctxDuplicate}
          onAddToTray={ctxAddToTray}
          onNewFolder={ctxNewFolder}
          onTrash={ctxTrash}
        />
      )}
      {drag && (
        <DragGhost
          items={drag.items}
          x={drag.x}
          y={drag.y}
          active={drag.target !== null}
        />
      )}
      {prompt && (
        <PromptDialog
          title={prompt.title}
          initialValue={prompt.initialValue}
          confirmLabel={prompt.confirmLabel}
          selectStem={prompt.selectStem}
          onConfirm={(v) => { prompt.onConfirm(v); setPrompt(null); }}
          onClose={() => setPrompt(null)}
        />
      )}
      {infoItem && <InfoModal info={infoItem} onClose={() => setInfoItem(null)} />}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        nodes={nodes}
        recents={recents}
        pinned={pinned}
        isPinned={isPinned}
        onJump={(p) => flyToPath(p)}
        onTogglePin={togglePin}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
