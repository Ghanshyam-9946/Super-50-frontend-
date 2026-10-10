import { useEffect, useState } from "react";
import {
  Loader2, Save, Plus, Trash2, Shuffle, Link2, Upload, Star, MessageSquare, Users, ListChecks, UserPlus, UserMinus, Check,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// The parts of a training that sit around the core sheet: the batches
// students are divided into, where the result lands in a subject, and what
// the students thought of the trainer.

const inputCls =
  "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]";

/* =========================== 3.2 batches =========================== */

export const BatchesPanel = ({ training, records, onChanged }) => {
  const [rows, setRows] = useState(training.batches || []);
  const [busy, setBusy] = useState("");
  const [faculty, setFaculty] = useState([]);
  const [choiceOpen, setChoiceOpen] = useState(!!training.batchChoiceOpen);
  const [choiceDeadline, setChoiceDeadline] = useState(
    training.batchChoiceDeadline ? String(training.batchChoiceDeadline).slice(0, 16) : "",
  );

  useEffect(() => {
    api.get("/tasks/faculty-list").then(({ data }) => setFaculty(data.data || [])).catch(() => {});
  }, []);

  const toggleChoice = async () => {
    setBusy("choice");
    try {
      const { data } = await api.put(`/trainings/${training._id}/batch-choice`, {
        open: !choiceOpen,
        deadline: choiceDeadline || null,
      });
      setChoiceOpen(data.data.batchChoiceOpen);
      toast.success(data.message);
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change it");
    } finally { setBusy(""); }
  };

  const save = async () => {
    setBusy("save");
    try {
      const { data } = await api.put(`/trainings/${training._id}/batches`, { batches: rows });
      toast.success(data.message);
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the batches");
    } finally { setBusy(""); }
  };

  const autoSplit = async () => {
    if (!window.confirm("Divide every student across these batches? Anyone already placed will be moved.")) return;
    setBusy("split");
    try {
      const { data } = await api.post(`/trainings/${training._id}/batches/assign`, {});
      toast.success(data.message);
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not divide them");
    } finally { setBusy(""); }
  };

  // Adding students by hand. Not every training is run by choice filling,
  // so the admin needs to be able to say outright who is in a batch.
  const [adding, setAdding] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candQuery, setCandQuery] = useState("");
  const [candAll, setCandAll] = useState(false);
  const [candScope, setCandScope] = useState("");
  const [candTruncated, setCandTruncated] = useState(false);
  const [picked, setPicked] = useState([]);
  const [addTo, setAddTo] = useState("");

  const loadCandidates = async () => {
    try {
      const { data } = await api.get(`/trainings/${training._id}/add-candidates`, {
        params: { q: candQuery.trim(), all: candAll ? 1 : undefined },
      });
      setCandidates(data.data || []);
      setCandScope(data.scope || "");
      setCandTruncated(!!data.truncated);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the student list");
    }
  };

  // Typing in the box re-asks the server; the list is far too long to filter
  // in the browser.
  useEffect(() => {
    if (!adding) return undefined;
    const t = setTimeout(loadCandidates, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adding, candQuery, candAll]);

  const addPicked = async () => {
    if (picked.length === 0) return toast.error("Pick at least one student");
    setBusy("add");
    try {
      const { data } = await api.post(`/trainings/${training._id}/students`, {
        studentIds: picked, batchName: addTo || undefined,
      });
      toast.success(data.message);
      if (data.skipped?.length) toast(data.skipped.slice(0, 3).join(", "));
      setPicked([]);
      await loadCandidates();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add them");
    } finally {
      setBusy("");
    }
  };

  // Out of the batch, or out of the training altogether.
  const removeStudent = async (record, batchOnly) => {
    const what = batchOnly
      ? `Take ${record.studentName} out of "${record.trainingBatch}"? They stay in the training.`
      : `Remove ${record.studentName} from this training completely?`;
    if (!window.confirm(what)) return;
    setBusy(record._id);
    try {
      const { data } = await api.delete(`/trainings/${training._id}/students/${record._id}`, {
        params: batchOnly ? { batchOnly: 1 } : {},
      });
      toast.success(data.message);
      onChanged?.();
    } catch (err) {
      const msg = err.response?.data?.message || "Could not remove them";
      // The server refuses when attendance or marks already exist, rather
      // than deleting somebody's recorded work without saying so.
      if (err.response?.status === 409 && window.confirm(`${msg}\n\nDelete those records too?`)) {
        try {
          const { data } = await api.delete(`/trainings/${training._id}/students/${record._id}`, { params: { force: 1 } });
          toast.success(data.message);
          onChanged?.();
        } catch (e2) {
          toast.error(e2.response?.data?.message || "Could not remove them");
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy("");
    }
  };

  const move = async (recordId, batchName) => {
    try {
      await api.post(`/trainings/${training._id}/batches/assign`, { assignments: { [recordId]: batchName } });
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not move them");
    }
  };

  const counts = (rows || []).map((b) =>
    records.filter((r) => r.trainingBatch === b.name).length);
  const unplaced = records.filter((r) => !r.trainingBatch).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {rows.map((b, i) => (
          <div key={b._id || i} className="flex flex-wrap items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-2.5">
            <input value={b.name} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
              placeholder="Batch name" className={`${inputCls} flex-1 min-w-[120px]`} />
            <input type="number" min="1" value={b.capacity ?? ""} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, capacity: e.target.value } : r)))}
              placeholder="Seats" className={`${inputCls} w-24`} />
            <input value={b.venue || ""} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, venue: e.target.value } : r)))}
              placeholder="Venue" className={`${inputCls} w-32`} />
            <input value={b.schedule || ""} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, schedule: e.target.value } : r)))}
              placeholder="Timing" className={`${inputCls} w-36`} />
            <select value={b.faculty?._id || b.faculty || ""} onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, faculty: e.target.value } : r)))}
              className={`${inputCls} w-44`}>
              <option value="">Trainer…</option>
              {faculty.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
            <span className="text-[11px] font-bold text-[var(--text-secondary)] px-2">{counts[i] ?? 0} in</span>
            <button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
              <Trash2 size={14} />
            </button>
            {/* What a student needs to know before choosing this one. */}
            <textarea
              value={b.instructions || ""}
              onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, instructions: e.target.value } : r)))}
              rows={2}
              placeholder="Instructions for students — what to bring, which gate, what the sessions cover"
              className={`${inputCls} w-full resize-y text-xs`}
            />
          </div>
        ))}
        <button onClick={() => setRows([...rows, { name: `Batch ${String.fromCharCode(65 + rows.length)}`, capacity: "", venue: "", schedule: "" }])}
          className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1.5">
          <Plus size={13} /> Add a batch
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={!!busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save batches
        </button>
        {/* Students pick one for themselves; the admin can still move
            anybody afterwards. */}
        <button onClick={toggleChoice} disabled={!!busy || rows.length === 0}
          className={`text-xs px-4 py-2 rounded-xl font-bold border flex items-center gap-1.5 disabled:opacity-50 ${
            choiceOpen ? "border-red-500/40 text-red-500" : "border-emerald-500/40 text-emerald-600"
          }`}>
          {busy === "choice" ? <Loader2 size={13} className="animate-spin" /> : <ListChecks size={13} />}
          {choiceOpen ? "Close student choice" : "Let students choose"}
        </button>
        <label className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
          until
          <input type="datetime-local" value={choiceDeadline}
            onChange={(e) => setChoiceDeadline(e.target.value)}
            className={`${inputCls} py-1.5 text-xs w-52`} />
        </label>
        <button onClick={autoSplit} disabled={!!busy || rows.length === 0}
          className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "split" ? <Loader2 size={13} className="animate-spin" /> : <Shuffle size={13} />} Divide everyone evenly
        </button>
        <button onClick={() => { setAdding((v) => !v); setPicked([]); }}
          className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5">
          <UserPlus size={13} /> {adding ? "Done adding" : "Add students"}
        </button>
        {unplaced > 0 && <span className="text-xs text-amber-600 self-center">{unplaced} student(s) not in a batch</span>}
      </div>

      {adding && (
        <div className="border border-[var(--border-light)] rounded-2xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input value={candQuery} onChange={(e) => setCandQuery(e.target.value)}
              placeholder="Search by name or enrollment number"
              className={`${inputCls} flex-1 min-w-[200px]`} />
            <select value={addTo} onChange={(e) => setAddTo(e.target.value)} className={`${inputCls} w-44`}>
              <option value="">Add without a batch</option>
              {rows.filter((b) => b.name).map((b) => <option key={b.name} value={b.name}>Into {b.name}</option>)}
            </select>
            <label className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
              <input type="checkbox" checked={candAll} onChange={(e) => setCandAll(e.target.checked)} />
              Any class
            </label>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Showing {candidates.length} student(s) not already in this training
            {candScope && !candAll ? ` from ${candScope}` : ""}
            {candTruncated ? " \u2014 narrow the search to see the rest" : ""}
          </div>

          <div className="max-h-56 overflow-y-auto border border-[var(--border-light)] rounded-xl divide-y divide-[var(--border-light)]">
            {candidates.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[var(--text-secondary)]">
                Nobody left to add{candAll ? "" : " from this class \u2014 tick \u201cAny class\u201d to look wider"}.
              </div>
            ) : candidates.map((c) => {
              const on = picked.includes(c._id);
              return (
                <button key={c._id} type="button"
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c._id) : [...p, c._id]))}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs ${on ? "bg-[var(--primary)]/10" : "hover:bg-[var(--bg-hover)]"}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border-light)]"}`}>
                    {on && <Check size={11} className="text-white" />}
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">{c.name}</span>
                  <span className="text-[var(--text-secondary)]">{c.enrollmentNumber}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] ml-auto">
                    {[c.semester ? `Sem ${c.semester}` : "", c.section, c.batch].filter(Boolean).join(" \u00b7 ")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={addPicked} disabled={busy === "add" || picked.length === 0}
              className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
              {busy === "add" ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
              Add {picked.length || ""} {picked.length === 1 ? "student" : "students"}
              {addTo ? ` to ${addTo}` : ""}
            </button>
            {picked.length > 0 && (
              <button onClick={() => setPicked([])} className="text-xs font-bold text-[var(--text-secondary)] hover:underline">
                Clear
              </button>
            )}
            {candidates.length > 0 && (
              <button onClick={() => setPicked(candidates.map((c) => c._id))}
                className="text-xs font-bold text-[var(--primary)] hover:underline ml-auto">
                Select all {candidates.length} shown
              </button>
            )}
          </div>
        </div>
      )}

      {records.length > 0 && rows.length > 0 && (
        <div className="overflow-x-auto border border-[var(--border-light)] rounded-2xl">
          <table className="w-full text-xs min-w-[460px]">
            <thead>
              <tr className="bg-[var(--primary)]/5 text-[var(--text-secondary)] text-left">
                <th className="px-3 py-2 font-black uppercase tracking-wider">Student</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider w-44">Batch</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider w-24 text-right">Remove</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id} className="border-t border-[var(--border-light)]">
                  <td className="px-3 py-2">
                    <div className="font-bold text-[var(--text-primary)]">{r.studentName}</div>
                    <div className="text-[10px] text-[var(--text-secondary)]">{r.enrollmentNumber}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select value={r.trainingBatch || ""} onChange={(e) => move(r._id, e.target.value)} className={inputCls}>
                      <option value="">Not placed</option>
                      {rows.filter((b) => b.name).map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {r.trainingBatch && (
                      <button onClick={() => removeStudent(r, true)} disabled={!!busy}
                        title="Take out of this batch, but keep them in the training"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-amber-600 disabled:opacity-40">
                        <UserMinus size={14} />
                      </button>
                    )}
                    <button onClick={() => removeStudent(r, false)} disabled={!!busy}
                      title="Remove from this training altogether"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ================ 3.3 the result into sessional marks ================ */

export const SessionalLinkPanel = ({ training, onChanged }) => {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    subject: training.sessionalLink?.subject?._id || training.sessionalLink?.subject || "",
    category: training.sessionalLink?.category || "",
    maxMarks: training.sessionalLink?.maxMarks || 20,
  });
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get("/master-data/subjects").then(({ data }) => setSubjects(data.data || [])).catch(() => {});
  }, []);

  const save = async () => {
    setBusy("save");
    try {
      const { data } = await api.put(`/trainings/${training._id}/sessional-link`, form);
      toast.success(data.message);
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the link");
    } finally { setBusy(""); }
  };

  const push = async () => {
    if (!window.confirm("Write every student's training score into that subject's sessional marks?")) return;
    setBusy("push");
    try {
      const { data } = await api.post(`/trainings/${training._id}/push-sessional`);
      toast.success(data.message);
      setResult(data.data);
      await onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not push the marks");
    } finally { setBusy(""); }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--text-secondary)]">
        Send this training's assessment result straight into a subject's sessional marks, so the
        faculty does not type the same numbers twice. The score is scaled to the activity's own maximum.
      </p>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Subject
          <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={`${inputCls} mt-1.5`}>
            <option value="">Not linked</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectCode})</option>)}
          </select>
        </label>
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Activity it files under
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Training Score" className={`${inputCls} mt-1.5`} />
        </label>
        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
          Out of
          <input type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} className={`${inputCls} mt-1.5`} />
        </label>
      </div>
      <p className="text-[11px] text-[var(--text-secondary)]">
        The activity must already exist on that subject for the faculty who owns each sheet, as a
        Marks or Both activity — otherwise that student is skipped and told why.
      </p>

      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={!!busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />} Save link
        </button>
        <button onClick={push} disabled={!!busy || !training.sessionalLink?.subject}
          className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "push" ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Push the marks
        </button>
        {training.sessionalLink?.lastPushedAt && (
          <span className="text-[11px] text-[var(--text-secondary)] self-center">
            last pushed {new Date(training.sessionalLink.lastPushedAt).toLocaleString()}
          </span>
        )}
      </div>

      {result && (
        <div className="text-xs space-y-1 border border-[var(--border-light)] rounded-2xl p-3">
          <p className="font-bold text-emerald-600">{result.pushed.length} written</p>
          {result.skipped.length > 0 && (
            <>
              <p className="font-bold text-amber-600">{result.skipped.length} skipped</p>
              {result.skipped.slice(0, 10).map((s, i) => (
                <p key={i} className="text-[var(--text-secondary)]">{s.student} — {s.reason}</p>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ===================== 3.4 feedback on the trainer ===================== */

export const FeedbackPanel = ({ training, onChanged }) => {
  const [faculty, setFaculty] = useState([]);
  const [trainers, setTrainers] = useState((training.trainers || []).map((t) => t._id || t));
  const [open, setOpen] = useState(!!training.feedbackOpen);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api.get("/tasks/faculty-list").then(({ data }) => setFaculty(data.data || [])).catch(() => {});
    api.get(`/trainings/${training._id}/feedback/report`)
      .then(({ data }) => setReport(data)).catch(() => {});
  }, [training._id]);

  const save = async (nextOpen = open) => {
    setBusy("save");
    try {
      const { data } = await api.put(`/trainings/${training._id}/feedback-setup`, { trainers, feedbackOpen: nextOpen });
      toast.success(data.message);
      setOpen(nextOpen);
      await onChanged();
      const r = await api.get(`/trainings/${training._id}/feedback/report`);
      setReport(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally { setBusy(""); }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">
          Who gets rated
        </p>
        {/* Taken from the venues, not chosen again here: whoever was put in
            charge of a batch is who that batch's students rate. */}
        {(training.batches || []).filter((b) => b.faculty).length === 0 ? (
          <p className="text-xs text-amber-600">
            No venue has a trainer yet. Name one on the Batches tab and they will appear here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(training.batches || []).filter((b) => b.faculty).map((b) => (
              <span key={b.name}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]">
                {b.faculty?.name || "Trainer"} <span className="opacity-70">· {b.name}</span>
              </span>
            ))}
          </div>
        )}
        <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
          Each student rates only the trainer of their own batch.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => save(!open)} disabled={!!busy}
          className={`text-xs px-4 py-2 rounded-xl font-bold border flex items-center gap-1.5 disabled:opacity-50 ${
            open ? "border-red-500/40 text-red-500" : "border-emerald-500/40 text-emerald-600"
          }`}>
          <MessageSquare size={13} /> {open ? "Close feedback" : "Open feedback to students"}
        </button>
      </div>

      {report?.data?.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] text-[var(--text-secondary)]">
            {report.enrolled} student(s) attended. Answers are anonymous — no name is stored against a rating here.
          </p>
          {report.data.map((row) => (
            <div key={row.faculty._id} className="border border-[var(--border-light)] rounded-2xl p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  {row.faculty.name}
                  {row.batches?.length > 0 && (
                    <span className="ml-2 text-[11px] font-normal text-[var(--text-secondary)]">
                      {row.batches.join(", ")}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-black">
                  <Star size={14} className="text-amber-500" />
                  {row.overall ?? "—"}<span className="text-[var(--text-secondary)] font-normal text-xs"> / 5 · {row.responses} response(s)</span>
                </span>
              </div>
              {row.questions.map((q) => (
                <div key={q.question} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 text-[var(--text-secondary)]">{q.question}</span>
                  <div className="w-24 h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--primary)]" style={{ width: `${((q.average || 0) / 5) * 100}%` }} />
                  </div>
                  <span className="font-bold text-[var(--text-primary)] w-8 text-right">{q.average ?? "—"}</span>
                </div>
              ))}
              {row.comments.length > 0 && (
                <div className="pt-1 space-y-1">
                  {row.comments.map((c, i) => (
                    <p key={i} className="text-[11px] text-[var(--text-secondary)] italic">“{c}”</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================== 3.1 choice rounds (its own page) ================== */

export const ChoiceRoundsPanel = () => {
  const [rounds, setRounds] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [openId, setOpenId] = useState(null);
  const [responses, setResponses] = useState(null);
  const [form, setForm] = useState({ title: "", trainings: [], semesters: "", maxChoices: 3, deadline: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        api.get("/trainings/choice-rounds"),
        api.get("/trainings"),
      ]);
      setRounds(r.data.data || []);
      setTrainings(t.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the rounds");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setBusy("create");
    try {
      const { data } = await api.post("/trainings/choice-rounds", {
        ...form,
        semesters: String(form.semesters).split(",").map((n) => Number(n.trim())).filter(Boolean),
        released: true,
      });
      toast.success(data.message);
      setForm({ title: "", trainings: [], semesters: "", maxChoices: 3, deadline: "" });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the round");
    } finally { setBusy(""); }
  };

  const openResponses = async (id) => {
    if (openId === id) { setOpenId(null); setResponses(null); return; }
    setOpenId(id);
    setResponses(null);
    try {
      const { data } = await api.get(`/trainings/choice-rounds/${id}/responses`);
      setResponses(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the responses");
    }
  };

  const allot = async (id) => {
    const seats = {};
    (responses?.demand || []).forEach((d) => {
      const n = window.prompt(`How many seats for "${d.training.name}"? Leave blank for no limit.`, "");
      if (n && Number(n) > 0) seats[d.training._id] = Number(n);
    });
    setBusy(id);
    try {
      const { data } = await api.post(`/trainings/choice-rounds/${id}/allot`, { seats });
      toast.success(data.message);
      await openResponses(id);
      await openResponses(id);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not allot");
    } finally { setBusy(""); }
  };

  const remove = async (id, title) => {
    if (!window.confirm(`Delete "${title}" and every response to it?`)) return;
    try {
      const { data } = await api.delete(`/trainings/choice-rounds/${id}`);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete it");
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="space-y-5">
      <div className="glass-card p-4 rounded-2xl space-y-3">
        <h3 className="font-display font-black text-sm text-[var(--text-primary)]">Open a new choice round</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Round title" className={inputCls} />
          <input value={form.semesters} onChange={(e) => setForm({ ...form, semesters: e.target.value })} placeholder="Semesters e.g. 5,7" className={inputCls} />
          <input type="number" min="1" value={form.maxChoices} onChange={(e) => setForm({ ...form, maxChoices: e.target.value })} placeholder="Choices each" className={inputCls} />
          <input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputCls} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1.5">Trainings on offer</p>
          <div className="flex flex-wrap gap-1.5">
            {trainings.map((t) => {
              const on = form.trainings.includes(t._id);
              return (
                <button key={t._id} type="button"
                  onClick={() => setForm({ ...form, trainings: on ? form.trainings.filter((x) => x !== t._id) : [...form.trainings, t._id] })}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                    on ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                       : "border-[var(--border-light)] text-[var(--text-secondary)]"
                  }`}>
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
        <button onClick={create} disabled={!!busy || !form.title || form.trainings.length === 0}
          className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {busy === "create" ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Open the round
        </button>
      </div>

      {rounds.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No rounds yet.</p>
      ) : rounds.map((r) => (
        <div key={r._id} className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                {r.title}
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                  r.live ? "bg-emerald-500/15 text-emerald-600" : "bg-slate-400/15 text-slate-500"
                }`}>{r.live ? "open" : "closed"}</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                {r.trainings.length} training(s) · {r.responses} response(s) · {r.allotted} allotted
                {r.deadline ? ` · closes ${new Date(r.deadline).toLocaleString()}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openResponses(r._id)} className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                <Users size={13} /> {openId === r._id ? "Hide" : "Responses"}
              </button>
              <button onClick={() => remove(r._id, r.title)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
            </div>
          </div>

          {openId === r._id && (
            <div className="border-t border-[var(--border-light)] p-4 space-y-3">
              {!responses ? <Loader2 className="animate-spin text-[var(--primary)]" size={18} /> : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {responses.demand.map((d) => (
                      <span key={d.training._id} className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-light)]">
                        <strong className="text-[var(--text-primary)]">{d.training.name}</strong>
                        <span className="text-[var(--text-secondary)]"> — 1st choice {d.firstChoice} · allotted {d.allotted}</span>
                      </span>
                    ))}
                    <button onClick={() => allot(r._id)} disabled={busy === r._id}
                      className="btn-premium text-[11px] px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
                      {busy === r._id ? <Loader2 size={11} className="animate-spin" /> : <Shuffle size={11} />} Allot seats
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr className="text-[var(--text-secondary)] text-left">
                          <th className="px-3 py-2 font-black uppercase tracking-wider">Student</th>
                          <th className="px-3 py-2 font-black uppercase tracking-wider">Preferences</th>
                          <th className="px-3 py-2 font-black uppercase tracking-wider">Allotted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.data.map((c) => (
                          <tr key={c._id} className="border-t border-[var(--border-light)]">
                            <td className="px-3 py-2">
                              <div className="font-bold text-[var(--text-primary)]">{c.student?.name}</div>
                              <div className="text-[10px] text-[var(--text-secondary)]">{c.student?.enrollmentNumber}</div>
                            </td>
                            <td className="px-3 py-2 text-[var(--text-secondary)]">
                              {(c.preferences || []).map((p, i) => `${i + 1}. ${p.name}`).join("   ")}
                            </td>
                            <td className="px-3 py-2">
                              {c.allotted
                                ? <span className="font-bold text-emerald-600">{c.allotted.name}</span>
                                : <span className="text-amber-600">not placed</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
