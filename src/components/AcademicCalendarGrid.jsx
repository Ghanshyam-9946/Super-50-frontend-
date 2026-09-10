import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Building a lookup key from plain (year, month, day) integers — instead of
// round-tripping through a Date object's .toDateString() — keeps event
// matching correct regardless of the viewer's browser timezone. A calendar
// event date coming from the backend is UTC-anchored (see
// parseAcademicCalendarExcel.js), so it's read with getUTC*(); a grid
// cell's date is built locally from (year, month, day) we already know, so
// those integers are used directly with no Date round-trip at all.
const dateKey = (y, m, d) => `${y}-${m}-${d}`;
const utcDateKey = (date) => dateKey(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_STYLE = {
  teaching: 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-500/25 dark:border-emerald-400/50 dark:text-emerald-300',
  off: 'bg-slate-100 border-slate-300 text-slate-500 dark:bg-slate-500/20 dark:border-slate-400/40 dark:text-slate-400',
  event: 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-500/25 dark:border-amber-400/50 dark:text-amber-300',
};

// The parsed-Excel calendar's actual visual — a Semester picker plus every
// month that semester has data for, stacked and shown all at once (no
// prev/next paging, so there's no way to land on an empty month and think
// the calendar is broken). Shared between the full-page viewer
// (StudentAcademicCalendarPage.jsx, used by student/faculty/admin routes)
// and inline previews (AcademicCalendarManagePage.jsx's expandable card)
// so both stay visually identical with one implementation.
export default function AcademicCalendarGrid({ calendar, defaultSemester, canSetReminders = false }) {
  const [semester, setSemester] = useState(defaultSemester || 1);
  const [reminderDates, setReminderDates] = useState(new Set());
  const [reminderModalDate, setReminderModalDate] = useState(null);
  const [reminderForm, setReminderForm] = useState({ time: '', title: '', note: '' });
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (!canSetReminders) return;
    api
      .get('/calendar-reminders')
      .then(({ data }) => {
        if (data.success) {
          setReminderDates(new Set(data.data.map((r) => new Date(r.date).toDateString())));
        }
      })
      .catch(() => {});
  }, [canSetReminders]);

  const openReminderModal = (date) => {
    setReminderModalDate(date);
    setReminderForm({ time: '', title: '', note: '' });
  };

  const saveReminder = async () => {
    if (!reminderForm.time || !reminderForm.title.trim()) {
      return toast.error('Time and title are required');
    }
    setSavingReminder(true);
    try {
      const { data } = await api.post('/calendar-reminders', {
        calendarId: calendar._id,
        date: reminderModalDate,
        time: reminderForm.time,
        title: reminderForm.title.trim(),
        note: reminderForm.note.trim(),
      });
      if (data.success) {
        toast.success('Reminder set');
        setReminderDates((prev) => new Set(prev).add(new Date(reminderModalDate).toDateString()));
        setReminderModalDate(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set reminder');
    } finally {
      setSavingReminder(false);
    }
  };

  const semesterEvents = useMemo(() => {
    return (calendar.events || []).filter((e) => e.semester === Number(semester));
  }, [calendar, semester]);

  const eventsByDate = useMemo(() => {
    const map = {};
    semesterEvents.forEach((e) => { map[utcDateKey(new Date(e.date))] = e; });
    return map;
  }, [semesterEvents]);

  const monthsToShow = useMemo(() => {
    const seen = new Set();
    const months = [];
    semesterEvents.forEach((e) => {
      const d = new Date(e.date);
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const key = `${year}-${month}`;
      if (!seen.has(key)) {
        seen.add(key);
        months.push({ year, month });
      }
    });
    months.sort((a, b) => (a.year - b.year) || (a.month - b.month));
    return months;
  }, [semesterEvents]);

  const buildGrid = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, event: eventsByDate[dateKey(year, month, d)] || null });
    }
    return cells;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-display font-black text-lg text-[var(--text-primary)]">
          {calendar.session}{calendar.campus ? ` — ${calendar.campus}` : ''}
        </span>
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

      {monthsToShow.length === 0 ? (
        <p className="text-base text-[var(--text-secondary)] text-center py-6">No calendar entries for Semester {semester} in this session.</p>
      ) : (
        monthsToShow.map(({ year, month }) => (
          <div key={`${year}-${month}`} className="space-y-2">
            <div className="font-display font-bold text-base text-[var(--text-primary)]">{MONTH_LABELS[month]} {year}</div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEKDAY_LABELS.map((w, i) => (
                <div key={i} className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] py-1">{w}</div>
              ))}
              {buildGrid(year, month).map((cell, i) =>
                cell ? (
                  <div
                    key={cell.date.toISOString()}
                    title={cell.event?.label || (cell.event?.status === 'teaching' ? `Teaching day ${cell.event.dayNumber}` : cell.event?.status === 'off' ? 'Off day' : '')}
                    className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center text-base font-bold p-1 ${cell.event ? STATUS_STYLE[cell.event.status] : 'border-[var(--border-light)] text-[var(--text-secondary)]'}`}
                  >
                    {canSetReminders && (
                      <button
                        onClick={() => openReminderModal(cell.date)}
                        title="Set a reminder for this date"
                        className={`absolute top-0.5 right-0.5 p-0.5 rounded-full ${reminderDates.has(cell.date.toDateString()) ? 'text-[var(--primary)]' : 'text-current opacity-30 hover:opacity-80'}`}
                      >
                        <Bell size={11} fill={reminderDates.has(cell.date.toDateString()) ? 'currentColor' : 'none'} />
                      </button>
                    )}
                    <span>{cell.date.getDate()}</span>
                    {cell.event?.status === 'teaching' && <span className="text-xs font-medium opacity-80">Day {cell.event.dayNumber}</span>}
                    {cell.event?.status === 'event' && <span className="text-[11px] font-medium leading-tight truncate w-full px-0.5">{cell.event.label}</span>}
                  </div>
                ) : (
                  <div key={`blank-${year}-${month}-${i}`} />
                )
              )}
            </div>
          </div>
        ))
      )}

      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--border-light)] text-sm font-bold text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Teaching day</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400" /> Off / weekend</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Holiday / exam / event</span>
      </div>

      {reminderModalDate && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setReminderModalDate(null)}>
          <div className="glass-card w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                <Bell size={14} className="text-[var(--primary)]" /> Set Reminder — {new Date(reminderModalDate).toLocaleDateString()}
              </h3>
              <button onClick={() => setReminderModalDate(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Time
              <input
                type="time"
                value={reminderForm.time}
                onChange={(e) => setReminderForm((f) => ({ ...f, time: e.target.value }))}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Title
              <input
                value={reminderForm.title}
                onChange={(e) => setReminderForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Prepare for exam"
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
              Note <span className="normal-case font-medium opacity-70">(optional)</span>
              <textarea
                value={reminderForm.note}
                onChange={(e) => setReminderForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <button
              onClick={saveReminder}
              disabled={savingReminder}
              className="btn-premium w-full text-sm px-4 py-2 flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {savingReminder ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />} Set Reminder
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
