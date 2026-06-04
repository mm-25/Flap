<!-- CONTEXT_BLOCK -->
# PLANS — Flap
Project Type: dev
Last Updated: [Wed 2026-06-03 15:00]

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

NEXT threads (not yet started):
1. **File operations** — copy/move between folders. Approaches brainstormed: carry-drag (A), cut/copy/paste (B), grab-mode (C). User deferred choice. Needs Rust `move_entry`/`copy_entry` + subtree relayout.
2. **TopNav breadcrumbs** — clickable ancestry trail; reuses `flyToPath`; would unlock sidebar "you are here" highlight via `selectedPath`.
3. **Custom app icon** — current icon is Tauri default scaffold.

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
