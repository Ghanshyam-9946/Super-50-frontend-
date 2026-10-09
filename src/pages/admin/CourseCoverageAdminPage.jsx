import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList, Loader2, Rocket, Trash2, Table2, AlertCircle, CheckCircle2, Download,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Course Coverage from the admin's side: release it once before MST 1 and
// once before MST 2, then read what came back and who has not answered.

const inputCls =
  "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";
const labelCls = "text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex flex-col gap-1";

const dateText = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const dateInput = (d) => (d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "");

export default function CourseCoverageAdminPage() {
  const [forms, setForms] = useState([]);
  const [canRelease, setCanRelease] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState(null);
  const [openResponses, setOpenResponses] = useState(null);
  const [responses, setResponses] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/course-coverage/forms");
      setForms(data.data || []);
      setCanRelease(data.canRelease || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const release = async () => {
    if (!draft?.title?.trim()) return toast.error("Give the form a title");
    if (!draft.releaseDate || !draft.deadlineDate) return toast.error("Both dates are needed");
    setBusy("release");
    try {
      const { data } = await api.post("/course-coverage/forms", draft);
      toast.success(data.message);
      setDraft(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not release it");
    } finally {
      setBusy("");
    }
  };

  const saveForm = async (form, patch) => {
    setBusy(form._id);
    try {
      const { data } = await api.put(`/course-coverage/forms/${form._id}`, patch);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setBusy("");
    }
  };

  const removeForm = async (form) => {
    if (!window.confirm(`Delete "${form.title}"?`)) return;
    setBusy(form._id);
    try {
      const { data } = await api.delete(`/course-coverage/forms/${form._id}`);
      toast.success(data.message);
      await load();
    } catch (err) {
      // The server refuses while responses exist rather than destroying
      // them without saying so.
      const msg = err.response?.data?.message || "Could not delete";
      if (err.response?.status === 409 && window.confirm(`${msg}\n\nDelete them too?`)) {
        try {
          const { data } = await api.delete(`/course-coverage/forms/${form._id}?force=1`);
          toast.success(data.message);
          await load();
        } catch (e2) {
          toast.error(e2.response?.data?.message || "Could not delete");
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy("");
    }
  };

  const viewResponses = async (form) => {
    if (openResponses === form._id) { setOpenResponses(null); return; }
    setOpenResponses(form._id);
    setResponses(null);
    try {
      const { data } = await api.get(`/course-coverage/forms/${form._id}/responses`);
      setResponses(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the responses");
    }
  };

  const exportCsv = () => {
    const rows = responses?.data || [];
    if (!rows.length) return toast.error("Nothing to export");
    const head = ["Faculty", "Department", "Subject", "Code", "Sem", "Total lectures", "Completed", "Unit covered", "For MST 1", "For MST 2", "Submitted"];
    const body = rows.map((r) => [
      r.faculty?.name || "", r.faculty?.department || "", r.subjectName, r.subjectCode, r.semester ?? "",
      r.totalLectures, r.completedTillDate ?? "", r.unitCovered, r.lecturesForMst1 ?? "", r.lecturesForMst2 ?? "",
      dateText(r.submittedAt),
    ]);
    const csv = [head, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "course_coverage.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-[var(--text-primary)] flex items-center gap-2">
            <ClipboardList size={22} className="text-[var(--primary)]" /> Course Coverage
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Released to every faculty, filled in per subject. Launched twice — once before MST 1, once before MST 2.
          </p>
        </div>
        {canRelease.length > 0 && !draft && (
          <button
            onClick={() => setDraft({
              title: `Course Coverage before MST ${canRelease[0]}`,
              round: canRelease[0], releaseDate: dateInput(new Date()), deadlineDate: "",
            })}
            className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5">
            <Rocket size={14} /> Release MST {canRelease[0]} form
          </button>
        )}
      </div>

      {canRelease.length === 0 && !draft && (
        <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
          <CheckCircle2 size={12} /> Both rounds have been released. Edit the dates below if you need to extend one.
        </p>
      )}

      {draft && (
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display font-black text-lg text-[var(--text-primary)]">
            Release the MST {draft.round} form
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className={`${labelCls} sm:col-span-2`}>
              Title
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className={`${inputCls} normal-case tracking-normal font-normal`} />
            </label>
            <label className={labelCls}>
              Round
              <select value={draft.round} onChange={(e) => setDraft({ ...draft, round: Number(e.target.value) })} className={inputCls}>
                {canRelease.map((r) => <option key={r} value={r}>Before MST {r}</option>)}
              </select>
            </label>
            <label className={labelCls}>
              Release date
              <input type="date" value={draft.releaseDate}
                onChange={(e) => setDraft({ ...draft, releaseDate: e.target.value })} className={inputCls} />
            </label>
            <label className={labelCls}>
              Deadline
              <input type="date" value={draft.deadlineDate}
                onChange={(e) => setDraft({ ...draft, deadlineDate: e.target.value })} className={inputCls} />
            </label>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">
            MST {draft.round}: faculty must enter the lectures required to complete <b>MST {draft.round}</b> for every
            subject assigned to them. The deadline runs to the end of that day.
          </p>
          <div className="flex gap-2">
            <button onClick={release} disabled={busy === "release"} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {busy === "release" ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} Release to all faculty
            </button>
            <button onClick={() => setDraft(null)} className="text-sm font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {forms.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          Nothing released yet.
        </div>
      ) : forms.map((f) => (
        <div key={f._id} className="glass-card rounded-3xl p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-bold text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                {f.title}
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30">
                  MST {f.round}
                </span>
                {f.closed && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-red-500/10 text-red-600 border-red-500/30">
                    closed
                  </span>
                )}
                {!f.isActive && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--border-light)] text-[var(--text-secondary)]">
                    hidden
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Released {dateText(f.releaseDate)} · due {dateText(f.deadlineDate)} ·{" "}
                <b className="text-[var(--text-primary)]">{f.responses}</b> response(s) from {f.facultyResponded} faculty
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => viewResponses(f)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
                <Table2 size={13} /> {openResponses === f._id ? "Hide" : "Responses"}
              </button>
              <button onClick={() => removeForm(f)} disabled={busy === f._id}
                className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-40" title="Delete this form">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className={`${labelCls} sm:col-span-2`}>
              Title
              <input defaultValue={f.title} onBlur={(e) => e.target.value !== f.title && saveForm(f, { title: e.target.value })}
                className={`${inputCls} normal-case tracking-normal font-normal`} />
            </label>
            <label className={labelCls}>
              Release date
              <input type="date" defaultValue={dateInput(f.releaseDate)}
                onChange={(e) => saveForm(f, { releaseDate: e.target.value })} className={inputCls} />
            </label>
            <label className={labelCls}>
              Deadline
              <input type="date" defaultValue={dateInput(f.deadlineDate)}
                onChange={(e) => saveForm(f, { deadlineDate: e.target.value })} className={inputCls} />
            </label>
          </div>

          <label className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
            <input type="checkbox" checked={f.isActive} onChange={(e) => saveForm(f, { isActive: e.target.checked })} />
            Visible to faculty
          </label>

          {openResponses === f._id && (
            responses === null ? (
              <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {responses.summary?.submitted} submitted · {responses.summary?.pending} pending
                  </span>
                  <button onClick={exportCsv} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
                    <Download size={13} /> CSV
                  </button>
                </div>

                <div className="overflow-x-auto border border-[var(--border-light)] rounded-2xl">
                  <table className="w-full text-xs min-w-[760px]">
                    <thead>
                      <tr className="bg-[var(--primary)]/5 text-[var(--text-secondary)] text-left">
                        <th className="px-3 py-2 font-black uppercase tracking-wider">Faculty</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">Subject</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">Total</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">Done</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">Unit covered</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">For MST 1</th>
                        <th className="px-3 py-2 font-black uppercase tracking-wider">For MST 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(responses.data || []).map((r) => (
                        <tr key={r._id} className="border-t border-[var(--border-light)]">
                          <td className="px-3 py-2">
                            <div className="font-bold text-[var(--text-primary)]">{r.faculty?.name}</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">{r.faculty?.department}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-[var(--text-primary)]">{r.subjectName}</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">{r.subjectCode}</div>
                          </td>
                          <td className="px-3 py-2">{r.totalLectures}</td>
                          <td className="px-3 py-2">{r.completedTillDate ?? "—"}</td>
                          <td className="px-3 py-2">{r.unitCovered || "—"}</td>
                          <td className="px-3 py-2">{r.lecturesForMst1 ?? "—"}</td>
                          <td className="px-3 py-2">{r.lecturesForMst2 ?? "—"}</td>
                        </tr>
                      ))}
                      {(responses.data || []).length === 0 && (
                        <tr><td colSpan={7} className="px-3 py-8 text-center text-[var(--text-secondary)]">Nothing submitted yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {(responses.pending || []).length > 0 && (
                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-3">
                    <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1.5">
                      <AlertCircle size={13} /> Still to submit ({responses.pending.length})
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] space-y-0.5 max-h-40 overflow-y-auto">
                      {responses.pending.map((p, i) => (
                        <div key={`${p.faculty?._id}-${p.subject}-${i}`}>
                          <b className="text-[var(--text-primary)]">{p.faculty?.name}</b> — {p.subjectName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
