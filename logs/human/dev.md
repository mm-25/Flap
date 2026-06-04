# DEV — Flap
_Last updated: [Wed 2026-06-03 14:05]_

---

**Quick Summary**
> Canvas working. Findability: jump palette, dock (scroll zones + Clear), outline sidebar. Focus mode removed. Spacebar Quick Look added (Rust `qlmanage`). Frontend + cargo both green.

---

## Log

**[Wed 2026-06-03 14:05]** — ✅ Quick Look + dock rework, ❌ removed Focus mode
Cut Focus mode (confusing). Added Rust `quick_look` (qlmanage -p) + spacebar handler with `selectedPath`. Dock now has bounded scrollable pinned zone + growing recents + Clear button (`clearRecents`). `npm run build` + `cargo check` green.

**[Wed 2026-06-03 13:40]** — ✅ Focus mode + outline sidebar
Focus mode: `collapseSiblings` in useFileTree (one open path per level), TopNav toggle, persisted. Sidebar: new `OutlineSidebar.tsx`, builds tree from live nodes+edges, row click flies, chevron expands. `npm run build` green.

**[Wed 2026-06-03 13:20]** — ✅ Shipped findability layer
New: `useNavStore` (path-keyed recents/pins, localStorage), `revealPath` in useFileTree (expand collapsed ancestors → return node id, no layout change), `flyToPath` in App (the shared fly-to primitive), upgraded `SearchOverlay` (fuzzy + recents + pin toggle), new `Dock`. `tsc` clean, `npm run build` green (202 modules).

**[Wed 2026-06-03 00:00]** — 📌 Architecture baseline
treeRef (mutable) holds TreeNode tree. expandNode mutates + relayouts. Node IDs: `root||/path` → `parentId||/child/path`. Ancestry fully decodable from ID alone. expandCbRef + initRootRef patterns prevent stale closures in App.tsx.

---
