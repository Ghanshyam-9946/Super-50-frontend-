import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, CheckCircle2, AlertCircle, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

// Course Coverage for one subject, shown inside My Subjects beside the
// Course File tab. The full page at /faculty/course-coverage lists every
// subject; this is the same thing narrowed to the subject on screen, so a
// faculty member filling in a subject does not have to leave it.
//
// A round asks for its own MST figure only — before MST 1 there is no MST 2
// plan to give, and by MST 2 the MST 1 figure is history.

const field =
  "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition disabled:opacity-60";
const label = "text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

const dateText = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const RoundForm = ({ form, subject, saved, onSaved }) => {
  const mstKey = form.requiredMst;
  const mstLabel = form.round === 2 ? "MST 2" : "MST 1";

  const [v, setV] = useState({ totalLectures: "", completedTillDate: "", unitCovered: "", mst: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setV({
      totalLectures: saved?.totalLectures ?? "",
      completedTillDate: saved?.completedTillDate ?? "",
      unitCovered: saved?.unitCovered || "",
      mst: saved?.[mstKey] ?? "",
    });
  }, [saved, mstKey]);

  const set = (patch) => setV((p) => ({ ...p, ...patch }));

  const total = Number(v.totalLectures) || 0;
  const done = Number(v.completedTillDate) || 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  const overrun = total > 0 && done > total;

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/course-coverage/forms/${form._id}/respond`, {
        subjectId: subject._id,
        totalLectures: v.totalLectures,
        completedTillDate: v.completedTillDate,
        unitCovered: v.unitCovered,
        [mstKey]: v.mst,
      });
      toast.success(data.message);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-2xl border ${saved ? "border-emerald-500/30" : "border-[var(--border-light)]"}`}>
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-light)]">
        <div className="min-w-0 flex items-center gap-2">
          {saved
            ? <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            : <CalendarClock size={15} className="text-[var(--text-secondary)] shrink-0" />}
          <div className="min-w-0">
            <div className="font-bold text-sm text-[var(--text-primary)] truncate">
              Before MST {form.round}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {form.title} · due {dateText(form.deadlineDate)}
              {saved && ` · saved ${dateText(saved.submittedAt)}`}
            </div>
          </div>
        </div>
        {form.closed ? (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-600">
            Deadline passed
          </span>
        ) : total > 0 && (
          <div className="w-32 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              <span>Covered</span>
              <span className={overrun ? "text-red-500" : pct >= 75 ? "text-emerald-600" : "text-amber-600"}>
                {done}/{total}
              </span>
            </div>
            <div className="h-1.5 mt-1 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-light)]">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: overrun ? "#ef4444" : pct >= 75 ? "#10b981" : "#f59e0b" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className={`${label} flex flex-col gap-1.5`}>
          <span>Total lectures <span className="text-red-500">*</span></span>
          <input type="number" min="0" value={v.totalLectures} disabled={form.closed}
            onChange={(e) => set({ totalLectures: e.target.value })} className={field} placeholder="e.g. 40" />
        </label>
        <label className={`${label} flex flex-col gap-1.5`}>
          <span>Completed till date</span>
          <input type="number" min="0" value={v.completedTillDate} disabled={form.closed}
            onChange={(e) => set({ completedTillDate: e.target.value })} className={field} placeholder="e.g. 18" />
        </label>
        <label className={`${label} flex flex-col gap-1.5`}>
          <span>Unit covered</span>
          <input value={v.unitCovered} disabled={form.closed}
            onChange={(e) => set({ unitCovered: e.target.value })}
            className={`${field} normal-case tracking-normal font-medium`} placeholder="e.g. Unit 1, Unit 2" />
        </label>
        <label className={`${label} flex flex-col gap-1.5`}>
          <span>Lectures to finish {mstLabel} <span className="text-red-500">*</span></span>
          <input type="number" min="0" value={v.mst} disabled={form.closed}
            onChange={(e) => set({ mst: e.target.value })} className={field} placeholder="e.g. 22" />
        </label>

        {overrun && (
          <p className="sm:col-span-2 lg:col-span-4 text-[11px] text-red-500 flex items-center gap-1.5">
            <AlertCircle size={12} /> Completed cannot be more than the total.
          </p>
        )}

        {!form.closed && (
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button onClick={submit} disabled={busy}
              className="btn-premium text-xs px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {saved ? "Update" : "Submit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SubjectCoverage({ subject }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/course-coverage/mine");
      // Only the rounds released for this subject's own semester.
      setForms((data.data || []).filter(
        (f) => Number(f.semester) === Number(subject?.semester),
      ));
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, [subject?.semester]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={18} /></div>;
  }

  if (forms.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center">
        No Course Coverage form has been released for semester {subject?.semester} yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {forms.map((f) => (
        <RoundForm
          key={f._id}
          form={f}
          subject={subject}
          saved={(f.responses || []).find((r) => String(r.subject) === String(subject._id))}
          onSaved={load}
        />
      ))}
    </div>
  );
}
