import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2, Save, CheckCircle2, AlertCircle, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Course Coverage, as the faculty meets it: one row per subject they
// teach, for whichever rounds the admin has released.

const inputCls =
  "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";

const dateText = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const SubjectRow = ({ form, subject, saved, onSaved }) => {
  const [v, setV] = useState({
    totalLectures: "", completedTillDate: "", unitCovered: "",
    lecturesForMst1: "", lecturesForMst2: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setV({
      totalLectures: saved?.totalLectures ?? "",
      completedTillDate: saved?.completedTillDate ?? "",
      unitCovered: saved?.unitCovered || "",
      lecturesForMst1: saved?.lecturesForMst1 ?? "",
      lecturesForMst2: saved?.lecturesForMst2 ?? "",
    });
  }, [saved]);

  const set = (patch) => setV((p) => ({ ...p, ...patch }));
  // Round 1 asks for the MST 1 plan, round 2 for the MST 2 plan. The other
  // box stays available, because a faculty who knows both may as well say.
  const mstField = form.requiredMst;

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/course-coverage/forms/${form._id}/respond`, {
        subjectId: subject._id, ...v,
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
    <div className={`rounded-2xl border p-4 space-y-3 ${saved ? "border-emerald-500/30 bg-emerald-500/5" : "border-[var(--border-light)]"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            {subject.subjectName}
            {saved && <CheckCircle2 size={14} className="text-emerald-600" />}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            {[subject.subjectCode, subject.semester ? `Sem ${subject.semester}` : ""].filter(Boolean).join(" · ")}
            {saved ? ` · saved ${dateText(saved.submittedAt)}` : ""}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex flex-col gap-1">
          Total no. of lecture <span className="text-red-500">*</span>
          <input type="number" min="0" value={v.totalLectures} disabled={form.closed}
            onChange={(e) => set({ totalLectures: e.target.value })} className={inputCls} />
        </label>
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex flex-col gap-1">
          Lectures completed till date
          <input type="number" min="0" value={v.completedTillDate} disabled={form.closed}
            onChange={(e) => set({ completedTillDate: e.target.value })} className={inputCls} />
        </label>
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex flex-col gap-1">
          Unit covered
          <input value={v.unitCovered} disabled={form.closed} placeholder="e.g. Unit 1, Unit 2"
            onChange={(e) => set({ unitCovered: e.target.value })}
            className={`${inputCls} normal-case tracking-normal font-normal`} />
        </label>
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex flex-col gap-1">
          Lectures required to complete MST 1
          {mstField === "lecturesForMst1" && <span className="text-red-500">*</span>}
          <input type="number" min="0" value={v.lecturesForMst1} disabled={form.closed}
            onChange={(e) => set({ lecturesForMst1: e.target.value })} className={inputCls} />
        </label>
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex flex-col gap-1">
          Lectures required to complete MST 2
          {mstField === "lecturesForMst2" && <span className="text-red-500">*</span>}
          <input type="number" min="0" value={v.lecturesForMst2} disabled={form.closed}
            onChange={(e) => set({ lecturesForMst2: e.target.value })} className={inputCls} />
        </label>
      </div>

      {!form.closed && (
        <div className="flex justify-end">
          <button onClick={submit} disabled={busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saved ? "Update" : "Submit"}
          </button>
        </div>
      )}
    </div>
  );
};

export default function CourseCoveragePage() {
  const [forms, setForms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/course-coverage/mine");
      setForms(data.data || []);
      setSubjects(data.subjects || []);
      setOpenForm((cur) => cur || (data.data || [])[0]?._id || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the form");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-black text-2xl text-[var(--text-primary)] flex items-center gap-2">
          <ClipboardList size={22} className="text-[var(--primary)]" /> Course Coverage
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Fill this in for every subject you teach, before the deadline.
        </p>
      </div>

      {forms.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No Course Coverage form has been released yet.
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No subject is assigned to you yet, so there is nothing to fill in.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {forms.map((f) => (
              <button key={f._id} onClick={() => setOpenForm(f._id)}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl border flex items-center gap-1.5 ${
                  openForm === f._id
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                }`}>
                MST {f.round}
                <span className={openForm === f._id ? "opacity-80" : "text-[var(--text-secondary)]"}>
                  {f.done}/{f.total}
                </span>
              </button>
            ))}
          </div>

          {forms.filter((f) => f._id === openForm).map((f) => (
            <div key={f._id} className="space-y-3">
              <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--text-primary)]">{f.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5">
                    <CalendarClock size={12} />
                    Released {dateText(f.releaseDate)} · due {dateText(f.deadlineDate)}
                  </div>
                </div>
                {f.closed ? (
                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-600 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Deadline passed — read only
                  </span>
                ) : (
                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                    f.done === f.total
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                  }`}>
                    {f.done} of {f.total} subject{f.total === 1 ? "" : "s"} filled
                  </span>
                )}
              </div>

              {subjects.map((s) => (
                <SubjectRow
                  key={`${f._id}-${s._id}`}
                  form={f}
                  subject={s}
                  saved={(f.responses || []).find((r) => String(r.subject) === String(s._id))}
                  onSaved={load}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
