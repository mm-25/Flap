# Flap

A spatial file manager for macOS. Files and folders live as nodes on an infinite pan-and-zoom canvas — the whole tree stays visible at once, so you never lose your place navigating back and forth.

---

## Why Flap exists

Every file manager built in the last thirty years works the same way: you open a folder, it replaces what you were looking at, and the previous context disappears. You navigate by going *into* things, losing sight of everything else. When you need to compare two folders, copy files between deeply nested directories, or just remember where something was, you are constantly drilling in, backing out, and drilling in again.

**The mental model is a stack. Your filesystem is not.**

Your files have structure, relationships, and spatial meaning that a list view cannot express. You already think about your files spatially — "the design assets are somewhere under the client project, next to the old version" — but your file manager forces you to abandon that intuition and navigate linearly.

Flap replaces the stack with a canvas. Every folder you expand becomes a visible branch. The whole tree stays on screen at once. You can see where everything is relative to everything else, and you never lose context by navigating away.

---

## How it is different from Finder and traditional file managers

| | Traditional file manager (Finder, Windows Explorer) | Flap |
|---|---|---|
| **Navigation model** | Stack — each click replaces the current view | Canvas — every expanded folder stays visible |
| **Context** | Lost when you navigate into a folder | Preserved — the whole tree is always on screen |
| **Multiple locations at once** | Requires opening multiple windows | Native — expand as many branches as you want |
| **Finding files** | Type a name and hope the search is fast | Jump palette with fuzzy matching + fly-to animation |
| **Spatial memory** | Impossible — the view always resets | First-class — folders stay where they are on the canvas |
| **Deep hierarchies** | Painful — many clicks to reach a nested file | One jump — type a partial name and the canvas flies there |
| **File preview** | Open Quick Look separately | Press `Space` on any selected item |
| **Keyboard navigation** | Limited, folder-by-folder | Arrow keys traverse the whole visible tree |
| **Multi-source moves** | Walk to folder A, copy, walk to B, paste, repeat | Drag from many folders into one staging Shelf, drop the whole batch at the destination |
| **Selection** | One folder window at a time | Marquee-drag or shift-click to select many items anywhere on the canvas |

The result is a file manager that matches how you already think about your files — as a connected structure in space, not a sequence of folder contents to flip through.

---

## Features

### Navigating
- **Infinite canvas** — pan and zoom freely; expand folders as nodes laid out below their parent
- **Jump palette** (`⌘F` / `⌘P`) — fuzzy-search any folder or file by partial name; shows currently expanded and pinned folders when empty
- **Dock** — bottom bar of currently expanded folders; a `★` button opens a dropdown of all pinned folders so they never crowd the bar
- **Outline sidebar** (`⌘⇧O`) — slide-in tree view synced to the canvas; click a row to fly there, chevron to expand/collapse
- **Keyboard navigation** — `←`/`→` between siblings, `↑` to parent, `↓` into children, `Enter` to expand/open
- **Selection pill** — floating name badge at the top centre of the canvas; always shows what is selected even when zoomed far out

### Selecting & previewing
- **Multi-select** — marquee-drag empty canvas to select many items, or `Shift`-click to add/remove individual ones
- **Quick Look** (`Space`) — native macOS preview of the selected item

