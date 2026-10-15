import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Loader2, Send, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { MONTHS, downloadBlob } from "./appraisalHelpers";
import PeoplePicker from "./PeoplePicker";

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full";
const labelCls = "flex flex-col gap-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]";
const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function AppraisalHRPage() {
  const [people, setPeople] = useState([]);
  const [cycles, setCycles] = useState(null);
  const now = new Date();
  const [form, setForm] = useState({
    formFor: "faculty", title: "",
    from: { year: now.getMonth() >= 6 ? now.getFullYear() - 1 : now.getFullYear() - 2, month: 7 },
    to: { year: now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1, month: 6 },
  });
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([api.get("/appraisal/people"), api.get("/appraisal/cycles")]);
      setPeople(p.data.data);
      setCycles(c.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load");
      setCycles([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const release = async () => {
    if (!form.title.trim()) return toast.error("Give the appraisal a title");
    if (!selected.length) return toast.error("Select at least one person");
    if (!window.confirm(`Release "${form.title}" to ${selected.length} ${form.formFor === "hod" ? "HOD(s)" : "faculty member(s)"}?`)) return;
    setBusy("release");
    try {
      const { data } = await api.post("/appraisal/cycles", { ...form, people: selected });
      toast.success(data.message, { duration: 6000 });
      setSelected([]);
      setForm((f) => ({ ...f, title: "" }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not release");
    } finally {
      setBusy("");
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.title}" and all ${c.counts.total} of its forms? This cannot be undone.`)) return;
    try {
      const { data } = await api.delete(`/appraisal/cycles/${c._id}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    }
  };

  const downloadAll = async (c) => {
    setBusy(`zip-${c._id}`);
    try {
      await downloadBlob(`/appraisal/cycles/${c._id}/download`, `${c.title}.zip`, { format: "pdf" });
    } catch {
      toast.error("Could not download");
    } finally {
      setBusy("");
    }
  };

  const setMonth = (which, key, v) => setForm((f) => ({ ...f, [which]: { ...f[which], [key]: Number(v) } }));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20"><Users size={26} /></div>
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Appraisal — HR</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Release appraisal forms, follow where each one is, and download them filled in — one person or the whole round at once.
          </p>
        </div>
      </header>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Release an appraisal</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={labelCls}>Form for
            <select value={form.formFor} onChange={(e) => { setForm((f) => ({ ...f, formFor: e.target.value })); setSelected([]); }} className={inputCls}>
              <option value="faculty">Faculty (goes to their HOD, then the Principal)</option>
              <option value="hod">HOD (goes straight to the Principal)</option>
            </select>
          </label>
          <label className={labelCls}>Appraisal title
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Faculty Appraisal AY 2024-25" className={inputCls} />
          </label>
          {[["from", "From"], ["to", "To"]].map(([which, label]) => (
            <div key={which} className={labelCls}>{label} (month / year)
              <div className="flex gap-2">
                <select value={form[which].month} onChange={(e) => setMonth(which, "month", e.target.value)} className={inputCls}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <select value={form[which].year} onChange={(e) => setMonth(which, "year", e.target.value)} className={inputCls}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className={`${labelCls} mb-2`}>Select {form.formFor === "hod" ? "HODs" : "faculty"}</div>
          <PeoplePicker people={people} value={selected} onChange={setSelected} hodsOnly={form.formFor === "hod"} />
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Each form is filled in from the person&apos;s profile for this period; they add what is missing. A faculty form goes to the HOD of their department — set someone as HOD (or HR, or Principal) in Verify Faculty &amp; Admins → Responsibilities.
        </p>
        <button onClick={release} disabled={busy === "release"} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "release" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Release
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Released rounds</h2>
        {!cycles ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
          : cycles.length === 0 ? <div className="glass-card rounded-2xl p-8 text-center text-sm text-[var(--text-secondary)]">Nothing released yet.</div>
            : cycles.map((c) => (
              <div key={c._id} className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <Link to={`/appraisal/hr/${c._id}`} className="font-bold text-sm text-[var(--text-primary)] hover:text-[var(--primary)] hover:underline">{c.title}</Link>
                  <div className="text-xs text-[var(--text-secondary)]">{c.formFor === "hod" ? "HOD" : "Faculty"} · {c.period} · released by {c.releasedBy?.name || "—"}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">With appraisee {c.counts.faculty}</span>
                    {c.formFor === "faculty" && <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600">With HOD {c.counts.hod}</span>}
                    <span className="px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600">With Principal {c.counts.principal}</span>
                    <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600">Completed {c.counts.completed} / {c.counts.total}</span>
                  </div>
                </div>
                <Link to={`/appraisal/hr/${c._id}`} className="btn-outline-premium text-xs px-3 py-2">Open</Link>
                <button onClick={() => downloadAll(c)} disabled={!!busy} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
                  {busy === `zip-${c._id}` ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download all (PDF)
                </button>
                <button onClick={() => remove(c)} title="Delete round" className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
              </div>
            ))}
      </div>
    </div>
  );
}
