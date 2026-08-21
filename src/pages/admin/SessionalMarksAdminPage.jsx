import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  GraduationCap,
  Percent,
  Lock,
  Unlock,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement } from "chart.js";
import api from "../../services/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

const STATUS_COLORS = {
  locked: "#8b5cf6",
  open: "#64748b",
};

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function SemesterSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none w-28"
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

// Lets the admin/coordinator pick an already-defined section+subject
// instead of retyping batch/semester/section/subject by hand.
function MappingPicker({ mappings, onPick }) {
  if (!mappings.length) return null;
  return (
    <select
      defaultValue=""
      onChange={(e) => {
        const m = mappings.find((x) => x._id === e.target.value);
        if (m) onPick(m);
        e.target.value = "";
      }}
      className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none min-w-[240px]"
    >
      <option value="">Load an existing subject…</option>
      {mappings.map((m) => (
        <option key={m._id} value={m._id}>
          {m.batch} · Sem {m.semester} · {m.section} · {m.subjectName}
        </option>
      ))}
    </select>
  );
}

export default function SessionalMarksAdminPage() {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <GraduationCap className="text-[var(--primary)]" size={30} /> Sessional Marks Report
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Read-only reporting across sections. Marks are entered and managed by subject faculty and Academic Coordinators.
          </p>
        </div>
      </header>

      <OverviewTab user={user} />
    </div>
  );
}

