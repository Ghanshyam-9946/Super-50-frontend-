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
  // { 1: [semesters still free for MST 1], 2: [...] }
  const [canRelease, setCanRelease] = useState({ 1: [], 2: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [draft, setDraft] = useState(null);
  const [openResponses, setOpenResponses] = useState(null);
  const [responses, setResponses] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/course-coverage/forms");
      setForms(data.data || []);
      setCanRelease(data.canRelease || { 1: [], 2: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const release = async () => {
    if (!draft?.title?.trim()) return toast.error("Give the form a title");
    if (!(draft.semesters || []).length) return toast.error("Choose at least one semester");
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

  // Named here so the button and the hint beside it always agree.
  const missing = !draft ? ""
    : !draft.title?.trim() ? "Give the form a title"
      : !(draft.semesters || []).length ? "Pick at least one semester"
        : !draft.releaseDate ? "Set the release date"
          : !draft.deadlineDate ? "Set the deadline"
            : "";

  if (loading) {
    return <div className="p-4 md:p-8 max-w-6xl mx-auto"><div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-[var(--text-primary)] flex items-center gap-2">
            <ClipboardList size={22} className="text-[var(--primary)]" /> Course Coverage
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Released to every faculty, filled in per subject. Launched twice — once before MST 1, once before MST 2.
          </p>
        </div>
        {!draft && (canRelease[1]?.length || canRelease[2]?.length) > 0 && (
          <button
            onClick={() => {
              const round = canRelease[1]?.length ? 1 : 2;
              setDraft({
                title: `Course Coverage before MST ${round}`,
                round,
                semesters: [],
                releaseDate: dateInput(new Date()),
                // Prefilled a fortnight out. An empty deadline was the
                // likeliest reason a release "failed": the form refused
                // and the admin read that as an error.
                deadlineDate: dateInput(new Date(Date.now() + 14 * 86400000)),
              });
            }}
            className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5">
            <Rocket size={14} /> Release a form
          </button>
        )}
      </div>

      {!draft && !(canRelease[1]?.length || canRelease[2]?.length) && (
        <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
          <CheckCircle2 size={12} /> Both rounds are out for every semester. Edit the dates below to extend one.
        </p>
      )}

      {draft && (
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <h2 className="font-display font-black text-lg text-[var(--text-primary)]">
            Release a Course Coverage form
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className={`${labelCls} sm:col-span-2`}>
              Title
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className={`${inputCls} normal-case tracking-normal font-normal`} />
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

          <div className="space-y-2">
            <span className={labelCls}>Round</span>
            <div className="flex gap-2">
              {[1, 2].map((r) => (
                <button key={r} type="button"
                  onClick={() => setDraft({
                    ...draft, round: r, semesters: [],
                    title: `Course Coverage before MST ${r}`,
                  })}
                  disabled={!canRelease[r]?.length}
                  title={canRelease[r]?.length ? `` : `Every semester already has an MST ${r} form`}
                  className={`text-xs font-bold px-4 py-2 rounded-xl border transition disabled:opacity-40 ${
                    draft.round === r
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  }`}>
                  Before MST {r}
                </button>
              ))}
            </div>
          </div>

          {/* Semesters, several at once. Only the ones that do not already
              have this round's form are offered, so a click cannot fail. */}
          <div className="space-y-2">
            <span className={labelCls}>Semesters</span>
            {!canRelease[draft.round]?.length ? (
              <p className="text-[11px] text-amber-600">
                Every semester already has an MST {draft.round} form. Edit one below instead.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {canRelease[draft.round].map((sem) => {
                    const on = (draft.semesters || []).includes(sem);
                    return (
                      <button key={sem} type="button"
                        onClick={() => setDraft({
                          ...draft,
                          semesters: on
                            ? draft.semesters.filter((x) => x !== sem)
                            : [...(draft.semesters || []), sem].sort((a, b) => a - b),
                        })}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition ${
                          on
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        }`}>
                        Sem {sem}
                      </button>
                    );
                  })}
                </div>
                <button type="button"
                  onClick={() => setDraft({ ...draft, semesters: [...canRelease[draft.round]] })}
                  className="text-[11px] font-bold text-[var(--primary)] hover:underline">
                  Select all {canRelease[draft.round].length}
                </button>
              </>
            )}
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] border-l-2 border-[var(--primary)]/40 pl-2">
            Each semester gets its own form, so you can extend or close one without touching the rest.
            Faculty are asked only for the lectures needed to finish <b>MST {draft.round}</b> — the other
            MST is not shown. The deadline runs to the end of that day.
          </p>
          <div className="flex gap-2">
            <button onClick={release} disabled={busy === "release" || !!missing}
              title={missing || "Release this form to the faculty of the chosen semesters"}
              className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {busy === "release" ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
              Release{(draft.semesters || []).length ? ` for ${draft.semesters.map((x) => `Sem ${x}`).join(", ")}` : ""}
            </button>
            {missing && (
              <span className="self-center text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                <AlertCircle size={12} /> {missing}
              </span>
            )}
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
                  Sem {f.semester} · MST {f.round}
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
