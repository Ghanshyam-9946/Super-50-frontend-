import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Heading, Quote, Eraser } from "lucide-react";

// A small formatting box for free text that needs structure — used by the
// weekly work report's description. No extra dependency: it is a
// contentEditable div plus the browser's own formatting commands, and the
// server keeps only a short whitelist of tags anyway.
//
// `value` is HTML. It is written into the box only when it differs from
// what the box already holds, so typing is never interrupted.
const BUTTONS = [
  { cmd: "bold", icon: Bold, title: "Bold (Ctrl+B)" },
  { cmd: "italic", icon: Italic, title: "Italic (Ctrl+I)" },
  { cmd: "underline", icon: Underline, title: "Underline (Ctrl+U)" },
  { cmd: "insertUnorderedList", icon: List, title: "Bullet list" },
  { cmd: "insertOrderedList", icon: ListOrdered, title: "Numbered list" },
  { cmd: "formatBlock", arg: "<h4>", icon: Heading, title: "Heading" },
  { cmd: "formatBlock", arg: "<blockquote>", icon: Quote, title: "Quote" },
  { cmd: "removeFormat", icon: Eraser, title: "Clear formatting" },
];

export default function RichTextEditor({ value = "", onChange, placeholder = "", rows = 4, disabled = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== (value || "")) el.innerHTML = value || "";
  }, [value]);

  const run = (cmd, arg) => {
    if (disabled) return;
    ref.current?.focus();
    // execCommand is deprecated but is still the only thing every browser
    // implements for this; the alternative is a whole editor dependency.
    document.execCommand(cmd, false, arg);
    onChange?.(ref.current?.innerHTML || "");
  };

  return (
    <div className={`rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] overflow-hidden ${disabled ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-[var(--border-light)] bg-[var(--bg-card)]">
        {BUTTONS.map(({ cmd, arg, icon: Icon, title }) => (
          <button
            key={title}
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()} // keep the caret where it is
            onClick={() => run(cmd, arg)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange?.(e.currentTarget.innerHTML)}
        className="rte-body px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none overflow-y-auto"
        style={{ minHeight: `${rows * 24}px`, maxHeight: "320px" }}
      />
    </div>
  );
}