function OverviewTab({ user }) {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ batch: "", semester: "", section: "", subjectName: "" });
  const [lockedFilter, setLockedFilter] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    api
      .get("/sessional-marks/mappings")
      .then(({ data }) => {
        if (data.success) setMappings(data.data);
      })
      .catch(() => {});
  }, []);

  const applyMapping = (m) =>
    setFilters({ batch: m.batch, semester: String(m.semester), section: m.section, subjectName: m.subjectName });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      if (lockedFilter) params.locked = lockedFilter;
      const { data } = await api.get("/sessional-marks/sheets", { params });
      if (data.success) setSheets(data.data);
    } catch {
      toast.error("Failed to load sessional marks sheets");
    } finally {
      setLoading(false);
    }
  }, [filters, lockedFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (updated) => setSheets((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));

  const stats = useMemo(() => {
    const lockedCount = sheets.filter((s) => s.locked).length;
    const openCount = sheets.length - lockedCount;
    const avg = (key) => {
      const vals = sheets.map((s) => s.converted?.[key]).filter((v) => v != null);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : 0;
    };

    const bySection = {};
    sheets.forEach((s) => {
      const sec = s.section || "Unknown";
      if (!bySection[sec]) bySection[sec] = { total: 0, sum: 0 };
      bySection[sec].total += 1;
      bySection[sec].sum += s.converted?.final30 || 0;
    });
    const sectionLabels = Object.keys(bySection).sort();
    const sectionAvg = sectionLabels.map((sec) =>
      bySection[sec].total ? Math.round((bySection[sec].sum / bySection[sec].total) * 100) / 100 : 0
    );

    return {
      lockedCount,
      openCount,
      avgMst: avg("mst20"),
      avgCa: avg("ca10"),
      avgFinal: avg("final30"),
      sectionLabels,
      sectionAvg,
    };
  }, [sheets]);

  const doughnutData = {
    labels: ["Locked", "Open"],
    datasets: [{ data: [stats.lockedCount, stats.openCount], backgroundColor: [STATUS_COLORS.locked, STATUS_COLORS.open], borderWidth: 0 }],
  };

  const barData = {
    labels: stats.sectionLabels,
    datasets: [{ label: "Avg Final /30", data: stats.sectionAvg, backgroundColor: STATUS_COLORS.locked, borderRadius: 8 }],
  };

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const response = await api.get("/sessional-marks/export", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sessional-Marks-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download Excel export");
    } finally {
      setDownloading(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const response = await api.get("/sessional-marks/export/pdf", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sessional-Marks-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download PDF export");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Sheets" value={sheets.length} />
        <StatCard label="Locked" value={stats.lockedCount} accent="text-[var(--primary)]" icon={Lock} />
        <StatCard label="Open" value={stats.openCount} accent="text-slate-400" />
        <StatCard label="Avg MST /20" value={stats.avgMst} accent="text-amber-500" icon={Percent} />
        <StatCard label="Avg Final /30" value={stats.avgFinal} accent="text-emerald-500" icon={Percent} />
      </div>

      {sheets.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-2xl">
            <h4 className="font-display font-bold text-sm text-[var(--text-primary)] mb-4">Locked vs Open</h4>
            <div className="max-w-[260px] mx-auto">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } } } }} />
            </div>
          </div>
          {stats.sectionLabels.length > 0 && (
            <div className="glass-card p-5 rounded-2xl">
              <h4 className="font-display font-bold text-sm text-[var(--text-primary)] mb-4">Avg Final Marks by Section</h4>
              <Bar
                data={barData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, max: 30, ticks: { stepSize: 5 } } },
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <MappingPicker mappings={mappings} onPick={applyMapping} />
        {["batch", "section", "subjectName"].map((k) => (
          <input
            key={k}
            placeholder={k}
            value={filters[k]}
            onChange={(e) => setFilters((f) => ({ ...f, [k]: e.target.value }))}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm w-32"
          />
        ))}
        <SemesterSelect value={filters.semester} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))} />
        <select
          value={lockedFilter}
          onChange={(e) => setLockedFilter(e.target.value)}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none"
        >
          <option value="">All</option>
          <option value="true">Locked</option>
          <option value="false">Open</option>
        </select>
        <button onClick={load} className="text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
          Apply
        </button>
        <button
          onClick={downloadExcel}
          disabled={downloading}
          className="ml-auto flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all disabled:opacity-40"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Excel
        </button>
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all disabled:opacity-40"
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} PDF
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : sheets.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <GraduationCap size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No sessional marks sheets found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sheets.map((sheet) => (
            <SheetRow key={sheet._id} sheet={sheet} user={user} onChange={handleChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function SheetRow({ sheet, user, onChange }) {
  const isAdmin = user?.role === "admin";
  const [locking, setLocking] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [showUnlock, setShowUnlock] = useState(false);

  const toggleLock = async (locked) => {
    if (!locked && !unlockReason.trim()) return toast.error("Enter a reason to unlock");
    setLocking(true);
    try {
      const { data } = await api.patch(`/sessional-marks/sheets/${sheet._id}/lock`, { locked, unlockReason });
      if (data.success) {
        toast.success(locked ? "Sheet locked" : "Sheet unlocked");
        onChange(data.data);
        setShowUnlock(false);
        setUnlockReason("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className={`glass-card rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 ${sheet.locked ? "ring-1 ring-emerald-500/30" : ""}`}>
      <div className="min-w-0">
        <div className="font-bold text-sm text-[var(--text-primary)] truncate">
          {sheet.student?.name} <span className="text-[var(--text-secondary)] font-medium">({sheet.student?.enrollmentNumber})</span>
        </div>
        <div className="text-[11px] text-[var(--text-secondary)]">
          {sheet.subjectName} · Sem {sheet.semester} / {sheet.section} · Faculty: {sheet.faculty?.name || "Unassigned"}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="badge">MST {sheet.converted.mst20}/20</span>
        <span className="badge">CA {sheet.converted.ca10}/10</span>
        <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">Final {sheet.converted.final30}/30</span>
        <span className={`badge ${sheet.locked ? "badge-approved" : "bg-slate-500/10 border-slate-500/20 text-slate-500"}`}>
          {sheet.locked ? "Locked" : "Open"}
        </span>
        {isAdmin && !sheet.locked && (
          <button
            onClick={() => toggleLock(true)}
            disabled={locking}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
          >
            <Lock size={12} /> Lock
          </button>
        )}
        {isAdmin && sheet.locked && !showUnlock && (
          <button
            onClick={() => setShowUnlock(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]"
          >
            <Unlock size={12} /> Unlock
          </button>
        )}
        {isAdmin && sheet.locked && showUnlock && (
          <>
            <input
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="Reason"
              className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs w-40"
            />
            <button
              onClick={() => toggleLock(false)}
              disabled={locking}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] disabled:opacity-40"
            >
              {locking ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />} Confirm
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className={`flex items-center gap-2 text-2xl md:text-3xl font-display font-black leading-none ${accent || "text-[var(--text-primary)]"}`}>
        {Icon && <Icon size={20} />} {value}
      </div>
      <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}