### File operations (right-click any node)
- **Open** — folder expands on canvas; file opens in its default app
- **Open in Terminal** — launches Terminal at the folder (or the file's parent)
- **Reveal in Finder** — opens Finder with the item selected
- **Get Info** — panel with kind, size / item count, location, created & modified dates
- **New Folder** — created inside the right-clicked folder, or the root if right-clicking empty canvas
- **Rename** — inline dialog; pre-selects the name without the extension for files
- **Duplicate** — Finder-style "… copy" / "… copy N" naming
- **Move to Trash** — recoverable; uses the real macOS Trash, never a hard delete
- **Add to Tray** — stages the item in the Shelf for copy/move

### Copying and moving
- **Direct drag-to-folder** — drag any node onto a folder to **move** it (Finder-style spatial intent). If the node is part of a multi-selection, the whole selection moves together
- **Shelf** — bottom staging tray for copy/move batches. Drag items in from anywhere on the canvas (multi-source), toggle Copy or Move, then drag the whole batch onto a destination folder. Never overwrites; folders moving cross-volume fall back to copy + delete
- Drop on a different destination after a Copy and the Shelf stays, so you can fan a batch out to multiple destinations

### View controls
- **Collapse all** (`⌘⇧C`) — collapses every open branch back to the root in one keystroke, then fits the view
- **Fit view** (`⌘⇧F`) — zooms and pans to show everything on screen
- **Reload** (`⌘R`) — re-reads the current root from disk (picks up external changes)
- **Keyboard shortcuts reference** (`⌘/`) — pop-up showing every shortcut in the app

### Polish
- Light and dark mode, minimap, recents and pinned folders persisted across sessions

---

## Requirements

| Dependency | Minimum version |
|---|---|
| macOS | 12 Monterey or later |
| [Node.js](https://nodejs.org) | 18 or later |
| [Rust](https://rustup.rs) | 1.77 or later (installed via `rustup`) |

> Flap is macOS-only. It uses native APIs (`qlmanage` for Quick Look, system font stack) that are not available on other platforms.

---

## Install from source

### 1. Clone the repo

```bash
git clone https://github.com/mm-25/flap.git
cd flap/flap
```

### 2. Install Rust (if you don't have it)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

Verify:

```bash
rustc --version   # should print rustc 1.77 or later
```

### 3. Install Node dependencies

```bash
npm install
```

### 4. Run in development mode

```bash
npm run tauri dev
```

The first run compiles the Rust backend — this takes a few minutes. Subsequent runs are much faster because of Rust's incremental compilation.

### 5. Build a release app bundle

```bash
npm run tauri build
```

This produces a signed `.app` bundle and a `.dmg` installer at:

```
src-tauri/target/release/bundle/macos/Flap.app
src-tauri/target/release/bundle/dmg/Flap_0.1.0_aarch64.dmg   # Apple Silicon
src-tauri/target/release/bundle/dmg/Flap_0.1.0_x64.dmg        # Intel
```

Drag `Flap.app` into your `/Applications` folder, or open the `.dmg` and do the same.

---

## Usage quick-start

| Action | How |
|---|---|
| Open a folder | Click **Open folder** in the top-right, or the app loads your home directory automatically |
| Expand a folder | Single-click any folder node |
| Open a file | Double-click any file node |
| Right-click menu | Right-click any node for Open, Open in Terminal, Reveal in Finder, Get Info, New Folder, Rename, Duplicate, Add to Tray, Move to Trash |
| Multi-select | Marquee-drag empty canvas, or `Shift`-click to add/remove. The pill shows the count |
| Move files | Drag any node onto a folder. If the node is part of a multi-selection, the whole selection moves |
| Copy / multi-source | Drag items into the bottom **Shelf**, set Copy or Move, then drag the batch onto the destination folder |
| Jump to a folder | `⌘F` or `⌘P` → type a partial name → `Enter` |
| Preview a file | Click to select it → press `Space` |
| Pin a folder | Hover a chip in the dock → click `☆`, or use the star in the jump palette |
| See pinned folders | Click the `★ N` button on the left of the dock |
| Navigate by keyboard | `←` `→` siblings · `↑` parent · `↓` first child · `Enter` expand/open |
| Reload from disk | Click **Reload** or press `⌘R` (picks up changes made outside Flap) |
| Collapse all open folders | Click **Collapse** or press `⌘⇧C` |
| Fit everything in view | Click **Fit view** or press `⌘⇧F` |
| Toggle outline tree | Click **Outline** or press `⌘⇧O` |
| See all shortcuts | Click the keyboard icon or press `⌘/` |

---

## Project structure

```
flap/
├── src/                       # React frontend (TypeScript)
│   ├── components/
│   │   ├── FsNode.tsx         # Custom react-flow node (file + folder)
│   │   ├── TopNav.tsx         # Top bar with Outline/Collapse/Fit/Reload/Open
│   │   ├── Dock.tsx           # Bottom dock — expanded folders + pinned dropdown
│   │   ├── Shelf.tsx          # Bottom staging tray for copy/move batches
│   │   ├── OutlineSidebar.tsx # Slide-in tree view
│   │   ├── SearchOverlay.tsx  # Jump palette (⌘F / ⌘P)
│   │   ├── SelectionPill.tsx  # Floating "Selected" badge at top
│   │   ├── ContextMenu.tsx    # Right-click menu
│   │   ├── PromptDialog.tsx   # Rename / New Folder dialog
│   │   ├── InfoModal.tsx      # Get Info panel
│   │   ├── ShortcutsModal.tsx # ⌘/ shortcuts reference
│   │   ├── DragGhost.tsx      # Cursor-following drag ghost
│   │   └── dragContext.ts     # React context for starting node drags
│   ├── hooks/
│   │   ├── useFileTree.ts     # Tree state + layout + refreshFolder
│   │   ├── useNavStore.ts     # Recents + pinned (localStorage)
│   │   ├── useShelf.ts        # Shelf staging + Copy/Move mode
│   │   ├── useDragController.ts # Custom pointer drag layer
│   │   └── useColorScheme.ts  # Light/dark detection
│   ├── App.tsx                # Main canvas + event wiring
│   ├── App.css                # All component styles
│   └── tokens.css             # Design tokens (colours, spacing, typography)
├── src-tauri/                 # Rust backend
│   └── src/lib.rs             # Tauri commands: read_dir, get_home_dir,
│                              # quick_look, reveal_in_finder, open_terminal,
│                              # move_to_trash, rename_entry, duplicate_entry,
│                              # copy_entry, move_entry, create_folder, get_info
├── logs/                      # Project decision logs (ai/ and human/ formats)
└── package.json
```

---

## Tech stack

- **[Tauri v2](https://tauri.app)** — native macOS shell, Rust backend
- **[React 19](https://react.dev)** + **TypeScript** — UI
- **[@xyflow/react](https://reactflow.dev)** — infinite canvas and node graph
- **Vite** — frontend bundler

---

## License

MIT
