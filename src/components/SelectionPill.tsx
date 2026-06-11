interface SelectedItem {
  name: string;
  path: string;
  isDir: boolean;
  extension: string;
  count?: number;
}

interface SelectionPillProps {
  item: SelectedItem | null;
}

function FileIcon({ extension }: { extension: string }) {
  const ext = extension.toLowerCase();
  let color = "#8e8e93";
  if (["ts", "tsx", "js", "jsx"].includes(ext)) color = "#f7df1e";
  else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) color = "#30d158";
  else if (["pdf"].includes(ext)) color = "#ff453a";
  else if (["md", "txt"].includes(ext)) color = "#64d2ff";
  else if (["json", "yaml", "yml", "toml"].includes(ext)) color = "#bf5af2";
  else if (["zip", "tar", "gz", "rar"].includes(ext)) color = "#ff9f0a";
  else if (["mp4", "mov", "avi"].includes(ext)) color = "#ff6b6b";
  else if (["mp3", "wav", "flac"].includes(ext)) color = "#5ac8fa";
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
      <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" fill={color} opacity="0.9" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 5a2 2 0 012-2h4.586a1 1 0 01.707.293L10.707 5H18a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
        className="folder-icon-path"
      />
    </svg>
  );
}

// Floating pill at the top-centre of the canvas that shows whichever node is
// currently selected. Lets users know what they have highlighted at any zoom
// level — especially useful when zoomed far out and items are tiny.
export default function SelectionPill({ item }: SelectionPillProps) {
  if (!item) return null;
  const isMulti = (item.count ?? 1) > 1;

  return (
    <div className="selection-pill">
      <span className="selection-pill__label">{isMulti ? "Selected" : "Selected"}</span>
      <div className="selection-pill__item">
        {!isMulti && (
          <span className="selection-pill__icon">
            {item.isDir ? <FolderIcon /> : <FileIcon extension={item.extension} />}
          </span>
        )}
        <span className="selection-pill__name">{item.name}</span>
      </div>
    </div>
  );
}
