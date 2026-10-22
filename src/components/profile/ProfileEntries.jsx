import { ExternalLink, Paperclip, Pencil, Trash2 } from "lucide-react";
import { getFileUrl } from "../../utils/imageUrl";

const href = (link) => (/^https?:\/\//i.test(link) ? link : `https://${link}`);

// The supporting document on an entry, as a link that opens it.
export function AttachmentLink({ url, name }) {
  if (!url) return null;
  return (
    <a
      href={getFileUrl(url)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 max-w-full"
      title={name || "Open attachment"}
    >
      <Paperclip size={12} className="shrink-0" />
      <span className="truncate">{name || "Attachment"}</span>
    </a>
  );
}

// The entries of one profile section, as cards. Read-only unless onEdit /
// onRemove are given — the faculty's own editor passes them, the admin's
// view does not.
export default function EntryList({ section, items = [], onEdit, onRemove, emptyText = "Nothing added yet." }) {
  if (!items.length) {
    return (
      <div className="border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center text-sm text-[var(--text-secondary)]">
        {emptyText}
      </div>
    );
  }
  const Icon = section.icon;
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const meta = (section.meta?.(item) || []).filter(Boolean);
        const link = section.link?.(item);
        const description = section.description?.(item);
        return (
          <div
            key={item._id || idx}
            className="flex items-start gap-3 bg-[var(--bg-input)]/60 border border-[var(--border-light)] rounded-2xl p-4 hover:border-[var(--primary)]/40 transition-colors"
          >
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="font-bold text-sm text-[var(--text-primary)] break-words">{section.title_(item) || "—"}</div>
              {meta.length > 0 && <div className="text-xs text-[var(--text-secondary)] break-words">{meta.join(" · ")}</div>}
              {description && <div className="text-xs text-[var(--text-secondary)] whitespace-pre-line">{description}</div>}
              {(item.attachmentUrl || link) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <AttachmentLink url={item.attachmentUrl} name={item.attachmentName} />
                  {link && (
                    <a href={href(link)} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline">
                      <ExternalLink size={12} /> Open link
                    </a>
                  )}
                </div>
              )}
            </div>
            {(onEdit || onRemove) && (
              <div className="flex items-center gap-1 shrink-0">
                {onEdit && (
                  <button onClick={() => onEdit(idx)} title="Edit" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--border-light)]">
                    <Pencil size={14} />
                  </button>
                )}
                {onRemove && (
                  <button onClick={() => onRemove(idx)} title="Delete" className="p-2 rounded-lg text-red-500 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
