import { useEffect, useState } from 'react';
import {
  DoorOpen, Loader2, Inbox, History, Download, Shield, UserPlus, Trash2, Search, RefreshCw, Power,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { PassRow, ReviewDialog, fmt, studentLine, semLine } from './gatePassShared';

const TABS = [
  { key: 'pending', label: 'Approvals', icon: Inbox },
  { key: 'history', label: 'History & Report', icon: History },
  { key: 'security', label: 'Security Accounts', icon: Shield },
];

const STATUS_OPTIONS = [
  ['all', 'All statuses'], ['pending_tg', 'Waiting for TG'], ['pending_admin', 'Waiting for admin'],
  ['approved', 'Approved'], ['used', 'Exited'], ['rejected', 'Rejected'], ['expired', 'Expired'],
];

const emptyGuard = { name: '', mobile: '', username: '', password: '', photo: null };

export default function AdminGatePassPage() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  // Students and faculty both apply here, so the lists are kept apart.
  const [kind, setKind] = useState('all');
  const [filters, setFilters] = useState({ status: 'all', from: '', to: '', q: '' });
  const [guard, setGuard] = useState(emptyGuard);
  const [savingGuard, setSavingGuard] = useState(false);

  const loadPending = async () => {
    const { data } = await api.get('/gate-pass/admin/pending');
    setPending(data.data || []);
  };

  const loadHistory = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v); });
    if (kind !== 'all') params.set('kind', kind);
    const { data } = await api.get(`/gate-pass/admin/history?${params.toString()}`);
    setHistory(data.data || []);
  };

  // The pending list is short and already loaded, so it narrows here
  // rather than with another request.
  const shownPending = pending.filter((p) =>
    kind === 'all' || (kind === 'faculty' ? p.kind === 'faculty' : p.kind !== 'faculty'));

  const loadGuards = async () => {
    const { data } = await api.get('/gate-pass/admin/security');
    setGuards(data.data || []);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadPending(), loadHistory(), loadGuards()]);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load gate pass data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const review = async (decision, remark) => {
    try {
      const { data } = await api.patch(`/gate-pass/${reviewing._id}/admin-review`, { decision, remark });
      toast.success(data.message);
      await Promise.all([loadPending(), loadHistory()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save the decision');
    }
  };

  const downloadReport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v); });
      const res = await api.get(`/gate-pass/admin/report?${params.toString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `gate-pass-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error('Could not download the report');
    }
  };

  const createGuard = async (e) => {
    e.preventDefault();
    setSavingGuard(true);
    try {
      const fd = new FormData();
      Object.entries(guard).forEach(([k, v]) => { if (v) fd.append(k === 'photo' ? 'photo' : k, v); });
      const { data } = await api.post('/gate-pass/admin/security', fd);
      toast.success(data.message);
      setGuard(emptyGuard);
      loadGuards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create the account');
    } finally {
      setSavingGuard(false);
    }
  };

  const toggleGuard = async (g) => {
    try {
      await api.patch(`/gate-pass/admin/security/${g._id}`, { isActive: !g.isActive });
      loadGuards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update the account');
    }
  };

  const resetGuardPassword = async (g) => {
    const password = window.prompt(`New password for ${g.name} (at least 6 characters)`);
    if (!password) return;
    try {
      const { data } = await api.patch(`/gate-pass/admin/security/${g._id}`, { password });
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change the password');
    }
  };

  const removeGuard = async (g) => {
    if (!window.confirm(`Remove the security account "${g.name}"? They will not be able to log in again.`)) return;
    try {
      const { data } = await api.delete(`/gate-pass/admin/security/${g._id}`);
      toast.success(data.message);
      loadGuards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove the account');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <DoorOpen className="text-[var(--primary)]" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Gate Pass</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Final approval on requests the TGs cleared, the full history, and the gate's security accounts.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border transition-colors ${
              tab === key
                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon size={15} /> {label}
            {key === 'pending' && pending.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {(tab === 'pending' || tab === 'history') && (
        <div className="flex flex-wrap gap-1.5">
          {[['all', 'Everyone'], ['student', 'Students'], ['faculty', 'Faculty']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setKind(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                kind === key
                  ? 'bg-[var(--primary)]/15 text-[var(--primary)] border-[var(--primary)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)]'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  {pending.filter((p) => (key === 'faculty' ? p.kind === 'faculty' : p.kind !== 'faculty')).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="glass-card p-10 rounded-3xl flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : tab === 'pending' ? (
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-black text-lg text-[var(--text-primary)]">
              Waiting for you ({shownPending.length})
            </h2>
            <button onClick={loadPending} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><RefreshCw size={13} /> Refresh</button>
          </div>
          {shownPending.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Nothing waiting for approval.</p>
          ) : (
            <div className="space-y-2">
              {shownPending.map((p) => (
                <div key={p._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[var(--text-primary)] flex flex-wrap items-center gap-2">
                      {studentLine(p.student)}
                      {p.kind === 'faculty' && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                          faculty
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {p.kind === 'faculty' ? (p.student?.designation || p.student?.email || '') : semLine(p.student)}
                    </div>
                    <div className="text-sm text-[var(--text-primary)] mt-1">{p.reason}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Exit at {fmt(p.exitTime)}
                      {p.kind === 'faculty'
                        ? ` · ${p.informHod ? 'HOD informed' : 'HOD not informed'}`
                        : ` · TG ${p.tgDecision?.by?.name || '—'} approved ${fmt(p.tgDecision?.at)}${p.tgDecision?.remark ? ` — "${p.tgDecision.remark}"` : ''}`}
                    </div>
                  </div>
                  <button onClick={() => setReviewing(p)} className="btn-premium text-xs px-4 py-2">Review</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === 'history' ? (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
              Status
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)]"
              >
                {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
              From
              <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)]" />
            </label>
            <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5">
              To
              <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)]" />
            </label>
            <label className="flex flex-col text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] gap-1.5 flex-1 min-w-[180px]">
              Search
              <input value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Name, enrollment or reason"
                className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)]" />
            </label>
            <button onClick={loadHistory} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5"><Search size={13} /> Apply</button>
            <button onClick={downloadReport} className="btn-outline-premium text-xs px-4 py-2.5 flex items-center gap-1.5"><Download size={13} /> Download report</button>
          </div>

          <p className="text-xs text-[var(--text-secondary)]">{history.length} gate pass{history.length === 1 ? '' : 'es'}</p>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Nothing matches these filters.</p>
          ) : (
            <div className="space-y-2">{history.map((p) => <PassRow key={p._id} pass={p} />)}</div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={createGuard} className="glass-card p-6 rounded-3xl space-y-3 h-fit">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">New security account</h2>
            </div>
            {[
              ['name', 'Name', 'text'],
              ['mobile', 'Mobile', 'tel'],
              ['username', 'Username', 'text'],
              ['password', 'Password', 'text'],
            ].map(([key, label, type]) => (
              <label key={key} className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                {label}
                <input
                  type={type}
                  value={guard[key]}
                  onChange={(e) => setGuard({ ...guard, [key]: e.target.value })}
                  required
                  className="mt-1.5 w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
                />
              </label>
            ))}
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
              Photo (optional)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setGuard({ ...guard, photo: e.target.files?.[0] || null })}
                className="mt-1.5 w-full text-xs font-normal normal-case tracking-normal text-[var(--text-secondary)]"
              />
            </label>
            <p className="text-xs text-[var(--text-secondary)]">
              The guard signs in on the normal login page with this username instead of an email.
            </p>
            <button type="submit" disabled={savingGuard} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-40">
              {savingGuard ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Create account
            </button>
          </form>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Security guards ({guards.length})</h2>
            {guards.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No security accounts yet.</p>
            ) : (
              <div className="space-y-2">
                {guards.map((g) => (
                  <div key={g._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                    <div className="flex items-center gap-3 min-w-0">
                      {g.profileImage ? (
                        <img src={getImageUrl(g.profileImage)} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center"><Shield size={16} className="text-[var(--primary)]" /></div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--text-primary)] truncate">{g.name}</div>
                        <div className="text-xs text-[var(--text-secondary)]">@{g.username} · {g.mobile}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${
                        g.isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'
                      }`}>{g.isActive ? 'Active' : 'Disabled'}</span>
                      <button onClick={() => toggleGuard(g)} title={g.isActive ? 'Disable login' : 'Enable login'}
                        className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"><Power size={15} /></button>
                      <button onClick={() => resetGuardPassword(g)} className="text-xs font-bold text-[var(--primary)] px-2">Reset password</button>
                      <button onClick={() => removeGuard(g)} title="Remove account"
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {reviewing && <ReviewDialog pass={reviewing} onClose={() => setReviewing(null)} onSubmit={review} />}
    </div>
  );
}
