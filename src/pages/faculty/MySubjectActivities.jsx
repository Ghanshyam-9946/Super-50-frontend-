import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Loader2, Edit3, X, Paperclip, FileText, FlaskConical, BookMarked, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";

const emptyActivity = () => ({ label: "", type: "tick", maxMarks: 0, unitWise: false, optional: false, deadline: null, pdfUrl: null, pdfFileName: null });
const toDateInputValue = (d) => (d ? String(d).slice(0, 10) : "");
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_QB_BYTES = 15 * 1024 * 1024;
const emptyLabCo = () => ({ labCo1: "", labCo2: "", labCo3: "", labCo4: "", labCo5: "" });

// Lets a Subject Faculty (anyone with a FacultySectionMap row for a
// subject — not just the coordinator/admin) manage that subject's
// Activities, which drive both No Dues checklist items and Sessional
// Marks CA categories. Scoped server-side (PATCH /subjects/:id/activities)
// to only the subjects this faculty is actually assigned to teach.
// A subject with a lab also has its own Lab COs; its lab support faculty
// see that subject too (myRole 'labSupport') but can edit only the Lab COs
// (PATCH /subjects/:id/lab-cos).
export default function MySubjectActivities() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [co, setCo] = useState({ co1: "", co2: "", co3: "", co4: "", co5: "" });
  const [labCo, setLabCo] = useState(emptyLabCo);
  const [qbBusy, setQbBusy] = useState(null); // subjectId being uploaded/deleted
  const [surveyQuestions, setSurveyQuestions] = useState(["", "", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/subjects/mine");
      if (data.success) setSubjects(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (subject) => {
    setEditingId(subject._id);
    setActivities(subject.activities.map((a) => ({ ...a })));
    setCo({
      co1: subject.co1 || "", co2: subject.co2 || "", co3: subject.co3 || "",
      co4: subject.co4 || "", co5: subject.co5 || "",
    });
    setSurveyQuestions([...(subject.surveyQuestions || []), "", "", "", "", ""].slice(0, 5));
    setLabCo({
      labCo1: subject.labCo1 || "", labCo2: subject.labCo2 || "", labCo3: subject.labCo3 || "",
      labCo4: subject.labCo4 || "", labCo5: subject.labCo5 || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setActivities([]);
    setCo({ co1: "", co2: "", co3: "", co4: "", co5: "" });
    setLabCo(emptyLabCo());
    setSurveyQuestions(["", "", "", "", ""]);
  };

  const editingSubject = subjects.find((s) => s._id === editingId);
  const isLabSupportOnly = editingSubject?.myRole === "labSupport";

  // Question bank PDFs: uploaded per subject, visible to that subject's students
  const uploadQuestionBank = async (subject, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");
    if (file.size > MAX_QB_BYTES) return toast.error("PDF must be 15MB or smaller");
    setQbBusy(subject._id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name.replace(/\.pdf$/i, "").slice(0, 60));
      const { data } = await api.post(`/master-data/subjects/${subject._id}/question-bank`, fd);
      if (data.success) {
        replaceSubject(data.data);
        toast.success("Question bank uploaded — students can see it now");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setQbBusy(null);
    }
  };

  const deleteQuestionBank = async (subject, qb) => {
    if (!window.confirm(`Delete "${qb.title}"? Students will no longer see it.`)) return;
    setQbBusy(subject._id);
    try {
      const { data } = await api.delete(`/master-data/subjects/${subject._id}/question-bank/${qb._id}`);
      if (data.success) {
        replaceSubject(data.data);
        toast.success("Question bank deleted");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    } finally {
      setQbBusy(null);
    }
  };

  // Server responses don't carry myRole (it's per-viewer) — keep ours.
  const replaceSubject = (updated) =>
    setSubjects((prev) => prev.map((s) => (s._id === updated._id ? { ...updated, myRole: s.myRole } : s)));

  const updateSurveyQuestion = (idx, value) =>
    setSurveyQuestions((prev) => prev.map((q, i) => (i === idx ? value : q)));

  const addActivity = () => setActivities((prev) => [...prev, emptyActivity()]);
  const updateActivity = (idx, patch) =>
    setActivities((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const removeActivity = (idx) => setActivities((prev) => prev.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      if (isLabSupportOnly) {
        const { data } = await api.patch(`/master-data/subjects/${editingId}/lab-cos`, labCo);
        if (data.success) {
          toast.success("Lab COs saved");
          replaceSubject(data.data);
        }
        return;
      }
      const hasLab = editingSubject?.noOfPractical > 0;
      const { data } = await api.patch(`/master-data/subjects/${editingId}/activities`, {
        activities, ...co, surveyQuestions, ...(hasLab ? labCo : {}),
      });
      if (data.success) {
        toast.success("Assessment saved");
        // Stay in edit mode with the saved subject's real activity _ids
        // (a freshly-added activity has none until now) so a PDF can be
        // attached to it right away, without reopening.
        setActivities(data.data.activities.map((a) => ({ ...a })));
        replaceSubject(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const uploadAttachment = async (idx, activityId, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("PDF must be 5MB or smaller");
      return;
    }
    setUploadingIdx(idx);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(
        `/master-data/subjects/${editingId}/activities/${activityId}/attachment`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (data.success) {
        const updated = data.data.activities.find((a) => a._id === activityId);
        if (updated) updateActivity(idx, { pdfUrl: updated.pdfUrl, pdfFileName: updated.pdfFileName });
        replaceSubject(data.data);
        toast.success("PDF attached");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload PDF");
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <BookOpen size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">My Subjects — Assessment</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Manage Activities and Course Outcomes (NBA) for subjects you're assigned to teach — feeds No Dues checklists and Sessional Marks CA categories automatically.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          You aren't assigned to any subject yet — ask the coordinator to finalize your Choice Filling allocation.
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map((s) => (
            <div key={s._id} className="glass-card rounded-2xl px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                    {s.subjectName} {s.subjectCode && <span className="text-[var(--text-secondary)] font-medium">({s.subjectCode})</span>}
                    {s.myRole === "labSupport" && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                        <FlaskConical size={10} className="inline -mt-0.5" /> Lab faculty
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Sem {s.semester} · {s.activities.length} activit{s.activities.length === 1 ? "y" : "ies"}
                    {s.noOfPractical > 0 && " · Has Lab"}
                  </div>
                </div>
                {editingId !== s._id && (
                  <button onClick={() => startEdit(s)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
                    <Edit3 size={12} /> {s.myRole === "labSupport" ? "Manage Lab COs" : "Manage Assessment"}
                  </button>
                )}
              </div>

              {/* Question bank — students of this subject can download these */}
              <div className="mt-3 border-t border-[var(--border-light)] pt-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
                    <BookMarked size={12} /> Question Bank ({(s.questionBanks || []).length})
                  </span>
                  <label className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1 cursor-pointer hover:border-[var(--primary)]">
                    {qbBusy === s._id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload PDF
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={qbBusy === s._id}
                      onChange={(e) => {
                        uploadQuestionBank(s, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {(s.questionBanks || []).length === 0 ? (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    No question bank uploaded yet — students see these on their Assignments page.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {s.questionBanks.map((qb) => (
                      <div key={qb._id} className="flex items-center gap-2 text-xs bg-[var(--bg-input)] rounded-lg px-3 py-2">
                        <FileText size={13} className="text-[var(--primary)] shrink-0" />
                        <a href={getImageUrl(qb.url)} target="_blank" rel="noreferrer" className="font-semibold text-[var(--text-primary)] hover:underline truncate">
                          {qb.title}
                        </a>
                        <span className="text-[var(--text-secondary)] truncate hidden sm:inline">{qb.fileName}</span>
                        <button
                          onClick={() => deleteQuestionBank(s, qb)}
                          disabled={qbBusy === s._id}
                          title="Delete"
                          className="ml-auto text-[var(--text-secondary)] hover:text-red-500 disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingId === s._id && (
                <div className="mt-4 space-y-4 border-t border-[var(--border-light)] pt-4">
                  {!isLabSupportOnly && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      {s.noOfPractical > 0 ? "Theory Course Outcomes (NBA)" : "Course Outcomes (NBA)"}
                    </span>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">CO{n}</span>
                          <input
                            value={co[`co${n}`]}
                            onChange={(e) => setCo((prev) => ({ ...prev, [`co${n}`]: e.target.value }))}
                            placeholder={`Course Outcome ${n}`}
                            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  )}
                  {s.noOfPractical > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
                        <FlaskConical size={12} /> Lab Course Outcomes (NBA)
                      </span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <label key={n} className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Lab CO{n}</span>
                            <input
                              value={labCo[`labCo${n}`]}
                              onChange={(e) => setLabCo((prev) => ({ ...prev, [`labCo${n}`]: e.target.value }))}
                              placeholder={`Lab Course Outcome ${n}`}
                              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {!isLabSupportOnly && (
                  <>
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Course Exit Survey Questions</span>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Up to 5 statements students will rate on a fixed scale — Strongly Agree (5), Agree (4), Neutral (3), Disagree (2), Strongly Disagree (1).
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {surveyQuestions.map((q, idx) => (
                        <label key={idx} className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Question {idx + 1}</span>
                          <input
                            value={q}
                            onChange={(e) => updateSurveyQuestion(idx, e.target.value)}
                            placeholder={`e.g. "The course objectives were clearly communicated"`}
                            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Activities</span>
                    <button onClick={addActivity} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
                      <Plus size={12} /> Add Activity
                    </button>
                  </div>
                  {activities.length === 0 && <p className="text-xs text-[var(--text-secondary)]">No activities yet — add Assignment, Presentation, Lab, etc.</p>}
                  {activities.map((a, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-2.5">
                      <input
                        placeholder="Label (e.g. Presentation)"
                        value={a.label}
                        onChange={(e) => updateActivity(idx, { label: e.target.value })}
                        className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs flex-1 min-w-[140px]"
                      />
                      <select
                        value={a.type}
                        onChange={(e) => updateActivity(idx, { type: e.target.value })}
                        className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                      >
                        <option value="tick">Tick (No Dues)</option>
                        <option value="marks">Marks (Sessional)</option>
                      </select>
                      {a.type === "marks" && (
                        <>
                          <input
                            type="number"
                            min="0"
                            placeholder="Max marks"
                            value={a.maxMarks}
                            onChange={(e) => updateActivity(idx, { maxMarks: Number(e.target.value) })}
                            className="w-24 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            Deadline
                            <input
                              type="date"
                              value={toDateInputValue(a.deadline)}
                              onChange={(e) => updateActivity(idx, { deadline: e.target.value || null })}
                              className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                            />
                          </label>
                          {!a._id ? (
                            <span className="text-[11px] text-[var(--text-secondary)] italic">Save first to attach a PDF</span>
                          ) : a.pdfUrl ? (
                            <a
                              href={getImageUrl(a.pdfUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] underline"
                              title={a.pdfFileName}
                            >
                              <FileText size={12} /> {a.pdfFileName?.length > 18 ? `${a.pdfFileName.slice(0, 18)}…` : a.pdfFileName}
                            </a>
                          ) : (
                            <label className="flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg border border-dashed border-[var(--border-light)] cursor-pointer text-[var(--text-secondary)]">
                              {uploadingIdx === idx ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                              Attach PDF (max 5MB)
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                disabled={uploadingIdx === idx}
                                onChange={(e) => uploadAttachment(idx, a._id, e.target.files[0])}
                              />
                            </label>
                          )}
                        </>
                      )}
                      <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <input type="checkbox" checked={a.unitWise} onChange={(e) => updateActivity(idx, { unitWise: e.target.checked })} /> Unit-wise
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <input type="checkbox" checked={a.optional} onChange={(e) => updateActivity(idx, { optional: e.target.checked })} /> Optional
                      </label>
                      <button onClick={() => removeActivity(idx)} className="ml-auto">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                  </>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button onClick={save} disabled={saving} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : isLabSupportOnly ? "Save Lab COs" : "Save Assessment"}
                    </button>
                    <button onClick={cancelEdit} className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5">
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
