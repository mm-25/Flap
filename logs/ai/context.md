<!-- CONTEXT_BLOCK -->
# CONTEXT — Flap
Project Type: dev
Last Updated: [Wed 2026-06-03 00:00]

## CURRENT STATE
Flap is a macOS free-canvas file manager. Files and folders are nodes on an infinite pan/zoom canvas. Clicking a folder expands it into child nodes laid out in a horizontal row below. Built with Tauri v2 + React (TypeScript) + @xyflow/react. Currently functional: root folder loads on launch (home dir), expand/collapse folders, open files with default app, search overlay (Cmd+F), minimap, fit-view. Breadcrumb navigation in TopNav is next planned feature.

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
