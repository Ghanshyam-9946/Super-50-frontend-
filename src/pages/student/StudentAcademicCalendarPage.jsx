import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { CalendarDays, Download, Info, Layers, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import AcademicCalendarGrid from '../../components/AcademicCalendarGrid';

// Beautiful full-calendar view for the parsed-Excel path (events[]), with a
// graceful fallback to the legacy inline PDF viewer for older PDF-only
// calendars (pre-Excel-upload). Shared by three routes — the student route
// (/student/academic-calendar), the faculty/admin view-only route
// (/faculty/academic-calendar), and an optional admin deep-link to one
// specific calendar (/academic-calendar/view/:id) — App.jsx mounts the same
// component for all three; the `:id` param, when present, skips the "most
// recent published" default and the session picker entirely.
export default function StudentAcademicCalendarPage() {
  const { user } = useSelector((s) => s.auth);
  const { id: pinnedId } = useParams();
  const FACULTY_ROLES = ['teacher', 'admin', 'super50_admin', 'tp_admin', 'guide', 'pms_admin'];
  const isFacultyRole = (user?.roles?.length ? user.roles : [user?.role]).some((r) => FACULTY_ROLES.includes(r));
  const [options, setOptions] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const storageKey = 'mile_academic_calendar_choice';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (pinnedId) {
          const { data } = await api.get(`/academic-calendars/${pinnedId}`);
          if (data.success) {
            setOptions([]);
            setCalendar(data.data);
          }
          return;
        }
        const { data } = await api.get('/academic-calendars/my');
        if (data.success) {
          const opts = data.options || (data.data ? [data.data] : []);
          setOptions(opts);
          setMessage(data.message || '');

          const rememberedId = localStorage.getItem(storageKey);
          const remembered = rememberedId ? opts.find((o) => o._id === rememberedId) : null;
          setCalendar(remembered || data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load academic calendar');
      } finally {
        setLoading(false);
      }
    })();
  }, [pinnedId]);

  const selectOption = (id) => {
    const chosen = options.find((o) => o._id === id);
    if (!chosen) return;
    setCalendar(chosen);
    localStorage.setItem(storageKey, id);
  };

  const pdfUrl = calendar ? getImageUrl(calendar.pdfUrl) : '';
  const hasEvents = calendar?.events?.length > 0;

  // A plain `<a download>` is silently ignored by browsers when the href is
  // cross-origin — fetch the blob ourselves and save it via a same-origin
  // object URL instead (same fix as StudentTimetablePage.jsx).
  const downloadPdf = async () => {
    try {
      const res = await fetch(pdfUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = calendar.pdfFileName || "Academic-Calendar.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Failed to download academic calendar");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <CalendarDays className="text-[var(--primary)]" size={30} /> Academic Calendar
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">Institution-wide academic calendar, published by the admin.</p>
        </div>
        {calendar?.pdfUrl && (
          <button
            onClick={downloadPdf}
            className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto"
          >
            <Download size={16} /> Download PDF
          </button>
        )}
      </header>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">Loading academic calendar…</p>
        </div>
      ) : !calendar ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Info size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No academic calendar available yet</p>
          <p className="text-[var(--text-secondary)] text-sm max-w-md">
            {message || 'The academic calendar has not been published yet. Please check back later.'}
          </p>
        </div>
      ) : (
        <>
          {!pinnedId && options.length > 0 && (
            <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Layers size={16} className="text-[var(--primary)]" /> {message || 'Session'}
              </div>
              <select
                value={calendar._id}
                onChange={(e) => selectOption(e.target.value)}
                className="sm:ml-auto bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] min-w-[200px]"
              >
                {options.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.session}{o.campus ? ` — ${o.campus}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasEvents ? (
            <div className="glass-card p-4 md:p-6 rounded-3xl">
              <AcademicCalendarGrid calendar={calendar} defaultSemester={user?.semester} canSetReminders={isFacultyRole} />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] px-1">
                <FileText size={14} /> {calendar.pdfFileName || 'Academic-Calendar.pdf'}
              </div>
              <div className="glass-card p-2 md:p-3 rounded-3xl overflow-hidden">
                <iframe
                  src={pdfUrl}
                  title="Academic Calendar"
                  className="w-full rounded-2xl border-0"
                  style={{ height: '80vh' }}
                />
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
