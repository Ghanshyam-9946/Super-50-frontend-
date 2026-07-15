import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { CalendarClock, Download, Info, Users2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

export default function StudentTimetablePage() {
  const { user } = useSelector((s) => s.auth);
  const [options, setOptions] = useState([]); // every published timetable matching the student's semester
  const [timetable, setTimetable] = useState(null); // the one currently displayed
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const storageKey = user?.semester ? `mile_timetable_section_sem${user.semester}` : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/timetables/my');
        if (data.success) {
          const opts = data.options || (data.data ? [data.data] : []);
          setOptions(opts);
          setMessage(data.message || '');

          // If the student previously picked a section for this semester, honour it
          const rememberedId = storageKey ? localStorage.getItem(storageKey) : null;
          const remembered = rememberedId ? opts.find((o) => o._id === rememberedId) : null;
          setTimetable(remembered || data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSection = (id) => {
    const chosen = options.find((o) => o._id === id);
    if (!chosen) return;
    setTimetable(chosen);
    if (storageKey) localStorage.setItem(storageKey, id);
  };

  const pdfUrl = timetable ? getImageUrl(timetable.pdfUrl) : '';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <CalendarClock className="text-[var(--primary)]" size={30} /> My Time Table
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            {user?.semester ? `Semester ${user.semester}` : 'Class schedule'} — updated by the department.
          </p>
        </div>
        {timetable && (
          <a
            href={pdfUrl}
            download={timetable.pdfFileName || 'Timetable.pdf'}
            className="btn-premium flex items-center gap-2 text-xs self-start md:self-auto"
          >
            <Download size={16} /> Download PDF
          </a>
        )}
      </header>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">Loading your timetable…</p>
        </div>
      ) : !timetable ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Info size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No timetable available yet</p>
          <p className="text-[var(--text-secondary)] text-sm max-w-md">
            {message || 'Your timetable has not been published yet. Please check back later or contact your department.'}
          </p>
        </div>
      ) : (
        <>
          {options.length > 1 && (
            <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Users2 size={16} className="text-[var(--primary)]" /> {message || 'Multiple sections found — select yours:'}
              </div>
              <select
                value={timetable._id}
                onChange={(e) => selectSection(e.target.value)}
                className="sm:ml-auto bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] min-w-[200px]"
              >
                {options.map((o) => (
                  <option key={o._id} value={o._id}>
                    Sem {o.semester} — {o.className || `Section ${o._id.slice(-4)}`}{o.session ? ` (${o.session})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] px-1">
              <FileText size={14} /> {timetable.pdfFileName || 'Timetable.pdf'}
            </div>
            <div className="glass-card p-2 md:p-3 rounded-3xl overflow-hidden">
              <iframe
                src={pdfUrl}
                title="Timetable"
                className="w-full rounded-2xl border-0"
                style={{ height: '80vh' }}
              />
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
