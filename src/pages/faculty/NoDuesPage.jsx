import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck2,
  Users2,
  Plus,
  ClipboardList,
  ListChecks,
  Loader2,
  X,
  ChevronRight,
  PartyPopper,
  Circle,
  Save,
  Check,
  Search,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { fetchMe } from "../../features/auth/authSlice";
import NoDuesFormDetail from "../../components/nodues/NoDuesFormDetail";

const DEFAULT_SUBJECT_ITEMS = [
  "Assignment",
  "Tutorial",
  "POD AI Quiz",
  "Presentation/GD/Task/Mini Project",
];

const isAcademicCoordinator = (user) =>
  user?.role === "admin" ||
  (user?.responsibilities || []).includes("Academic Coordinator");

export default function NoDuesPage() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const isCoordinator = isAcademicCoordinator(user);
  const [tab, setTab] = useState(isCoordinator ? "students" : "checklist"); // students | create | forms | checklist
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [myForms, setMyForms] = useState([]);
  const [checklistForms, setChecklistForms] = useState([]);
  const [studentsError, setStudentsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [preselectedStudent, setPreselectedStudent] = useState(null);
  const [openFormId, setOpenFormId] = useState(null);

  // Refresh the current user's responsibilities (e.g. picks up an
  // "Academic Coordinator" tag assigned since the last login) before
  // deciding which tabs/data to load.
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      // Only an Academic Coordinator (or admin) is allowed to call this —
      // skip it entirely for everyone else instead of eating a 403.
      isCoordinator ? api.get("/no-dues/all-students") : Promise.resolve(null),
      api.get("/no-dues/faculty-list"),
      api.get("/no-dues/mine"),
      api.get("/no-dues/assigned-to-me"),
    ]);
    const [s, f, mf, cf] = results;

    if (!isCoordinator) {
      setStudents([]);
      setStudentsError("");
    } else if (s.status === "fulfilled" && s.value?.data.success) {
      setStudents(s.value.data.data);
      setStudentsError("");
    } else {
      setStudents([]);
      setStudentsError(
        s.status === "rejected"
          ? s.reason?.response?.data?.message ||
              s.reason?.message ||
              "Request failed"
          : "",
      );
    }

    if (f.status === "fulfilled" && f.value.data.success)
      setFaculty(f.value.data.data);
    else toast.error("Failed to load faculty list");

    if (mf.status === "fulfilled" && mf.value.data.success)
      setMyForms(mf.value.data.data);
    else toast.error("Failed to load forms you created");

    if (cf.status === "fulfilled" && cf.value.data.success)
      setChecklistForms(cf.value.data.data);
    else toast.error("Failed to load your subject checklist");

    setLoading(false);
  }, [isCoordinator]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshForms = useCallback(async () => {
    const [mf, cf] = await Promise.allSettled([
      api.get("/no-dues/mine"),
      api.get("/no-dues/assigned-to-me"),
    ]);
    if (mf.status === "fulfilled" && mf.value.data.success)
      setMyForms(mf.value.data.data);
    if (cf.status === "fulfilled" && cf.value.data.success)
      setChecklistForms(cf.value.data.data);
  }, []);

  const handleFormChanged = async (updated) => {
    setMyForms((prev) =>
      prev.map((f) => (f._id === updated._id ? updated : f)),
    );
    setChecklistForms((prev) =>
      prev.map((f) => (f._id === updated._id ? updated : f)),
    );
  };

  const deleteForm = async (id) => {
    if (!window.confirm("Delete this No Dues form? This cannot be undone."))
      return;
    try {
      const { data } = await api.delete(`/no-dues/${id}`);
      if (data.success) {
        toast.success("Form deleted");
        setOpenFormId(null);
        await refreshForms();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const tabs = [
    ...(isCoordinator
      ? [
          { key: "students", label: "All Students", icon: Users2 },
          { key: "create", label: "Create No Dues Form", icon: Plus },
          { key: "forms", label: "Forms I Released", icon: ClipboardList },
        ]
      : []),
    { key: "checklist", label: "My Subject Checklist", icon: ListChecks },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <FileCheck2 className="text-[var(--primary)]" size={30} /> No Dues
            Management
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            {isCoordinator
              ? "As Academic Coordinator, release No Dues forms to any student and assign subject faculty. Subject teachers tick their own row."
              : "Tick off your own subject's checklist for any student assigned to you. Only an Academic Coordinator can release new No Dues forms."}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border-light)] pb-1">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setOpenFormId(null);
              }}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <t.icon size={16} /> {t.label}
              {active && (
                <motion.div
                  layoutId="noDuesTabUnderline"
                  className="absolute -bottom-[5px] left-3 right-3 h-[3px] rounded-full bg-[var(--primary)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">
            Loading…
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "students" && (
              <AllStudentsTab
                students={students}
                error={studentsError}
                onRefresh={loadAll}
                onCreateFor={(student) => {
                  setPreselectedStudent(student);
                  setTab("create");
                }}
              />
            )}
            {tab === "create" && (
              <CreateFormView
                students={students}
                faculty={faculty}
                preselected={preselectedStudent}
                onCreated={async () => {
                  setPreselectedStudent(null);
                  await refreshForms();
                  setTab("forms");
                }}
              />
            )}
            {tab === "forms" && (
              <FormsList
                forms={myForms}
                user={user}
                openFormId={openFormId}
                setOpenFormId={setOpenFormId}
                onChange={handleFormChanged}
                onDelete={deleteForm}
                emptyText="You haven't created any No Dues forms yet."
              />
            )}
            {tab === "checklist" && (
              <FormsList
                forms={checklistForms}
                user={user}
                openFormId={openFormId}
                setOpenFormId={setOpenFormId}
                onChange={handleFormChanged}
                onDelete={deleteForm}
                emptyText="You aren't assigned as subject faculty on any No Dues form yet."
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/* ─────────────────────────────  ALL STUDENTS  ───────────────────────────── */

function AllStudentsTab({ students, error, onCreateFor, onRefresh }) {
  const [search, setSearch] = useState("");
  const [uploadingFees, setUploadingFees] = useState(false);

  const uploadFeesExcel = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingFees(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/no-dues/dues-fees/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success(data.message || "Dues fees updated");
        await onRefresh?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload dues fees");
    } finally {
      setUploadingFees(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.enrollmentNumber || "").toLowerCase().includes(search.toLowerCase()),
  );

  if (students.length === 0) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-2xl px-4 py-3 text-sm font-semibold">
            Couldn't load students: {error}
          </div>
        )}
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Users2
            size={40}
            className="text-[var(--text-secondary)] opacity-50"
          />
          <p className="text-[var(--text-primary)] font-bold">
            No students found
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-input)]">
        <Search size={14} className="text-[var(--text-secondary)] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or enrollment…"
          className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]"
        />
        <label className="text-[11px] font-bold text-[var(--primary)] hover:underline shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5">
          {uploadingFees ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Upload size={13} />
          )}
          Upload Fees Excel
          <input type="file" accept=".xlsx,.xls,.csv" onChange={uploadFeesExcel} disabled={uploadingFees} className="hidden" />
        </label>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-light)] text-left">
              {["Name", "Enrollment", "Semester", "Attendance", "Dues Fees", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s._id}
                className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <td className="px-5 py-4 font-bold text-[var(--text-primary)]">
                  {s.name}
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">
                  {s.enrollmentNumber || "—"}
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">
                  {s.semester || "—"}
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">
                  {s.attendancePercentage != null
                    ? `${s.attendancePercentage}%`
                    : "—"}
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">
                  ₹{s.duesFees ?? 0}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onCreateFor(s)}
                    className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 ml-auto"
                  >
                    <Plus size={13} /> No Dues Form
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-[var(--text-secondary)]"
                >
                  No students match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────  CREATE FORM  ───────────────────────────── */

