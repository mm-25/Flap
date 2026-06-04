# PLANS — Flap
_Last updated: [Wed 2026-06-03 15:00]_

---

**Quick Summary**
> v0.1.0 complete and on GitHub (https://github.com/mm-25/flap). All features shipped. Next: file copy/move operations, breadcrumbs, custom icon.

---

## Log

**[Wed 2026-06-03 15:00]** — ✅ v0.1.0 shipped + pushed to GitHub
All features complete. Selection pill, arrow-key nav, collapse all (⌘⇧C), fit view (⌘⇧F), outline (⌘⇧O), shortcuts modal (⌘/) all shipped. Pushed to https://github.com/mm-25/flap. Next: file ops, breadcrumbs, custom icon.

**[Wed 2026-06-03 14:05]** — 🔄 Copy/move is the active design thread
Focus mode removed; Quick Look + dock rework done. Now brainstorming how to copy/paste & move files on a spatial canvas (drag-drop vs cut/copy/paste vs grab-mode). Needs Rust fs commands + relayout. Breadcrumbs after.

**[Wed 2026-06-03 13:40]** — ✅ Levers 2 + 3 shipped — findability epic done
Focus mode + outline sidebar built. Next thread: breadcrumbs (would also unlock a "you are here" highlight in the sidebar). 💡 Polish: focus mode doesn't retro-collapse already-open branches; pins are global; dock has no overflow scroll.

**[Wed 2026-06-03 13:20]** — ✅ Levers 1 + 4 shipped, backlog set
Findability framed as 4 levers; built palette + dock. Remaining: 💡 accordion/focus layout (sprawl fix, touches layout — needs ok), outline sidebar, breadcrumbs (now reuses the fly-to primitive). No blockers.

**[Wed 2026-06-03 00:00]** — 🔄 Breadcrumb impl planned
Steps: selectedNodeId state in App → parse node ID for ancestors → clickable segments in TopNav → click zooms canvas. Overflow: collapse middle to `…`. Touches App.tsx + TopNav.tsx only.

---
