<!-- CONTEXT_BLOCK -->
# CONTEXT — Flap
Project Type: dev
Last Updated: [Thu 2026-06-04 23:55]

## CURRENT STATE
Flap is a macOS free-canvas file manager. Files and folders are nodes on an infinite pan/zoom canvas. Clicking a folder expands it into child nodes laid out in a horizontal row below. Built with Tauri v2 + React (TypeScript) + @xyflow/react. Repo: https://github.com/mm-25/Flap (public, main = HEAD `d9ba093`).

Functional today:
- **Navigation:** root auto-loads home dir, expand/collapse folders, jump palette (⌘F/⌘P) with fuzzy matching, outline sidebar (⌘⇧O), arrow-key nav (←→↑↓), selection pill (top-centre badge), recents/pinned dock with star-button dropdown, minimap, fit-view (⌘⇧F), collapse-all (⌘⇧C), manual reload (⌘R), light/dark mode.
- **File operations (right-click context menu):** Open, Quick Look (Space), Reveal in Finder, Open in Terminal, Get Info, New Folder, Rename, Duplicate, Add to Tray, Move to Trash (recoverable via `trash` crate).
- **Selection:** marquee-drag (react-flow native via `selectionOnDrag`) + shift-click toggle. Path-keyed `selectionSet` mirrored from react-flow `onSelectionChange`.
- **Copy/move:** direct drag-to-folder (move, multi-node aware), plus bottom Shelf staging tray with Copy/Move toggle for multi-source / multi-destination batches.
- **Persistence:** recents + pinned folders + focus mode preference saved to localStorage.

Removed: live FS watcher (caused instability — re-rebuilt the node tree on disk churn from Adobe CC and other constant writers; replaced with manual Reload).

**Location:** `/Users/mufaddalmiyajiwala/Documents/Random/Flap/flap/`
**Run:** `npm run tauri dev` from `flap/` (requires `source ~/.cargo/env` first)
**Distributable build:** `npm run tauri build` → `src-tauri/target/release/bundle/macos/Flap.app`. The installed copy lives at `/Applications/Flap.app`.

**Location:** `/Users/mufaddalmiyajiwala/Documents/Random/Flap/flap/`
**Run:** `npm run tauri dev` from `flap/` (requires `source ~/.cargo/env` first)

<!-- END CONTEXT_BLOCK -->

---

## CHANGE LOG

### [Wed 2026-06-03 00:00]
**Type:** other
**Summary:** Project logger initialized for Flap.
**Detail:**
Flap is a macOS spatial file manager. Stack: Tauri v2 (Rust backend) + Vite + React + TypeScript + @xyflow/react for canvas. Apple-inspired design system (SF Pro, #0066cc primary, dark tile surfaces) defined in `DESIGN.md` and `src/tokens.css`. Key files: `src-tauri/src/lib.rs` (read_dir, get_home_dir commands), `src/hooks/useFileTree.ts` (node/edge state + expand/collapse), `src/components/FsNode.tsx` (custom react-flow node), `src/components/TopNav.tsx` (nav bar), `src/App.tsx` (ReactFlowProvider + canvas). App auto-loads home dir on launch. Scaffolded and building cleanly.
**Impact:** Logging baseline established.

### [Thu 2026-06-04 23:55]
**Type:** other
**Summary:** Context refresh covering file-ops, copy/move, stability fixes, multi-select, terminal.
**Detail:**
Since the baseline, the project has grown well beyond a viewer. New surfaces: ContextMenu, Shelf, DragGhost, SelectionPill, ShortcutsModal, PromptDialog, InfoModal. New hooks: useShelf, useDragController, refreshFolder + collapseAll on useFileTree. New Rust commands: reveal_in_finder, open_terminal, move_to_trash (trash crate), rename_entry, duplicate_entry, copy_entry, move_entry, create_folder, get_info. Stability story: original tree-rebuild approach was destabilized by a live FS watcher → removed (manual Reload added) and react-flow was migrated to the proper controlled-state pattern (useNodesState/useEdgesState + onNodesChange/onEdgesChange) so edges and fitView work consistently. Multi-select uses react-flow's native selection (selectionOnDrag + multiSelectionKeyCode="Shift") mirrored to a path-keyed selectionSet. Direct drag from a selected node moves the whole selection; the Shelf retains Copy/Move toggle for cross-source batches.
**Impact:** Brings the context block up to date with a year of features so a fresh agent can resume without spelunking through dev.md.
