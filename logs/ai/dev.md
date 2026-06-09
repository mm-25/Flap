<!-- CONTEXT_BLOCK -->
# DEV — Flap
Project Type: dev
Last Updated: [Wed 2026-06-03 14:05]

## CURRENT STATE
Core canvas working. Node IDs encode full ancestry: `root||/path/to/a||/path/to/a/b`. Layout: horizontal children, vertical expansion, subtree-width algorithm ensures no overlap. Expand/collapse mutates treeRef in-place then relayouts. File open uses `tauri-plugin-opener`.

Findability features:
- **Outline sidebar**: `src/components/OutlineSidebar.tsx` — derives a tree from live `nodes`+`edges` (no hook coupling), renders nested rows. Row click → `flyToPath`; chevron → expand/collapse; file double-click → open. Toggled from TopNav.
- **Quick Look** (spacebar): `selectedPath` state in App, set on node click, cleared on `onPaneClick`. A SPACE keydown handler (guarded against input/textarea/contentEditable) invokes Rust `quick_look(path)` → spawns `qlmanage -p` (stdio nulled). Reads selection via `selectedPathRef` so the listener never rebinds.
- **Dock**: two scrollable zones — pinned (bounded `max-width:38%`, own overflow scroll) + recents (grows, newest-first so just-visited folder stays at the left edge, always visible). `Clear` button calls `clearRecents()` (useNavStore) — wipes recents, keeps pins. Chips `flex-shrink:0` for horizontal scroll; scrollbars hidden.

NOTE: Focus mode (former lever 2, accordion/collapse-siblings) was REMOVED — too confusing. `useFileTree` is back to free expansion (no `collapseSiblings`/`focusModeRef`/`setFocusMode`). `.btn-nav--active` retained (Outline toggle uses it).

Findability layer shipped (recents/pins + fuzzy jump palette):
- `src/hooks/useNavStore.ts` — recents (cap 12) + pinned folders, keyed by absolute path (stable; node IDs are not), persisted to localStorage (`flap.recents`, `flap.pinned`).
- `src/hooks/useFileTree.ts` `revealPath(path)` — expands every ancestor from root down to a collapsed target, returns the deterministic node id. Additive; does NOT touch layoutTree/subtreeWidth.
- `src/App.tsx` `flyToPath(path)` — shared fly-to primitive: mounted node → `fitView`; collapsed → `revealPath` then fly after 80ms relayout-commit delay. Records a visit each call.
- `src/components/SearchOverlay.tsx` — upgraded to fuzzy palette (subsequence scorer), recents-when-empty, pin-star toggle, jump-by-path. Candidate set = canvas nodes ∪ pinned ∪ recents (collapsed-but-known folders stay findable). Bound to Cmd+F and Cmd+P.
- `src/components/Dock.tsx` — floating bottom dock of pinned + recent chips, click to fly, hover pin-star.

Key architectural decisions:
- Tree state lives in `treeRef` (mutable ref), not React state — avoids stale closures in callbacks
- Layout recomputed from scratch on every expand/collapse — acceptable for current scale
- Node IDs: `root||<path>` for root, `<parentId>||<childPath>` for children — ancestry fully decodable from ID alone; this makes `revealPath` ids deterministic
- Nav state keyed by PATH, not node id — paths survive collapse/reopen and sessions
- `nodesRef` mirror in App keeps `flyToPath` stable while reading latest nodes

<!-- END CONTEXT_BLOCK -->

---

## CHANGE LOG

### [Thu 2026-06-04 23:30]
**Type:** bug
**Summary:** Real root cause of edges-missing / search-not-navigating: react-flow controlled without onNodesChange. Adopted proper controlled state.
**Detail:**
Bug persisted on the watcher-free build. Symptoms: connectors to root intermittently missing; search→Enter (and dock/arrow-nav) don't navigate; reload doesn't help. All trace to ONE cause: react-flow v12 was given controlled `nodes` (brand-new objects every render) WITHOUT `onNodesChange`, so it couldn't persist node measurements. Unmeasured nodes → edges can't be positioned (connectors vanish) AND `fitView` no-ops (search/dock/arrow-nav all call fitView via flyToNodeId). It "worked" in the original findability build because there were fewer re-renders; file-ops/selection/drag added enough re-renders to replace nodes mid-measurement and lose `measured`. FIX: switched to react-flow's controlled pattern — `useNodesState`/`useEdgesState` + `onNodesChange`/`onEdgesChange`. Our computed layout (`displayNodes`/`edges`) stays the source of truth; a sync effect writes it into `rfNodes`/`rfEdges` while preserving react-flow's measured dimensions (merge old node by id, take our position+data+type). ReactFlow now uses `rfNodes`/`rfEdges` + the change handlers. `npm run build` green. Installed to /Applications. COULD NOT verify live — the dev/WebView environment degraded to blank/black frames after many launch/kill cycles (machine at ~20% battery); needs a fresh machine state to confirm.
**Impact:** Should make edges render reliably and fitView-based navigation (search, dock, arrow keys) work consistently. Awaiting user confirmation on a fresh launch/reboot.

