# PRODUCT — Flap
_Last updated: [Wed 2026-06-03 14:05]_

---

**Quick Summary**
> Spatial file manager — whole tree on one canvas. Findability: palette, dock (now scrolls + Clear), sidebar. Focus mode removed. Spacebar = Quick Look preview. Next: copy/move files.

---

## Log

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
