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
