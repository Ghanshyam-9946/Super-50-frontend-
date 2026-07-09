import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ArrowLeft,
  Save, X, Check, Table2, Users2, ClipboardList, Upload, Image as ImageIcon, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import TimetableGrid from '../../components/timetable/TimetableGrid';
import { downloadTimetablePdf } from '../../utils/timetablePdf';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyForm = () => ({
  instituteName: 'SAGAR INSTITUTE OF SCIENCE & TECHNOLOGY',
  departmentHeading: 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
  logoUrl: '',
  session: '',
  semester: 1,
  className: '',
  roomNo: '',
  effectiveFrom: '',
  periods: [
    { label: '1', time: '9:35 - 10:35' },
    { label: '2', time: '10:35 - 11:35' },
    { label: '3', time: '11:35 - 12:35' },
    { label: '4', time: '12:35 - 1:35' },
    { label: '5', time: '2:10 - 3:10' },
    { label: '6', time: '3:10 - 4:10' },
  ],
  breakAfterPeriod: 4,
  breakLabel: 'Lunch Time',
  breakTime: '1:35 - 2:10',
  days: DAYS.map((day) => ({ day, cells: [] })),
  signatories: [
    { name: '', designation: 'Prepared by' },
    { name: '', designation: 'HOD' },
    { name: '', designation: 'Vice Principal' },
    { name: '', designation: 'Principal' },
  ],
  isPublished: true,
});

const toDateInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function TimetableManagePage() {
  const [view, setView] = useState('list'); // 'list' | 'builder'
  const [editing, setEditing] = useState(null); // existing timetable being edited, or null for create

  return view === 'list' ? (
    <ListView
      onCreate={() => {
        setEditing(null);
        setView('builder');
      }}
      onEdit={(tt) => {
        setEditing(tt);
        setView('builder');
      }}
    />
  ) : (
    <BuilderView
      initial={editing}
      onDone={() => {
        setEditing(null);
        setView('list');
      }}
    />
  );
}

/* ─────────────────────────────  LIST VIEW  ───────────────────────────── */

