import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, Plus, Trash2, Loader2, Paperclip, FileText, FlaskConical, BookMarked,
  Upload, Search, Save, RotateCcw, ListChecks, Target, MessageSquareText, FolderOpen,
  CheckCircle2, AlertCircle, GraduationCap, Layers,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";

const emptyActivity = () => ({ label: "", type: "tick", maxMarks: 0, unitWise: false, optional: false, deadline: null, pdfUrl: null, pdfFileName: null });
const toDateInputValue = (d) => (d ? String(d).slice(0, 10) : "");
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const MAX_QB_BYTES = 15 * 1024 * 1024;
const blankFive = () => ["", "", "", "", ""];

// The workspace tabs. `labOnly` marks the ones a lab support faculty may
// open — they can only touch Lab COs and the subject's material.
const TABS = [
  { key: "overview", label: "Overview", icon: BookOpen, labOnly: true },
  { key: "activities", label: "Activities", icon: ListChecks },
  { key: "outcomes", label: "Outcomes", icon: Target, labOnly: true },
  { key: "survey", label: "Survey", icon: MessageSquareText },
  { key: "materials", label: "Materials", icon: FolderOpen, labOnly: true },
];

const draftOf = (subject) => ({
  activities: (subject?.activities || []).map((a) => ({ ...a })),
  co: {
    co1: subject?.co1 || "", co2: subject?.co2 || "", co3: subject?.co3 || "",
    co4: subject?.co4 || "", co5: subject?.co5 || "",
  },
  labCo: {
    labCo1: subject?.labCo1 || "", labCo2: subject?.labCo2 || "", labCo3: subject?.labCo3 || "",
    labCo4: subject?.labCo4 || "", labCo5: subject?.labCo5 || "",
  },
  surveyQuestions: [...(subject?.surveyQuestions || []), ...blankFive()].slice(0, 5),
  labSurveyQuestions: [...(subject?.labSurveyQuestions || []), ...blankFive()].slice(0, 5),
});

