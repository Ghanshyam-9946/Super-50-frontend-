import { useMemo, useState } from "react";
import { Search } from "lucide-react";

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full";

// Pick people: search, department filter, select all of what is shown.
export default function PeoplePicker({ people, value, onChange, hodsOnly }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const depts = useMemo(() => [...new Set(people.map((p) => p.department).filter(Boolean))].sort(), [people]);
  const shown = people.filter((p) => (!hodsOnly || p.isHod)
    && (!dept || p.department === dept)
    && (!q.trim() || `${p.name} ${p.email}`.toLowerCase().includes(q.trim().toLowerCase())));
  const allShownOn = shown.length > 0 && shown.every((p) => value.includes(p._id));
  const toggleAll = () => onChange(allShownOn ? value.filter((id) => !shown.some((p) => p._id === id)) : [...new Set([...value, ...shown.map((p) => p._id)])]);
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" className={`${inputCls} pl-8`} />
        </div>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className={`${inputCls} w-auto`}>
          <option value="">All departments</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button type="button" onClick={toggleAll} className="btn-outline-premium text-xs px-3 py-2">{allShownOn ? "Clear these" : "Select all"}</button>
      </div>
      <div className="text-[11px] text-[var(--text-secondary)]">{value.length} selected · {shown.length} shown</div>
      <div className="max-h-72 overflow-y-auto border border-[var(--border-light)] rounded-xl divide-y divide-[var(--border-light)]">
        {shown.length === 0 && <div className="p-4 text-xs text-[var(--text-secondary)]">{hodsOnly ? "No one has the HOD responsibility yet (Verify Faculty & Admins)." : "No one matches."}</div>}
        {shown.map((p) => (
          <label key={p._id} className="flex items-center gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-[var(--bg-input)]/60">
            <input type="checkbox" checked={value.includes(p._id)} onChange={() => toggle(p._id)} />
            <span className="font-bold text-[var(--text-primary)]">{p.name}</span>
            <span className="text-[var(--text-secondary)] truncate">{[p.designation, p.department, p.isHod && "HOD"].filter(Boolean).join(" · ")}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
