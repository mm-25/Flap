import { useState, useRef, useEffect } from "react";

interface PromptDialogProps {
  title: string;
  initialValue: string;
  confirmLabel: string;
  // select only the name without extension on focus (Finder-style rename)
  selectStem?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export default function PromptDialog({
  title,
  initialValue,
  confirmLabel,
  selectStem,
  onConfirm,
  onClose,
}: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (selectStem) {
      const dot = initialValue.lastIndexOf(".");
      el.setSelectionRange(0, dot > 0 ? dot : initialValue.length);
    } else {
      el.select();
    }
  }, [initialValue, selectStem]);

  const confirm = () => {
    const v = value.trim();
    if (v) onConfirm(v);
  };

  return (
    <div className="prompt-overlay" onClick={onClose}>
      <div className="prompt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-dialog__title">{title}</div>
        <input
          ref={inputRef}
          className="prompt-dialog__input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirm();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
        />
        <div className="prompt-dialog__actions">
          <button className="prompt-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="prompt-btn prompt-btn--primary" onClick={confirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
