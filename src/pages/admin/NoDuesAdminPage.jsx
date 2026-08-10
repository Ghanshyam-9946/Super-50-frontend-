import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2, ChevronRight, PartyPopper, Circle,
  Wallet, Percent, ArrowRightCircle, Download, Loader2, RefreshCw, CheckCircle2, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement,
} from 'chart.js';
import api from '../../services/api';
import NoDuesFormDetail from '../../components/nodues/NoDuesFormDetail';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ArcElement);

// Fixed status colors — reused everywhere else in this module (badges),
// never cycled/reassigned per render.
const STATUS_COLORS = {
  forwarded: '#8b5cf6', // purple — matches the "Forwarded" badge
  completed: '#10b981', // emerald — matches the "Completed" badge
  inProgress: '#64748b', // slate — matches the "In Progress" badge
};

export default function NoDuesAdminPage() {
  const { user } = useSelector((s) => s.auth);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <FileCheck2 className="text-[var(--primary)]" size={30} /> No Dues Report
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Read-only reporting across the department. No Dues forms are released and managed by Academic Coordinators.
          </p>
        </div>
      </header>

      <OverviewTab user={user} />
    </div>
  );
}

/* ─────────────────────────────  OVERVIEW  ───────────────────────────── */

function OverviewTab({ user }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [openFormId, setOpenFormId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  // Bulk-forward mode — pick several fully-completed, not-yet-forwarded
  // forms (across whichever filter is active) and forward them all in one
  // request instead of opening each one individually.
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRemark, setBulkRemark] = useState('');
  const [bulkForwarding, setBulkForwarding] = useState(false);

  const downloadForwarded = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/no-dues/forwarded/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `No-Dues-Forwarded-${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download the forwarded students list');
    } finally {
      setDownloading(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      // "Forwarded" isn't a param the backend understands (it filters on
      // isCompleted only) — fetch everything and narrow it down here.
      if (filter === 'true' || filter === 'false') params.completed = filter;
      const { data } = await api.get('/no-dues', { params });
      if (data.success) {
        setForms(filter === 'forwarded' ? data.data.filter((f) => f.forwarded) : data.data);
      }
    } catch {
      toast.error('Failed to load No Dues forms');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // One-time repair: re-run isCompleted for every form using the CURRENT
  // rules — needed after a completion-rule change (a new optional item, a
  // threshold fix, etc.), since a form's stored isCompleted flag only ever
  // refreshes when someone next ticks an item on that specific form.
  const recomputeAll = async () => {
    if (!window.confirm('Re-check completion status for every No Dues form using the current rules? This is safe and reversible.')) return;
    setRecomputing(true);
    try {
      const { data } = await api.post('/no-dues/recompute-all');
      if (data.success) {
        toast.success(data.message);
        await load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to recompute');
    } finally {
      setRecomputing(false);
    }
  };

  const handleChange = (updated) => setForms((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));

  // Only fully-completed, not-yet-forwarded forms can be bulk-selected.
  const eligibleIds = useMemo(
    () => forms.filter((f) => f.isCompleted && !f.forwarded).map((f) => f._id),
    [forms]
  );

  const toggleSelected = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectAllEligible = () => setSelectedIds(eligibleIds);

  const submitBulkForward = async () => {
    if (selectedIds.length === 0) return toast.error('Select at least one form');
    setBulkForwarding(true);
    try {
      const { data } = await api.patch('/no-dues/bulk-forward', {
        formIds: selectedIds,
        remark: bulkRemark.trim(),
      });
      if (data.success) {
        toast.success(data.message);
        if (data.data?.skipped?.length) {
          data.data.skipped.forEach((s) => toast.error(`${s.name}: ${s.reason}`, { duration: 5000 }));
        }
        setSelectedIds([]);
        setBulkRemark('');
        setSelectMode(false);
        await load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk forward failed');
    } finally {
      setBulkForwarding(false);
    }
  };

  const stats = useMemo(() => {
    const forwardedCount = forms.filter((f) => f.forwarded).length;
    const completedNotForwarded = forms.filter((f) => f.isCompleted && !f.forwarded).length;
    const inProgressCount = forms.filter((f) => !f.isCompleted).length;

    // De-duplicate by student — the same student can appear on more than one form.
    const seenStudents = new Map();
    forms.forEach((f) => {
      if (f.student?._id) seenStudents.set(f.student._id, f.student);
    });
    const totalPendingFees = [...seenStudents.values()].reduce((sum, s) => sum + (s.duesFees || 0), 0);

    const attendanceValues = forms
      .map((f) => f.attendanceSummary?.adjustedAttendancePercentage)
      .filter((v) => v != null);
    const avgAdjustedAttendance = attendanceValues.length
      ? Math.round((attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length) * 10) / 10
      : 0;

    // Completion % per batch (only batches with at least one form).
    const byBatch = {};
    forms.forEach((f) => {
      const batch = f.student?.batch || 'Unknown';
      if (!byBatch[batch]) byBatch[batch] = { total: 0, completed: 0 };
      byBatch[batch].total += 1;
      if (f.isCompleted) byBatch[batch].completed += 1;
    });
    const batchLabels = Object.keys(byBatch).sort();
    const batchCompletionPct = batchLabels.map((b) =>
      byBatch[b].total ? Math.round((byBatch[b].completed / byBatch[b].total) * 100) : 0
    );

    return {
      forwardedCount,
      completedNotForwarded,
      inProgressCount,
      totalPendingFees,
      avgAdjustedAttendance,
      batchLabels,
      batchCompletionPct,
    };
  }, [forms]);

  const statusDoughnutData = {
    labels: ['Forwarded', 'Completed (not forwarded)', 'In Progress'],
    datasets: [{
      data: [stats.forwardedCount, stats.completedNotForwarded, stats.inProgressCount],
      backgroundColor: [STATUS_COLORS.forwarded, STATUS_COLORS.completed, STATUS_COLORS.inProgress],
      borderWidth: 0,
    }],
  };

  const batchBarData = {
    labels: stats.batchLabels,
    datasets: [{
      label: 'Completion %',
      data: stats.batchCompletionPct,
      backgroundColor: STATUS_COLORS.forwarded,
      borderRadius: 8,
    }],
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Forms" value={forms.length} />
        <StatCard label="Forwarded" value={stats.forwardedCount} accent="text-[var(--primary)]" icon={ArrowRightCircle} />
        <StatCard label="Completed" value={stats.completedNotForwarded} accent="text-emerald-500" />
        <StatCard label="In Progress" value={stats.inProgressCount} accent="text-slate-400" />
        <StatCard label="Avg Final Attendance" value={`${stats.avgAdjustedAttendance}%`} accent="text-amber-500" icon={Percent} />
        <StatCard label="Total Pending Fees" value={`₹${stats.totalPendingFees}`} accent="text-red-400" icon={Wallet} />
      </div>

      {forms.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-2xl">
            <h4 className="font-display font-bold text-sm text-[var(--text-primary)] mb-4">Status Breakdown</h4>
            <div className="max-w-[260px] mx-auto">
              <Doughnut
                data={statusDoughnutData}
                options={{
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
                }}
              />
            </div>
          </div>
          {stats.batchLabels.length > 0 && (
            <div className="glass-card p-5 rounded-2xl">
              <h4 className="font-display font-bold text-sm text-[var(--text-primary)] mb-4">Completion % by Batch</h4>
              <Bar
                data={batchBarData}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` } } },
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Filter</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none">
          <option value="">All</option>
          <option value="true">Completed</option>
          <option value="false">In Progress</option>
          <option value="forwarded">Forwarded</option>
        </select>
        <button
          onClick={() => {
            setSelectMode((v) => !v);
            setSelectedIds([]);
          }}
          className={`text-xs font-bold px-4 py-2.5 rounded-xl border flex items-center gap-1.5 ${
            selectMode
              ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
              : 'border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <CheckCircle2 size={14} /> {selectMode ? 'Cancel' : 'Select to Forward'}
        </button>
        {user?.role === 'admin' && (
          <button
            onClick={recomputeAll}
            disabled={recomputing}
            title="Re-check every form's Completed/In Progress status against the current rules"
            className="ml-auto flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-40"
          >
            {recomputing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Recompute All Status
          </button>
        )}
        <button
          onClick={downloadForwarded}
          disabled={downloading}
          className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all disabled:opacity-40 ${user?.role === 'admin' ? '' : 'ml-auto'}`}
        >
          {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Download Forwarded (Excel)
        </button>
      </div>

      {selectMode && (
        <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sticky top-2 z-10">
          <span className="text-sm font-bold text-[var(--text-primary)] shrink-0">
            {selectedIds.length} selected
          </span>
          <button
            onClick={selectAllEligible}
            disabled={eligibleIds.length === 0}
            className="text-xs font-bold px-3.5 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-40 shrink-0"
          >
            Select All ({eligibleIds.length})
          </button>
          <input
            value={bulkRemark}
            onChange={(e) => setBulkRemark(e.target.value)}
            placeholder="Remark (only needed for students with dues fees pending)"
            className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2 text-sm text-[var(--text-primary)] outline-none"
          />
          <button
            onClick={submitBulkForward}
            disabled={bulkForwarding || selectedIds.length === 0}
            className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 shrink-0 disabled:opacity-40"
          >
            {bulkForwarding ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightCircle size={15} />}
            Forward Selected ({selectedIds.length})
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : forms.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <FileCheck2 size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No No Dues forms found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => {
            const open = openFormId === form._id;
            const selectable = form.isCompleted && !form.forwarded;
            const isSelected = selectedIds.includes(form._id);
            return (
              <div key={form._id} className={`glass-card rounded-2xl overflow-hidden ${form.isCompleted ? 'ring-1 ring-emerald-500/30' : ''} ${isSelected ? 'ring-2 ring-[var(--primary)]' : ''}`}>
                <div className="flex items-stretch">
                  {selectMode && (
                    <button
                      onClick={() => (selectable ? toggleSelected(form._id) : null)}
                      disabled={!selectable}
                      title={selectable ? 'Select for bulk forward' : 'Only completed, not-yet-forwarded forms can be selected'}
                      className="flex items-center justify-center px-4 shrink-0 disabled:opacity-30"
                    >
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-light)]'}`}>
                        {isSelected && <Check size={13} className="text-white" />}
                      </span>
                    </button>
                  )}
                  <button onClick={() => setOpenFormId(open ? null : form._id)} className="flex-1 min-w-0 flex items-center justify-between gap-3 px-5 py-4 text-left">
                    <div className="min-w-0 flex items-center gap-3">
                      {form.isCompleted ? (
                        <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><PartyPopper size={15} className="text-emerald-500" /></span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0"><Circle size={15} className="text-slate-400" /></span>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--text-primary)] truncate">{form.student?.name} <span className="text-[var(--text-secondary)] font-medium">— {form.batch}</span></div>
                        <div className="text-[11px] text-[var(--text-secondary)]">Sem {form.semester}{form.section ? ` · ${form.section}` : ''} · Mentor: {form.createdBy?.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {form.attendanceSummary && (
                        <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">
                          Attendance: {form.attendanceSummary.adjustedAttendancePercentage}%
                        </span>
                      )}
                      {form.forwarded && (
                        <span className="badge bg-purple-500/10 border-purple-500/20 text-[var(--primary)]">Forwarded</span>
                      )}
                      <span className={`badge ${form.isCompleted ? 'badge-approved' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                        {form.isCompleted ? 'Completed' : 'In Progress'}
                      </span>
                      <ChevronRight size={16} className={`text-[var(--text-secondary)] transition-transform ${open ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                </div>
                <AnimatePresence>
                  {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1 border-t border-[var(--border-light)]">
                        <NoDuesFormDetail form={form} currentUser={user} onChange={handleChange} showDeleteButton={false} />
                      </div>
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

function StatCard({ label, value, accent, icon: Icon }) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className={`flex items-center gap-2 text-2xl md:text-3xl font-display font-black leading-none ${accent || 'text-[var(--text-primary)]'}`}>
        {Icon && <Icon size={20} />} {value}
      </div>
      <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}