### [Thu 2026-06-04 23:10]
**Type:** bug
**Summary:** Diagnosed "issue persists" report — user was running a STALE /Applications build (watcher still in it). Installed the fixed build.
**Detail:**
User reported the instability persisted, triggered specifically by expanding a TCC-protected folder (Downloads/Documents) → macOS permission prompt → Allow → root node + edges vanish. Investigation finding: `npm run tauri build` outputs to `src-tauri/target/release/bundle/`, NOT `/Applications`. The `/Applications/Flap.app` the user (and I, via `open_application "Flap"`) was launching was an OLDER build that still contained the filesystem watcher — so the watcher-removal fix (commit 33ad5fd) was never actually being run. Confirmed multiple Flap instances were running simultaneously (`/Applications/Flap.app` PID + dev `target/debug/flap` PID). The fixed code (33ad5fd) DID render correctly in a dev instance this session (saw full UI incl. new Reload button). RESOLUTION: copied the fresh fixed bundle to `/Applications/Flap.app` so the user runs the watcher-free build. NOTE: late in the session the WebView began rendering blank on every launch (dev + release) with NO JS error and the bundle not executing — attributed to the machine choking after ~10 rapid launch/kill cycles at ~20% battery (WKWebView content-process pressure), not a code regression (same build rendered earlier). User should fully quit Flap (and ideally reboot / charge) then relaunch the /Applications build.
**Impact:** Fixed build now actually installed where the user launches it. Could not do a final live confirmation of the TCC scenario due to the environmental blank-WebView state.

### [Thu 2026-06-04 22:25]
**Type:** bug
**Summary:** Removed the filesystem watcher — it was destabilizing react-flow. Added manual Reload (⌘R).
**Detail:**
ROOT CAUSE of the "click root → root/edges disappear, can't interact" + "works then breaks" bugs: the live filesystem watcher. It watched the home dir recursively and was in the interest set from launch; on a machine with constant home/Library churn (this user has Adobe Creative Cloud → "Creative Cloud Files" folder, which writes constantly) it fired `fs-change` → `refreshFolder(home)` → `relayout` repeatedly. Each relayout replaces all node objects, so react-flow never stabilized: nodes/edges intermittently failed to render and `fitView` became a no-op (which also broke dock/search/arrow-nav, since they call fitView). Diagnosed by diffing working commit 3bf8c99 → 085b653; the watcher was the destabilizing addition. FIX: removed all watcher wiring — frontend `set_interest` effect, `fs-change` listener, `watch_root` call, `listen` import; Rust `WatchState`, `.setup()` watcher, `watch_root`/`set_interest` commands, notify imports + `notify` Cargo dep. `refreshFolder` retained (still used by copy/move/rename/trash — user-triggered, not racy). Added manual Reload: `handleReload` re-runs initRoot(currentPath) + clears selection; wired to a TopNav "Reload" button + ⌘R + shortcuts modal entry. VERIFIED live in dev: fresh launch → click root → root + edges render correctly + interactive; Fit view works (whole tree fits). Release app rebuilt.
**Impact:** Core canvas is stable again. Trade-off: external changes no longer auto-refresh — use Reload (⌘R). A debounced/safe watcher could be reintroduced later if wanted.

