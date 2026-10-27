import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, Upload, Download, FileSpreadsheet, Search, Loader2, Pencil, Save, X, History, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Student Fees Records — for the admin and the Academic Coordinator.
// Upload a sheet (Student Name, Enrollment No, Due Fees): each student is
// found by enrollment number and lands in their batch. Every change is kept
// in the history; an amount can be corrected here; everything downloads as
// Excel, one sheet per batch.

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]";
const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const SOURCE = { excel: "Excel upload", manual: "Edited here", "no-dues": "No Dues page" };

const saveBlob = (res, fallback) => {
  const name = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")?.[1] || fallback;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`glass-card rounded-3xl w-full ${wide ? "max-w-4xl" : "max-w-2xl"} my-8 bg-[var(--bg-card)]`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
        <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]"><X size={18} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

export default function StudentFeesPage() {
  const [rows, setRows] = useState(null);
  const [batches, setBatches] = useState([]);
  const [batch, setBatch] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState(null); // { file, data, changes }
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(null); // { id, value, note }
  const [history, setHistory] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [withHistory, setWithHistory] = useState(false);

  // Search runs once typing pauses.
  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const load = useCallback(() => {
    const params = { ...(batch ? { batch } : {}), ...(status ? { status } : {}), ...(query ? { q: query } : {}) };
    return Promise.all([api.get("/fees/students", { params }), api.get("/fees/uploads")])
      .then(([s, u]) => {
        setRows(s.data.data);
        setBatches(s.data.batches);
        setUploads(u.data.data || []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Could not load the fees records");
        setRows([]);
      });
  }, [batch, status, query]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => batches.reduce((t, b) => ({ students: t.students + b.students, withDues: t.withDues + b.withDues, total: t.total + b.total }), { students: 0, withDues: 0, total: 0 }), [batches]);
  const shownTotal = useMemo(() => (rows || []).reduce((n, r) => n + (r.duesFees || 0), 0), [rows]);

  /* ---------- upload: preview, then confirm ---------- */
  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("preview");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("preview", "1");
      const { data } = await api.post("/fees/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPreview({ file, data: data.data, changes: data.changes || [] });
      setNote("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not read the file");
    } finally {
      setBusy("");
    }
  };
  const confirmUpload = async () => {
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", preview.file);
      fd.append("note", note);
      const { data } = await api.post("/fees/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(data.message, { duration: 6000 });
      setPreview(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy("");
    }
  };

  /* ---------- one student ---------- */
  const saveEdit = async () => {
    const value = Number(editing.value);
    if (!Number.isFinite(value) || value < 0) return toast.error("Enter 0 or more");
    setBusy(`edit-${editing.id}`);
    try {
      const { data } = await api.patch(`/fees/students/${editing.id}`, { duesFees: value, note: editing.note });
      toast.success(data.message);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setBusy("");
    }
  };
  const openHistory = async (r) => {
    setHistory({ student: r, list: null });
    try {
      const { data } = await api.get(`/fees/students/${r._id}/history`);
      setHistory({ student: r, list: data.data.history });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the history");
      setHistory(null);
    }
  };

  /* ---------- downloads ---------- */
  const download = async (scope) => {
    setBusy(`dl-${scope}`);
    try {
      const params = { ...(scope === "view" && batch ? { batch } : {}), ...(scope === "view" && status ? { status } : {}), ...(withHistory ? { history: "1" } : {}) };
      const res = await api.get("/fees/export", { params, responseType: "blob" });
      saveBlob(res, "Student_Fees.xlsx");
    } catch {
      toast.error("Could not download");
    } finally {
      setBusy("");
    }
  };
  const template = async () => {
    try { saveBlob(await api.get("/fees/template", { responseType: "blob" }), "student-fees-template.xlsx"); } catch { toast.error("Could not download"); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex flex-wrap items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0"><Wallet className="text-emerald-600" size={26} /></div>
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Student Fees Records</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Upload the fees sheet (Student Name, Enrollment No, Due Fees) — each student lands in their batch. Every change is kept in the history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={template} className="btn-outline-premium text-xs px-3 py-2.5 flex items-center gap-1.5"><FileSpreadsheet size={14} /> Template</button>
          <label className={`btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 cursor-pointer ${busy === "preview" ? "opacity-60 pointer-events-none" : ""}`}>
            {busy === "preview" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload Excel
            <input id="fees-file" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={pickFile} />
          </label>
        </div>
      </header>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Students", totals.students, Users, "text-[var(--primary)] bg-[var(--primary)]/10"],
          ["With dues", totals.withDues, AlertTriangle, "text-red-600 bg-red-500/10"],
          ["Cleared", totals.students - totals.withDues, CheckCircle2, "text-emerald-600 bg-emerald-500/10"],
          ["Total due", rupees(totals.total), Wallet, "text-amber-600 bg-amber-500/10"],
        ].map(([label, value, Icon, tone]) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon size={18} /></span>
            <div>
              <div className="text-xl font-display font-black text-[var(--text-primary)] tabular-nums">{value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Batches */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Batches">
        {/* Students without a batch are counted in "All batches". */}
        {[{ batch: "", students: totals.students, withDues: totals.withDues, total: totals.total }, ...batches.filter((x) => x.batch)].map((b) => {
          const on = batch === b.batch;
          return (
            <button key={b.batch || "all"} role="tab" aria-selected={on} onClick={() => setBatch(b.batch)}
              className={`rounded-2xl border px-4 py-2 text-left transition-colors ${on ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--bg-card)] border-[var(--border-light)] hover:border-[var(--primary)]"}`}>
              <div className="text-sm font-black">{b.batch || "All batches"}</div>
              <div className={`text-[10px] font-bold ${on ? "text-white/80" : "text-[var(--text-secondary)]"}`}>{b.students} students · {b.withDues} due · {rupees(b.total)}</div>
            </button>
          );
        })}
      </div>

      {/* Filters + download */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or enrollment no" aria-label="Search students" className={`${inputCls} w-full pl-9`} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Fees status" className={inputCls}>
          <option value="">All students</option>
          <option value="due">With dues</option>
          <option value="clear">Cleared (₹0)</option>
        </select>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={withHistory} onChange={(e) => setWithHistory(e.target.checked)} /> Include history
        </label>
        <button onClick={() => download("view")} disabled={!!busy} className="btn-outline-premium text-xs px-3 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "dl-view" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download {batch || "this view"}
        </button>
        <button onClick={() => download("all")} disabled={!!busy} className="btn-premium text-xs px-3 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "dl-all" ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />} Download all batches
        </button>
      </div>

      {/* The list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {!rows ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-secondary)]">No students here.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                  <th className="px-4 py-3">Student</th><th className="px-4 py-3">Enrollment No</th><th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3 text-right">Due fees</th><th className="px-4 py-3">Last updated</th><th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isEditing = editing?.id === r._id;
                  return (
                    <tr key={r._id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-input)]/40">
                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--text-primary)]">{r.name}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{[r.department, r.semester ? `Sem ${r.semester}` : "", r.section ? `Sec ${r.section}` : ""].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{r.enrollmentNumber || "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{r.batch || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <input type="number" min="0" autoFocus value={editing.value} aria-label={`Due fees for ${r.name}`}
                              onChange={(e) => setEditing((x) => ({ ...x, value: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                              className={`${inputCls} w-32 text-right`} />
                            <input value={editing.note} placeholder="Reason (optional)" aria-label="Reason"
                              onChange={(e) => setEditing((x) => ({ ...x, note: e.target.value }))} className={`${inputCls} w-44 text-xs`} />
                          </div>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black tabular-nums ${r.duesFees > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {r.duesFees > 0 ? rupees(r.duesFees) : "Cleared"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[var(--text-secondary)]">
                        {r.lastChangedAt ? <>{when(r.lastChangedAt)}<div>{r.lastChangedBy}{r.lastSource ? ` · ${SOURCE[r.lastSource]}` : ""}</div></> : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button onClick={saveEdit} disabled={!!busy} className="btn-premium text-xs px-3 py-1.5 flex items-center gap-1">
                                {busy === `edit-${r._id}` ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                              </button>
                              <button onClick={() => setEditing(null)} className="btn-outline-premium text-xs px-2.5 py-1.5" aria-label="Cancel"><X size={12} /></button>
                            </>
                          ) : (
                            <button onClick={() => setEditing({ id: r._id, value: r.duesFees || 0, note: "" })} title="Edit due fees" aria-label={`Edit due fees for ${r.name}`}
                              className="p-2 rounded-lg border border-[var(--border-light)] hover:border-[var(--primary)] hover:text-[var(--primary)]"><Pencil size={13} /></button>
                          )}
                          <button onClick={() => openHistory(r)} title="History" aria-label={`History for ${r.name}`}
                            className="p-2 rounded-lg border border-[var(--border-light)] hover:border-[var(--primary)] hover:text-[var(--primary)] relative">
                            <History size={13} />
                            {r.changes > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[var(--primary)] text-white text-[9px] font-black flex items-center justify-center">{r.changes}</span>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-light)] bg-[var(--bg-input)]/40">
                  <td className="px-4 py-3 text-xs font-bold text-[var(--text-secondary)]" colSpan={3}>{rows.length} student(s) shown</td>
                  <td className="px-4 py-3 text-right text-sm font-black text-[var(--text-primary)] tabular-nums">{rupees(shownTotal)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Recent uploads */}
      {uploads.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-black text-base text-[var(--text-primary)]">Recent uploads</h2>
          <div className="space-y-1.5">
            {uploads.slice(0, 10).map((u) => (
              <div key={u._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs px-3 py-2 rounded-xl bg-[var(--bg-input)]/60">
                <span className="font-bold text-[var(--text-primary)]">{u.fileName || "Sheet"}</span>
                <span className="text-[var(--text-secondary)]">{u.changed} changed · {u.matched} matched of {u.rows} rows{u.unmatched?.length ? ` · ${u.unmatched.length} not found` : ""}</span>
                <span className="text-[var(--text-secondary)]">{Object.entries(u.byBatch || {}).map(([b, n]) => `${b}: ${n}`).join(", ")}</span>
                <span className="ml-auto text-[var(--text-secondary)]">{u.byName} · {when(u.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload preview */}
      {preview && (
        <Modal title={`Check before saving — ${preview.file.name}`} onClose={() => setPreview(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[["Rows", preview.data.rows], ["Students found", preview.data.matched], ["Will change", preview.data.changed], ["Not in MILE", preview.data.unmatched.length]].map(([l, v]) => (
                <div key={l} className="rounded-2xl border border-[var(--border-light)] p-3">
                  <div className="text-xl font-black text-[var(--text-primary)]">{v}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">{l}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">By batch</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(preview.data.byBatch).map(([b, v]) => (
                  <span key={b} className="text-xs px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                    <b>{b}</b> — {v.students} students, {v.changed} change, {rupees(v.total)}
                  </span>
                ))}
              </div>
            </div>
            {preview.changes.length > 0 && (
              <div className="max-h-64 overflow-y-auto border border-[var(--border-light)] rounded-xl">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--bg-card)]">
                    <tr className="text-left text-[10px] uppercase text-[var(--text-secondary)]"><th className="px-3 py-2">Student</th><th className="px-3 py-2">Enrollment</th><th className="px-3 py-2">Batch</th><th className="px-3 py-2 text-right">Now</th><th className="px-3 py-2 text-right">New</th></tr>
                  </thead>
                  <tbody>
                    {preview.changes.map((c) => (
                      <tr key={c.enrollmentNumber} className="border-t border-[var(--border-light)]">
                        <td className="px-3 py-1.5 font-semibold">{c.name}</td><td className="px-3 py-1.5 font-mono">{c.enrollmentNumber}</td><td className="px-3 py-1.5">{c.batch}</td>
                        <td className="px-3 py-1.5 text-right">{rupees(c.previous)}</td><td className="px-3 py-1.5 text-right font-bold">{rupees(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(preview.data.unmatched.length > 0 || preview.data.problems.length > 0) && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs space-y-1">
                {preview.data.unmatched.length > 0 && <p><b>Not found in MILE (skipped):</b> {preview.data.unmatched.slice(0, 15).map((u) => u.enrollmentNumber).join(", ")}{preview.data.unmatched.length > 15 ? " …" : ""}</p>}
                {preview.data.problems.slice(0, 8).map((p) => <p key={p}>{p}</p>)}
              </div>
            )}
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the history (e.g. Accounts sheet, 24 Oct)" aria-label="Upload note" className={`${inputCls} w-full`} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setPreview(null)} className="btn-outline-premium text-sm px-4 py-2">Cancel</button>
              <button id="fees-confirm" onClick={confirmUpload} disabled={busy === "upload" || preview.data.changed === 0} className="btn-premium text-sm px-5 py-2 flex items-center gap-1.5 disabled:opacity-50">
                {busy === "upload" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {preview.data.changed ? `Save ${preview.data.changed} change(s)` : "Nothing to change"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* History */}
      {history && (
        <Modal title={`Fees history — ${history.student.name}`} onClose={() => setHistory(null)}>
          <p className="text-xs text-[var(--text-secondary)] mb-3">{history.student.enrollmentNumber} · {history.student.batch} · now <b className="text-[var(--text-primary)]">{rupees(history.student.duesFees)}</b></p>
          {!history.list ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
            : history.list.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No changes recorded yet.</p> : (
              <ol className="space-y-2">
                {history.list.map((h) => {
                  const up = h.amount > h.previous;
                  return (
                    <li key={h._id} className="rounded-xl border border-[var(--border-light)] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-sm font-black tabular-nums text-[var(--text-primary)]">{rupees(h.previous)} → {rupees(h.amount)}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${up ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"}`}>{up ? "+" : "−"}{rupees(Math.abs(h.amount - h.previous))}</span>
                      <span className="text-[11px] text-[var(--text-secondary)]">{SOURCE[h.source] || h.source}{h.upload?.fileName ? ` (${h.upload.fileName})` : ""}</span>
                      <span className="ml-auto text-[11px] text-[var(--text-secondary)]">{h.byName} · {when(h.createdAt)}</span>
                      {h.note && <div className="w-full text-xs text-[var(--text-secondary)]">“{h.note}”</div>}
                    </li>
                  );
                })}
              </ol>
            )}
        </Modal>
      )}
    </div>
  );
}
