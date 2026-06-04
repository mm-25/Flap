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

The result is a file manager that matches how you already think about your files — as a connected structure in space, not a sequence of folder contents to flip through.

---

## Features

- **Infinite canvas** — pan and zoom freely; expand folders as nodes laid out below their parent
- **Jump palette** (`⌘F` / `⌘P`) — fuzzy-search any folder or file by partial name; shows currently expanded and pinned folders when empty
- **Dock** — bottom bar of currently expanded folders; a `★` button opens a dropdown of all pinned folders so they never crowd the bar
- **Outline sidebar** (`⌘⇧O`) — slide-in tree view synced to the canvas; click a row to fly there, chevron to expand/collapse
- **Quick Look** (`Space`) — native macOS preview of the selected item
- **Keyboard navigation** — `←`/`→` between siblings, `↑` to parent, `↓` into children, `Enter` to expand/open
- **Selection pill** — floating name badge at the top centre of the canvas; always shows what is selected even when zoomed far out
- **Collapse all** (`⌘⇧C`) — collapses every open branch back to the root in one keystroke, then fits the view
- **Fit view** (`⌘⇧F`) — zooms and pans to show everything on screen
- **Keyboard shortcuts reference** (`⌘/`) — pop-up showing every shortcut in the app
- Light and dark mode, minimap

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
| Jump to a folder | `⌘F` or `⌘P` → type a partial name → `Enter` |
| Preview a file | Click to select it → press `Space` |
| Pin a folder | Hover a chip in the dock → click `☆`, or use the star in the jump palette |
| See pinned folders | Click the `★ N` button on the left of the dock |
| Navigate by keyboard | `←` `→` siblings · `↑` parent · `↓` first child · `Enter` expand/open |
| Collapse all open folders | Click **Collapse** or press `⌘⇧C` |
| Fit everything in view | Click **Fit view** or press `⌘⇧F` |
| Toggle outline tree | Click **Outline** or press `⌘⇧O` |
| See all shortcuts | Click the keyboard icon or press `⌘/` |

---

## Project structure

```
flap/
├── src/                  # React frontend (TypeScript)
│   ├── components/       # FsNode, TopNav, Dock, OutlineSidebar, SearchOverlay, SelectionPill, ShortcutsModal
│   ├── hooks/            # useFileTree, useNavStore, useColorScheme
│   ├── App.tsx           # Main canvas + event wiring
│   ├── App.css           # All component styles
│   └── tokens.css        # Design tokens (colours, spacing, typography)
├── src-tauri/            # Rust backend
│   └── src/lib.rs        # read_dir, get_home_dir, quick_look Tauri commands
├── logs/                 # Project decision logs (ai/ and human/ formats)
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
