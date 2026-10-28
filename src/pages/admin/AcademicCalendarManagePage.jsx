import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ArrowLeft,
  Save, X, Table2, FileText, FileSpreadsheet, Upload, Download, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { calendarFile, downloadCalendarFile } from '../../utils/academicCalendarFile';
import AcademicCalendarViewer from '../../components/AcademicCalendarViewer';

const emptyForm = () => ({
  session: '',
  campus: '',
  isPublished: true,
});

export default function AcademicCalendarManagePage() {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editing, setEditing] = useState(null);

  return view === 'list' ? (
    <ListView
      onCreate={() => {
        setEditing(null);
        setView('form');
      }}
      onEdit={(cal) => {
        setEditing(cal);
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
  const [previewId, setPreviewId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/academic-calendars');
      if (data.success) setItems(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load academic calendars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const togglePublish = async (id) => {
    try {
      const { data } = await api.patch(`/academic-calendars/${id}/publish`);
      if (data.success) {
        toast.success(data.message);
        setItems((prev) => prev.map((c) => (c._id === id ? data.data : c)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this academic calendar? This cannot be undone.')) return;
    try {
      const { data } = await api.delete(`/academic-calendars/${id}`);
      if (data.success) {
        toast.success('Academic calendar deleted');
        setItems((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const downloadFile = async (cal) => {
    try {
      await downloadCalendarFile(cal);
    } catch (err) {
      toast.error(err.message || 'Failed to download academic calendar');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <CalendarDays className="text-[var(--primary)]" size={30} /> Academic Calendar Manager
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Upload the academic calendar as an Excel file or PDF — everyone sees it exactly as uploaded once published.
          </p>
        </div>
        <button onClick={onCreate} className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto">
          <Plus size={16} /> Upload Academic Calendar
        </button>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">Loading academic calendars…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Table2 size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No academic calendars uploaded yet</p>
          <button onClick={onCreate} className="btn-premium flex items-center gap-2 text-xs mt-2">
            <Plus size={16} /> Upload your first academic calendar
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((cal, i) => (
            <motion.div
              key={cal._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-card p-5 rounded-2xl flex flex-col gap-3 ${previewId === cal._id ? 'md:col-span-2 xl:col-span-3' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-[var(--text-primary)] truncate">
                    {cal.session}{cal.campus ? ` — ${cal.campus}` : ''}
                  </h3>
                </div>
                <span className={`badge shrink-0 ${cal.isPublished ? 'badge-approved' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                  {cal.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              {(() => {
                const file = calendarFile(cal);
                if (!file) {
                  return <p className="text-xs font-bold text-amber-600">No file on record — edit and re-upload the calendar.</p>;
                }
                const Icon = file.type === 'pdf' ? FileText : FileSpreadsheet;
                return (
                  <button
                    onClick={() => setPreviewId((p) => (p === cal._id ? null : cal._id))}
                    className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] min-w-0"
                    title={previewId === cal._id ? 'Hide preview' : 'Preview'}
                  >
                    <Icon size={14} className="shrink-0" /> <span className="truncate flex-1 text-left">{file.name}</span>
                    {previewId === cal._id ? <ChevronUp size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
                  </button>
                );
              })()}

              {previewId === cal._id && <AcademicCalendarViewer calendar={cal} height="70vh" />}

              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[var(--border-light)]">
                <button
                  onClick={() => onEdit(cal)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-light)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                >
                  <Pencil size={13} /> Edit
                </button>
                {calendarFile(cal) && (
                  <button
                    onClick={() => downloadFile(cal)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-light)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                    title="Download original file"
                  >
                    <Download size={13} />
                  </button>
                )}
                <button
                  onClick={() => togglePublish(cal._id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10 text-xs font-bold transition-all"
                  title={cal.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {cal.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => remove(cal._id)}
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
  const [form, setForm] = useState(() => (initial ? { ...emptyForm(), ...initial } : emptyForm()));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const currentFile = calendarFile(initial);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.session.trim()) return toast.error('Session is required (e.g. JAN-JUNE, 2026)');
    if (!initial && !file) return toast.error('Please upload the academic calendar (Excel or PDF)');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('session', form.session.trim());
      fd.append('campus', form.campus.trim());
      fd.append('isPublished', form.isPublished);
      // Stored exactly as uploaded; no file = keep the current one.
      if (file) fd.append('file', file);

      const { data } = initial
        ? await api.put(`/academic-calendars/${initial._id}`, fd)
        : await api.post('/academic-calendars', fd);

      if (data.success) {
        toast.success(data.message || 'Saved');
        onDone();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save academic calendar');
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
            {initial ? 'Edit Academic Calendar' : 'Upload Academic Calendar'}
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
          <label className={labelCls}>Campus <span className="opacity-60 normal-case font-medium">(optional)</span></label>
          <input value={form.campus} onChange={(e) => set({ campus: e.target.value })} placeholder="GN" className={inputCls} />
        </div>
        <div className="flex items-end md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] cursor-pointer select-none pb-2.5">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} className="w-4 h-4 accent-[var(--primary)]" />
            Published (visible to everyone)
          </label>
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>
            Academic Calendar File {initial ? <span className="opacity-60 normal-case font-medium">(leave empty to keep the current file)</span> : null}
          </label>
          <p className="text-xs text-[var(--text-secondary)] mb-2">
            Upload the college's calendar Excel workbook (all sheets, colours and merged cells are shown exactly as in the file) or a PDF. Nothing is converted.
          </p>
          <label className="flex items-center gap-3 border border-dashed border-[var(--border-light)] rounded-xl px-4 py-3 cursor-pointer hover:border-[var(--primary)] transition-colors">
            <Upload size={16} className="text-[var(--primary)]" />
            <span className="text-sm text-[var(--text-secondary)] truncate">
              {file ? file.name : currentFile ? `Replace "${currentFile.name}"` : 'Choose an Excel (.xlsx/.xls) or PDF file'}
            </span>
            <input type="file" className="hidden" accept=".xlsx,.xls,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file && (
              <button onClick={(e) => { e.preventDefault(); setFile(null); }} className="ml-auto text-[var(--text-secondary)] hover:text-red-500 shrink-0">
                <X size={16} />
              </button>
            )}
          </label>
        </div>

        {initial && !file && currentFile && (
          <div className="md:col-span-2 space-y-2">
            <span className={labelCls}>Current file</span>
            <AcademicCalendarViewer calendar={initial} height="50vh" />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onDone} className="px-5 py-2.5 rounded-xl border border-[var(--border-light)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
          Cancel
        </button>
        <button onClick={save} disabled={saving} className="btn-premium flex items-center gap-2 text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Academic Calendar
        </button>
      </div>
    </div>
  );
}
