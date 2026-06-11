# DEV — Flap
_Last updated: [Thu 2026-06-04 23:55]_

---

**Quick Summary**
> Full file manager: navigation, file ops, copy/move, multi-select, terminal launch. Stability rebuild — removed FS watcher, fixed react-flow controlled-state bug. All on GitHub at mm-25/Flap.

---

## Log

**[Thu 2026-06-04 23:55]** — ✅ Open in Terminal + multi-select + direct drag-to-folder
Rust `open_terminal` (open -a Terminal <dir>) + right-click menu entry. Marquee selection (react-flow `selectionOnDrag`) + Shift-click multi-select (`multiSelectionKeyCode="Shift"`) mirrored via `onSelectionChange` into a path-keyed `selectionSet`. `resolveNodeDragItems` in drag controller expands a single grabbed node to the full selection when it's part of it. `onDropOnFolder` now takes a source parameter — `node` source always moves (Finder spatial intent), `shelf` source respects Copy/Move toggle. Hit-test excludes self-folders. Built + installed + pushed (d9ba093).

**[Thu 2026-06-04 23:30]** — 🐛 Real react-flow bug fixed (controlled state)
Diagnosed the bug that survived the watcher removal: react-flow was given controlled `nodes` (new objects every render) WITHOUT `onNodesChange`, so it couldn't persist measurements → edges to root vanished, fitView became a no-op (broke search/dock/arrow nav). Switched to `useNodesState`/`useEdgesState` + `onNodesChange`/`onEdgesChange`. Computed layout stays source of truth; sync effect merges into rfNodes preserving react-flow's measured sizes by id.

**[Thu 2026-06-04 22:25]** — 🐛 Removed FS watcher (was destabilizing) + added Reload (⌘R)
The notify-based filesystem watcher fired constantly on home dir churn (Adobe CC etc), rebuilding the node tree and intermittently breaking the canvas. Removed: frontend wiring + Rust setup/commands + notify dep. Added manual Reload — TopNav button + ⌘R + shortcuts entry. handleReload re-runs initRoot(currentPath) and clears selection.

**[Wed 2026-06-03 16:30]** — ✅ Copy/move drag-to-tray Shelf
Custom pointer drag (not react-flow node drag): pickup threshold 8px, ghost follows cursor, hit-test via elementFromPoint. Two flows: node→shelf (stage) and shelf→folder (execute per Copy/Move toggle). Rust copy_entry/move_entry with keep-both naming (unique_destination), self-into-self guard, cross-volume copy+delete fallback.

**[Wed 2026-06-03 15:40]** — ✅ Right-click context menu
ContextMenu component (onNodeContextMenu / onPaneContextMenu, viewport-clamped, click-outside/Esc). Rust commands: reveal_in_finder, move_to_trash (trash crate v5), rename_entry, duplicate_entry, create_folder, get_info. PromptDialog (rename / new folder) + InfoModal (Get Info). refreshFolder in useFileTree reconciles a folder in place after mutation while preserving expanded subtrees.

**[Wed 2026-06-03 14:05]** — ✅ Quick Look + dock rework, ❌ removed Focus mode
Cut Focus mode (confusing). Added Rust `quick_look` (qlmanage -p) + spacebar handler with `selectedPath`. Dock now has bounded scrollable pinned zone + growing recents + Clear button (`clearRecents`). `npm run build` + `cargo check` green.

**[Wed 2026-06-03 13:40]** — ✅ Focus mode + outline sidebar
Focus mode: `collapseSiblings` in useFileTree (one open path per level), TopNav toggle, persisted. Sidebar: new `OutlineSidebar.tsx`, builds tree from live nodes+edges, row click flies, chevron expands. `npm run build` green.

**[Wed 2026-06-03 13:20]** — ✅ Shipped findability layer
New: `useNavStore` (path-keyed recents/pins, localStorage), `revealPath` in useFileTree (expand collapsed ancestors → return node id, no layout change), `flyToPath` in App (the shared fly-to primitive), upgraded `SearchOverlay` (fuzzy + recents + pin toggle), new `Dock`. `tsc` clean, `npm run build` green (202 modules).

**[Wed 2026-06-03 00:00]** — 📌 Architecture baseline
treeRef (mutable) holds TreeNode tree. expandNode mutates + relayouts. Node IDs: `root||/path` → `parentId||/child/path`. Ancestry fully decodable from ID alone. expandCbRef + initRootRef patterns prevent stale closures in App.tsx.

---
