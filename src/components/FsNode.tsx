import { memo, useContext } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { DragContext } from "./dragContext";

export interface FsNodeData {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  extension: string;
  isExpanded: boolean;
  isRoot: boolean;
  isSelected: boolean;
  isDropTarget: boolean;
  onExpand: (id: string, path: string) => void;
  onOpen?: (path: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"
        fill={color}
        opacity="0.9"
      />
      <path d="M12 2l4 4h-3a1 1 0 01-1-1V2z" fill="rgba(0,0,0,0.25)" />
    </svg>
  );
}

function FolderIcon({ isExpanded }: { isExpanded: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 5a2 2 0 012-2h4.586a1 1 0 01.707.293L10.707 5H18a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"
        className={isExpanded ? "folder-icon-path folder-icon-path--expanded" : "folder-icon-path"}
      />
    </svg>
  );
}

function FsNodeInner({ data }: NodeProps) {
  const d = data as unknown as FsNodeData;
  const drag = useContext(DragContext);

  const sizeLabel = formatSize(d.size);
  const extLabel = d.extension ? `.${d.extension}` : (d.isDir ? "folder" : "file");

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />
      <div
        className={`fs-node nopan nodrag ${d.isDir ? "fs-node--dir" : "fs-node--file"} ${d.isExpanded ? "fs-node--expanded" : ""} ${d.isRoot ? "fs-node--root" : ""} ${d.isSelected ? "fs-node--selected" : ""} ${d.isDropTarget ? "fs-node--droptarget" : ""}`}
        title={d.path}
        data-path={d.path}
        data-isdir={d.isDir ? "true" : "false"}
        onPointerDown={(e) => {
          if (drag) drag.startNodeDrag(e, { path: d.path, name: d.name, isDir: d.isDir, extension: d.extension });
        }}
      >
        <div className="fs-node__icon">
          {d.isDir
            ? <FolderIcon isExpanded={d.isExpanded} />
            : <FileIcon extension={d.extension} />}
        </div>
        <div className="fs-node__body">
          <span className="fs-node__name">{d.name}</span>
          <span className="fs-node__meta">
            {sizeLabel || extLabel}
          </span>
        </div>
        {d.isDir && (
          <div className="fs-node__chevron" style={{ opacity: d.isExpanded ? 1 : 0.4 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d={d.isExpanded ? "M2 3.5l3 3 3-3" : "M3.5 2l3 3-3 3"}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </>
  );
}

export default memo(FsNodeInner);
