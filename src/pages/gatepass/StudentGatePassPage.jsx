import { useEffect, useState } from 'react';
import { DoorOpen, Loader2, Send, Clock, History } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { PassRow, StatusBadge, fmt } from './gatePassShared';

// Round to the next 5 minutes so the default is a sensible "leaving soon".
const defaultExit = () => {
  const d = new Date(Date.now() + 20 * 60000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const OPEN = ['pending_tg', 'pending_admin', 'approved'];

// Counts down to the moment the QR stops working.
const Countdown = ({ until }) => {
  const [left, setLeft] = useState(new Date(until) - Date.now());
  useEffect(() => {
    const id = setInterval(() => setLeft(new Date(until) - Date.now()), 1000);
    return () => clearInterval(id);
  }, [until]);
  if (left <= 0) return <span className="text-red-600 font-bold">expired</span>;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return <span className="font-mono font-bold text-[var(--text-primary)]">{m}m {String(s).padStart(2, '0')}s</span>;
};

export default function StudentGatePassPage() {
  const [passes, setPasses] = useState([]);
  const [active, setActive] = useState(null);
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ reason: '', exitTime: defaultExit() });

  const load = async () => {
    try {
      const { data } = await api.get('/gate-pass/mine');
      setPasses(data.data || []);
      setActive(data.active || null);
      setQr(data.qr || '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load your gate passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // While a request is moving through TG/admin, poll so the QR appears
  // without the student having to refresh.
  const openPass = passes.find((p) => OPEN.includes(p.status));
  useEffect(() => {
    if (!openPass) return undefined;
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [openPass?._id, openPass?.status]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) return toast.error('Please write the reason');
    setSending(true);
    try {
      const { data } = await api.post('/gate-pass', { reason: form.reason.trim(), exitTime: new Date(form.exitTime) });
      toast.success(data.message);
      setForm({ reason: '', exitTime: defaultExit() });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <DoorOpen className="text-[var(--primary)]" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Gate Pass</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Ask your TG for permission to leave the campus. Once your TG and the admin approve, you get a QR code to show at the gate.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-10 rounded-3xl flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : (
        <>
          {/* The live pass — QR, or where the request has reached */}
          {openPass && (
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Current request</div>
                  <div className="font-bold text-[var(--text-primary)] mt-1">{openPass.reason}</div>
                  <div className="text-xs text-[var(--text-secondary)]">Exit at {fmt(openPass.exitTime)}</div>
                </div>
                <StatusBadge status={openPass.status} />
              </div>

              {active && qr ? (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <img src={qr} alt="Gate pass QR code" className="w-56 h-56 rounded-2xl bg-white p-3 shadow-lg" />
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    Show this to the security guard at the gate. Valid until <strong className="text-[var(--text-primary)]">{fmt(active.validUntil)}</strong>
                    {' '}— <Countdown until={active.validUntil} /> left.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] rounded-2xl p-4">
                  <Clock size={15} />
                  {openPass.status === 'pending_tg'
                    ? 'Your TG has the request. You will get a QR code once your TG and then the admin approve it.'
                    : 'Your TG approved it. Waiting for the admin — the QR code appears here as soon as they do.'}
                </div>
              )}

              {openPass.tgDecision?.remark && (
                <p className="text-xs text-[var(--text-secondary)]">TG remark: {openPass.tgDecision.remark}</p>
              )}
            </div>
          )}

          {/* New request */}
          {!openPass && (
            <form onSubmit={submit} className="glass-card p-6 rounded-3xl space-y-4">
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Request a gate pass</h2>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                Reason for gate pass
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  placeholder="e.g. Doctor's appointment at 2 PM"
                  className="mt-1.5 w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </label>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                Exit time
                <input
                  type="datetime-local"
                  value={form.exitTime}
                  onChange={(e) => setForm({ ...form, exitTime: e.target.value })}
                  className="mt-1.5 w-full md:w-72 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </label>
              <p className="text-xs text-[var(--text-secondary)]">
                The QR code stays valid until 20 minutes after this time.
              </p>
              <button type="submit" disabled={sending} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40">
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send
              </button>
            </form>
          )}

          {/* History — only ever this student's own */}
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">My history</h2>
            </div>
            {passes.filter((p) => p._id !== openPass?._id).length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No gate passes yet.</p>
            ) : (
              <div className="space-y-2">
                {passes.filter((p) => p._id !== openPass?._id).map((p) => (
                  <PassRow key={p._id} pass={p} showStudent={false} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
