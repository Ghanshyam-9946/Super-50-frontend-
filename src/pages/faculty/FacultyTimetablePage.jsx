import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, FileText, Download, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getFileUrl } from '../../utils/imageUrl';

// Read-only view of every published timetable, for any faculty member.
// Uploading and editing stays with the admin / Academic Coordinator
// (/admin/timetable).
export default function FacultyTimetablePage() {
  const [timetables, setTimetables] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/timetables');
        // Drafts are the admin's work in progress — show only what's published.
        const published = (data.data || []).filter((t) => t.isPublished);
        setTimetables(published);
        setSelectedId(published[0]?._id || '');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load timetables');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const semesters = useMemo(
    () => [...new Set(timetables.map((t) => t.semester))].sort((a, b) => a - b),
    [timetables]
  );
  const shown = semester ? timetables.filter((t) => String(t.semester) === String(semester)) : timetables;
  const selected = shown.find((t) => t._id === selectedId) || shown[0];
  const pdfUrl = selected ? getFileUrl(selected.pdfUrl, 'timetables') : '';

  const download = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selected.pdfFileName || 'Timetable.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error('Could not download the file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <CalendarClock className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Time Table</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Class timetables published by the department — view or download any semester's.
            </p>
          </div>
        </div>
        {selected && (
          <button onClick={download} disabled={downloading} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 disabled:opacity-50">
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Download
          </button>
        )}
      </header>

      {loading ? (
        <div className="glass-card p-16 flex items-center justify-center rounded-3xl">
          <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : timetables.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-2">
          <Info size={34} className="mx-auto text-[var(--text-secondary)] opacity-60" />
          <p className="font-bold text-[var(--text-primary)]">No timetable published yet</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Once the department publishes a timetable, it will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card p-5 rounded-2xl flex flex-wrap gap-4 items-end">
            <div className="min-w-[160px]">
              <label className="block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Semester</label>
              <select
                value={semester}
                onChange={(e) => { setSemester(e.target.value); setSelectedId(''); }}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                <option value="">All semesters</option>
                {semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="min-w-[220px] flex-1">
              <label className="block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Class</label>
              <select
                value={selected?._id || ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {shown.map((t) => (
                  <option key={t._id} value={t._id}>
                    Sem {t.semester}{t.className ? ` — ${t.className}` : ''}{t.session ? ` (${t.session})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {selected?.roomNo && (
              <div className="text-sm text-[var(--text-secondary)] pb-2">Room: <strong className="text-[var(--text-primary)]">{selected.roomNo}</strong></div>
            )}
          </div>

          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] px-1">
                <FileText size={14} /> {selected.pdfFileName || 'Timetable.pdf'}
                {selected.effectiveFrom && (
                  <span className="font-medium">· w.e.f. {new Date(selected.effectiveFrom).toLocaleDateString('en-IN')}</span>
                )}
              </div>
              <div className="glass-card p-2 md:p-3 rounded-3xl overflow-hidden">
                <iframe
                  key={pdfUrl}
                  src={pdfUrl}
                  title="Timetable"
                  className="w-full rounded-2xl border-0"
                  style={{ height: '80vh' }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
