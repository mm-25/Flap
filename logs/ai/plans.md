<!-- CONTEXT_BLOCK -->
# PLANS — Flap
Project Type: dev
Last Updated: [Thu 2026-06-04 21:35]

## CURRENT STATE
All planned features shipped. Project pushed to GitHub (public): https://github.com/mm-25/flap

Shipped feature set:
- ✅ Infinite canvas (pan/zoom, expand/collapse folders as nodes)
- ✅ Jump palette (⌘F/⌘P) — fuzzy search + fly-to + pin toggle
- ✅ Dock — expanded folders as live chips, pinned folders in ★ dropdown
- ✅ Outline sidebar (⌘⇧O) — synced tree, click to fly
- ✅ Quick Look (Space) — native qlmanage preview
- ✅ Keyboard navigation (arrows + Enter)
- ✅ Selection pill — floating name badge at top-centre of canvas
- ✅ Collapse all (⌘⇧C) — collapses tree + auto-fits view
- ✅ Fit view (⌘⇧F)
- ✅ Shortcuts modal (⌘/) — full keyboard reference
- ✅ Light/dark mode, minimap

Reusable primitives: `flyToPath(path)`, `revealPath(path)`, `collapseAll()`, `selectedPath` selection.

File operations — PHASE 1 (right-click context menu) SHIPPED:
- `ContextMenu.tsx` (onNodeContextMenu / onPaneContextMenu, viewport-clamped, click-outside/Esc close)
- Actions: Open, Quick Look, Reveal in Finder, Get Info, New Folder, Rename, Duplicate, Move to Trash
- New Rust commands: `reveal_in_finder`, `move_to_trash` (uses `trash` crate — recoverable), `rename_entry`, `duplicate_entry` (recursive copy + Finder-style " copy" naming), `create_folder`, `get_info` (→ ItemInfo struct)
- `PromptDialog.tsx` (rename + new folder), `InfoModal.tsx` (Get Info panel)
- `useFileTree.refreshFolder(path)` — re-reads an expanded folder, reconciles children in place (keeps subtree expansion), relayouts. Called after every mutating op.

File operations — PHASE 2 (copy/move drag-to-tray) SHIPPED:
- `useShelf` (staging items + copy/move mode), `useDragController` (custom pointer drag), `dragContext.ts`, `Shelf.tsx`, `DragGhost.tsx`
- node→shelf staging (multi-source), shelf→folder execute; Copy keeps tray, Move clears it; "Add to Tray" in context menu
- Rust `copy_entry`/`move_entry` (keep-both naming, self-guard, cross-volume fallback)

Drag-to-stage canvas-pan bug fixed (nopan/nodrag on nodes).

REVERTED: live filesystem watcher — it destabilized react-flow (constant relayout from home/Adobe-CC churn → broken render + dead fitView). Replaced with manual Reload (⌘R / TopNav button). A safe debounced watcher could return later.

NEXT threads (not yet started):
1. **TopNav breadcrumbs** — clickable ancestry trail; reuses `flyToPath`; would unlock sidebar "you are here" highlight via `selectedPath`.
2. **Custom app icon** — current icon is Tauri default scaffold.

Possible polish on copy/move (post-test):
- Per-item drag from tray (currently dragging any chip drags the whole batch).
- Progress UI for large folder copies (currently fire-and-forget).
- Direct node→folder drag (skip the tray) as a shortcut.
- Conflict resolution dialog (replace / keep both / skip) instead of always keep-both.

Open polish / tech-debt:
- Pins/recents are global, not per-root.
- Sidebar can overlap dock on narrow windows.
- `qlmanage -p` may stack panels on repeated spacebar presses.
- Hidden files filtered in `read_dir`; move/copy must handle name collisions.
- No codesigning — users must right-click → Open on first launch.

<!-- END CONTEXT_BLOCK -->

---

## CHANGE LOG

### [Wed 2026-06-03 00:00]
**Type:** other
**Summary:** Plans log initialized; breadcrumb impl plan captured.
**Detail:**
Breadcrumb plan discussed and agreed in session. Implementation touches: App.tsx (selectedNodeId state, pass fitView + nodes to TopNav), TopNav.tsx (replace static displayPath with clickable crumb segments). No hook or layout changes required. Clicking `…` in overflow: zoom-only to root, not expand-ancestors.
**Impact:** Baseline; breadcrumb impl is next action.

### [Wed 2026-06-03 13:20]
**Type:** decision
**Summary:** Findability framed as 4 levers; user chose 1 + 4; both shipped.
**Detail:**
Framed the "scrolling is tedious" problem as recall/traverse/sprawl, surfaced 4 levers: (1) fuzzy palette + fly-to, (2) focus/accordion layout, (3) outline sidebar, (4) recents/pinned dock. User picked 1 + 4. Both implemented and building clean. Remaining backlog: lever 2 (accordion — the structural sprawl fix, needs explicit ok since it touches layout), lever 3 (sidebar), and the previously-planned TopNav breadcrumbs (now trivially reuses `flyToPath`).
**Impact:** Sets the post-ship menu. No blockers. Awaiting user pick for next.

