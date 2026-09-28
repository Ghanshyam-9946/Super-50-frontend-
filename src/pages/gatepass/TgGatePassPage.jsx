import { useEffect, useState } from 'react';
import { DoorOpen, Loader2, Inbox, History, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { PassRow, ReviewDialog, fmt, studentLine, semLine } from './gatePassShared';

// The TG's queue: gate pass requests from the students in their tutor group.
// Approving sends the request on to the admin; rejecting closes it.
export default function TgGatePassPage() {
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get('/gate-pass/tg');
      setPending(data.data?.pending || []);
      setHistory(data.data?.history || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load gate pass requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const review = async (decision, remark) => {
    try {
      const { data } = await api.patch(`/gate-pass/${reviewing._id}/tg-review`, { decision, remark });
      toast.success(data.message);
      load(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save the decision');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <DoorOpen className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Gate Pass (TG)</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Requests from your tutor group. What you approve goes to the admin for final approval.
            </p>
          </div>
        </div>
        <button onClick={() => load(true)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </header>

      {loading ? (
        <div className="glass-card p-10 rounded-3xl flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : (
        <>
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <Inbox size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Waiting for you ({pending.length})</h2>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nothing to review right now.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((p) => (
                  <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[var(--text-primary)]">{studentLine(p.student)}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{semLine(p.student)}</div>
                      <div className="text-sm text-[var(--text-primary)] mt-1">{p.reason}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">Wants to leave at {fmt(p.exitTime)} · asked {fmt(p.createdAt)}</div>
                    </div>
                    <button onClick={() => setReviewing(p)} className="btn-premium text-xs px-4 py-2">Review</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Already reviewed</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No past requests.</p>
            ) : (
              <div className="space-y-2">{history.map((p) => <PassRow key={p._id} pass={p} />)}</div>
            )}
          </div>
        </>
      )}

      {reviewing && <ReviewDialog pass={reviewing} onClose={() => setReviewing(null)} onSubmit={review} />}
    </div>
  );
}
