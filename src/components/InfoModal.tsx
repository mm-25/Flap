export interface ItemInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  extension: string;
  item_count: number | null;
  modified: number | null;
  created: number | null;
}

interface InfoModalProps {
  info: ItemInfo;
  onClose: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 bytes";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(secs: number | null): string {
  if (!secs) return "—";
  return new Date(secs * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InfoModal({ info, onClose }: InfoModalProps) {
  const kind = info.is_dir
    ? "Folder"
    : info.extension
      ? `${info.extension.toUpperCase()} file`
      : "Document";

  const rows: [string, string][] = [
    ["Kind", kind],
    info.is_dir
      ? ["Items", info.item_count != null ? `${info.item_count}` : "—"]
      : ["Size", formatSize(info.size)],
    ["Where", info.path.slice(0, info.path.lastIndexOf("/")) || "/"],
    ["Created", formatDate(info.created)],
    ["Modified", formatDate(info.modified)],
  ];

  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-modal__header">
          <span className="info-modal__name">{info.name}</span>
          <button className="info-modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="info-modal__body">
          {rows.map(([label, value]) => (
            <div key={label} className="info-row">
              <span className="info-row__label">{label}</span>
              <span className="info-row__value">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
