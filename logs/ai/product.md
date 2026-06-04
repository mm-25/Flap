<!-- CONTEXT_BLOCK -->
# PRODUCT — Flap
Project Type: dev
Last Updated: [Wed 2026-06-03 14:05]

## CURRENT STATE
Flap is a spatial/visual file manager for macOS. Core value prop: entire file tree visible on one canvas without navigating back and forth. Current user-facing features: auto-load home dir, open-folder dialog, expand/collapse folders on click, open files with default app on double-click, minimap, fit-view button, light/dark mode.

Findability features (shipped, addressing "scrolling to find folders is tedious"):
- **Jump palette** (Cmd+F / Cmd+P): fuzzy partial-name match across visible + known folders; empty query shows recents & pinned; Enter/click flies the canvas to the folder. Star icon pins from the list.
- **Dock**: floating bottom bar — pinned folders (bounded so they never crowd the bar) + recent folders that update as you browse (newest stays visible). Click a chip to fly; hover to pin/unpin; **Clear** button wipes recents (keeps pins). Both zones scroll.
- **Outline sidebar** (TopNav toggle): slide-in tree of the open folders; click a row to fly the canvas there, chevron to expand/collapse. Scroll a list instead of panning.
- **Quick Look** (spacebar): select an item, press space → native macOS Quick Look preview.
- Jumping to a collapsed folder auto-expands its ancestors first, then flies.

REMOVED: Focus mode (accordion) — confusing to use, cut per user.

Next: file operations (copy/move) — being designed. Then TopNav breadcrumbs.

<!-- END CONTEXT_BLOCK -->

---

## CHANGE LOG

### [Wed 2026-06-03 00:00]
**Type:** other
**Summary:** Product log initialized; captured current feature set.
**Detail:**
All core interactions are working. TopNav currently shows a static truncated path string (collapses to "~ / folder" or "~ / … / folder"). No interactivity on path display. Planned breadcrumb feature: clicking a node selects it and shows ancestry chain in TopNav as clickable segments; clicking a segment zooms canvas to that ancestor node. Decision made: clicking breadcrumb = zoom only (not auto-expand collapsed ancestors) — preserves spatial mental model.
**Impact:** Baseline for future product decisions.

### [Wed 2026-06-03 13:20]
**Type:** feature
**Summary:** Added jump palette + recents/pinned dock to fix folder findability.
**Detail:**
User reported scrolling across folders is tedious — hard to find a folder's position, hard to even recall the name. Diagnosed three sub-problems: recall (find by name), traverse (pan to it), sprawl (canvas too big). User chose to build levers 1 (fuzzy palette + fly-to) and 4 (recents/pinned dock) first. Both shipped. Palette: Cmd+F/Cmd+P, fuzzy match, recents-when-empty, pin stars, flies canvas to result (auto-expanding collapsed ancestors). Dock: bottom floating chips of pinned + recent folders, click to fly, hover to pin. Decision held from earlier: jumping = "take me there" (zoom + expand-to-reveal), preserving the spatial mental model.
**Impact:** Recognition-over-recall navigation; users no longer pan the canvas to reach known folders. Sprawl (lever 2) and breadcrumbs still open.

### [Wed 2026-06-03 13:40]
**Type:** feature
**Summary:** Added Focus mode + Outline sidebar (levers 2 + 3).
**Detail:**
Focus mode (TopNav toggle, persisted): expanding a folder auto-collapses its siblings so the canvas is one narrow path, not a wide sprawl — the structural fix for scroll tedium. Outline sidebar (TopNav toggle): a slide-in tree list of open folders; click a row to fly the canvas there, chevron to expand/collapse, double-click a file to open. Both reuse the existing fly-to primitive. All four findability levers now shipped; only TopNav breadcrumbs remain from the original plan.
**Impact:** Users get both a structural (smaller canvas) and a list-based (sidebar) escape from panning, on top of palette + dock.

### [Wed 2026-06-03 14:05]
**Type:** feature
**Summary:** Cut Focus mode; added spacebar Quick Look + dock Clear/scroll with bounded pins.
**Detail:**
User feedback: Focus mode was confusing — removed. Dock reworked so it stays usable as it fills: recents update live as you click folders (newest stays visible), a Clear button wipes recents (pins preserved), pinned folders are bounded and scroll so they never hide the new folders you're browsing; both zones scroll. Added macOS Quick Look: select an item, hit spacebar for a native preview. Next up is the creative copy/move design (being brainstormed) and then breadcrumbs.
**Impact:** Cleaner mental model and a familiar OS-level preview; dock scales with use instead of becoming clutter.
