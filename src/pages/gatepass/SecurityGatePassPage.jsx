import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { DoorOpen, Loader2, ScanLine, CameraOff, CheckCircle2, XCircle, History, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import { PassRow, StatusBadge, fmt, studentLine, semLine } from './gatePassShared';

const READER_ID = 'gate-pass-qr-reader';

// The guard's screen: the camera on the left, the students cleared to leave
// on the right. Scanning a student's QR closes their pass on the spot.
export default function SecurityGatePassPage() {
  const { user } = useSelector((state) => state.auth);
  const [queue, setQueue] = useState([]);
  const [recent, setRecent] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('scan');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { ok, message, pass }
  const [manual, setManual] = useState('');
  const scannerRef = useRef(null);
  const busyRef = useRef(false); // one scan at a time — the camera fires repeatedly

  const loadQueue = async () => {
    try {
      const { data } = await api.get('/gate-pass/guard/queue');
      setQueue(data.data?.active || []);
      setRecent(data.data?.recent || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load gate passes');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { data } = await api.get('/gate-pass/guard/history');
      setHistory(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load history');
    }
  };

  useEffect(() => {
    loadQueue();
    const id = setInterval(loadQueue, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  const submitToken = async (token) => {
    if (busyRef.current || !token) return;
    busyRef.current = true;
    try {
      const { data } = await api.post('/gate-pass/guard/scan', { token });
      setResult({ ok: true, message: data.message, pass: data.data });
      toast.success(data.message);
      loadQueue();
    } catch (err) {
      setResult({ ok: false, message: err.response?.data?.message || 'Could not read this gate pass' });
    } finally {
      // A short pause so the same code isn't read five times in a row.
      setTimeout(() => { busyRef.current = false; }, 2500);
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // already stopped — nothing to undo
    }
  };

  const startScanner = async () => {
    if (scannerRef.current) return;
    setResult(null);
    try {
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => submitToken(String(text).trim()),
        () => {} // per-frame "no QR here" — not worth surfacing
      );
      setScanning(true);
    } catch (err) {
      scannerRef.current = null;
      setScanning(false);
      toast.error(err?.message?.includes('Permission')
        ? 'Allow camera access to scan QR codes'
        : 'No camera available — type the code below instead');
    }
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <DoorOpen className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Gate Pass — Security</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              {user?.name ? `${user.name} · ` : ''}Scan the QR on the student's phone. A scanned pass closes itself and the student may exit.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {[['scan', 'Scan'], ['history', 'History']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                tab === key ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)]'
              }`}>{label}</button>
          ))}
        </div>
      </header>

      {tab === 'history' ? (
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Gate pass history</h2>
            </div>
            <button onClick={loadHistory} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><RefreshCw size={13} /> Refresh</button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Nothing here yet.</p>
          ) : (
            <div className="space-y-2">{history.map((p) => <PassRow key={p._id} pass={p} />)}</div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Scanner */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <ScanLine size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Scan QR</h2>
            </div>

            <div id={READER_ID} className={`rounded-2xl overflow-hidden bg-black ${scanning ? '' : 'hidden'}`} />

            {!scanning && (
              <div className="rounded-2xl bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] p-8 flex flex-col items-center gap-3 text-center">
                <CameraOff size={28} className="text-[var(--text-secondary)]" />
                <p className="text-sm text-[var(--text-secondary)]">The camera is off.</p>
              </div>
            )}

            <div className="flex gap-2">
              {scanning ? (
                <button onClick={stopScanner} className="btn-outline-premium text-sm px-4 py-2.5">Stop camera</button>
              ) : (
                <button onClick={startScanner} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-2"><ScanLine size={15} /> Start camera</button>
              )}
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submitToken(manual.trim()); setManual(''); }}
              className="flex gap-2 pt-2 border-t border-[var(--border-light)]"
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Or type the code under the QR"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
              />
              <button type="submit" className="btn-outline-premium text-sm px-4 py-2.5">Check</button>
            </form>

            {result && (
              <div className={`rounded-2xl p-4 border ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-start gap-3">
                  {result.ok ? <CheckCircle2 className="text-emerald-600 shrink-0" size={20} /> : <XCircle className="text-red-600 shrink-0" size={20} />}
                  <div className="min-w-0">
                    <div className={`font-bold text-sm ${result.ok ? 'text-emerald-700' : 'text-red-700'}`}>{result.message}</div>
                    {result.pass && (
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        {studentLine(result.pass.student)} · {semLine(result.pass.student)}<br />
                        {result.pass.reason} · exit {fmt(result.pass.exitTime)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Who is cleared to leave right now */}
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Cleared to exit ({queue.length})</h2>
              <button onClick={loadQueue} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><RefreshCw size={13} /> Refresh</button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
            ) : queue.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nobody is approved to leave at the moment.</p>
            ) : (
              <div className="space-y-2">
                {queue.map((p) => (
                  <div key={p._id} className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[var(--text-primary)] truncate">{studentLine(p.student)}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{semLine(p.student)}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1.5">
                      {p.reason} · exit {fmt(p.exitTime)} · valid till {fmt(p.validUntil)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recent.length > 0 && (
              <div className="pt-3 border-t border-[var(--border-light)] space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Recently exited</div>
                {recent.slice(0, 5).map((p) => (
                  <div key={p._id} className="text-xs text-[var(--text-secondary)]">
                    {studentLine(p.student)} — {fmt(p.usedAt)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