### [Wed 2026-06-03 17:00]
**Type:** bug + feature
**Summary:** Fixed canvas panning during node drag; added live filesystem watching.
**Detail:**
BUG: dragging a node to stage it also panned the canvas — because `nodesDraggable={false}` lets the press fall through to react-flow's pane pan. Fix: added react-flow's `nopan nodrag` classes to the `.fs-node` element (panning still works from empty canvas). FEATURE: external fs changes (deletes/moves/edits outside Flap) now auto-reflect. Backend: added `notify` crate (FSEvents on macOS). One recursive watcher on the open root (`watch_root` command, re-armed on Open folder). Frontend registers visible dirs via `set_interest` (root + expandedFolders) on every expansion change; the watcher only emits `fs-change` for events whose parent dir is in that set. Path matching is canonical→original keyed (HashMap) to survive macOS firmlink-resolved event paths. Frontend listens for `fs-change`, debounces 200ms, calls `refreshFolder(dir)` per changed dir (no-op if not expanded). Our own ops also trigger it harmlessly (refreshFolder is idempotent). cargo + npm build green.
**Impact:** Drag-to-stage no longer moves the canvas. Flap now stays in sync with the filesystem without a manual reload.

### [Wed 2026-06-03 16:30]
**Type:** feature
**Summary:** Copy/move via staging tray + custom pointer-drag layer.
**Detail:**
Phase 2 of file ops. New: `useShelf` (items + copy/move mode, multi-source, dedup by path), `useDragController` (custom pointer drag — NOT react-flow node drag; THRESHOLD=8px matches nodeClickDistance so clicks still expand; activates a ghost; hit-tests via `document.elementFromPoint`; Esc cancels; toggles `body.is-dragging`), `dragContext.ts` (DragContext so FsNode can start a node drag without prop-drilling), `Shelf.tsx` (bottom tray, Copy/Move toggle, per-item ✕, Clear, drag-out handle), `DragGhost.tsx` (cursor-following ghost, pointer-events:none so hit-testing sees through it). Two drag flows: node→shelf (stage) and shelf→folder (execute). FsNode gained `data-path`/`data-isdir` (drop hit-testing) + `onPointerDown` + `isDropTarget` class. ReactFlow set `nodesDraggable={false}`. App injects `isDropTarget` into displayNodes (folder under a tray-drag highlights). Rust: `copy_entry`/`move_entry` (unique_destination = never overwrite, keep-both naming; is_into_self guard; move falls back to copy+delete cross-volume). After drop: revealResultsIn(dest) (expand if collapsed else refreshFolder); move also refreshes source parents + clears shelf; copy keeps shelf for multi-destination. Context menu gained "Add to Tray". NOTE: had a TDZ bug — displayNodes referenced dropTargetPath before declaration; moved displayNodes below the drag controller.
**Impact:** Full copy/move, including the headline multi-source → single-destination flow. copy_entry/move_entry + refreshFolder are the fs-mutation primitives.

### [Wed 2026-06-03 15:40]
**Type:** feature
**Summary:** Right-click context menu + file-operation Rust commands.
**Detail:**
`ContextMenu.tsx` rendered from react-flow `onNodeContextMenu` (node) and `onPaneContextMenu` (empty canvas → only "New Folder"). Viewport-clamped via useLayoutEffect + getBoundingClientRect; closes on click-outside/Esc. New Rust commands in lib.rs (all registered): `reveal_in_finder` (`open -R`), `move_to_trash` (`trash` crate v5, recoverable), `rename_entry` (validates name, blocks collisions, returns new path), `duplicate_entry` (copy_recursively helper + duplicate_destination Finder-style " copy"/" copy N" naming), `create_folder` (collision suffix), `get_info` (→ ItemInfo: name/path/is_dir/size/extension/item_count/modified/created). Frontend: `PromptDialog.tsx` (reused for rename — selectStem selects name w/o extension — and new folder), `InfoModal.tsx`. `useFileTree.refreshFolder(folderPath)` finds node by path, if expanded re-reads dir and reconciles children by path (reuses existing child objects to preserve subtree expansion), relayouts. App wires ctxOpen/ctxReveal/ctxQuickLook/ctxGetInfo/ctxRename/ctxDuplicate/ctxNewFolder/ctxTrash; each mutation calls refreshFolder(parentDir) and updates selection. Cargo.toml: added `trash = "5"`.
**Impact:** Filesystem mutations now possible from the canvas. Established refreshFolder as the post-op canvas-sync primitive (reused by copy/move next).

