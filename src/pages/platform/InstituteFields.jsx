// The pieces of an institute's record, shared by the "new institute" form
// and the institute's own page.

import { PLANS, inputCls, labelCls } from "./instituteForm";

export function DetailsFields({ form, setForm, legacy = false }) {
  const set = (path, value) => setForm((f) => {
    const next = structuredClone(f);
    const keys = path.split(".");
    let o = next;
    keys.slice(0, -1).forEach((k) => { o = o[k]; });
    o[keys.at(-1)] = value;
    return next;
  });
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <label className={labelCls}>Institute name
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Plan
        <select value={form.plan} onChange={(e) => set("plan", e.target.value)} className={inputCls}>
          {[...new Set([...PLANS, form.plan])].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      {!legacy && (
        <label className={`${labelCls} sm:col-span-2`}>Own domains (optional, comma-separated)
          <input value={form.domains} onChange={(e) => set("domains", e.target.value)} placeholder="erp.abccollege.edu" className={inputCls} />
        </label>
      )}
      <label className={labelCls}>Subscription starts
        <input type="date" value={form.subscription.startsAt} onChange={(e) => set("subscription.startsAt", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Subscription ends
        <input type="date" value={form.subscription.endsAt} onChange={(e) => set("subscription.endsAt", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Student limit (blank = no limit)
        <input type="number" min="0" value={form.limits.students} onChange={(e) => set("limits.students", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Faculty limit (blank = no limit)
        <input type="number" min="0" value={form.limits.faculty} onChange={(e) => set("limits.faculty", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Contact person
        <input value={form.contact.person} onChange={(e) => set("contact.person", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Contact email
        <input type="email" value={form.contact.email} onChange={(e) => set("contact.email", e.target.value)} className={inputCls} />
      </label>
      <label className={labelCls}>Contact phone
        <input value={form.contact.phone} onChange={(e) => set("contact.phone", e.target.value)} className={inputCls} />
      </label>
      <label className={`${labelCls} sm:col-span-2`}>Notes
        <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} />
      </label>
    </div>
  );
}

// Tick the modules this institute has. Core ones are always on.
export function ModulePicker({ catalog, value, onChange }) {
  const optional = catalog.filter((m) => !m.core);
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-[var(--text-secondary)]">{value.length} of {optional.length} modules on</span>
        <button type="button" onClick={() => onChange(optional.map((m) => m.key))} className="font-bold text-[var(--primary)] hover:underline">Select all</button>
        <button type="button" onClick={() => onChange([])} className="font-bold text-[var(--primary)] hover:underline">Clear</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {catalog.filter((m) => m.core).map((m) => (
          <div key={m.key} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)]/60 opacity-80">
            <input type="checkbox" checked disabled className="mt-0.5" />
            <span className="text-xs font-bold text-[var(--text-primary)]">{m.label} <span className="font-medium text-[var(--text-secondary)]">— always on</span></span>
          </div>
        ))}
        {optional.map((m) => {
          const on = value.includes(m.key);
          return (
            <label key={m.key} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${on ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-[var(--border-light)] hover:bg-[var(--bg-input)]"}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(m.key)} className="mt-0.5" />
              <span className="text-xs font-bold text-[var(--text-primary)]">{m.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