### [Wed 2026-06-03 13:40]
**Type:** decision
**Summary:** Levers 2 + 3 shipped; all 4 findability levers done. Breadcrumbs is the last open item.
**Detail:**
User asked to implement levers 2 (focus/accordion) and 3 (outline sidebar) together. Both built and building clean. Roadmap now fully delivered. Remaining backlog: TopNav breadcrumbs (reuses flyToPath) plus the polish items listed in CURRENT STATE (retro-collapse on focus toggle, per-root pins, dock overflow, "you are here" highlight which depends on a selection concept breadcrumbs would add).
**Impact:** Findability epic complete. Breadcrumbs is the natural next thread and would also unlock sidebar highlight.

### [Wed 2026-06-03 14:05]
**Type:** decision
**Summary:** Dropped Focus mode; shipped Quick Look + dock rework; copy/move is the new active design thread.
**Detail:**
User cut Focus mode (confusing). Added spacebar Quick Look and reworked the dock (scroll, bounded pins, Clear). Opened a new design thread: copy/paste & move files between folders in the spatial canvas — explicitly to be brainstormed. Candidate approaches: drag-drop node onto folder (Option=copy), cut/copy/paste keyboard into selected folder, or a two-click "grab → drop" mode. Will need Rust fs commands and subtree relayout. Breadcrumbs deferred behind file ops.
**Impact:** Sets file operations as the next build once an approach is chosen.

### [Wed 2026-06-03 15:00]
**Type:** other
**Summary:** v0.1.0 shipped — all planned features complete, pushed to GitHub.
**Detail:**
Remaining features shipped since last log: node selection highlight (isSelected in node data, blue ring + fill for files), selection pill (floating top-centre badge showing selected item name/icon), arrow-key navigation (siblings left/right, parent up, child down, Enter expand/open), collapse all (⌘⇧C, collapseAll in useFileTree), fit view shortcut (⌘⇧F), outline toggle shortcut (⌘⇧O), shortcuts modal (⌘/, ShortcutsModal component). All shortcuts use `e.key.toLowerCase()` to avoid WebKit case inconsistency with Shift modifier. README updated (correct GitHub URL, all features documented, shortcuts table). Project initialized as git repo and pushed to https://github.com/mm-25/flap (public).
**Impact:** v0.1.0 is live. Next threads: file operations (copy/move), breadcrumbs, custom app icon.

### [Wed 2026-06-03 15:40]
**Type:** feature
**Summary:** File ops phase 1 — Finder-like right-click context menu shipped.
**Detail:**
After a feasibility discussion, user chose to build the context menu (easy+medium tier) first, test, then do copy/move. Shipped: ContextMenu component (react-flow onNodeContextMenu/onPaneContextMenu, viewport-clamped, click-outside/Esc), with Open, Quick Look, Reveal in Finder, Get Info, New Folder, Rename, Duplicate, Move to Trash. Six new Rust commands (reveal_in_finder, move_to_trash via `trash` crate, rename_entry, duplicate_entry with recursive copy + " copy" naming, create_folder, get_info). PromptDialog (rename/new folder) + InfoModal (get info). useFileTree.refreshFolder reconciles an expanded folder in place after mutations. cargo check + npm build both green. Tags/Share/Services/Compress intentionally omitted (deep macOS integration). Move to Trash is recoverable (never hard delete).
**Impact:** Core file management now possible inside Flap. Phase 2 (copy/move drag-tray) is next after user testing.

### [Wed 2026-06-03 16:30]
**Type:** feature
**Summary:** File ops phase 2 — drag-to-tray copy/move shipped (incl. multi-source).
**Detail:**
Built the staging tray "shelf": drag canvas nodes into a bottom tray (collect from multiple folders), Copy/Move toggle, then drag the batch onto a destination folder. Custom pointer-drag layer (useDragController) instead of react-flow node drag, with elementFromPoint hit-testing. Rust copy_entry/move_entry added (keep-both naming, self-into-self guard, cross-volume copy+delete fallback). Context menu gained "Add to Tray". Both frontend + cargo green. Remaining: breadcrumbs, custom icon, plus copy/move polish (per-item drag, progress UI, direct node→folder, conflict dialog).
**Impact:** The full browse→organize→copy/move loop now works in-canvas. Awaiting user testing before polish.

### [Thu 2026-06-04 22:35]
**Type:** other
**Summary:** Rebuilt release `.app` and pushed the watcher-removal fix to GitHub.
**Detail:**
After confirming the FS-watcher removal fixed the instability (verified live: click root renders root+edges, Fit view works), rebuilt the release bundle and committed/pushed to https://github.com/mm-25/Flap (main). Changes: removed watcher (frontend + Rust + notify dep), added manual Reload (⌘R + TopNav button + shortcuts entry).
**Impact:** Stable build is current and on GitHub.

### [Thu 2026-06-04 21:35]
**Type:** other
**Summary:** Rebuilt release `.app` bundle after drag-pan fix + live filesystem watching.
**Detail:**
Ran `npm run tauri build` — release profile compiled clean (notify/trash/fsevent-sys included), bundle produced at `src-tauri/target/release/bundle/macos/Flap.app`. Bundle reflects: copy/move drag-tray, right-click context menu, nopan drag fix, and live FSEvents-based folder refresh. Still unsigned (`.dmg` not generated; right-click → Open required on first launch). No `.dmg`/codesigning config added yet.
**Impact:** Distributable build current with all latest features. Codesigning + .dmg remains open if wider distribution is wanted.
