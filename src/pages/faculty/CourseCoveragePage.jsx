import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList, Loader2, Save, CheckCircle2, AlertCircle, CalendarClock, Layers, BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Course Coverage, as the faculty meets it: one card per subject they teach
// in the semester the form is for.
//
// A round asks for its own MST figure only. Before MST 1 there is no MST 2
// plan to give, and by MST 2 the MST 1 figure is history — showing both
// boxes invited people to fill in the wrong one.

const field =
  "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition disabled:opacity-60";
const label = "text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

const dateText = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const daysLeft = (d) => {
  const end = new Date(d);
  const ms = end.setHours(23, 59, 59, 999) - Date.now();
  return Math.ceil(ms / 86400000);
};

/* ----------------------------- one subject ----------------------------- */

const SubjectCard = ({ form, subject, saved, onSaved }) => {
  const mstKey = form.requiredMst; // 'lecturesForMst1' | 'lecturesForMst2'
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
    <div className={`glass-card rounded-2xl overflow-hidden border ${saved ? "border-emerald-500/30" : "border-[var(--border-light)]"}`}>
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-light)]">
        <div className="min-w-0 flex items-center gap-2.5">
          <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            saved ? "bg-emerald-500/10 text-emerald-600" : "bg-[var(--primary)]/10 text-[var(--primary)]"
          }`}>
            {saved ? <CheckCircle2 size={17} /> : <BookOpen size={17} />}
          </span>
          <div className="min-w-0">
            <div className="font-bold text-sm text-[var(--text-primary)] truncate">{subject.subjectName}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {[subject.subjectCode, `Sem ${subject.semester}`].filter(Boolean).join(" · ")}
              {saved && ` · saved ${dateText(saved.submittedAt)}`}
            </div>
          </div>
        </div>
        {total > 0 && (
          <div className="w-40 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              <span>Covered</span>
              <span className={overrun ? "text-red-500" : pct >= 75 ? "text-emerald-600" : "text-amber-600"}>
                {done}/{total}
              </span>
            </div>
            <div className="h-1.5 mt-1 bg-[var(--bg-input)] rounded-full overflow-hidden border border-[var(--border-light)]">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: overrun ? "#ef4444" : pct >= 75 ? "#10b981" : "#f59e0b" }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        {/* Only this round's figure. The other MST is not asked for here. */}
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

/* ------------------------------- the page ------------------------------- */

export default function CourseCoveragePage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/course-coverage/mine");
      setForms(data.data || []);
      setOpenId((cur) => cur || (data.data || [])[0]?._id || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the form");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = useMemo(() => forms.find((f) => f._id === openId), [forms, openId]);

  if (loading) {
    return <div className="p-4 md:p-8 max-w-5xl mx-auto"><div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <ClipboardList className="text-[var(--primary)]" size={26} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Course Coverage
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            How far each of your subjects has got, before the MST.
          </p>
        </div>
      </header>

      {forms.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl space-y-2">
          <Layers size={34} className="text-[var(--text-secondary)] opacity-40 mx-auto" />
          <p className="font-bold text-[var(--text-primary)]">Nothing to fill in</p>
          <p className="text-sm text-[var(--text-secondary)]">
            No Course Coverage form has been released for a semester you teach in.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {forms.map((f) => {
              const on = openId === f._id;
              const complete = f.done === f.total && f.total > 0;
              return (
                <button key={f._id} onClick={() => setOpenId(f._id)}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl border flex items-center gap-2 transition ${
                    on
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}>
                  <span>Sem {f.semester}</span>
                  <span className={on ? "opacity-70" : "text-[var(--text-secondary)]"}>·</span>
                  <span>MST {f.round}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    on ? "bg-white/20" : complete ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                  }`}>
                    {f.done}/{f.total}
                  </span>
                </button>
              );
            })}
          </div>

          {open && (
            <div className="space-y-3">
              <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--text-primary)]">{open.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Layers size={12} /> Semester {open.semester} · before MST {open.round}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarClock size={12} /> Released {dateText(open.releaseDate)} · due {dateText(open.deadlineDate)}
                    </span>
                  </div>
                </div>
                {open.closed ? (
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Deadline passed — read only
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {daysLeft(open.deadlineDate) <= 3 && (
                      <span className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600">
                        {daysLeft(open.deadlineDate) <= 0 ? "Due today" : `${daysLeft(open.deadlineDate)} day(s) left`}
                      </span>
                    )}
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                      open.done === open.total
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-[var(--border-light)] text-[var(--text-secondary)]"
                    }`}>
                      {open.done} of {open.total} filled
                    </span>
                  </div>
                )}
              </div>

              {(open.subjects || []).map((s) => (
                <SubjectCard
                  key={`${open._id}-${s._id}`}
                  form={open}
                  subject={s}
                  saved={(open.responses || []).find((r) => String(r.subject) === String(s._id))}
                  onSaved={load}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
