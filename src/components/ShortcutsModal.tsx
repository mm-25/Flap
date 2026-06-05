interface ShortcutsModalProps {
  onClose: () => void;
}

function Kbd({ keys }: { keys: string[] }) {
  return (
    <span className="shortcuts__keys">
      {keys.map((k, i) => (
        <kbd key={i} className="shortcuts__kbd">{k}</kbd>
      ))}
    </span>
  );
}

const SECTIONS = [
  {
    title: "Navigation",
    rows: [
      { keys: ["←", "→"],       label: "Previous / next sibling folder" },
      { keys: ["↑"],            label: "Go up to parent folder" },
      { keys: ["↓"],            label: "Go into first child folder" },
      { keys: ["Enter"],        label: "Expand or collapse a folder / open a file" },
    ],
  },
  {
    title: "Search & Jump",
    rows: [
      { keys: ["⌘", "F"],       label: "Open jump palette" },
      { keys: ["⌘", "P"],       label: "Open jump palette" },
      { keys: ["Esc"],          label: "Close palette" },
    ],
  },
  {
    title: "View",
    rows: [
      { keys: ["⌘", "⇧", "F"], label: "Fit all nodes in view" },
      { keys: ["⌘", "⇧", "O"], label: "Toggle outline sidebar" },
      { keys: ["⌘", "⇧", "C"], label: "Collapse all folders" },
      { keys: ["⌘", "R"],      label: "Reload current folder from disk" },
      { keys: ["⌘", "/"],      label: "Show / hide this shortcuts reference" },
    ],
  },
  {
    title: "Files",
    rows: [
      { keys: ["Space"],        label: "Quick Look preview of selected item" },
      { keys: ["Double-click"], label: "Open file with default app" },
    ],
  },
];

export default function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div className="shortcuts-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal__header">
          <span className="shortcuts-modal__title">Keyboard shortcuts</span>
          <button className="shortcuts-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="shortcuts-modal__body">
          {SECTIONS.map((section) => (
            <div key={section.title} className="shortcuts__section">
              <div className="shortcuts__section-title">{section.title}</div>
              {section.rows.map((row) => (
                <div key={row.label} className="shortcuts__row">
                  <span className="shortcuts__label">{row.label}</span>
                  <Kbd keys={row.keys} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