const Chip = ({ children, tone = "muted", title }) => {
  const tones = {
    muted: "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)]",
    primary: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    warn: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  };
  return (
    <span title={title} className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
};

const SectionTitle = ({ icon: Icon, children, hint }) => (
  <div className="space-y-1">
    <h3 className="text-sm font-display font-black text-[var(--text-primary)] flex items-center gap-2">
      {Icon && <Icon size={15} className="text-[var(--primary)]" />} {children}
    </h3>
    {hint && <p className="text-[11px] text-[var(--text-secondary)]">{hint}</p>}
  </div>
);

const FileRow = ({ file, subtitle, busy, onDelete }) => (
  <div className="flex items-center gap-2 text-xs bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5">
    <FileText size={14} className="text-[var(--primary)] shrink-0" />
    <div className="min-w-0 flex-1">
      <a href={getImageUrl(file.url)} target="_blank" rel="noreferrer" className="font-bold text-[var(--text-primary)] hover:underline block truncate">
        {file.title}
      </a>
      <div className="text-[10px] text-[var(--text-secondary)] truncate">{subtitle}</div>
    </div>
    <button onClick={onDelete} disabled={busy} title="Delete" className="text-[var(--text-secondary)] hover:text-red-500 disabled:opacity-40 shrink-0">
      <Trash2 size={14} />
    </button>
  </div>
);

// Lets a Subject Faculty (anyone with a FacultySectionMap row for a
// subject — not just the coordinator/admin) manage that subject's
// Activities, Course Outcomes, survey questions and study material.
// Scoped server-side to the subjects this faculty actually teaches.
// A subject with a lab also has its own Lab COs; its lab support faculty
// see that subject too (myRole 'labSupport') but can edit only the Lab COs.
export default function MySubjectActivities() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");

  // One editable draft for the selected subject; `baseline` is what was
  // last loaded/saved, so the Save bar can tell you what's unsaved.
  const [draft, setDraft] = useState(draftOf(null));
  const [baseline, setBaseline] = useState(JSON.stringify(draftOf(null)));
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [qbBusy, setQbBusy] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteMeta, setNoteMeta] = useState({ title: "", unit: "" });

  const selectSubject = (subject) => {
    setSelectedId(subject?._id || null);
    const next = draftOf(subject);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setTab("overview");
  };

  const load = async (keepSelection = false) => {
    setLoading(true);
    try {
      const { data } = await api.get("/master-data/subjects/mine");
      if (data.success) {
        setSubjects(data.data);
        if (!keepSelection) selectSubject(data.data[0] || null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = subjects.find((s) => s._id === selectedId) || null;
  const isLabSupportOnly = selected?.myRole === "labSupport";
  const subjectHasLab = (selected?.noOfPractical || 0) > 0;
  const dirty = JSON.stringify(draft) !== baseline;

  const visibleTabs = TABS.filter((t) => !isLabSupportOnly || t.labOnly);

  const totals = useMemo(() => ({
    subjects: subjects.length,
    withLab: subjects.filter((s) => (s.noOfPractical || 0) > 0).length,
    activities: subjects.reduce((n, s) => n + (s.activities?.length || 0), 0),
    materials: subjects.reduce((n, s) => n + (s.questionBanks?.length || 0) + (s.notes?.length || 0), 0),
  }), [subjects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((s) => `${s.subjectName} ${s.subjectCode || ""}`.toLowerCase().includes(q));
  }, [subjects, search]);

  // Server responses don't carry myRole (it's per-viewer) — keep ours.
  const replaceSubject = (updated) =>
    setSubjects((prev) => prev.map((s) => (s._id === updated._id ? { ...updated, myRole: s.myRole } : s)));

  /* ----------------------------- draft edits ----------------------------- */
  const setActivities = (fn) => setDraft((d) => ({ ...d, activities: fn(d.activities) }));
  const addActivity = () => setActivities((list) => [...list, emptyActivity()]);
  const updateActivity = (idx, patch) => setActivities((list) => list.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const removeActivity = (idx) => setActivities((list) => list.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    try {
      if (isLabSupportOnly) {
        const { data } = await api.patch(`/master-data/subjects/${selectedId}/lab-cos`, draft.labCo);
        if (data.success) {
          toast.success("Lab COs saved");
          replaceSubject(data.data);
          setBaseline(JSON.stringify(draft));
        }
        return;
      }
      const { data } = await api.patch(`/master-data/subjects/${selectedId}/activities`, {
        activities: draft.activities,
        ...draft.co,
        surveyQuestions: draft.surveyQuestions,
        ...(subjectHasLab ? { ...draft.labCo, labSurveyQuestions: draft.labSurveyQuestions } : {}),
      });
      if (data.success) {
        toast.success("Assessment saved");
        // Keep editing with the saved activities' real _ids (a freshly added
        // one has none until now) so a PDF can be attached straight away.
        const next = { ...draft, activities: data.data.activities.map((a) => ({ ...a })) };
        setDraft(next);
        setBaseline(JSON.stringify(next));
        replaceSubject(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => {
    const next = draftOf(selected);
    setDraft(next);
    setBaseline(JSON.stringify(next));
  };

  /* ------------------------------- uploads ------------------------------- */
  const uploadAttachment = async (idx, activityId, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");
    if (file.size > MAX_PDF_BYTES) return toast.error("PDF must be 5MB or smaller");
    setUploadingIdx(idx);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post(
        `/master-data/subjects/${selectedId}/activities/${activityId}/attachment`,
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

  const uploadMaterial = async (kind, file) => {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");
    if (file.size > MAX_QB_BYTES) return toast.error("PDF must be 15MB or smaller");
    const isNote = kind === "notes";
    const setBusy = isNote ? setNoteBusy : setQbBusy;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", (isNote ? noteMeta.title : "").trim() || file.name.replace(/\.pdf$/i, "").slice(0, 60));
      if (isNote && noteMeta.unit) fd.append("unit", noteMeta.unit);
      const { data } = await api.post(`/master-data/subjects/${selectedId}/${isNote ? "notes" : "question-bank"}`, fd);
      if (data.success) {
        replaceSubject(data.data);
        if (isNote) setNoteMeta({ title: "", unit: "" });
        toast.success(`${isNote ? "Notes" : "Question bank"} uploaded — students can see it now`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteMaterial = async (kind, item) => {
    const isNote = kind === "notes";
    if (!window.confirm(`Delete "${item.title}"? Students will no longer see it.`)) return;
    const setBusy = isNote ? setNoteBusy : setQbBusy;
    setBusy(true);
    try {
      const { data } = await api.delete(`/master-data/subjects/${selectedId}/${isNote ? "notes" : "question-bank"}/${item._id}`);
      if (data.success) {
        replaceSubject(data.data);
        toast.success(`${isNote ? "Notes" : "Question bank"} deleted`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------- render ------------------------------- */
  // A "both" activity counts on both sides — it is one activity that the
  // faculty ticks on No Dues and also enters marks for in Sessional Marks.
  const isTick = (a) => a.type === "tick" || a.type === "both";
  const isMarks = (a) => a.type === "marks" || a.type === "both";
  const tickCount = draft.activities.filter(isTick).length;
  const markCount = draft.activities.filter(isMarks).length;
  const totalMarks = draft.activities.reduce((n, a) => n + (isMarks(a) ? Number(a.maxMarks) || 0 : 0), 0);
  const filledCOs = [1, 2, 3, 4, 5].filter((n) => draft.co[`co${n}`]?.trim()).length;
  const filledLabCOs = [1, 2, 3, 4, 5].filter((n) => draft.labCo[`labCo${n}`]?.trim()).length;
  const filledSurvey = draft.surveyQuestions.filter((q) => q.trim()).length;

  const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-colors";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
              <BookOpen size={26} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">My Subjects — Assessment</h1>
              <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
                Everything you own for a subject in one place — activities, course outcomes, survey questions and the material your students download.
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              [GraduationCap, totals.subjects, "Subjects"],
              [FlaskConical, totals.withLab, "With lab"],
              [ListChecks, totals.activities, "Activities"],
              [FolderOpen, totals.materials, "Files"],
            ].map(([Icon, value, label]) => (
              <div key={label} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl px-4 py-2.5 min-w-[92px]">
                <div className="flex items-center gap-1.5 text-[var(--primary)]"><Icon size={13} /><span className="text-lg font-display font-black text-[var(--text-primary)]">{value}</span></div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : subjects.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          You aren't assigned to any subject yet — ask the coordinator to finalize your Choice Filling allocation.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr] items-start">
          {/* ---------------- subject picker ---------------- */}
          <div className="glass-card rounded-3xl p-4 space-y-3 lg:sticky lg:top-6">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subjects…"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-0.5">
              {filtered.length === 0 && <p className="text-xs text-[var(--text-secondary)] px-1">No subject matches that.</p>}
              {filtered.map((s) => {
                const files = (s.questionBanks?.length || 0) + (s.notes?.length || 0);
                const active = s._id === selectedId;
                return (
                  <button
                    key={s._id}
                    onClick={() => selectSubject(s)}
                    className={`w-full text-left rounded-2xl px-3.5 py-3 border transition-all ${
                      active
                        ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-sm"
                        : "bg-[var(--bg-input)] border-[var(--border-light)] hover:border-[var(--primary)]/40"
                    }`}
                  >
                    <div className="font-bold text-sm text-[var(--text-primary)] leading-snug">{s.subjectName}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{s.subjectCode || "No code"} · Sem {s.semester}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Chip tone={active ? "primary" : "muted"}>{s.activities?.length || 0} act</Chip>
                      {files > 0 && <Chip tone="success">{files} file{files > 1 ? "s" : ""}</Chip>}
                      {(s.noOfPractical || 0) > 0 && <Chip tone="warn">Lab</Chip>}
                      {s.myRole === "labSupport" && <Chip tone="primary">Lab faculty</Chip>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ---------------- workspace ---------------- */}
          {selected && (
            <div className="space-y-4">
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-display font-black text-[var(--text-primary)]">{selected.subjectName}</h2>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {selected.subjectCode && <Chip>{selected.subjectCode}</Chip>}
                      <Chip>Sem {selected.semester}</Chip>
                      {selected.noOfLectures > 0 && <Chip>{selected.noOfLectures} lectures</Chip>}
                      {subjectHasLab && <Chip tone="warn"><FlaskConical size={9} className="inline -mt-0.5" /> {selected.noOfPractical} practical</Chip>}
                      {isLabSupportOnly && <Chip tone="primary">You are lab support — Lab COs only</Chip>}
                    </div>
                  </div>
                  {dirty && (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                      <AlertCircle size={13} /> Unsaved changes
                    </span>
                  )}
                </div>

                {/* tabs */}
                <div className="flex gap-1.5 flex-wrap border-b border-[var(--border-light)] -mb-px">
                  {visibleTabs.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 rounded-t-xl border-b-2 transition-colors ${
                        tab === key
                          ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>

                {/* ---------- overview ---------- */}
                {tab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        ["No Dues items", tickCount, "Tick + Both"],
                        ["Sessional items", markCount, `${totalMarks} marks total`],
                        ["Course outcomes", `${filledCOs}/5`, subjectHasLab ? `Lab: ${filledLabCOs}/5` : "NBA"],
                        ["Survey questions", `${filledSurvey}/5`, "Course exit survey"],
                      ].map(([label, value, hint]) => (
                        <div key={label} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-4">
                          <div className="text-2xl font-display font-black text-[var(--text-primary)]">{value}</div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-0.5">{label}</div>
                          <div className="text-[10px] text-[var(--text-secondary)] mt-1">{hint}</div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-4 space-y-2 text-xs text-[var(--text-secondary)]">
                      <SectionTitle icon={Layers}>Where this goes</SectionTitle>
                      <p><strong className="text-[var(--text-primary)]">Tick</strong> activities become checklist items on the No Dues form of the students you teach.</p>
                      <p><strong className="text-[var(--text-primary)]">Marks</strong> activities become CA categories in Sessional Marks, and any PDF you attach shows up on the student's Assignments page.</p>
                      <p><strong className="text-[var(--text-primary)]">Question banks and notes</strong> are visible to this subject's students the moment you upload them.</p>
                    </div>
                    {(selected.notes?.length > 0 || selected.questionBanks?.length > 0) && (
                      <div className="space-y-2">
                        <SectionTitle icon={FolderOpen}>Latest material</SectionTitle>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {[...(selected.notes || []).map((n) => ({ ...n, kind: "Notes" })), ...(selected.questionBanks || []).map((q) => ({ ...q, kind: "Question bank" }))]
                            .slice(0, 4)
                            .map((f) => (
                              <div key={f._id} className="flex items-center gap-2 text-xs bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
                                <FileText size={13} className="text-[var(--primary)] shrink-0" />
                                <a href={getImageUrl(f.url)} target="_blank" rel="noreferrer" className="font-bold text-[var(--text-primary)] truncate hover:underline">{f.title}</a>
                                <span className="ml-auto shrink-0"><Chip>{f.kind}</Chip></span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------- activities ---------- */}
                {tab === "activities" && !isLabSupportOnly && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <SectionTitle icon={ListChecks} hint="Your own list — tick items feed No Dues, marks items feed Sessional Marks.">
                        My Activities
                      </SectionTitle>
                      <button onClick={addActivity} className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 hover:border-[var(--primary)]">
                        <Plus size={13} /> Add activity
                      </button>
                    </div>
                    <div className="text-[11px] bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl px-4 py-3 text-[var(--text-secondary)] space-y-1">
                      <p>
                        These activities are <strong className="text-[var(--text-primary)]">yours</strong>. Other faculty teaching this subject keep their own,
                        and only the students you teach see this list.
                      </p>
                      <p>
                        Seen by:{" "}
                        {(selected.mySections || []).length === 0 ? (
                          <span className="text-amber-600">no section mapped to you yet — ask the coordinator to finalize the allocation</span>
                        ) : (
                          <strong className="text-[var(--text-primary)]">
                            {selected.mySections.map((x) => `${x.batch} · Sem ${x.semester} · Sec ${x.section}`).join(", ")}
                          </strong>
                        )}
                      </p>
                      {selected.hasOwnActivities === false && (
                        <p className="text-[var(--primary)]">
                          Starting from the coordinator's default list — as soon as you save, it becomes your own copy.
                        </p>
                      )}
                    </div>
                    {draft.activities.length === 0 && (
                      <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-2xl p-6 text-center">
                        No activities yet — add Assignment, Presentation, Lab Record, etc.
                      </p>
                    )}
                    <div className="space-y-2.5">
                      {draft.activities.map((a, idx) => (
                        <div key={idx} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-4 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                            <input
                              placeholder="Label (e.g. Presentation)"
                              value={a.label}
                              onChange={(e) => updateActivity(idx, { label: e.target.value })}
                              className={`${inputCls} flex-1 min-w-[160px] bg-[var(--bg-card)]`}
                            />
                            {/* type as a segmented control — clearer than a dropdown */}
                            <div className="flex rounded-xl border border-[var(--border-light)] overflow-hidden">
                              {[
                                ["tick", "Tick", "No Dues checklist item"],
                                ["marks", "Marks", "Sessional Marks CA category"],
                                ["both", "Both", "Goes to No Dues and Sessional Marks"],
                              ].map(([value, label, hint]) => (
                                <button
                                  key={value}
                                  title={hint}
                                  onClick={() => updateActivity(idx, { type: value })}
                                  className={`px-3 py-2 text-xs font-bold transition-colors ${
                                    a.type === value ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-card)] text-[var(--text-secondary)]"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => removeActivity(idx)} title="Remove activity" className="ml-auto text-[var(--text-secondary)] hover:text-red-500">
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {isMarks(a) && (
                            <div className="flex flex-wrap items-end gap-3 pl-8">
                              <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                                Max marks
                                <input
                                  type="number" min="0" value={a.maxMarks}
                                  onChange={(e) => updateActivity(idx, { maxMarks: Number(e.target.value) })}
                                  className={`${inputCls} w-24 bg-[var(--bg-card)]`}
                                />
                              </label>
                              <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                                Deadline
                                <input
                                  type="date" value={toDateInputValue(a.deadline)}
                                  onChange={(e) => updateActivity(idx, { deadline: e.target.value || null })}
                                  className={`${inputCls} bg-[var(--bg-card)]`}
                                />
                              </label>
                              {!a._id ? (
                                <span className="text-[11px] text-[var(--text-secondary)] italic pb-2">Save first to attach a PDF</span>
                              ) : a.pdfUrl ? (
                                <a
                                  href={getImageUrl(a.pdfUrl)} target="_blank" rel="noreferrer" title={a.pdfFileName}
                                  className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--primary)] border border-[var(--primary)]/30 bg-[var(--primary)]/5 rounded-xl px-3 py-2"
                                >
                                  <FileText size={12} /> {a.pdfFileName?.length > 20 ? `${a.pdfFileName.slice(0, 20)}…` : a.pdfFileName}
                                </a>
                              ) : (
                                <label className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border border-dashed border-[var(--border-light)] cursor-pointer text-[var(--text-secondary)] hover:border-[var(--primary)]">
                                  {uploadingIdx === idx ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />} Attach PDF (5MB)
                                  <input type="file" accept="application/pdf" className="hidden" disabled={uploadingIdx === idx}
                                    onChange={(e) => { uploadAttachment(idx, a._id, e.target.files[0]); e.target.value = ""; }} />
                                </label>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 pl-8 text-xs text-[var(--text-secondary)]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                              {a.type === "both" ? "No Dues + Sessional" : a.type === "marks" ? "Sessional only" : "No Dues only"}
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={!!a.unitWise} onChange={(e) => updateActivity(idx, { unitWise: e.target.checked })} /> Unit-wise
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={!!a.optional} onChange={(e) => updateActivity(idx, { optional: e.target.checked })} /> Optional (never blocks No Dues)
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---------- outcomes ---------- */}
                {tab === "outcomes" && (
                  <div className="space-y-5">
                    {!isLabSupportOnly && (
                      <div className="space-y-2">
                        <SectionTitle icon={Target} hint="Used on NBA reports and the Sessional Marks sheet.">
                          {subjectHasLab ? "Theory Course Outcomes" : "Course Outcomes"}
                        </SectionTitle>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <label key={n} className="flex flex-col gap-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">CO{n}</span>
                              <input
                                value={draft.co[`co${n}`]}
                                onChange={(e) => setDraft((d) => ({ ...d, co: { ...d.co, [`co${n}`]: e.target.value } }))}
                                placeholder={`Course Outcome ${n}`}
                                className={inputCls}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {subjectHasLab && (
                      <div className="space-y-2">
                        <SectionTitle icon={FlaskConical} hint="Separate from the theory COs above.">Lab Course Outcomes</SectionTitle>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <label key={n} className="flex flex-col gap-1">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Lab CO{n}</span>
                              <input
                                value={draft.labCo[`labCo${n}`]}
                                onChange={(e) => setDraft((d) => ({ ...d, labCo: { ...d.labCo, [`labCo${n}`]: e.target.value } }))}
                                placeholder={`Lab Course Outcome ${n}`}
                                className={inputCls}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------- survey ---------- */}
                {tab === "survey" && !isLabSupportOnly && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <SectionTitle icon={MessageSquareText} hint="Up to 5 statements students rate — Strongly Agree (5) to Strongly Disagree (1).">
                        Course Exit Survey Questions
                      </SectionTitle>
                      <div className="space-y-2">
                        {draft.surveyQuestions.map((q, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                            <input
                              value={q}
                              onChange={(e) => setDraft((d) => ({ ...d, surveyQuestions: d.surveyQuestions.map((x, i) => (i === idx ? e.target.value : x)) }))}
                              placeholder={`e.g. "The course objectives were clearly communicated"`}
                              className={`${inputCls} flex-1`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {subjectHasLab && (
                      <div className="space-y-2">
                        <SectionTitle icon={FlaskConical} hint="Asked in the Lab survey, separately from the theory questions.">
                          Lab — Course Exit Survey Questions
                        </SectionTitle>
                        <div className="space-y-2">
                          {draft.labSurveyQuestions.map((q, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 text-[11px] font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                              <input
                                value={q}
                                onChange={(e) => setDraft((d) => ({ ...d, labSurveyQuestions: d.labSurveyQuestions.map((x, i) => (i === idx ? e.target.value : x)) }))}
                                placeholder={`e.g. "The lab experiments helped me understand the concepts"`}
                                className={`${inputCls} flex-1`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------- materials ---------- */}
                {tab === "materials" && (
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* notes */}
                    <div className="space-y-2.5">
                      <SectionTitle icon={BookOpen} hint="Lecture notes / study material — students see them on their Assignments page.">
                        Notes ({(selected.notes || []).length})
                      </SectionTitle>
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={noteMeta.title}
                          onChange={(e) => setNoteMeta((m) => ({ ...m, title: e.target.value }))}
                          placeholder="Title (optional)"
                          className={`${inputCls} flex-1 min-w-[140px]`}
                        />
                        <select
                          value={noteMeta.unit}
                          onChange={(e) => setNoteMeta((m) => ({ ...m, unit: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="">No unit</option>
                          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Unit {n}</option>)}
                        </select>
                        <label className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
                          {noteBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload PDF
                          <input type="file" accept="application/pdf" className="hidden" disabled={noteBusy}
                            onChange={(e) => { uploadMaterial("notes", e.target.files?.[0]); e.target.value = ""; }} />
                        </label>
                      </div>
                      {(selected.notes || []).length === 0 ? (
                        <p className="text-[11px] text-[var(--text-secondary)]">No notes uploaded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {[...selected.notes].sort((a, b) => (a.unit || 99) - (b.unit || 99)).map((n) => (
                            <FileRow
                              key={n._id}
                              file={n}
                              busy={noteBusy}
                              subtitle={`${n.unit ? `Unit ${n.unit} · ` : ""}${n.fileName || ""}`}
                              onDelete={() => deleteMaterial("notes", n)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* question bank */}
                    <div className="space-y-2.5">
                      <SectionTitle icon={BookMarked} hint="Question banks for this subject — up to 10.">
                        Question Bank ({(selected.questionBanks || []).length})
                      </SectionTitle>
                      <label className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)] w-fit">
                        {qbBusy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Upload PDF
                        <input type="file" accept="application/pdf" className="hidden" disabled={qbBusy}
                          onChange={(e) => { uploadMaterial("question-bank", e.target.files?.[0]); e.target.value = ""; }} />
                      </label>
                      {(selected.questionBanks || []).length === 0 ? (
                        <p className="text-[11px] text-[var(--text-secondary)]">No question bank uploaded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {selected.questionBanks.map((qb) => (
                            <FileRow key={qb._id} file={qb} busy={qbBusy} subtitle={qb.fileName} onDelete={() => deleteMaterial("question-bank", qb)} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* save bar — only for the tabs that actually hold editable fields */}
              {tab !== "materials" && tab !== "overview" && (
                <div className="glass-card rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky bottom-4">
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                    {dirty ? <><AlertCircle size={14} className="text-amber-500" /> You have unsaved changes</> : <><CheckCircle2 size={14} className="text-emerald-500" /> Everything is saved</>}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={resetDraft} disabled={!dirty || saving} className="text-sm font-bold px-4 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 disabled:opacity-40">
                      <RotateCcw size={14} /> Reset
                    </button>
                    <button onClick={save} disabled={saving || !dirty} className="btn-premium text-sm px-5 py-2 flex items-center gap-1.5 disabled:opacity-40">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isLabSupportOnly ? "Save Lab COs" : "Save Assessment"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