function CreateFormView({ students, faculty, preselected, onCreated }) {
  const [studentIds, setStudentIds] = useState(
    preselected?._id ? [preselected._id] : [],
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [session, setSession] = useState("");
  const [semester, setSemester] = useState(preselected?.semester || 1);
  const [section, setSection] = useState("");
  const [subjects, setSubjects] = useState([
    {
      subjectCode: "",
      subjectName: "",
      faculty: "",
      items: [...DEFAULT_SUBJECT_ITEMS],
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.enrollmentNumber || "")
        .toLowerCase()
        .includes(studentSearch.toLowerCase());
    const matchesSemester =
      !semesterFilter || String(s.semester) === String(semesterFilter);
    return matchesSearch && matchesSemester;
  });

  const toggleStudent = (id) =>
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const allFilteredSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => studentIds.includes(s._id));
  const toggleSelectAll = () => {
    const ids = filteredStudents.map((s) => s._id);
    setStudentIds((prev) =>
      allFilteredSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])],
    );
  };

  // Semesters present among the loaded students, for quick "whole semester" selection
  const availableSemesters = [
    ...new Set(students.map((s) => s.semester).filter(Boolean)),
  ].sort((a, b) => a - b);

  const setSubject = (idx, patch) => {
    const next = [...subjects];
    next[idx] = { ...next[idx], ...patch };
    setSubjects(next);
  };
  const addSubject = () =>
    setSubjects([
      ...subjects,
      {
        subjectCode: "",
        subjectName: "",
        faculty: "",
        items: [...DEFAULT_SUBJECT_ITEMS],
      },
    ]);
  const removeSubject = (idx) =>
    setSubjects(subjects.filter((_, i) => i !== idx));

  const toggleItemForSubject = (idx, item) => {
    const current = subjects[idx].items;
    const next = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    setSubject(idx, { items: next });
  };

  const submit = async () => {
    if (studentIds.length === 0)
      return toast.error("Select at least one student");
    if (!session.trim())
      return toast.error("Session is required (e.g. JAN-JUNE 2026)");
    if (subjects.some((s) => !s.subjectName.trim()))
      return toast.error("Every subject needs a name");
    if (subjects.some((s) => !s.faculty))
      return toast.error("Assign a faculty for every subject");

    setSubmitting(true);
    try {
      const { data } = await api.post("/no-dues/bulk", {
        studentIds,
        session: session.trim(),
        semester,
        section: section.trim(),
        subjects: subjects.map((s) => ({
          subjectCode: s.subjectCode.trim(),
          subjectName: s.subjectName.trim(),
          faculty: s.faculty,
          items: s.items,
        })),
      });
      if (data.success) {
        toast.success(data.message || "No Dues forms created");
        if (data.skipped?.length) {
          data.skipped.forEach((sk) =>
            toast.error(`Skipped ${sk.name || sk.studentId}: ${sk.reason}`),
          );
        }
        await onCreated();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create forms");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all";
  const labelCls =
    "block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5";

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <div>
        <label className={labelCls}>
          Students{" "}
          <span className="opacity-60 normal-case font-medium">
            (any student — pick individually, filter by semester, or select all)
          </span>
        </label>
        <div className="border border-[var(--border-light)] rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2.5 border-b border-[var(--border-light)] bg-[var(--bg-input)]">
            <div className="flex items-center gap-2 flex-1">
              <Search
                size={14}
                className="text-[var(--text-secondary)] shrink-0"
              />
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or enrollment…"
                className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] min-w-0"
              />
            </div>
            {availableSemesters.length > 1 && (
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none shrink-0"
              >
                <option value="">All semesters</option>
                {availableSemesters.map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            )}
            {filteredStudents.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-[var(--primary)] hover:underline shrink-0 whitespace-nowrap"
              >
                {allFilteredSelected
                  ? "Clear all"
                  : `Select all (${filteredStudents.length})`}
              </button>
            )}
            {studentIds.length > 0 && (
              <span className="badge badge-approved shrink-0">
                {studentIds.length} selected
              </span>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
            {filteredStudents.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-6">
                No students found.
              </p>
            )}
            {filteredStudents.map((s) => {
              const on = studentIds.includes(s._id);
              return (
                <button
                  key={s._id}
                  onClick={() => toggleStudent(s._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                    on
                      ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                      : "hover:bg-[var(--bg-hover)] border border-transparent"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 ${on ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border-light)]"}`}
                  >
                    {on && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {s.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-secondary)] shrink-0 ml-auto">
                    {s.enrollmentNumber}
                    {s.semester ? ` · Sem ${s.semester}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Session</label>
          <input
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="JAN-JUNE 2026"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            Semester{" "}
            <span className="opacity-60 normal-case font-medium">
              (applied to every selected student's form)
            </span>
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className={inputCls}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>
            Section{" "}
            <span className="opacity-60 normal-case font-medium">
              (optional)
            </span>
          </label>
          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="IV-1"
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-[var(--text-primary)]">
            Subjects
          </h3>
          <button
            onClick={addSubject}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            <Plus size={14} /> Add Subject
          </button>
        </div>

        {subjects.map((subj, idx) => (
          <div
            key={idx}
            className="border border-[var(--border-light)] rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <input
                value={subj.subjectCode}
                onChange={(e) =>
                  setSubject(idx, { subjectCode: e.target.value })
                }
                placeholder="Code (CS-402)"
                className="w-32 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
              <input
                value={subj.subjectName}
                onChange={(e) =>
                  setSubject(idx, { subjectName: e.target.value })
                }
                placeholder="Subject name"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
              <select
                value={subj.faculty}
                onChange={(e) => setSubject(idx, { faculty: e.target.value })}
                className="w-48 bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              >
                <option value="">Faculty…</option>
                {faculty.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {subjects.length > 1 && (
                <button
                  onClick={() => removeSubject(idx)}
                  className="text-[var(--text-secondary)] hover:text-red-500 shrink-0"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {DEFAULT_SUBJECT_ITEMS.concat(["Lab Record"]).map((item) => {
                const on = subj.items.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItemForSubject(idx, item)}
                    className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                      on
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]"
                        : "border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {on ? "✓ " : "+ "}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-[var(--border-light)]">
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-premium flex items-center gap-2 text-sm"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}{" "}
          Create & Assign
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────  FORMS LIST (shared)  ───────────────────────────── */

function FormsList({
  forms,
  user,
  openFormId,
  setOpenFormId,
  onChange,
  onDelete,
  emptyText,
}) {
  if (forms.length === 0) {
    return (
      <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
        <ClipboardList
          size={40}
          className="text-[var(--text-secondary)] opacity-50"
        />
        <p className="text-[var(--text-primary)] font-bold">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {forms.map((form) => {
        const open = openFormId === form._id;
        return (
          <div
            key={form._id}
            className={`glass-card rounded-2xl overflow-hidden ${form.isCompleted ? "ring-1 ring-emerald-500/30" : ""}`}
          >
            <button
              onClick={() => setOpenFormId(open ? null : form._id)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div className="min-w-0 flex items-center gap-3">
                {form.isCompleted ? (
                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <PartyPopper size={15} className="text-emerald-500" />
                  </span>
                ) : (
                  <span className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
                    <Circle size={15} className="text-slate-400" />
                  </span>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {form.student?.name}{" "}
                    <span className="text-[var(--text-secondary)] font-medium">
                      — {form.session}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Sem {form.semester}
                    {form.section ? ` · ${form.section}` : ""} · Released by:{" "}
                    {form.createdBy?.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`badge ${form.isCompleted ? "badge-approved" : "bg-slate-500/10 border-slate-500/20 text-slate-500"}`}
                >
                  {form.isCompleted ? "Completed" : "In Progress"}
                </span>
                <ChevronRight
                  size={16}
                  className={`text-[var(--text-secondary)] transition-transform ${open ? "rotate-90" : ""}`}
                />
              </div>
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-1 border-t border-[var(--border-light)]">
                    <NoDuesFormDetail
                      form={form}
                      currentUser={user}
                      onChange={onChange}
                      onDelete={onDelete}
                      showDeleteButton
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
