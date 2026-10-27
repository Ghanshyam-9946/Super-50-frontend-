import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Save, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// MST marks, question by question, for the whole section at once — the
// printed MST-1 (28) / MST-2 (42) sheet: A MCQ, B Short Answer, C Brief, each
// part against its Course Outcome. The total adds itself up. Enter or ↓
// moves down a column; Save sends every changed row in one go.

const cellCls = "w-14 bg-[var(--bg-input)] border rounded-lg px-1.5 py-1.5 text-sm text-center tabular-nums outline-none focus:border-[var(--primary)] disabled:opacity-50";

const rowFrom = (sheet, test) => {
  const t = sheet.mst?.[test] || {};
  return {
    parts: Object.fromEntries(Object.entries(t.parts || {}).map(([k, v]) => [k, v ?? ""])),
    absent: !!t.absent,
    // A total synced from an uploaded result, without parts.
    synced: !t.parts && !t.absent && !t.enteredBy && t.obtained != null ? `${t.obtained}/${t.max}` : "",
    dirty: false,
  };
};

export default function MSTMarksGrid({ sheets, onPatch, coordinator, user }) {
  const [format, setFormat] = useState(null);
  const [test, setTest] = useState("test1");
  const [rows, setRows] = useState({});
  const [saving, setSaving] = useState(false);
  const refs = useRef({});

  useEffect(() => {
    api.get("/sessional-marks/mst-format").then(({ data }) => setFormat(data.data)).catch(() => toast.error("Could not load the MST format"));
  }, []);

  // Rows follow the sheets and the tab, unless they have unsaved changes.
  const [shownKey, setShownKey] = useState("");
  const key = `${test}|${sheets.map((s) => `${s._id}:${s.updatedAt}`).join(",")}`;
  if (key !== shownKey) {
    setShownKey(key);
    const next = {};
    sheets.forEach((s) => { next[s._id] = rows[s._id]?.dirty && rows[s._id]?.test === test ? rows[s._id] : { ...rowFrom(s, test), test }; });
    setRows(next);
  }

  const fmt = format?.[test];
  const items = useMemo(() => (fmt ? fmt.sections.flatMap((s) => s.items) : []), [fmt]);
  const dirty = Object.entries(rows).filter(([, r]) => r.dirty);

  // Unsaved marks are not lost by closing the tab by mistake.
  useEffect(() => {
    if (!dirty.length) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty.length]);

  const uid = user?._id;
  const canEdit = (s) => ((s.faculty?._id || s.faculty) === uid || coordinator) && !s.locked;
  const setCell = (id, k, v) => setRows((p) => ({ ...p, [id]: { ...p[id], parts: { ...p[id].parts, [k]: v }, dirty: true } }));
  const setAbsent = (id, v) => setRows((p) => ({ ...p, [id]: { ...p[id], absent: v, dirty: true } }));
  const totalOf = (r) => (r.absent ? 0 : items.reduce((n, it) => n + (Number(r.parts?.[it.key]) || 0), 0));
  const bad = (it, v) => v !== "" && v !== undefined && (Number.isNaN(Number(v)) || Number(v) < 0 || Number(v) > it.max);
  const anyBad = dirty.some(([, r]) => !r.absent && items.some((it) => bad(it, r.parts?.[it.key])));

  const switchTab = (t) => {
    if (t === test) return;
    if (dirty.length && !window.confirm(`${dirty.length} row(s) of ${fmt?.label} are not saved. Switch anyway and lose them?`)) return;
    setRows((p) => Object.fromEntries(Object.entries(p).map(([k, r]) => [k, { ...r, dirty: false }])));
    setTest(t);
  };

  const save = async () => {
    if (!dirty.length) return toast("Nothing changed");
    if (anyBad) return toast.error("Some marks are above the question's maximum — fix the red boxes");
    setSaving(true);
    try {
      const { data } = await api.patch("/sessional-marks/mst/bulk", {
        test,
        items: dirty.map(([sheetId, r]) => ({ sheetId, absent: r.absent, parts: r.parts })),
      });
      data.sheets.forEach((s) => onPatch(s));
      const failedIds = new Set(data.results.filter((r) => !r.ok).map((r) => r.sheetId));
      setRows((p) => Object.fromEntries(Object.entries(p).map(([k, r]) => [k, { ...r, dirty: failedIds.has(k) ? r.dirty : false }])));
      if (data.failed) toast.error(`${data.failed} row(s) not saved: ${data.results.filter((r) => !r.ok).map((r) => r.message).slice(0, 2).join("; ")}`);
      else toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const move = (e, i, k) => {
    if (e.key === "Enter" || e.key === "ArrowDown") { e.preventDefault(); refs.current[`${i + 1}-${k}`]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); refs.current[`${i - 1}-${k}`]?.focus(); }
  };

  if (!format) return <div className="glass-card rounded-2xl p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
  const th = "px-2 py-1.5 text-center border border-[var(--border-light)]";

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[var(--border-light)]">
        <div className="flex gap-1.5" role="tablist" aria-label="MST">
          {Object.values(format).map((f) => (
            <button key={f.key} role="tab" aria-selected={test === f.key} onClick={() => switchTab(f.key)}
              className={`text-sm font-black px-4 py-2 rounded-xl ${test === f.key ? "bg-[var(--primary)] text-white" : "border border-[var(--border-light)] text-[var(--text-secondary)]"}`}>
              {f.label} ({f.max})
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--text-secondary)]">Enter or ↓ moves down a column. Leave a box blank if not attempted.</span>
        <button id="mst-save" onClick={save} disabled={saving || !dirty.length} className="ml-auto btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save {dirty.length ? `${dirty.length} changed` : ""}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse min-w-full">
          <thead className="text-[11px] text-[var(--text-secondary)]">
            <tr>
              <th rowSpan={4} className={`${th} sticky left-0 bg-[var(--bg-card)] z-10`}>S.No.</th>
              <th rowSpan={4} className={th}>Enrollment No.</th>
              <th rowSpan={4} className={`${th} text-left min-w-[180px]`}>Student Name</th>
              {fmt.sections.map((s) => <th key={s.key} colSpan={s.items.length} className={`${th} font-black text-[var(--text-primary)]`}>{s.key}</th>)}
              <th rowSpan={4} className={`${th} font-black text-[var(--text-primary)]`}>Total ({fmt.max})</th>
              <th rowSpan={4} className={th}>Absent</th>
            </tr>
            <tr>{fmt.sections.map((s) => <th key={s.key} colSpan={s.items.length} className={`${th} font-bold text-[var(--text-primary)]`}>{s.title}</th>)}</tr>
            <tr>{items.map((it) => <th key={it.key} className={th}>{it.max} Marks</th>)}</tr>
            <tr>{items.map((it) => <th key={it.key} className={`${th} font-bold text-[var(--primary)]`}>{it.co}</th>)}</tr>
          </thead>
          <tbody>
            {sheets.map((s, i) => {
              const r = rows[s._id] || { parts: {}, absent: false };
              const editable = canEdit(s);
              const total = totalOf(r);
              return (
                <tr key={s._id} className={r.dirty ? "bg-amber-500/5" : ""}>
                  <td className={`${th} sticky left-0 bg-[var(--bg-card)]`}>{i + 1}</td>
                  <td className={`${th} font-mono text-xs`}>{s.student?.enrollmentNumber}</td>
                  <td className={`${th} text-left`}>
                    <div className="font-semibold text-[var(--text-primary)]">{s.student?.name}</div>
                    {r.synced && <div className="text-[10px] text-[var(--text-secondary)]">Synced from MST result: {r.synced}</div>}
                    {s.locked && <div className="text-[10px] text-[var(--text-secondary)]">Locked</div>}
                  </td>
                  {items.map((it) => {
                    const v = r.parts?.[it.key] ?? "";
                    return (
                      <td key={it.key} className={th}>
                        <input ref={(el) => { refs.current[`${i}-${it.key}`] = el; }} type="number" min="0" max={it.max} step="0.5"
                          value={r.absent ? "" : v} disabled={!editable || r.absent}
                          aria-label={`${it.key} (${it.co}) for ${s.student?.name}`}
                          onChange={(e) => setCell(s._id, it.key, e.target.value)} onKeyDown={(e) => move(e, i, it.key)}
                          className={`${cellCls} ${bad(it, v) ? "border-red-500 text-red-600" : "border-[var(--border-light)]"}`} />
                      </td>
                    );
                  })}
                  <td className={`${th} font-black tabular-nums ${r.absent ? "text-red-600" : "text-[var(--text-primary)]"}`}>{r.absent ? "AB" : total || (Object.values(r.parts || {}).some((x) => x !== "") ? 0 : "—")}</td>
                  <td className={th}>
                    <input type="checkbox" checked={r.absent} disabled={!editable} onChange={(e) => setAbsent(s._id, e.target.checked)} aria-label={`Absent: ${s.student?.name}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
        <FileSpreadsheet size={12} /> The {fmt.label} total goes into the sessional MST /20 (MST-1 + MST-2 together, as on the college sheet).
      </div>
    </div>
  );
}
