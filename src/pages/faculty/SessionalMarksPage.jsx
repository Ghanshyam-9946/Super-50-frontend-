import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Upload,
  RefreshCw,
  Lock,
  Unlock,
  Save,
  Search,
  ListChecks,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import BatchSelect from "../../components/BatchSelect";
import SectionSelect from "../../components/SectionSelect";

const isCoordinator = (user) =>
  user?.role === "admin" || (user?.responsibilities || []).includes("Academic Coordinator");

const CA_CATEGORIES = ["Assignment", "Tutorial", "Activity", "LabRecord"];
const CATEGORY_LABELS = {
  Assignment: "Assignment",
  Tutorial: "Tutorial",
  Activity: "Presentation / Task / GD / etc",
  LabRecord: "Lab Record",
};
const ACTIVITY_KINDS = ["Presentation", "Task", "GD", "Other"];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Semester only ever takes 1-8 — always a select, never free-typed.
function SemesterSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm ${className}`}
    >
      <option value="">Semester</option>
      {SEMESTERS.map((n) => (
        <option key={n} value={n}>
          Semester {n}
        </option>
      ))}
    </select>
  );
}

// Lets the coordinator/faculty pick an already-defined section+subject
// instead of retyping batch/semester/section/subject every time — the
// #1 source of typo-driven mismatches (a sheet created with "Sec A" won't
// link to a mapping saved as "A"). Fields stay editable after picking, for
// the (expected) case of a subject that has no mapping yet.
function MappingPicker({ mappings, onPick, label = "Load from existing subject" }) {
  if (!mappings.length) return null;
  return (
    <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
      {label}
      <select
        defaultValue=""
        onChange={(e) => {
          const m = mappings.find((x) => x._id === e.target.value);
          if (m) onPick(m);
          e.target.value = "";
        }}
        className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm min-w-[260px]"
      >
        <option value="">Select…</option>
        {mappings.map((m) => (
          <option key={m._id} value={m._id}>
            {m.batch} · Sem {m.semester} · {m.section} · {m.subjectName}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SessionalMarksPage() {
  const { user } = useSelector((s) => s.auth);
  const coordinator = isCoordinator(user);
  const [tab, setTab] = useState(coordinator ? "create" : "entry");

  const tabs = [
    ...(coordinator ? [{ id: "create", label: "Create Sheets", icon: Plus }] : []),
    { id: "entry", label: "Marks Entry", icon: ListChecks },
    ...(coordinator ? [{ id: "upload", label: "Bulk Upload", icon: Upload }] : []),
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <GraduationCap size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Sessional Marks
          </h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Unit-wise CA entry, automatic MST scaling, final marks out of 30.
          </p>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-[var(--primary)] text-white"
                : "border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "create" && coordinator && <CreateSheetsTab />}
      {tab === "entry" && <EntryTab user={user} coordinator={coordinator} />}
      {tab === "upload" && coordinator && <UploadTab />}
    </div>
  );
}

/* ─────────────────────────────  CREATE SHEETS  ───────────────────────────── */

function CreateSheetsTab() {
  const [form, setForm] = useState({ batch: "", semester: "", section: "", subjectCode: "", subjectName: "" });
  const [mappings, setMappings] = useState([]);
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api
      .get("/sessional-marks/mappings")
      .then(({ data }) => {
        if (data.success) setMappings(data.data);
      })
      .catch(() => {});
  }, []);

  const applyMapping = (m) =>
    setForm({ batch: m.batch, semester: String(m.semester), section: m.section, subjectCode: m.subjectCode, subjectName: m.subjectName });

  const search = async () => {
    if (!form.batch && !form.semester) return toast.error("Enter at least batch or semester to search students");
    setLoading(true);
    try {
      const { data } = await api.get("/sessional-marks/students", {
        params: { batch: form.batch, semester: form.semester },
      });
      if (data.success) setStudents(data.data);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAll = () => setSelected(students.map((s) => s._id));

  const create = async () => {
    if (selected.length === 0) return toast.error("Select at least one student");
    if (!form.batch || !form.semester || !form.section || !form.subjectName) {
      return toast.error("Fill batch, semester, section and subject name");
    }
    setCreating(true);
    try {
      const { data } = await api.post("/sessional-marks/sheets/bulk-init", {
        ...form,
        semester: Number(form.semester),
        studentIds: selected,
      });
      if (data.success) {
        toast.success(data.message);
        if (data.skipped?.length) {
          data.skipped.forEach((s) => toast.error(`${s.name || s.studentId}: ${s.reason}`, { duration: 5000 }));
        }
        setSelected([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create sheets");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
          Create Sheets for a Section + Subject
        </h3>
        <MappingPicker mappings={mappings} onPick={applyMapping} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <BatchSelect value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} />
          <SemesterSelect value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} />
          <SectionSelect value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
          <input
            placeholder="Subject code"
            value={form.subjectCode}
            onChange={(e) => setForm((f) => ({ ...f, subjectCode: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Subject name"
            value={form.subjectName}
            onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={search}
          className="text-sm font-bold px-4 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5"
        >
          <Search size={14} /> Find Students
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        students.length > 0 && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {selected.length} / {students.length} selected
              </span>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]">
                  Select All
                </button>
                <button
                  onClick={create}
                  disabled={creating}
                  className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
                >
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create Sheets
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto divide-y divide-[var(--border-light)]">
              {students.map((s) => (
                <label
                  key={s._id}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-[var(--bg-hover)]"
                >
                  <input type="checkbox" checked={selected.includes(s._id)} onChange={() => toggle(s._id)} />
                  <span className="font-bold text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-[var(--text-secondary)] text-xs">{s.enrollmentNumber}</span>
                </label>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* ─────────────────────────────  MARKS ENTRY  ───────────────────────────── */

function EntryTab({ user, coordinator }) {
  const [filters, setFilters] = useState({ batch: "", semester: "", section: "", subjectCode: "", subjectName: "" });
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [pickerOptions, setPickerOptions] = useState([]);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncForm, setSyncForm] = useState({ test1Name: "", test1Max: "", test2Name: "", test2Max: "" });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Coordinators see every subject/section to pick from; other faculty
    // only see the ones they're personally assigned to.
    const endpoint = coordinator ? "/sessional-marks/mappings" : "/sessional-marks/my-sections";
    api
      .get(endpoint)
      .then(({ data }) => {
        if (data.success) setPickerOptions(data.data);
      })
      .catch(() => {});
  }, [coordinator]);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const { data } = await api.get("/sessional-marks/sheets", { params });
      if (data.success) setSheets(data.data);
    } catch {
      toast.error("Failed to load sheets");
    } finally {
      setLoading(false);
    }
  };

  const applyMapping = (m) =>
    setFilters({ batch: m.batch, semester: String(m.semester), section: m.section, subjectCode: m.subjectCode, subjectName: m.subjectName });

  const handleChange = (updated) => setSheets((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));

  const runSync = async () => {
    if (!syncForm.test1Name || !syncForm.test1Max) return toast.error("Enter at least MST1's test name and max marks");
    if (!filters.batch || !filters.semester || !filters.section || !filters.subjectName) {
      return toast.error("Set batch/semester/section/subject filters first, then Load");
    }
    setSyncing(true);
    try {
      const { data } = await api.post("/sessional-marks/sheets/sync-mst", {
        ...filters,
        semester: Number(filters.semester),
        test1: { testName: syncForm.test1Name, maxMarks: Number(syncForm.test1Max) },
        ...(syncForm.test2Name ? { test2: { testName: syncForm.test2Name, maxMarks: Number(syncForm.test2Max) } } : {}),
      });
      if (data.success) {
        toast.success(data.message);
        setSyncOpen(false);
        await load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "MST sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-end gap-3">
        <MappingPicker mappings={pickerOptions} onPick={applyMapping} label="Load an existing subject" />
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          batch
          <BatchSelect value={filters.batch} onChange={(e) => setFilters((f) => ({ ...f, batch: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs" />
        </label>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          section
          <SectionSelect value={filters.section} onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs" />
        </label>
        {["subjectCode", "subjectName"].map((k) => (
          <label key={k} className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            {k}
            <input
              value={filters[k]}
              onChange={(e) => setFilters((f) => ({ ...f, [k]: e.target.value }))}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
            />
          </label>
        ))}
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          semester
          <SemesterSelect value={filters.semester} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))} />
        </label>
        <button onClick={load} className="btn-premium text-xs px-4 py-2.5">
          Load
        </button>
        {coordinator && (
          <button
            onClick={() => setSyncOpen((v) => !v)}
            className="text-xs font-bold px-4 py-2.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1.5 text-[var(--text-primary)]"
          >
            <RefreshCw size={13} /> Sync MST
          </button>
        )}
      </div>

      {syncOpen && (
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <p className="text-xs text-[var(--text-secondary)]">
            Final MST (/20) = ((MST1 + MST2) / (Max1 + Max2)) × 20 — leave MST2 blank to sync MST1 alone without touching an
            already-synced MST2.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              MST1 Test Name
              <input
                value={syncForm.test1Name}
                onChange={(e) => setSyncForm((f) => ({ ...f, test1Name: e.target.value }))}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              MST1 Max
              <input
                type="number"
                value={syncForm.test1Max}
                onChange={(e) => setSyncForm((f) => ({ ...f, test1Max: e.target.value }))}
                className="w-20 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              MST2 Test Name (optional)
              <input
                value={syncForm.test2Name}
                onChange={(e) => setSyncForm((f) => ({ ...f, test2Name: e.target.value }))}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              MST2 Max
              <input
                type="number"
                value={syncForm.test2Max}
                onChange={(e) => setSyncForm((f) => ({ ...f, test2Max: e.target.value }))}
                className="w-20 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
              />
            </label>
            <button
              onClick={runSync}
              disabled={syncing}
              className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40"
            >
              {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Sync
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center rounded-3xl">
          <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
        </div>
      ) : sheets.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No sheets loaded — set filters and click Load, or create sheets from the "Create Sheets" tab.
        </div>
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet) => {
            const open = openId === sheet._id;
            return (
              <div
                key={sheet._id}
                className={`glass-card rounded-2xl overflow-hidden ${sheet.locked ? "ring-1 ring-emerald-500/30" : ""}`}
              >
                <button
                  onClick={() => setOpenId(open ? null : sheet._id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                      {sheet.student?.name}{" "}
                      <span className="text-[var(--text-secondary)] font-medium">({sheet.student?.enrollmentNumber})</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {sheet.subjectName} · Sem {sheet.semester} / {sheet.section}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge">MST {sheet.converted.mst20}/20</span>
                    <span className="badge">CA {sheet.converted.ca10}/10</span>
                    {sheet.converted.labMarks != null && <span className="badge">Lab {sheet.converted.labMarks}/20</span>}
                    <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                      Final {sheet.converted.final30}/30
                    </span>
                    {sheet.locked && <span className="badge badge-approved">Locked</span>}
                    <ChevronRight size={16} className={`transition-transform ${open ? "rotate-90" : ""}`} />
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
                      <SheetEditor sheet={sheet} onChange={handleChange} coordinator={coordinator} user={user} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SheetEditor({ sheet, onChange, coordinator, user }) {
  const uid = user?._id;
  const isAssignedFaculty = sheet.faculty?._id === uid || sheet.faculty === uid;
  // A deadline is a live comparison against the stored date, not a separate
  // lock flag — the coordinator extending it to a future date is the
  // "unlock", nothing else to reset (mirrors the backend's isDeadlinePassed).
  const deadlinePassed = !!sheet.deadline && new Date() > new Date(sheet.deadline);
  const canEdit = (isAssignedFaculty || coordinator) && !sheet.locked && !deadlinePassed;
  const isAdmin = user?.role === "admin";

  // CA categories come from the linked Subject's marks-type Activities once
  // one is linked — falls back to the legacy fixed list for sheets that
  // predate the Subject Catalog (see Subject.js / masterDataController.js's
  // backfillSubjectCatalog). Same fallback the backend validates against.
  const subjectActivities = sheet.subjectRef?.activities || [];
  const marksActivities = subjectActivities.filter((a) => a.type === "marks");
  const categoryOptions = marksActivities.length ? marksActivities.map((a) => a.label) : CA_CATEGORIES;
  const categoryLabel = (cat) => CATEGORY_LABELS[cat] || cat;
  const hasLab = (sheet.subjectRef?.noOfPractical || 0) > 0;
  // A category's max comes from its Subject Activity's maxMarks, when one
  // is linked — saves re-typing the same number every entry. Still editable
  // afterwards for a genuine one-off.
  const defaultMaxFor = (category) => {
    const activity = marksActivities.find((a) => a.label === category);
    return activity ? String(activity.maxMarks ?? "") : "";
  };

  const [form, setForm] = useState({ category: categoryOptions[0] || "Assignment", kind: ACTIVITY_KINDS[0], unit: 1, obtained: "", max: defaultMaxFor(categoryOptions[0]), entryId: null });
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [labForm, setLabForm] = useState({
    attendance: sheet.lab?.attendance ?? "",
    submission: sheet.lab?.submission ?? "",
    viva: sheet.lab?.viva ?? "",
  });
  const [savingLab, setSavingLab] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(sheet.deadline ? sheet.deadline.slice(0, 10) : "");
  const [savingDeadline, setSavingDeadline] = useState(false);

  const resetForm = () => setForm({ category: categoryOptions[0] || "Assignment", kind: ACTIVITY_KINDS[0], unit: 1, obtained: "", max: defaultMaxFor(categoryOptions[0]), entryId: null });

  const saveDeadline = async () => {
    setSavingDeadline(true);
    try {
      const { data } = await api.patch(`/sessional-marks/sheets/${sheet._id}/deadline`, {
        deadline: deadlineInput || null,
      });
      if (data.success) {
        toast.success(data.message);
        onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save deadline");
    } finally {
      setSavingDeadline(false);
    }
  };

  const saveLab = async () => {
    setSavingLab(true);
    try {
      const payload = {};
      if (labForm.attendance !== "") payload.attendance = Number(labForm.attendance);
      if (labForm.submission !== "") payload.submission = Number(labForm.submission);
      if (labForm.viva !== "") payload.viva = Number(labForm.viva);
      const { data } = await api.patch(`/sessional-marks/sheets/${sheet._id}/lab`, payload);
      if (data.success) {
        toast.success("Lab marks saved");
        onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save lab marks");
    } finally {
      setSavingLab(false);
    }
  };

  const saveEntry = async () => {
    if (form.obtained === "" || form.max === "") return toast.error("Enter obtained and max marks");
    setSaving(true);
    try {
      const { data } = await api.patch(`/sessional-marks/sheets/${sheet._id}/ca`, {
        entryId: form.entryId,
        category: form.category,
        kind: form.kind,
        unit: Number(form.unit),
        obtained: Number(form.obtained),
        max: Number(form.max),
      });
      if (data.success) {
        toast.success("Marks saved");
        onChange(data.data);
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  const editEntry = (entry) =>
    setForm({ category: entry.category, kind: entry.kind || "Activity", unit: entry.unit, obtained: entry.obtained, max: entry.max, entryId: entry._id });

  const deleteEntry = async (entryId) => {
    if (!window.confirm("Remove this entry?")) return;
    try {
      const { data } = await api.delete(`/sessional-marks/sheets/${sheet._id}/ca/${entryId}`);
      if (data.success) {
        toast.success("Entry removed");
        onChange(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove entry");
    }
  };

  const toggleLock = async (locked) => {
    if (!locked && !unlockReason.trim()) return toast.error("Enter a reason to unlock");
    setLocking(true);
    try {
      const { data } = await api.patch(`/sessional-marks/sheets/${sheet._id}/lock`, { locked, unlockReason });
      if (data.success) {
        toast.success(locked ? "Sheet locked" : "Sheet unlocked");
        onChange(data.data);
        setUnlockReason("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="px-5 pb-5 pt-1 border-t border-[var(--border-light)] space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`font-bold ${deadlinePassed ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
          Deadline: {sheet.deadline ? new Date(sheet.deadline).toLocaleDateString() : "Not set"}
          {deadlinePassed && " — entries are blocked, extend to unlock"}
        </span>
        {coordinator && (
          <>
            <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1 text-xs"
            />
            <button onClick={saveDeadline} disabled={savingDeadline} className="text-xs font-bold px-2.5 py-1 rounded-lg border border-[var(--border-light)] disabled:opacity-40">
              {savingDeadline ? <Loader2 size={12} className="animate-spin" /> : "Save"}
            </button>
          </>
        )}
      </div>

      {(sheet.mst?.test1?.testName || sheet.mst?.test2?.testName) && (
        <div className="text-xs text-[var(--text-secondary)] flex flex-wrap gap-x-4 gap-y-1">
          {sheet.mst?.test1?.testName && (
            <span>
              MST1: {sheet.mst.test1.testName} — {sheet.mst.test1.obtained}/{sheet.mst.test1.max}
            </span>
          )}
          {sheet.mst?.test2?.testName && (
            <span>
              MST2: {sheet.mst.test2.testName} — {sheet.mst.test2.obtained}/{sheet.mst.test2.max}
            </span>
          )}
        </div>
      )}

      {hasLab && (
        <div className="bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Lab (Attendance / Submission / Viva → Lab Marks /20)
            </span>
            {sheet.converted?.labMarks != null && (
              <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                Lab Marks: {sheet.converted.labMarks}/20
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Attendance (/10)
              <input
                type="number"
                min="0"
                max="10"
                disabled={!canEdit}
                value={labForm.attendance}
                onChange={(e) => setLabForm((f) => ({ ...f, attendance: e.target.value }))}
                className="w-20 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Submission (/10)
              <input
                type="number"
                min="0"
                max="10"
                disabled={!canEdit}
                value={labForm.submission}
                onChange={(e) => setLabForm((f) => ({ ...f, submission: e.target.value }))}
                className="w-20 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs disabled:opacity-50"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Viva (/10)
              <input
                type="number"
                min="0"
                max="10"
                disabled={!canEdit}
                value={labForm.viva}
                onChange={(e) => setLabForm((f) => ({ ...f, viva: e.target.value }))}
                className="w-20 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs disabled:opacity-50"
              />
            </label>
            {canEdit && (
              <button onClick={saveLab} disabled={savingLab} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
                {savingLab ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save Lab
              </button>
            )}
          </div>
        </div>
      )}

      {categoryOptions.map((cat) => {
        const entries = sheet.caEntries.filter((e) => e.category === cat);
        return (
          <div key={cat}>
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2">
              {categoryLabel(cat)}
            </div>
            <div className="flex flex-wrap gap-2">
              {entries.map((e) => (
                <div
                  key={e._id}
                  className="flex items-center gap-2 bg-[var(--bg-raised,var(--bg-input))] border border-[var(--border-light)] rounded-lg px-3 py-1.5 text-xs"
                >
                  <button disabled={!canEdit} onClick={() => editEntry(e)} className="font-bold text-[var(--text-primary)] disabled:cursor-default">
                    Unit {e.unit}: {e.obtained}/{e.max}
                  </button>
                  {canEdit && (
                    <button onClick={() => deleteEntry(e._id)}>
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))}
              {entries.length === 0 && <span className="text-xs text-[var(--text-secondary)]">No entries yet</span>}
            </div>
          </div>
        );
      })}

      {canEdit && (
        <div className="flex flex-wrap items-end gap-2 bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-3">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, max: defaultMaxFor(e.target.value) }))}
              className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs"
            >
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          {form.category === "Activity" && (
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Kind
              <select
                value={form.kind}
                onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
                className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs"
              >
                {ACTIVITY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Unit
            <input
              type="number"
              min="1"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="w-16 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs"
            />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Obtained
            <input
              type="number"
              min="0"
              value={form.obtained}
              onChange={(e) => setForm((f) => ({ ...f, obtained: e.target.value }))}
              className="w-20 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs"
            />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Max
            <input
              type="number"
              min="0"
              value={form.max}
              onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
              className="w-20 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs"
            />
          </label>
          <button onClick={saveEntry} disabled={saving} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {form.entryId ? "Update" : "Add"}
          </button>
          {form.entryId && (
            <button onClick={resetForm} className="text-xs font-bold px-3 py-2 rounded-lg border border-[var(--border-light)]">
              Cancel
            </button>
          )}
        </div>
      )}

      {(coordinator || isAdmin) && (
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-light)]">
          {!sheet.locked ? (
            <button
              onClick={() => toggleLock(true)}
              disabled={locking}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
            >
              <Lock size={13} /> Lock Sheet
            </button>
          ) : isAdmin ? (
            <>
              <input
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Reason to unlock"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs"
              />
              <button
                onClick={() => toggleLock(false)}
                disabled={locking}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
              >
                <Unlock size={13} /> Unlock
              </button>
            </>
          ) : (
            <span className="text-xs text-[var(--text-secondary)]">Locked — only an admin can unlock this sheet.</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────  BULK UPLOAD  ───────────────────────────── */

function UploadTab() {
  const [form, setForm] = useState({
    batch: "",
    semester: "",
    section: "",
    subjectCode: "",
    subjectName: "",
    category: "Assignment",
    kind: ACTIVITY_KINDS[0],
    unit: 1,
    max: "",
  });
  const [mappings, setMappings] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .get("/sessional-marks/mappings")
      .then(({ data }) => {
        if (data.success) setMappings(data.data);
      })
      .catch(() => {});
  }, []);

  const applyMapping = (m) =>
    setForm((f) => ({ ...f, batch: m.batch, semester: String(m.semester), section: m.section, subjectCode: m.subjectCode, subjectName: m.subjectName }));

  const upload = async () => {
    if (!file) return toast.error("Choose an Excel file");
    if (!form.batch || !form.semester || !form.section || !form.subjectName || !form.unit) {
      return toast.error("Fill batch, semester, section, subject name and unit");
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/sessional-marks/upload", fd);
      if (data.success) {
        toast.success(data.message);
        setResult(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">
          Bulk Upload CA Marks (one category + unit per file)
        </h3>
        <MappingPicker mappings={mappings} onPick={applyMapping} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <BatchSelect value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} />
          <SemesterSelect value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} />
          <SectionSelect value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
          <input
            placeholder="Subject name"
            value={form.subjectName}
            onChange={(e) => setForm((f) => ({ ...f, subjectName: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          >
            {CA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Unit"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max marks (fallback if not in file)"
            value={form.max}
            onChange={(e) => setForm((f) => ({ ...f, max: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files[0])} className="text-sm text-[var(--text-primary)]" />
        </div>
        <p className="text-xs text-[var(--text-secondary)]">
          Excel columns: Enrollment Number, Obtained (and optionally Max per row).
        </p>
        <button onClick={upload} disabled={uploading} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
        </button>
      </div>
      {result && (
        <div className="glass-card p-4 rounded-2xl text-sm">
          <p className="font-bold mb-2 text-[var(--text-primary)]">Updated {result.updated} sheet(s)</p>
          {result.skipped?.length > 0 && (
            <ul className="text-xs text-[var(--text-secondary)] space-y-1">
              {result.skipped.map((s, i) => (
                <li key={i}>
                  {s.enrollment}: {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
