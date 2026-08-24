import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Download, Info, Layers, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_STYLE = {
  teaching: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  off: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
  event: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400',
};

// Beautiful month-grid calendar for the parsed-Excel path (events[]), with
// a graceful fallback to the legacy inline PDF viewer for older
// PDF-only calendars (pre-Excel-upload). Shared by both the student route
// (/student/academic-calendar) and the faculty/admin view-only route
// (/faculty/academic-calendar) — App.jsx mounts the same component twice.
export default function StudentAcademicCalendarPage() {
  const { user } = useSelector((s) => s.auth);
  const [options, setOptions] = useState([]);
  const [calendar, setCalendar] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState(user?.semester || 1);
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const storageKey = 'mile_academic_calendar_choice';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
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
  }, []);

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

  const eventsByDate = useMemo(() => {
    if (!hasEvents) return {};
    const map = {};
    calendar.events
      .filter((e) => e.semester === Number(semester))
      .forEach((e) => {
        const key = new Date(e.date).toDateString();
        map[key] = e;
      });
    return map;
  }, [calendar, semester, hasEvents]);

  const grid = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, event: eventsByDate[date.toDateString()] || null });
    }
    return cells;
  }, [viewMonth, eventsByDate]);

  const changeMonth = (delta) => {
    setViewMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
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
          {options.length > 1 && (
            <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Layers size={16} className="text-[var(--primary)]" /> {message || 'Multiple calendars found — select one:'}
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
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
              <div className="glass-card p-4 md:p-6 rounded-3xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="w-9 h-9 rounded-xl border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-display font-black text-lg text-[var(--text-primary)] min-w-[160px] text-center">
                      {MONTH_LABELS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                    </span>
                    <button onClick={() => changeMonth(1)} className="w-9 h-9 rounded-xl border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                    Semester
                    <select
                      value={semester}
                      onChange={(e) => setSemester(Number(e.target.value))}
                      className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] normal-case font-bold"
                    >
                      {SEMESTERS.map((n) => <option key={n} value={n}>Semester {n}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {WEEKDAY_LABELS.map((w, i) => (
                    <div key={i} className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] py-1">{w}</div>
                  ))}
                  <AnimatePresence mode="wait">
                    {grid.map((cell, i) =>
                      cell ? (
                        <motion.div
                          key={cell.date.toISOString()}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.005, 0.15) }}
                          title={cell.event?.label || (cell.event?.status === 'teaching' ? `Teaching day ${cell.event.dayNumber}` : cell.event?.status === 'off' ? 'Off day' : '')}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-bold p-1 ${cell.event ? STATUS_STYLE[cell.event.status] : 'border-[var(--border-light)] text-[var(--text-secondary)]'}`}
                        >
                          <span>{cell.date.getDate()}</span>
                          {cell.event?.status === 'teaching' && <span className="text-[9px] font-medium opacity-80">Day {cell.event.dayNumber}</span>}
                          {cell.event?.status === 'event' && <span className="text-[8px] font-medium leading-tight truncate w-full px-0.5">{cell.event.label}</span>}
                        </motion.div>
                      ) : (
                        <div key={`blank-${i}`} />
                      )
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border-light)] text-[11px] font-bold text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/60" /> Teaching day</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400/60" /> Off / weekend</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500/60" /> Holiday / exam / event</span>
                </div>
              </div>
            </motion.div>
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
