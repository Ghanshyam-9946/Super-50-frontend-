import { Fragment, useEffect, useState, useCallback, useMemo } from "react";
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
  UserCheck,
  ArrowRight,
  Settings2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { fetchMe } from "../../features/auth/authSlice";
import NoDuesFormDetail, {
  ReassignStudentPanel,
} from "../../components/nodues/NoDuesFormDetail";

const DEFAULT_SUBJECT_ITEMS = [
  "Assignment",
  "Tutorial",
  "POD AI Quiz",
  "Presentation/GD/Task/Mini Project",
  "RGPV",
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
          { key: "assign", label: "Assign Faculty", icon: UserCheck },
          { key: "forms", label: "Forms I Released", icon: ClipboardList },
          { key: "manage", label: "Manage Forms", icon: Settings2 },
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
                preselected={preselectedStudent}
                onCreated={async () => {
                  setPreselectedStudent(null);
                  await refreshForms();
                  setTab("forms");
                }}
              />
            )}
            {tab === "assign" && <AssignFacultyTab faculty={faculty} students={students} />}
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
            {tab === "manage" && (
              <ManageFormsTab forms={myForms} onRefresh={refreshForms} />
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
  const [batchFilter, setBatchFilter] = useState("");
  const [uploadingFees, setUploadingFees] = useState(false);

  const availableBatches = [
    ...new Set(students.map((s) => s.batch).filter(Boolean)),
  ].sort();

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

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.enrollmentNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesBatch = !batchFilter || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

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
        {availableBatches.length > 0 && (
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none shrink-0"
          >
            <option value="">All batches</option>
            {availableBatches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}
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

function CreateFormView({ students, preselected, onCreated }) {
  const [studentIds, setStudentIds] = useState(
    preselected?._id ? [preselected._id] : [],
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState(preselected?.semester || 1);
  const [section, setSection] = useState("");
  const [subjects, setSubjects] = useState([
    {
      subjectCode: "",
      subjectName: "",
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
    const matchesBatch = !batch || s.batch === batch;
    return matchesSearch && matchesSemester && matchesBatch;
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

  // Semesters/batches present among the loaded students, for quick "whole batch/semester" selection
  const availableSemesters = [
    ...new Set(students.map((s) => s.semester).filter(Boolean)),
  ].sort((a, b) => a - b);
  const availableBatches = [
    ...new Set(students.map((s) => s.batch).filter(Boolean)),
  ].sort();

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

  const [customItemDraft, setCustomItemDraft] = useState({}); // idx -> text
  const addCustomItem = (idx) => {
    const label = (customItemDraft[idx] || "").trim();
    if (!label) return;
    if (subjects[idx].items.includes(label)) {
      setCustomItemDraft((prev) => ({ ...prev, [idx]: "" }));
      return;
    }
    setSubject(idx, { items: [...subjects[idx].items, label] });
    setCustomItemDraft((prev) => ({ ...prev, [idx]: "" }));
  };
  const removeCustomItem = (idx, item) =>
    setSubject(idx, { items: subjects[idx].items.filter((i) => i !== item) });

  const submit = async () => {
    if (studentIds.length === 0)
      return toast.error("Select at least one student");
    if (!batch)
      return toast.error("Select a batch");
    if (subjects.some((s) => !s.subjectName.trim()))
      return toast.error("Every subject needs a name");

    setSubmitting(true);
    try {
      const { data } = await api.post("/no-dues/bulk", {
        studentIds,
        batch,
        semester,
        section: section.trim(),
        subjects: subjects.map((s) => ({
          subjectCode: s.subjectCode.trim(),
          subjectName: s.subjectName.trim(),
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
            (any student — pick individually, filter by batch/semester, or select all)
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
            {availableBatches.length > 0 && (
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none shrink-0"
              >
                <option value="">Select batch…</option>
                {availableBatches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
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
          <div>
            <h3 className="font-display font-bold text-[var(--text-primary)]">
              Subjects
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
              Faculty is assigned separately afterwards, from the "Assign Faculty" tab.
            </p>
          </div>
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
              {subj.items
                .filter((item) => !DEFAULT_SUBJECT_ITEMS.concat(["Lab Record"]).includes(item))
                .map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold"
                  >
                    {item}
                    <button onClick={() => removeCustomItem(idx, item)} className="hover:text-red-500">
                      <X size={11} />
                    </button>
                  </span>
                ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={customItemDraft[idx] || ""}
                onChange={(e) => setCustomItemDraft((prev) => ({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomItem(idx);
                  }
                }}
                placeholder="Add a custom task for this subject…"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
              />
              <button
                onClick={() => addCustomItem(idx)}
                className="text-xs font-bold text-[var(--primary)] hover:underline shrink-0 flex items-center gap-1"
              >
                <Plus size={13} /> Add
              </button>
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

/* ─────────────────────────────  ASSIGN FACULTY  ───────────────────────────── */

function AssignFacultyTab({ faculty, students }) {
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [openMentor, setOpenMentor] = useState(null); // mentorId currently expanded

  const availableBatches = [
    ...new Set(students.map((s) => s.batch).filter(Boolean)),
  ].sort();

  const load = async () => {
    if (!batch || !semester) {
      return toast.error("Pick a batch and a semester first");
    }
    setLoading(true);
    try {
      const { data } = await api.get("/no-dues/mentors-to-assign", {
        params: { batch, semester },
      });
      if (data.success) setRows(data.data);
      setLoaded(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load mentors");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all";
  const labelCls =
    "block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-4">
      <div className="glass-card p-6 rounded-3xl">
        <p className="text-[var(--text-secondary)] text-sm font-medium mb-4">
          Every student's subjects default to their own mentor (TG) — no
          assignment needed for a mentor's own group. Use this only to hand
          specific students of a subject over to a different specialist
          faculty: Select batch + semester → Select Mentor → Select Subject →
          pick students → Assign. Students without a mentor assigned yet are
          skipped here — assign them a mentor first from the Students page.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Batch</label>
            <select
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={load}
              disabled={loading}
              className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 w-full justify-center"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Search size={15} />
              )}
              Find Mentors
            </button>
          </div>
        </div>
      </div>

      {loaded &&
        (rows.length === 0 ? (
          <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
            <UserCheck
              size={40}
              className="text-[var(--text-secondary)] opacity-50"
            />
            <p className="text-[var(--text-primary)] font-bold">
              No mentor-led sections found for that batch/semester
            </p>
            <p className="text-[var(--text-secondary)] text-sm max-w-md">
              Students need a mentor assigned (Students page) before they show up here.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-left">
                    {["Mentor", "Role", "Students", ""].map((h) => (
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
                  {rows.map((row) => {
                    const open = openMentor === row.mentorId;
                    return (
                      <Fragment key={row.mentorId}>
                        <tr
                          onClick={() => setOpenMentor(open ? null : row.mentorId)}
                          className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-4 font-bold text-[var(--text-primary)]">{row.mentorName}</td>
                          <td className="px-5 py-4 text-[var(--text-secondary)]">{row.mentorRole}</td>
                          <td className="px-5 py-4">
                            <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                              {row.studentCount} student{row.studentCount !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ChevronRight
                              size={16}
                              className={`text-[var(--text-secondary)] transition-transform ml-auto ${open ? "rotate-90" : ""}`}
                            />
                          </td>
                        </tr>
                        {open && (
                          <tr className="border-b border-[var(--border-light)] last:border-0">
                            <td colSpan={4} className="p-4 bg-[var(--bg-hover)]/30">
                              <SubjectAssignPanel
                                batch={batch}
                                semester={semester}
                                mentorId={row.mentorId}
                                faculty={faculty}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}

// Step 3 of the flow: for the selected mentor, list every subject among that
// mentor's students' forms. Every student already defaults to their own
// mentor as subject faculty, so there's nothing to "assign" for the mentor's
// own group — the only real action here is handing SPECIFIC students of a
// subject to a different (specialist) faculty member.
function SubjectAssignPanel({ batch, semester, mentorId, faculty }) {
  const [subjectRows, setSubjectRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSubject, setOpenSubject] = useState(null); // subjectName currently expanded

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/no-dues/mentor-subjects", {
        params: { batch, semester, mentorId },
      });
      if (data.success) setSubjectRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  }, [batch, semester, mentorId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={18} className="animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (subjectRows.length === 0) {
    return <p className="text-xs text-[var(--text-secondary)] italic py-2">No subjects found for this mentor's students.</p>;
  }

  return (
    <div className="space-y-2">
      {subjectRows.map((row) => {
        const open = openSubject === row.subjectName;
        return (
          <div key={row.subjectName} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenSubject(open ? null : row.subjectName)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
            >
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                {row.subjectCode ? `${row.subjectCode} — ` : ""}
                {row.subjectName}
              </span>
              <span className="badge badge-approved shrink-0">
                Defaults to this mentor
              </span>
              <ChevronRight size={14} className={`text-[var(--text-secondary)] transition-transform ml-auto shrink-0 ${open ? "rotate-90" : ""}`} />
            </button>
            {open && (
              <div className="border-t border-[var(--border-light)] p-3 bg-[var(--bg-hover)]/30">
                <p className="text-[11px] text-[var(--text-secondary)] mb-2">
                  Pick specific students to hand over to a different (specialist) faculty for this subject — everyone else stays with the mentor.
                </p>
                <StudentAssignPanel
                  batch={batch}
                  semester={semester}
                  mentorId={mentorId}
                  subjectName={row.subjectName}
                  faculty={faculty}
                  onAssigned={load}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Step 4 (optional, when one subject is split across several teachers):
// pick a subset of the mentor's students + one faculty, Assign — repeat
// with a different subset/faculty to cover everyone.
function StudentAssignPanel({ batch, semester, mentorId, subjectName, faculty, onAssigned }) {
  const [studentRows, setStudentRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [facultyId, setFacultyId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/no-dues/mentor-subject-students", {
        params: { batch, semester, mentorId, subjectName },
      });
      if (data.success) setStudentRows(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [batch, semester, mentorId, subjectName]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = studentRows.length > 0 && studentRows.every((s) => selected.includes(s.studentId));
  const toggleSelectAll = () => {
    const ids = studentRows.map((s) => s.studentId);
    setSelected((prev) => (allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const assignSelected = async () => {
    if (selected.length === 0) return toast.error("Select at least one student");
    if (!facultyId) return toast.error("Pick a faculty first");
    setAssigning(true);
    try {
      const { data } = await api.patch("/no-dues/assign-faculty", {
        batch,
        semester,
        subjectName,
        mentorId,
        facultyId,
        studentIds: selected,
      });
      if (data.success) {
        toast.success(data.message || "Faculty assigned");
        setSelected([]);
        await load();
        await onAssigned?.();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign faculty");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {studentRows.length > 0 && (
          <button onClick={toggleSelectAll} className="text-[11px] font-bold text-[var(--primary)] hover:underline shrink-0">
            {allSelected ? "Clear all" : `Select all (${studentRows.length})`}
          </button>
        )}
        {selected.length > 0 && <span className="badge badge-approved shrink-0">{selected.length} selected</span>}
        <select
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none w-full sm:w-48 sm:ml-auto"
        >
          <option value="">Faculty…</option>
          {faculty.map((f) => (
            <option key={f._id} value={f._id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          onClick={assignSelected}
          disabled={assigning}
          className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 justify-center shrink-0"
        >
          {assigning ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
          Assign Selected
        </button>
      </div>

      <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-1">
        {studentRows.map((s) => {
          const on = selected.includes(s.studentId);
          return (
            <button
              key={s.studentId}
              onClick={() => toggle(s.studentId)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                on ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30" : "hover:bg-[var(--bg-hover)] border border-transparent"
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 ${on ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border-light)]"}`}
              >
                {on && <Check size={12} className="text-white" />}
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)] truncate">{s.studentName}</span>
              <span className="text-[11px] text-[var(--text-secondary)] shrink-0">{s.enrollmentNumber}</span>
              <span className="text-[11px] text-[var(--text-secondary)] shrink-0 ml-auto">
                {s.currentFacultyName ? `→ ${s.currentFacultyName}` : "Unassigned"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────  MANAGE FORMS  ───────────────────────────── */

// One row per RELEASE (a single or bulk create), not per student — every
// student created together shares a releaseId. Edit batch/semester/subjects
// once for the whole group, and add/remove/reassign which students are in it.
function ManageFormsTab({ forms, onRefresh }) {
  const [search, setSearch] = useState("");
  const [openReleaseId, setOpenReleaseId] = useState(null);

  const groups = useMemo(() => {
    const map = {};
    forms.forEach((f) => {
      const key = f.releaseId || f._id; // legacy forms with no releaseId are their own singleton group
      if (!map[key]) map[key] = { releaseId: key, members: [] };
      map[key].members.push(f);
    });
    return Object.values(map)
      .map((g) => {
        const sample = g.members[0];
        return {
          ...g,
          batch: sample.batch,
          semester: sample.semester,
          section: sample.section,
          subjectNames: sample.subjects.map((s) => s.subjectName),
          forwardedCount: g.members.filter((m) => m.forwarded).length,
          completedCount: g.members.filter((m) => m.isCompleted).length,
        };
      })
      .sort((a, b) => b.members.length - a.members.length);
  }, [forms]);

  const filtered = groups.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.members.some((m) => m.student?.name?.toLowerCase().includes(q) || (m.student?.enrollmentNumber || "").toLowerCase().includes(q)) ||
      g.subjectNames.some((n) => n.toLowerCase().includes(q))
    );
  });

  if (forms.length === 0) {
    return (
      <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
        <Settings2 size={40} className="text-[var(--text-secondary)] opacity-50" />
        <p className="text-[var(--text-primary)] font-bold">You haven't released any No Dues forms yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 rounded-2xl flex items-center gap-2">
        <Search size={15} className="text-[var(--text-secondary)] shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by subject, student name, or enrollment…"
          className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]"
        />
      </div>

      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-light)] text-left">
                {["Subjects", "Batch", "Sem / Section", "Students", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => {
                const open = openReleaseId === group.releaseId;
                return (
                  <Fragment key={group.releaseId}>
                    <tr
                      onClick={() => setOpenReleaseId(open ? null : group.releaseId)}
                      className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 max-w-[220px]">
                        <div className="font-bold text-[var(--text-primary)] truncate">{group.subjectNames.join(", ")}</div>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">{group.batch}</td>
                      <td className="px-5 py-4 text-[var(--text-secondary)]">
                        Sem {group.semester}{group.section ? ` · ${group.section}` : ""}
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                          {group.members.length} student{group.members.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[var(--text-secondary)] whitespace-nowrap">
                        {group.forwardedCount > 0 && <span className="text-[var(--primary)] font-bold">{group.forwardedCount} forwarded</span>}
                        {group.forwardedCount > 0 && " · "}
                        {group.completedCount}/{group.members.length} completed
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1 justify-end">
                          Manage
                          <ChevronRight size={14} className={`transition-transform ${open ? "rotate-90" : ""}`} />
                        </span>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-[var(--border-light)] last:border-0">
                        <td colSpan={6} className="p-4 bg-[var(--bg-hover)]/30">
                          <ManageReleaseGroup group={group} onRefresh={onRefresh} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[var(--text-secondary)]">
                    No releases match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ManageReleaseGroup({ group, onRefresh }) {
  const [reassigningId, setReassigningId] = useState(null); // form._id currently showing the reassign search
  const [removingId, setRemovingId] = useState(null);
  const [addSearch, setAddSearch] = useState("");
  const [addResults, setAddResults] = useState([]);
  const [adding, setAdding] = useState(null); // studentId currently being added

  useEffect(() => {
    if (!addSearch.trim()) {
      setAddResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/no-dues/all-students", { params: { search: addSearch.trim() } });
        if (data.success) {
          const memberIds = new Set(group.members.map((m) => m.student?._id));
          setAddResults(data.data.filter((s) => !memberIds.has(s._id)));
        }
      } catch {
        /* best-effort search */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addSearch, group.members]);

  const removeMember = async (form) => {
    if (!window.confirm(`Remove ${form.student?.name} from this release? Their No Dues form will be deleted.`)) return;
    setRemovingId(form._id);
    try {
      const { data } = await api.delete(`/no-dues/${form._id}`);
      if (data.success) {
        toast.success("Student removed from release");
        await onRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove student");
    } finally {
      setRemovingId(null);
    }
  };

  const addMember = async (student) => {
    setAdding(student._id);
    try {
      const { data } = await api.post(`/no-dues/releases/${group.releaseId}/students`, { studentId: student._id });
      if (data.success) {
        toast.success(data.message || "Student added");
        setAddSearch("");
        setAddResults([]);
        await onRefresh();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add student");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-5">
      <EditReleaseDetailsPanel group={group} onSaved={onRefresh} />

      <div className="space-y-2">
        <h5 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">
          Students in this release ({group.members.length})
        </h5>
        <div className="space-y-1.5">
          {group.members.map((form) => {
            const statusBadge = form.forwarded ? (
              <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">Forwarded</span>
            ) : (
              <span className={`badge ${form.isCompleted ? "badge-approved" : "bg-slate-500/10 border-slate-500/20 text-slate-500"}`}>
                {form.isCompleted ? "Completed" : "In Progress"}
              </span>
            );
            return (
              <div key={form._id} className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)] px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{form.student?.name}</span>
                  <span className="text-[11px] text-[var(--text-secondary)]">{form.student?.enrollmentNumber}</span>
                  {statusBadge}
                  <div className="ml-auto flex items-center gap-3">
                    <button
                      onClick={() => setReassigningId(reassigningId === form._id ? null : form._id)}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline"
                    >
                      Reassign
                    </button>
                    <button
                      onClick={() => removeMember(form)}
                      disabled={removingId === form._id}
                      className="text-[11px] font-bold text-red-500 hover:underline disabled:opacity-40"
                    >
                      {removingId === form._id ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
                {reassigningId === form._id && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-light)]">
                    <ReassignStudentPanel form={form} onChange={async () => { setReassigningId(null); await onRefresh(); }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Add a student to this release</h5>
        <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
          <Search size={13} className="text-[var(--text-secondary)] shrink-0" />
          <input
            value={addSearch}
            onChange={(e) => setAddSearch(e.target.value)}
            placeholder="Search a student by name or enrollment…"
            className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)]"
          />
        </div>
        {addResults.length > 0 && (
          <div className="border border-[var(--border-light)] rounded-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
            {addResults.map((s) => (
              <button
                key={s._id}
                onClick={() => addMember(s)}
                disabled={adding === s._id}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--bg-hover)] border-b border-[var(--border-light)] last:border-0 disabled:opacity-40"
              >
                <span className="font-bold text-[var(--text-primary)]">{s.name}</span>
                <span className="text-[var(--text-secondary)]">{adding === s._id ? "Adding…" : s.enrollmentNumber}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Edits batch/semester/section/subjects for the WHOLE release at once —
// same subject editor as the single-form version, seeded from one member
// as a representative sample.
function EditReleaseDetailsPanel({ group, onSaved }) {
  const sample = group.members[0];
  const [batch, setBatch] = useState(sample.batch || "");
  const [semester, setSemester] = useState(sample.semester || 1);
  const [section, setSection] = useState(sample.section || "");
  const [subjects, setSubjects] = useState(
    sample.subjects.map((s) => ({ subjectCode: s.subjectCode || "", subjectName: s.subjectName, items: s.items.map((i) => i.label) })),
  );
  const [customItemDraft, setCustomItemDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const setSubject = (idx, patch) => {
    const next = [...subjects];
    next[idx] = { ...next[idx], ...patch };
    setSubjects(next);
  };
  const addSubject = () => setSubjects([...subjects, { subjectCode: "", subjectName: "", items: [...DEFAULT_SUBJECT_ITEMS] }]);
  const removeSubject = (idx) => setSubjects(subjects.filter((_, i) => i !== idx));
  const toggleItem = (idx, item) => {
    const current = subjects[idx].items;
    setSubject(idx, { items: current.includes(item) ? current.filter((i) => i !== item) : [...current, item] });
  };
  const addCustomItem = (idx) => {
    const label = (customItemDraft[idx] || "").trim();
    if (!label || subjects[idx].items.includes(label)) return;
    setSubject(idx, { items: [...subjects[idx].items, label] });
    setCustomItemDraft((prev) => ({ ...prev, [idx]: "" }));
  };

  const save = async () => {
    if (!batch.trim()) return toast.error("Batch is required");
    if (subjects.some((s) => !s.subjectName.trim())) return toast.error("Every subject needs a name");
    setSaving(true);
    try {
      const { data } = await api.put(`/no-dues/releases/${group.releaseId}`, {
        batch: batch.trim(),
        semester,
        section: section.trim(),
        subjects: subjects.map((s) => ({ subjectCode: s.subjectCode.trim(), subjectName: s.subjectName.trim(), items: s.items })),
      });
      if (data.success) {
        toast.success(data.message || "Release updated");
        await onSaved();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update release");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">
        Edit Release Details <span className="normal-case font-medium opacity-70">— applies to all {group.members.length} student(s)</span>
      </h5>
      <div className="grid sm:grid-cols-3 gap-2">
        <input
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          placeholder="Batch (2023-27)"
          className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        />
        <select
          value={semester}
          onChange={(e) => setSemester(Number(e.target.value))}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <input
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="Section (optional)"
          className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] outline-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[var(--text-secondary)]">Subjects</span>
          <button onClick={addSubject} className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
            <Plus size={12} /> Add Subject
          </button>
        </div>
        {subjects.map((subj, idx) => (
          <div key={idx} className="border border-[var(--border-light)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={subj.subjectCode}
                onChange={(e) => setSubject(idx, { subjectCode: e.target.value })}
                placeholder="Code"
                className="w-24 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              <input
                value={subj.subjectName}
                onChange={(e) => setSubject(idx, { subjectName: e.target.value })}
                placeholder="Subject name"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none"
              />
              {subjects.length > 1 && (
                <button onClick={() => removeSubject(idx)} className="text-[var(--text-secondary)] hover:text-red-500 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set([...DEFAULT_SUBJECT_ITEMS, "Lab Record", ...subj.items])].map((item) => {
                const on = subj.items.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleItem(idx, item)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                      on ? "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]" : "border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {on ? "✓ " : "+ "}{item}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={customItemDraft[idx] || ""}
                onChange={(e) => setCustomItemDraft((prev) => ({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomItem(idx); } }}
                placeholder="Add a custom task…"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] outline-none"
              />
              <button onClick={() => addCustomItem(idx)} className="text-[11px] font-bold text-[var(--primary)] hover:underline shrink-0">
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving} className="btn-premium text-xs px-4 py-2 flex items-center gap-2">
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Changes
      </button>
    </div>
  );
}

/* ─────────────────────────────  FORMS LIST (shared)  ───────────────────────────── */

// Must match the backend's ATTENDANCE_RULES.otherRgpvQp.maxBaseAttendance —
// the RGPV subject item only applies (and blocks completion) below this.
const RGPV_ATTENDANCE_THRESHOLD = 60;
const isSubjectItemApplicable = (item, form) =>
  item.label !== 'RGPV' || (form.attendanceSummary?.baseAttendancePercentage ?? 0) < RGPV_ATTENDANCE_THRESHOLD;

// Ticked (or not-applicable/optional) items / applicable items across every
// subject + extra item on the form — mirrors the backend's completion rule
// so 100% here always lines up with form.isCompleted.
function formProgress(form) {
  const subjectItems = (form.subjects || []).flatMap((s) => s.items || []).filter((i) => isSubjectItemApplicable(i, form));
  const allItems = [...subjectItems, ...(form.extraItems || [])];
  const total = allItems.length;
  const done = allItems.filter((i) => i.checked || i.optional).length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function ProgressPill({ percent }) {
  const color =
    percent === 100 ? "text-emerald-500" : percent >= 50 ? "text-amber-500" : "text-[var(--text-secondary)]";
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-bold shrink-0 ${color}`}>
      <span className="w-10 h-1.5 rounded-full bg-[var(--border-light)] overflow-hidden">
        <span
          className={`block h-full rounded-full ${percent === 100 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-slate-400"}`}
          style={{ width: `${percent}%` }}
        />
      </span>
      {percent}%
    </span>
  );
}

function FormsList({
  forms,
  user,
  openFormId,
  setOpenFormId,
  onChange,
  onDelete,
  emptyText,
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | roll
  const uid = user?._id;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter(
      (f) =>
        f.student?.name?.toLowerCase().includes(q) ||
        (f.student?.enrollmentNumber || "").toLowerCase().includes(q)
    );
  }, [forms, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortBy === "roll") {
        return (a.student?.enrollmentNumber || "").localeCompare(b.student?.enrollmentNumber || "");
      }
      return (a.student?.name || "").localeCompare(b.student?.name || "");
    });
    return copy;
  }, [filtered, sortBy]);

  // Group by whichever subject(s) the viewer is the assigned faculty for on
  // that form; forms where they're only the TG (no subject assigned to
  // them) fall into their own group.
  const groups = useMemo(() => {
    const map = new Map();
    const pushTo = (key, form) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(form);
    };
    sorted.forEach((form) => {
      const mySubjects = (form.subjects || []).filter((s) => s.faculty?._id === uid).map((s) => s.subjectName);
      const isTG = form.student?.mentor?._id === uid;
      if (mySubjects.length === 0) {
        pushTo(isTG ? "Your TG Students" : "Other", form);
      } else {
        mySubjects.forEach((name) => pushTo(name, form));
      }
    });
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "Your TG Students") return -1;
      if (b === "Your TG Students") return 1;
      return a.localeCompare(b);
    });
  }, [sorted, uid]);

  const showGroups = groups.length > 1;

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

  const renderForm = (form) => {
    const open = openFormId === form._id;
    const percent = formProgress(form);
    // A subject faculty (or TG) may only care about their own row — flag it
    // separately from the whole-form "Completed" state, which also needs
    // every OTHER subject/extra item done.
    const mySubjects = (form.subjects || []).filter((s) => s.faculty?._id === uid);
    const myPartDone =
      mySubjects.length > 0 &&
      mySubjects.every((s) => s.items.every((i) => i.checked || i.optional || !isSubjectItemApplicable(i, form)));
    const highlightSky = myPartDone && !form.isCompleted;
    return (
      <div
        key={form._id}
        className={`glass-card rounded-2xl overflow-hidden ${
          form.isCompleted ? "ring-1 ring-emerald-500/30" : highlightSky ? "ring-1 ring-sky-500/30 bg-sky-500/5" : ""
        }`}
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
            ) : highlightSky ? (
              <span className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
                <Check size={15} className="text-sky-500" />
              </span>
            ) : (
              <span className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
                <Circle size={15} className="text-slate-400" />
              </span>
            )}
            <div className="min-w-0">
              <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                {form.student?.name}{" "}
                {form.student?.enrollmentNumber && (
                  <span className="text-[var(--text-secondary)] font-medium">
                    ({form.student.enrollmentNumber})
                  </span>
                )}{" "}
                <span className="text-[var(--text-secondary)] font-medium">
                  — {form.batch}
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
            <ProgressPill percent={percent} />
            {highlightSky && (
              <span className="badge bg-sky-500/10 border-sky-500/20 text-sky-500">
                Your part done
              </span>
            )}
            {form.forwarded && (
              <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                Forwarded
              </span>
            )}
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
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or enrollment number…"
            className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[var(--text-primary)] outline-none shrink-0"
        >
          <option value="name">Sort: Name</option>
          <option value="roll">Sort: Roll No</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card p-10 text-center rounded-3xl">
          <p className="text-[var(--text-secondary)] text-sm font-medium">No students match "{search}"</p>
        </div>
      ) : showGroups ? (
        <div className="space-y-6">
          {groups.map(([groupName, groupForms]) => (
            <div key={groupName}>
              <h4 className="flex items-center gap-2 text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                {groupName}
                <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                  {groupForms.length}
                </span>
              </h4>
              <div className="space-y-3">{groupForms.map(renderForm)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">{sorted.map(renderForm)}</div>
      )}
    </div>
  );
}