function ListView({ onCreate, onEdit }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/timetables', { params: semesterFilter ? { semester: semesterFilter } : {} });
      if (data.success) setItems(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load timetables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterFilter]);

  const togglePublish = async (id) => {
    try {
      const { data } = await api.patch(`/timetables/${id}/publish`);
      if (data.success) {
        toast.success(data.message);
        setItems((prev) => prev.map((t) => (t._id === id ? data.data : t)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this timetable? This cannot be undone.')) return;
    try {
      const { data } = await api.delete(`/timetables/${id}`);
      if (data.success) {
        toast.success('Timetable deleted');
        setItems((prev) => prev.filter((t) => t._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Downloads a card's PDF without opening the builder — renders the grid
  // off-screen for a moment, captures it, then tears it back down.
  const downloadPdf = async (tt) => {
    setDownloadingId(tt._id);
    try {
      await downloadTimetablePdf(tt);
      toast.success('Timetable downloaded');
    } catch (err) {
      console.error('Timetable PDF export failed:', err);
      toast.error('Could not generate PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <CalendarClock className="text-[var(--primary)]" size={30} /> Time Table Manager
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Create and manage semester-wise class timetables — students see them instantly once published.
          </p>
        </div>
        <button onClick={onCreate} className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto">
          <Plus size={16} /> Create Time Table
        </button>
      </header>

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Filter by semester</span>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
        >
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">Loading timetables…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Table2 size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No timetables created yet</p>
          <button onClick={onCreate} className="btn-premium flex items-center gap-2 text-xs mt-2">
            <Plus size={16} /> Create your first timetable
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((tt, i) => (
            <motion.div
              key={tt._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 rounded-2xl flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-[var(--text-primary)] truncate">
                    Semester {tt.semester}{tt.className ? ` — ${tt.className}` : ''}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{tt.session}</p>
                </div>
                <span className={`badge shrink-0 ${tt.isPublished ? 'badge-approved' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                  {tt.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {tt.roomNo && <p className="text-xs text-[var(--text-secondary)]">Room No {tt.roomNo}</p>}

              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[var(--border-light)]">
                <button
                  onClick={() => onEdit(tt)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-light)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => downloadPdf(tt)}
                  disabled={downloadingId === tt._id}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-xs font-bold transition-all disabled:opacity-50"
                  title="Download PDF"
                >
                  {downloadingId === tt._id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                </button>
                <button
                  onClick={() => togglePublish(tt._id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10 text-xs font-bold transition-all"
                  title={tt.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {tt.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => remove(tt._id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────  BUILDER VIEW  ───────────────────────────── */

function BuilderView({ initial, onDone }) {
  const [form, setForm] = useState(() => {
    if (!initial) return emptyForm();
    return {
      ...emptyForm(),
      ...initial,
      effectiveFrom: toDateInput(initial.effectiveFrom),
      days: DAYS.map((day) => initial.days?.find((d) => d.day === day) || { day, cells: [] }),
    };
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [downloadingPreview, setDownloadingPreview] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await api.post('/timetables/upload-logo', fd);
      if (data.success) {
        set({ logoUrl: data.url });
        toast.success('Logo uploaded');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logo upload failed');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const setPeriod = (idx, patch) => {
    const periods = [...form.periods];
    periods[idx] = { ...periods[idx], ...patch };
    set({ periods });
  };

  const addPeriod = () => {
    const n = form.periods.length + 1;
    set({ periods: [...form.periods, { label: String(n), time: '' }] });
  };

  const removePeriod = (idx) => {
    if (form.periods.length <= 1) return;
    const periods = form.periods.filter((_, i) => i !== idx);
    set({
      periods,
      breakAfterPeriod: Math.min(form.breakAfterPeriod, periods.length - 1),
      // Drop any day-cells that started at or beyond the removed period to avoid dangling references
      days: form.days.map((d) => ({ ...d, cells: d.cells.filter((c) => c.periodStart <= periods.length) })),
    });
  };

  const setSignatory = (idx, patch) => {
    const signatories = [...form.signatories];
    signatories[idx] = { ...signatories[idx], ...patch };
    set({ signatories });
  };
  const addSignatory = () => set({ signatories: [...form.signatories, { name: '', designation: '' }] });
  const removeSignatory = (idx) => set({ signatories: form.signatories.filter((_, i) => i !== idx) });

  const updateDayCells = (day, cells) => set({ days: form.days.map((d) => (d.day === day ? { ...d, cells } : d)) });

  const previewData = useMemo(() => ({ ...form }), [form]);

  const save = async () => {
    if (!form.session.trim()) return toast.error('Session is required (e.g. JAN-JUNE, 2026)');
    if (!form.semester) return toast.error('Semester is required');

    setSaving(true);
    try {
      const payload = { ...form, effectiveFrom: form.effectiveFrom || undefined };
      const { data } = initial
        ? await api.put(`/timetables/${initial._id}`, payload)
        : await api.post('/timetables', payload);
      if (data.success) {
        toast.success(data.message || 'Saved');
        onDone();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-purple-500/10 transition-all';
  const labelCls = 'block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <button onClick={onDone} className="w-9 h-9 rounded-xl border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl md:text-2xl font-display font-black text-[var(--text-primary)]">
            {initial ? 'Edit Time Table' : 'Create Time Table'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] cursor-pointer select-none">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
            Published (visible to students)
          </label>
          <button onClick={save} disabled={saving} className="btn-premium flex items-center gap-2 text-xs">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
          </button>
        </div>
      </header>

      {/* Meta form */}
      <div className="glass-card p-6 rounded-3xl grid md:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Institute Name</label>
          <input value={form.instituteName} onChange={(e) => set({ instituteName: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Department Heading</label>
          <input value={form.departmentHeading} onChange={(e) => set({ departmentHeading: e.target.value })} className={inputCls} />
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>Institute Logo <span className="opacity-60 normal-case font-medium">(optional)</span></label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 shrink-0 rounded-full border border-[var(--border-light)] bg-[var(--bg-hover)] flex items-center justify-center overflow-hidden">
              {form.logoUrl ? (
                <img src={getImageUrl(form.logoUrl)} alt="logo preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={20} className="text-[var(--text-secondary)]" />
              )}
            </div>
            <label className="flex-1 flex items-center gap-3 border border-dashed border-[var(--border-light)] rounded-xl px-4 py-3 cursor-pointer hover:border-[var(--primary)] transition-colors">
              {uploadingLogo ? <Loader2 size={16} className="animate-spin text-[var(--primary)]" /> : <Upload size={16} className="text-[var(--primary)]" />}
              <span className="text-sm text-[var(--text-secondary)] truncate">
                {uploadingLogo ? 'Uploading…' : form.logoUrl ? 'Replace logo image' : 'Upload logo image (PNG, JPG, SVG)'}
              </span>
              <input type="file" className="hidden" accept=".png,.jpg,.jpeg,.svg,.webp" disabled={uploadingLogo} onChange={handleLogoUpload} />
            </label>
            {form.logoUrl && (
              <button onClick={() => set({ logoUrl: '' })} className="text-[var(--text-secondary)] hover:text-red-500 shrink-0" title="Remove logo">
                <X size={18} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
            Or paste an image URL directly:{' '}
            <input
              value={form.logoUrl}
              onChange={(e) => set({ logoUrl: e.target.value })}
              placeholder="https://…"
              className="inline-block w-56 bg-transparent border-b border-[var(--border-light)] px-1 text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          </p>
        </div>
        <div>
          <label className={labelCls}>Session</label>
          <input value={form.session} onChange={(e) => set({ session: e.target.value })} placeholder="JAN-JUNE, 2026" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Semester</label>
          <select value={form.semester} onChange={(e) => set({ semester: Number(e.target.value) })} className={inputCls}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Class Name</label>
          <input value={form.className} onChange={(e) => set({ className: e.target.value })} placeholder="IV-1" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Room No</label>
          <input value={form.roomNo} onChange={(e) => set({ roomNo: e.target.value })} placeholder="102" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>W.e.f. (effective from)</label>
          <input type="date" value={form.effectiveFrom} onChange={(e) => set({ effectiveFrom: e.target.value })} className={inputCls} />
        </div>
      </div>

      {/* Periods */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2"><ClipboardList size={18} className="text-[var(--primary)]" /> Periods</h2>
          <button onClick={addPeriod} className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline">
            <Plus size={14} /> Add Period
          </button>
        </div>
        <div className="grid md:grid-cols-3 xl:grid-cols-4 gap-3">
          {form.periods.map((p, i) => (
            <div key={i} className="flex items-center gap-2 bg-[var(--bg-hover)] rounded-xl p-2.5">
              <input value={p.label} onChange={(e) => setPeriod(i, { label: e.target.value })} placeholder="Label" className="w-14 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs text-center text-[var(--text-primary)] outline-none" />
              <input value={p.time} onChange={(e) => setPeriod(i, { time: e.target.value })} placeholder="9:35 - 10:35" className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none min-w-0" />
              <button onClick={() => removePeriod(i)} className="text-[var(--text-secondary)] hover:text-red-500 shrink-0"><X size={15} /></button>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--border-light)]">
          <div>
            <label className={labelCls}>Break After Period #</label>
            <select value={form.breakAfterPeriod} onChange={(e) => set({ breakAfterPeriod: Number(e.target.value) })} className={inputCls}>
              {form.periods.map((_, i) => (
                <option key={i} value={i + 1}>After Period {i + 1}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Break Label</label>
            <input value={form.breakLabel} onChange={(e) => set({ breakLabel: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Break Time</label>
            <input value={form.breakTime} onChange={(e) => set({ breakTime: e.target.value })} placeholder="1:35 - 2:10" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Day-wise schedule */}
      <div className="glass-card p-6 rounded-3xl">
        <h2 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><CalendarClock size={18} className="text-[var(--primary)]" /> Day-wise Schedule</h2>
        <div className="grid lg:grid-cols-2 gap-5">
          {DAYS.map((day) => {
            const dayEntry = form.days.find((d) => d.day === day) || { day, cells: [] };
            return (
              <DayEditor
                key={day}
                day={day}
                cells={dayEntry.cells}
                periodsCount={form.periods.length}
                breakAfterPeriod={form.breakAfterPeriod}
                onChange={(cells) => updateDayCells(day, cells)}
              />
            );
          })}
        </div>
      </div>

      {/* Signatories */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2"><Users2 size={18} className="text-[var(--primary)]" /> Signatories</h2>
          <button onClick={addSignatory} className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {form.signatories.map((s, i) => (
            <div key={i} className="bg-[var(--bg-hover)] rounded-xl p-3 space-y-2">
              <input value={s.name} onChange={(e) => setSignatory(i, { name: e.target.value })} placeholder="Name (optional)" className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none" />
              <div className="flex items-center gap-2">
                <input value={s.designation} onChange={(e) => setSignatory(i, { designation: e.target.value })} placeholder="Designation" className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none min-w-0" />
                <button onClick={() => removeSignatory(i)} className="text-[var(--text-secondary)] hover:text-red-500 shrink-0"><X size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live preview — exact document look */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-bold text-[var(--text-primary)]">Live Preview</h2>
          <button
            onClick={async () => {
              setDownloadingPreview(true);
              try {
                await downloadTimetablePdf(previewData);
                toast.success('Timetable downloaded');
              } catch (err) {
                console.error('Timetable PDF export failed:', err);
                toast.error('Could not generate PDF');
              } finally {
                setDownloadingPreview(false);
              }
            }}
            disabled={downloadingPreview}
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50"
          >
            {downloadingPreview ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download PDF
          </button>
        </div>
        <div className="glass-card p-3 md:p-5 rounded-3xl overflow-x-auto">
          <div className="min-w-[900px]">
            <TimetableGrid data={previewData} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-4">
        <button onClick={onDone} className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
          Cancel
        </button>
        <button onClick={save} disabled={saving} className="btn-premium flex items-center gap-2 text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Time Table
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────  DAY EDITOR (add/edit/remove slots)  ───────────────────────── */

function DayEditor({ day, cells, periodsCount, breakAfterPeriod, onChange }) {
  const blank = { periodStart: 1, span: 1, subject: '', faculty: '' };
  const [form, setForm] = useState(blank);
  const [editingIdx, setEditingIdx] = useState(null);
  const [open, setOpen] = useState(false);

  const maxSpanFor = (start) => (start <= breakAfterPeriod ? breakAfterPeriod - start + 1 : periodsCount - start + 1);

  const overlaps = (start, span, excludeIdx) => {
    const range = new Set();
    for (let k = 0; k < span; k++) range.add(start + k);
    return cells.some((c, i) => {
      if (i === excludeIdx) return false;
      for (let k = 0; k < c.span; k++) {
        if (range.has(c.periodStart + k)) return true;
      }
      return false;
    });
  };

  const startAdd = () => {
    setForm(blank);
    setEditingIdx(null);
    setOpen(true);
  };

  const startEdit = (idx) => {
    setForm(cells[idx]);
    setEditingIdx(idx);
    setOpen(true);
  };

  const removeCell = (idx) => onChange(cells.filter((_, i) => i !== idx));

  const saveSlot = () => {
    if (!form.subject.trim()) return toast.error('Subject / activity name is required');
    const span = Math.max(1, Math.min(form.span, maxSpanFor(form.periodStart)));
    if (overlaps(form.periodStart, span, editingIdx)) {
      return toast.error('This period range overlaps an existing slot on this day');
    }
    const updated = { ...form, span };
    if (editingIdx !== null) {
      const next = [...cells];
      next[editingIdx] = updated;
      onChange(next);
    } else {
      onChange([...cells, updated]);
    }
    setOpen(false);
    setEditingIdx(null);
  };

  const sorted = [...cells].sort((a, b) => a.periodStart - b.periodStart);

  return (
    <div className="border border-[var(--border-light)] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-[var(--text-primary)]">{day}</h3>
        <button onClick={startAdd} className="flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline">
          <Plus size={12} /> Add Slot
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)] italic">No classes scheduled.</p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((c, idx) => {
            const realIdx = cells.indexOf(c);
            return (
              <div key={idx} className="flex items-center justify-between gap-2 bg-[var(--bg-hover)] rounded-lg px-2.5 py-1.5 text-xs">
                <button onClick={() => startEdit(realIdx)} className="text-left min-w-0 flex-1">
                  <span className="font-bold text-[var(--text-primary)]">P{c.periodStart}{c.span > 1 ? `-${c.periodStart + c.span - 1}` : ''}: </span>
                  <span className="text-[var(--text-secondary)] truncate">{c.subject}{c.faculty ? ` — ${c.faculty}` : ''}</span>
                </button>
                <button onClick={() => removeCell(realIdx)} className="text-[var(--text-secondary)] hover:text-red-500 shrink-0"><X size={13} /></button>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
              <div className="flex gap-2">
                <select value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: Number(e.target.value) })} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none">
                  {Array.from({ length: periodsCount }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>Start P{p}</option>
                  ))}
                </select>
                <select value={form.span} onChange={(e) => setForm({ ...form, span: Number(e.target.value) })} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none">
                  {Array.from({ length: maxSpanFor(form.periodStart) }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>{s} period{s > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject / Lab name" className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none" />
              <input value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} placeholder="Faculty name(s)" className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] outline-none" />
              <div className="flex gap-2">
                <button onClick={saveSlot} className="flex-1 flex items-center justify-center gap-1.5 btn-premium py-1.5 text-xs">
                  <Check size={13} /> {editingIdx !== null ? 'Update' : 'Add'}
                </button>
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
