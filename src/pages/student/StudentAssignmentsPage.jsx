import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardEdit, FileText, Info, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

const formatDeadline = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const deadlineState = (deadline) => {
  if (!deadline) return null;
  const diffMs = new Date(deadline).setHours(23, 59, 59, 999) - Date.now();
  if (diffMs < 0) return 'overdue';
  if (diffMs < 2 * 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/master-data/assignments/mine');
        if (data.success) setAssignments(data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <ClipboardEdit className="text-[var(--primary)]" size={30} /> Assignments
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Assignments posted by faculty for your subjects, with the deadline to submit by.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] font-medium text-sm">Loading…</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <Info size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No assignments posted yet</p>
          <p className="text-[var(--text-secondary)] text-sm max-w-md">
            Your subject faculty haven't attached any assignment PDFs yet — check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => {
            const state = deadlineState(a.deadline);
            return (
              <motion.a
                key={a.activityId}
                href={getImageUrl(a.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-card p-5 rounded-2xl flex flex-col gap-3 hover:border-[var(--primary)] border border-transparent transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                      {a.subjectName}{a.subjectCode ? ` (${a.subjectCode})` : ''}
                    </div>
                    <div className="text-lg font-display font-black text-[var(--text-primary)] mt-0.5">{a.label}</div>
                  </div>
                  <FileText className="text-[var(--primary)] flex-shrink-0" size={22} />
                </div>
                <div className="flex items-center justify-between mt-auto">
                  {a.deadline ? (
                    <span
                      className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        state === 'overdue'
                          ? 'bg-red-500/15 text-red-500'
                          : state === 'soon'
                          ? 'bg-amber-500/15 text-amber-500'
                          : 'bg-emerald-500/15 text-emerald-500'
                      }`}
                    >
                      {state === 'overdue' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                      {state === 'overdue' ? 'Overdue — ' : 'Due '}{formatDeadline(a.deadline)}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">No deadline set</span>
                  )}
                  {a.faculty && <span className="text-[11px] text-[var(--text-secondary)]">{a.faculty.name}</span>}
                </div>
              </motion.a>
            );
          })}
        </div>
      )}
    </div>
  );
}