### [Wed 2026-06-03 00:00]
**Type:** other
**Summary:** Dev log initialized; captured existing architecture decisions.
**Detail:**
useFileTree.ts: treeRef holds mutable TreeNode tree. expandNode reads dir via Tauri invoke, mutates treeRef, calls relayout(). relayout() calls layoutTree() which recursively computes positions using subtreeWidth() algorithm. Positions pushed to React state via setNodes/setEdges. App.tsx: expandCbRef pattern used to avoid stale closure on onNodeClick. initRootRef pattern used to avoid stale closure on loadRoot + fitView sequence. ColorScheme hook drives dot color on canvas background.
**Impact:** Baseline for future dev decisions.

### [Wed 2026-06-03 13:20]
**Type:** feature
**Summary:** Shipped findability layer — fuzzy jump palette + recents/pinned dock, on a shared fly-to-by-path primitive.
**Detail:**
Addressed scrolling/findability pain (panning to folders, forgetting position/name) with two features sharing one primitive. New `useNavStore` (recents cap 12 + pinned, path-keyed, localStorage). New `useFileTree.revealPath(path)` expands ancestors for collapsed targets and returns the deterministic node id (additive, layout untouched). New `App.flyToPath(path)`: mounted → `fitView`; collapsed → revealPath then fly after 80ms. `SearchOverlay` upgraded to fuzzy subsequence scorer, recents-when-empty, pin toggle, jump-by-path, candidate set = nodes ∪ pins ∪ recents; opens on Cmd+F and Cmd+P. New `Dock` component (bottom floating chips). CSS appended to App.css (dock + palette pin/caption); `.canvas-wrapper` made `position: relative` to anchor the dock. Verified: `tsc --noEmit` clean, `npm run build` green (202 modules).
**Impact:** Users can jump to any known folder by partial name or one click instead of panning. Establishes the reusable fly-to-by-path primitive that the planned breadcrumbs will also use.

### [Wed 2026-06-03 13:40]
**Type:** feature
**Summary:** Shipped levers 2 (focus/accordion mode) + 3 (outline sidebar).
**Detail:**
Focus mode: added `collapseSiblings(parent, keepId)` + `focusModeRef`/`setFocusMode()` to `useFileTree`; invoked in expandNode and revealPath so only one path stays open per level (accordion → single spine, kills sprawl). Toggle lives in TopNav, state in App (`focusMode`), persisted to `localStorage["flap.focusMode"]`, mirrored into hook via effect (`setTreeFocusMode` alias to avoid collision with App's state setter). Outline sidebar: new `OutlineSidebar.tsx` builds a tree from live `nodes`+`edges` (root = isRoot node, children via edge source→target map) and renders indented rows; row click flies (`flyToPath`), chevron toggles expand (`handleOutlineToggleExpand` → expandCbRef + recordVisit), file dbl-click opens. New TopNav toggle buttons with `btn-nav--active` styling; `.canvas-wrapper` already relative anchors the absolute sidebar (z-index 60, below search 100, above dock 50). Verified `npm run build` green (203 modules).
**Impact:** Two distinct ways to cut scroll tedium — structural (focus mode shrinks the canvas) and navigational (sidebar = scroll a list, click to fly). All 4 findability levers now in.

### [Wed 2026-06-03 14:05]
**Type:** feature
**Summary:** Removed Focus mode; added spacebar Quick Look + dock Clear/scroll/bounded-pins.
**Detail:**
(1) Removed Focus mode entirely (user found it confusing): deleted `collapseSiblings`, `focusModeRef`, `setFocusMode` and both call sites from useFileTree; removed focusMode state/effect/persist from App and the Focus button from TopNav. (2) Quick Look: added Rust command `quick_look(path)` (spawns `qlmanage -p`, stdio nulled) registered in invoke_handler; App tracks `selectedPath` on node click, clears on `onPaneClick`; SPACE keydown (input-guarded, reads `selectedPathRef`) invokes it. (3) Dock: `useNavStore.clearRecents()` (recents → [], pins kept); Dock split into `.dock__zone--pinned` (bounded 38%, own scroll) and `.dock__zone--recents` (flex grow, newest-first leftmost), chips `flex-shrink:0`, hidden scrollbars, `Clear` button. Verified: `npm run build` green (203 modules); `cargo check` green (4.3s).
**Impact:** Simpler model (no accordion). Native-feeling preview via spacebar. Dock stays usable when pins or recents grow — pins can't crowd out live recents, and recents are clearable. Note `qlmanage -p` may stack panels if pressed repeatedly (acceptable for now).
