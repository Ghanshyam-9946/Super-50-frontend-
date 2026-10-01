import { useEffect, useMemo, useState, useCallback } from 'react';
import { MessageSquareShare, Loader2, Search, Send, AlertTriangle, CheckCircle2, XCircle, MinusCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Admin-only: send the Gupshup WhatsApp templates to parents. Nothing is
// sent automatically — load the students for one alert, review, then send.

const TABS = [
  { key: 'podai', label: 'POD AI Score' },
  { key: 'attendance', label: 'Low Attendance' },
  { key: 'mst', label: 'MST Result' },
  { key: 'driveResult', label: 'Drive Not Cleared' },
  { key: 'driveRegistration', label: 'Drive Not Registered' },
];

const MST_TOTAL = '__total__';

const inputCls = 'w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] transition-all';
const labelCls = 'block text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');

const Field = ({ label, children }) => (
  <div className="min-w-[160px] flex-1">
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

export default function ParentAlertsPage() {
  const [options, setOptions] = useState(null);
  const [tab, setTab] = useState('podai');
  const [filters, setFilters] = useState({});
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [allowResend, setAllowResend] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);

  const loadLogs = useCallback(async () => {
    try {
      const { data } = await api.get('/parent-alerts/logs');
      setLogs(data.data || []);
    } catch {
      /* history is secondary — the page still works without it */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/parent-alerts/options');
        setOptions(data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load alert options');
      }
    })();
    loadLogs();
  }, [loadLogs]);

  const switchTab = (key) => {
    setTab(key);
    setFilters({});
    setResult(null);
    setSelected(new Set());
    setSummary(null);
    setAllowResend(false);
  };

  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setResult(null);
    setSummary(null);
  };

  // A row can be sent only with a valid number, and (unless re-sending)
  // only if it hasn't already had this same alert.
  const sendable = useCallback((r, resend) => !!r.phone && (resend || !r.alreadySentAt), []);

  const buildParams = () => {
    const f = filters;
    switch (tab) {
      case 'podai': {
        const t = options?.podaiTests?.[f.test];
        return t && { testName: t.testName, testDate: t.testDate, below: f.below ?? '' };
      }
      case 'attendance':
        return f.threshold ? { threshold: f.threshold, batch: f.batch || '', semester: f.semester || '', section: f.section || '' } : null;
      case 'mst': {
        const t = options?.mstTests?.[f.test];
        return t && { testName: t.testName, semester: t.semester, column: f.column || MST_TOTAL, below: f.below ?? '' };
      }
      default:
        return f.driveId ? { driveId: f.driveId } : null;
    }
  };

  const loadCandidates = async () => {
    const params = buildParams();
    if (!params) {
      toast.error(tab === 'attendance' ? 'Enter the attendance % first' : 'Choose what to alert about first');
      return;
    }
    setLoadingRows(true);
    setSummary(null);
    try {
      const { data } = await api.get('/parent-alerts/candidates', { params: { type: tab, ...params } });
      setResult(data.data);
      setSelected(new Set(data.data.rows.filter((r) => sendable(r, allowResend)).map((r) => r.studentId)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoadingRows(false);
    }
  };

  const toggleResend = (v) => {
    setAllowResend(v);
    if (result) setSelected(new Set(result.rows.filter((r) => sendable(r, v)).map((r) => r.studentId)));
  };

  const rows = useMemo(() => result?.rows || [], [result]);
  const selectableRows = rows.filter((r) => sendable(r, allowResend));
  const allChecked = selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.studentId));

  const toggleRow = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(selectableRows.map((r) => r.studentId)));

  const send = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!window.confirm(`Send ${ids.length} WhatsApp message${ids.length > 1 ? 's' : ''} to parents?\n\n${result.contextLabel}`)) return;
    setSending(true);
    try {
      const { data } = await api.post('/parent-alerts/send', { type: tab, ...buildParams(), studentIds: ids, allowResend });
      setSummary(data.data);
      const { sent, failed, skipped } = data.data;
      (failed ? toast.error : toast.success)(`Sent ${sent}, failed ${failed}, skipped ${skipped}`);
      loadLogs();
      // Refresh "already sent" flags without clearing the summary.
      const res = await api.get('/parent-alerts/candidates', { params: { type: tab, ...buildParams() } });
      setResult(res.data.data);
      setSelected(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sending failed');
    } finally {
      setSending(false);
    }
  };

  const sample = rows.find((r) => selected.has(r.studentId)) || rows[0];
  const valueHeader = { podai: 'Score', attendance: 'Attendance', mst: 'Marks', driveResult: 'Company', driveRegistration: 'Company' }[tab];
  const tabLabel = (type) => TABS.find((t) => t.key === type)?.label || type;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <MessageSquareShare className="text-emerald-500" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Parent WhatsApp Alerts</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Load the students for an alert, check the list, then send the approved WhatsApp template to their parents.
          </p>
        </div>
      </header>

      {!options ? (
        <div className="glass-card p-16 flex items-center justify-center rounded-3xl">
          <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <>
          {!options.configured && (
            <div className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 text-sm font-medium">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>WhatsApp is not configured yet. Add <code className="font-mono">GUPSHUP_API_KEY</code> to the backend <code className="font-mono">.env</code> and restart the server. You can still preview lists.</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="glass-card p-5 rounded-3xl space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              {tab === 'podai' && (
                <>
                  <Field label="POD AI test">
                    <select className={inputCls} value={filters.test ?? ''} onChange={(e) => setFilter('test', e.target.value)}>
                      <option value="">Select test…</option>
                      {options.podaiTests.map((t, i) => (
                        <option key={i} value={i}>{t.testName} — {fmtDate(t.testDate)} ({t.count})</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Only score below (optional)">
                    <input type="number" className={inputCls} value={filters.below ?? ''} onChange={(e) => setFilter('below', e.target.value)} placeholder="e.g. 60" />
                  </Field>
                </>
              )}

              {tab === 'attendance' && (
                <>
                  <Field label="Attendance below % *">
                    <input type="number" min="1" max="100" className={inputCls} value={filters.threshold ?? ''} onChange={(e) => setFilter('threshold', e.target.value)} placeholder="e.g. 75" />
                  </Field>
                  <Field label="Batch">
                    <select className={inputCls} value={filters.batch ?? ''} onChange={(e) => setFilter('batch', e.target.value)}>
                      <option value="">All</option>
                      {options.batches.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Semester">
                    <select className={inputCls} value={filters.semester ?? ''} onChange={(e) => setFilter('semester', e.target.value)}>
                      <option value="">All</option>
                      {options.semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Section">
                    <select className={inputCls} value={filters.section ?? ''} onChange={(e) => setFilter('section', e.target.value)}>
                      <option value="">All</option>
                      {options.sections.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {tab === 'mst' && (
                <>
                  <Field label="MST test">
                    <select className={inputCls} value={filters.test ?? ''} onChange={(e) => { setFilter('test', e.target.value); setFilter('column', ''); }}>
                      <option value="">Select test…</option>
                      {options.mstTests.map((t, i) => (
                        <option key={i} value={i}>{t.testName} — Sem {t.semester} ({t.count})</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Marks column">
                    <select className={inputCls} value={filters.column ?? ''} onChange={(e) => setFilter('column', e.target.value)} disabled={filters.test === undefined || filters.test === ''}>
                      <option value="">Total of all subjects</option>
                      {(options.mstTests[filters.test]?.columns || []).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Only marks below (optional)">
                    <input type="number" className={inputCls} value={filters.below ?? ''} onChange={(e) => setFilter('below', e.target.value)} placeholder="e.g. 12" />
                  </Field>
                </>
              )}

              {(tab === 'driveResult' || tab === 'driveRegistration') && (
                <Field label="Placement drive">
                  <select className={inputCls} value={filters.driveId ?? ''} onChange={(e) => setFilter('driveId', e.target.value)}>
                    <option value="">Select drive…</option>
                    {options.drives.map((d) => (
                      <option key={d._id} value={d._id}>{d.companyName}{d.batch ? ` — ${d.batch}` : ''}{d.deadline ? ` (${fmtDate(d.deadline)})` : ''}</option>
                    ))}
                  </select>
                </Field>
              )}

              <button onClick={loadCandidates} disabled={loadingRows} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2">
                {loadingRows ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Load students
              </button>
            </div>
            {tab === 'driveRegistration' && (
              <p className="text-xs text-[var(--text-secondary)]">Lists eligible students who never submitted the drive's apply form.</p>
            )}
          </div>

          {result && (
            <div className="glass-card p-5 rounded-3xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[var(--text-primary)]">{result.contextLabel}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {rows.length} student{rows.length !== 1 ? 's' : ''} · {rows.filter((r) => !r.phone).length} without a valid parent number · {rows.filter((r) => r.alreadySentAt).length} already sent
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input type="checkbox" checked={allowResend} onChange={(e) => toggleResend(e.target.checked)} />
                    Include already sent
                  </label>
                  <button
                    onClick={send}
                    disabled={sending || selected.size === 0 || !options.configured}
                    className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send to {selected.size} parent{selected.size !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>

              {sample && (
                <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-4">
                  <p className={labelCls}>Message preview — {sample.name}</p>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{sample.preview}</p>
                </div>
              )}

              {rows.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] py-6 text-center">No students match this alert.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                        <th className="py-2 pr-2"><input type="checkbox" checked={allChecked} onChange={toggleAll} disabled={selectableRows.length === 0} /></th>
                        <th className="py-2 pr-3">Student</th>
                        <th className="py-2 pr-3">Enrollment</th>
                        <th className="py-2 pr-3">{valueHeader}</th>
                        <th className="py-2 pr-3">Parent number</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const can = sendable(r, allowResend);
                        return (
                          <tr key={r.studentId} className={`border-b border-[var(--border-light)] ${can ? '' : 'opacity-60'}`}>
                            <td className="py-2 pr-2">
                              <input type="checkbox" checked={selected.has(r.studentId)} onChange={() => toggleRow(r.studentId)} disabled={!can} />
                            </td>
                            <td className="py-2 pr-3 font-semibold text-[var(--text-primary)]">{r.name}</td>
                            <td className="py-2 pr-3 text-[var(--text-secondary)]">{r.enrollment || '—'}</td>
                            <td className="py-2 pr-3 text-[var(--text-primary)]">{r.params[r.params.length - 1]}</td>
                            <td className="py-2 pr-3">
                              {r.phone
                                ? <span className="text-[var(--text-primary)]">+{r.phone}</span>
                                : <span className="text-red-500 text-xs font-semibold">{r.phoneRaw ? `Invalid (${r.phoneRaw})` : 'Missing'}</span>}
                            </td>
                            <td className="py-2 text-xs">
                              {r.alreadySentAt
                                ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Sent {fmtDateTime(r.alreadySentAt)}</span>
                                : <span className="text-[var(--text-secondary)]">Not sent</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {summary && (
            <div className="glass-card p-5 rounded-3xl space-y-3">
              <p className="font-bold text-[var(--text-primary)]">
                Result: {summary.sent} sent · {summary.failed} failed · {summary.skipped} skipped
              </p>
              <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
                {summary.results.filter((r) => r.status !== 'sent').map((r) => (
                  <li key={r.studentId} className="flex items-start gap-2">
                    {r.status === 'failed' ? <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" /> : <MinusCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />}
                    <span className="text-[var(--text-primary)]">{r.name || r.studentId}</span>
                    <span className="text-[var(--text-secondary)]">— {r.reason}</span>
                  </li>
                ))}
                {summary.sent > 0 && (
                  <li className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 size={15} /> {summary.sent} message{summary.sent !== 1 ? 's' : ''} accepted by WhatsApp
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="glass-card p-5 rounded-3xl space-y-3">
            <p className="flex items-center gap-2 font-bold text-[var(--text-primary)]"><History size={16} /> Recent alerts</p>
            {logs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No alerts sent yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)] border-b border-[var(--border-light)]">
                      <th className="py-2 pr-3">When</th>
                      <th className="py-2 pr-3">Alert</th>
                      <th className="py-2 pr-3">Student</th>
                      <th className="py-2 pr-3">Number</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l._id} className="border-b border-[var(--border-light)]">
                        <td className="py-2 pr-3 whitespace-nowrap text-[var(--text-secondary)]">{fmtDateTime(l.createdAt)}</td>
                        <td className="py-2 pr-3 text-[var(--text-primary)]">{tabLabel(l.type)}<span className="block text-xs text-[var(--text-secondary)]">{l.contextLabel}</span></td>
                        <td className="py-2 pr-3 text-[var(--text-primary)]">{l.studentName}</td>
                        <td className="py-2 pr-3 text-[var(--text-secondary)]">+{l.phone}</td>
                        <td className="py-2 pr-3">
                          {l.status === 'sent'
                            ? <span className="text-emerald-600 font-semibold">Sent</span>
                            : <span className="text-red-500 font-semibold" title={l.error}>Failed{l.error ? ` — ${l.error}` : ''}</span>}
                        </td>
                        <td className="py-2 text-[var(--text-secondary)]">{l.sentBy?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
