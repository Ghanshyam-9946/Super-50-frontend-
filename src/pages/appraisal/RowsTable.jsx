import { Plus, Trash2 } from "lucide-react";

// An editable table of rows (one of the format's repeating tables). Read
// only when `onChange` is not given.
export default function RowsTable({ columns, rows = [], onChange, emptyText = "Nothing listed." }) {
  const editable = !!onChange;
  const set = (i, key, value) => onChange(rows.map((r, n) => (n === i ? { ...r, [key]: value } : r)));
  const add = () => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))]);
  const remove = (i) => onChange(rows.filter((_, n) => n !== i));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border border-[var(--border-light)] rounded-xl">
        <table className="w-full text-xs" style={{ minWidth: Math.max(480, columns.length * 150) }}>
          <thead className="bg-[var(--bg-input)]/70">
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              {columns.map((c) => <th key={c.key} className="px-2.5 py-2 font-bold">{c.label}</th>)}
              {editable && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-3 py-3 text-[var(--text-secondary)]">{emptyText}</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--border-light)] align-top">
                {columns.map((c) => (
                  <td key={c.key} className="px-1.5 py-1.5">
                    {editable ? (
                      <textarea rows={1} value={r[c.key] || ""} onChange={(e) => set(i, c.key, e.target.value)}
                        className="w-full bg-transparent border border-transparent hover:border-[var(--border-light)] focus:border-[var(--primary)] rounded-md px-1.5 py-1 text-xs resize-y outline-none" />
                    ) : (
                      <div className="px-1.5 py-1 whitespace-pre-wrap text-[var(--text-primary)]">{r[c.key] || "—"}</div>
                    )}
                  </td>
                ))}
                {editable && (
                  <td className="px-1 py-1.5">
                    <button type="button" onClick={() => remove(i)} title="Remove row" className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10"><Trash2 size={13} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <button type="button" onClick={add} className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1 hover:underline">
          <Plus size={12} /> Add row
        </button>
      )}
    </div>
  );
}
