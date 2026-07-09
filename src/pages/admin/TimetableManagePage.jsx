import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ArrowLeft,
  Save, X, Table2, FileText, Upload, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const emptyForm = () => ({
  session: '',
  semester: 1,
  className: '',
  roomNo: '',
  effectiveFrom: '',
  isPublished: true,
});

const toDateInput = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function TimetableManagePage() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);

  return view === 'list' ? (
    <ListView
      onCreate={() => {
        setEditing(null);
        setView('form');
      }}
      onEdit={(tt) => {
        setEditing(tt);
        setView('form');
      }}
    />
  ) : (
    <FormView
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <CalendarClock className="text-[var(--primary)]" size={30} /> Time Table Manager
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Upload a semester's timetable PDF — students see it instantly once published.
          </p>
        </div>
        <button onClick={onCreate} className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto">
          <Plus size={16} /> Upload Time Table
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
          <p className="text-[var(--text-primary)] font-bold">No timetables uploaded yet</p>
          <button onClick={onCreate} className="btn-premium flex items-center gap-2 text-xs mt-2">
            <Plus size={16} /> Upload your first timetable
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

              <a
                href={getImageUrl(tt.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:underline"
              >
                <FileText size={14} /> {tt.pdfFileName || 'View PDF'} <ExternalLink size={12} />
              </a>

              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[var(--border-light)]">
                <button
                  onClick={() => onEdit(tt)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-light)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                >
                  <Pencil size={13} /> Edit
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

/* ─────────────────────────────  FORM VIEW (create / edit)  ───────────────────────────── */

function FormView({ initial, onDone }) {
  const [form, setForm] = useState(() =>
    initial
      ? { ...emptyForm(), ...initial, effectiveFrom: toDateInput(initial.effectiveFrom) }
      : emptyForm()
  );
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.session.trim()) return toast.error('Session is required (e.g. JAN-JUNE, 2026)');
    if (!form.semester) return toast.error('Semester is required');
    if (!initial && !file) return toast.error('Please upload the timetable PDF');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('session', form.session.trim());
      fd.append('semester', form.semester);
      fd.append('className', form.className.trim());
      fd.append('roomNo', form.roomNo.trim());
      if (form.effectiveFrom) fd.append('effectiveFrom', form.effectiveFrom);
      fd.append('isPublished', form.isPublished);
      if (file) fd.append('pdf', file);

      const { data } = initial
        ? await api.put(`/timetables/${initial._id}`, fd)
        : await api.post('/timetables', fd);

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
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <header className="glass-card flex items-center justify-between gap-4 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <button onClick={onDone} className="w-9 h-9 rounded-xl border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl md:text-2xl font-display font-black text-[var(--text-primary)]">
            {initial ? 'Edit Time Table' : 'Upload Time Table'}
          </h1>
        </div>
        <button onClick={save} disabled={saving} className="btn-premium flex items-center gap-2 text-xs">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
        </button>
      </header>

      <div className="glass-card p-6 rounded-3xl grid md:grid-cols-2 gap-5">
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
          <label className={labelCls}>Class Name <span className="opacity-60 normal-case font-medium">(optional)</span></label>
          <input value={form.className} onChange={(e) => set({ className: e.target.value })} placeholder="IV-1" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Room No <span className="opacity-60 normal-case font-medium">(optional)</span></label>
          <input value={form.roomNo} onChange={(e) => set({ roomNo: e.target.value })} placeholder="102" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>W.e.f. (effective from) <span className="opacity-60 normal-case font-medium">(optional)</span></label>
          <input type="date" value={form.effectiveFrom} onChange={(e) => set({ effectiveFrom: e.target.value })} className={inputCls} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] cursor-pointer select-none pb-2.5">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
            Published (visible to students)
          </label>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>
            Timetable PDF {initial ? <span className="opacity-60 normal-case font-medium">(leave empty to keep the current file)</span> : null}
          </label>
          <label className="flex items-center gap-3 border border-dashed border-[var(--border-light)] rounded-xl px-4 py-3 cursor-pointer hover:border-[var(--primary)] transition-colors">
            <Upload size={16} className="text-[var(--primary)]" />
            <span className="text-sm text-[var(--text-secondary)] truncate">
              {file ? file.name : initial?.pdfFileName ? `Replace "${initial.pdfFileName}"` : 'Choose a PDF file to upload'}
            </span>
            <input type="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && (
              <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="ml-auto text-[var(--text-secondary)] hover:text-red-500 shrink-0">
                <X size={16} />
              </button>
            )}
          </label>
          {initial?.pdfUrl && !file && (
            <a href={getImageUrl(initial.pdfUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline mt-2">
              <FileText size={13} /> View current PDF <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
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
