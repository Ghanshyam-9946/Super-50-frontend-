import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardEdit, FileText, Info, Clock, AlertTriangle, BookMarked, BookOpen, CheckCircle2, Hourglass, FlaskConical } from 'lucide-react';
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

// What a card shows: marks given → submitted (green); no marks yet → marks
// pending, red once it has a due date.
const statusOf = (a) => {
  if (a.submitted) return 'submitted';
  const state = deadlineState(a.deadline);
  if (state === 'overdue') return 'overdue';
  if (state) return 'pending';
  return 'open';
};

const fmtMarks = (n) => Math.round(Number(n) * 100) / 100;

const TONE = {
  submitted: { bar: 'bg-emerald-500', ring: 'hover:border-emerald-500/50', glow: 'from-emerald-500/10' },
  pending: { bar: 'bg-rose-500', ring: 'hover:border-rose-500/50', glow: 'from-rose-500/10' },
  overdue: { bar: 'bg-red-600', ring: 'hover:border-red-600/60', glow: 'from-red-600/15' },
  open: { bar: 'bg-amber-400', ring: 'hover:border-amber-400/50', glow: 'from-amber-400/10' },
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [questionBanks, setQuestionBanks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/master-data/assignments/mine');
        if (data.success) {
          setAssignments(data.data);
          setQuestionBanks(data.questionBanks || []);
          setNotes(data.notes || []);
        }
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

      {/* Notes uploaded by the subject faculty, in unit order */}
      {!loading && notes.length > 0 && (
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[var(--primary)]" size={18} />
            <h2 className="font-display font-black text-[var(--text-primary)]">Notes</h2>
            <span className="text-xs text-[var(--text-secondary)]">study material from your subject faculty</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {notes.map((n) => (
              <a
                key={n._id}
                href={getImageUrl(n.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] px-3 py-2.5 hover:border-[var(--primary)] transition-colors"
              >
                <FileText className="text-[var(--primary)] shrink-0" size={18} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{n.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">
                    {n.subjectName}{n.subjectCode ? ` (${n.subjectCode})` : ''}{n.faculty ? ` · ${n.faculty.name}` : ''}
                  </div>
                </div>
                {n.unit > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 shrink-0">
                    Unit {n.unit}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && questionBanks.length > 0 && (
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <BookMarked className="text-[var(--primary)]" size={18} />
            <h2 className="font-display font-black text-[var(--text-primary)]">Question Banks</h2>
            <span className="text-xs text-[var(--text-secondary)]">from your subject faculty</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {questionBanks.map((q) => (
              <a
                key={q._id}
                href={getImageUrl(q.url)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] px-3 py-2.5 hover:border-[var(--primary)] transition-colors"
              >
                <FileText className="text-[var(--primary)] shrink-0" size={18} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[var(--text-primary)] truncate">{q.title}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] truncate">
                    {q.subjectName}{q.subjectCode ? ` (${q.subjectCode})` : ''}{q.faculty ? ` · ${q.faculty.name}` : ''}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

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
        <div className="space-y-4">
          {/* How things stand, at a glance */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/25">
              <CheckCircle2 size={13} /> {assignments.filter((a) => a.submitted).length} Submitted
            </span>
            <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/25">
              <Hourglass size={13} /> {assignments.filter((a) => !a.submitted).length} Marks pending
            </span>
            {assignments.some((a) => statusOf(a) === 'overdue') && (
              <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-red-600 text-white shadow-sm shadow-red-600/30">
                <AlertTriangle size={13} /> {assignments.filter((a) => statusOf(a) === 'overdue').length} past due date
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
          {/* Pending first (soonest due on top), submitted after */}
          {[...assignments.filter((a) => !a.submitted), ...assignments.filter((a) => a.submitted)].map((a, i) => {
            const status = statusOf(a);
            const tone = TONE[status];
            return (
              <motion.a
                key={a.activityId}
                href={getImageUrl(a.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.04 }}
                className={`relative overflow-hidden glass-card rounded-2xl border border-[var(--border-light)] ${tone.ring} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${tone.bar}`} aria-hidden="true" />
                <div className={`absolute inset-0 bg-gradient-to-br ${tone.glow} to-transparent pointer-events-none`} aria-hidden="true" />
                <div className="relative p-5 pl-6 flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)] truncate">
                        {a.subjectName}{a.subjectCode ? ` (${a.subjectCode})` : ''}
                      </div>
                      <div className="text-lg font-display font-black text-[var(--text-primary)] mt-0.5 flex items-center gap-2 flex-wrap">
                        {a.label}
                        {a.part === 'lab' && (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/25">
                            <FlaskConical size={10} /> Lab
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-auto flex-wrap">
                    {status === 'submitted' ? (
                      <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
                        <CheckCircle2 size={13} /> Submitted
                        {a.marks && a.marks.max > 0 && (
                          <span className="ml-1 pl-2 border-l border-white/40 tabular-nums">{fmtMarks(a.marks.obtained)}/{fmtMarks(a.marks.max)}</span>
                        )}
                      </span>
                    ) : status === 'open' ? (
                      <span className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/25">
                        <Hourglass size={13} /> Marks Pending
                      </span>
                    ) : (
                      <span className={`flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full ${
                        status === 'overdue'
                          ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                          : 'bg-rose-500/12 text-rose-600 border border-rose-500/30'
                      }`}>
                        {status === 'overdue' ? (
                          <span className="relative flex w-2 h-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                            <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                          </span>
                        ) : <Clock size={13} />}
                        Marks Pending · {status === 'overdue' ? 'was due' : 'due'} {formatDeadline(a.deadline)}
                      </span>
                    )}
                    <span className="text-[11px] text-[var(--text-secondary)] text-right">
                      {status === 'submitted' && a.deadline && <span className="block">Due {formatDeadline(a.deadline)}</span>}
                      {a.faculty?.name}
                    </span>
                  </div>
                </div>
              </motion.a>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
