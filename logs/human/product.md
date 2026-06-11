# PRODUCT — Flap
_Last updated: [Thu 2026-06-04 23:55]_

---

**Quick Summary**
> Spatial file manager that's now a full file manager too: right-click context menu, copy/move (direct drag + Shelf), multi-select, Open in Terminal, manual Reload. All findability features still live.

---

## Log

**[Thu 2026-06-04 23:55]** — ✅ Open in Terminal + multi-select + direct drag-to-folder
Right-click → Open in Terminal on any node. Marquee-drag empty canvas or Shift-click to select many items. Drag a selected node onto a folder → moves the whole selection (Finder spatial intent). Shelf still handles Copy and multi-destination batches.

**[Thu 2026-06-04 22:25]** — 🐛 Stability fix: removed live FS watcher + added Reload
External-change auto-refresh was destabilizing the canvas (constant tree rebuilds breaking edges, fitView, search, dock). Removed. Manual Reload added — TopNav button + ⌘R + shortcuts entry.

**[Wed 2026-06-03 16:30]** — ✅ Copy/move via drag-to-tray Shelf
Drag any file/folder onto the bottom Shelf to stage from anywhere on the canvas, toggle Copy or Move, drop the batch on the destination folder. Highlights as you hover. Never overwrites (keep-both naming); blocks copying/moving a folder into itself; works across volumes. The multi-source → single-destination flow is the standout.

**[Wed 2026-06-03 15:40]** — ✅ Right-click context menu (file ops phase 1)
Right-click any node for Open, Quick Look, Reveal in Finder, Get Info, New Folder, Rename, Duplicate, Move to Trash (recoverable). Right-click empty canvas → New Folder in the root.

**[Wed 2026-06-03 14:05]** — ✅ Quick Look + dock rework, ❌ Focus mode removed
Removed Focus mode (confusing). Spacebar now opens native Quick Look on the selected item. Dock: recents update as you browse + Clear button (keeps pins); pinned bounded + scrollable so they don't crowd new folders. Next thread: copy/move files (brainstorming).

**[Wed 2026-06-03 13:40]** — ✅ Focus mode + outline sidebar
Focus mode (TopNav toggle): expanding a folder collapses its siblings → canvas stays a narrow path, not a sprawl. Persists. Outline sidebar (TopNav toggle): slide-in tree; click a row to fly there, chevron to expand. Two more ways to stop panning. All 4 levers shipped.

**[Wed 2026-06-03 13:20]** — ✅ Jump palette + dock (findability)
Fixed "scrolling to find folders is tedious." Palette: fuzzy-search by partial name, recents when empty, pin stars, flies canvas to the folder. Dock: bottom bar of pinned + recent folders, click to fly. Jumping to a collapsed folder auto-expands the way there. Chose these (levers 1 + 4) over accordion layout / sidebar for first pass.

**[Wed 2026-06-03 00:00]** — 📌 Feature baseline
Working: auto-load home dir, open-folder dialog, expand/collapse, open files, Cmd+F search, minimap, fit-view, light/dark mode.
Planned: breadcrumbs in TopNav. Click segment → zoom canvas to ancestor (zoom-only, no auto-expand).

---
