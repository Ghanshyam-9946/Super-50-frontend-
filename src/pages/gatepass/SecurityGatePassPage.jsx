import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { DoorOpen, Loader2, ScanLine, CameraOff, CheckCircle2, XCircle, History, RefreshCw, SwitchCamera, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import { PassRow, StatusBadge, fmt, studentLine, semLine } from './gatePassShared';

const READER_ID = 'gate-pass-qr-reader';

// Audio feedback on successful scan
const playSuccessBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio errors if browser blocks autoplay
  }
};

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
  const [starting, setStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
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
      playSuccessBeep();
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
    setStarting(false);
    setScanning(false);
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch (err) {
      console.warn('Error clearing scanner:', err);
    }
  };

  const startScanner = async (overrideCameraId) => {
    if (scannerRef.current) {
      await stopScanner();
    }
    setResult(null);
    setStarting(true);

    // Ensure DOM container layout pass is finished before starting Html5Qrcode
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const containerEl = document.getElementById(READER_ID);
      if (!containerEl) {
        throw new Error('Scanner container element not found in DOM');
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not accessible. Please ensure you are accessing via HTTPS or localhost.');
      }

      // Query available cameras
      let cameraList = [];
      try {
        cameraList = await Html5Qrcode.getCameras();
        if (cameraList && cameraList.length > 0) {
          setCameras(cameraList);
        }
      } catch (camListErr) {
        console.warn('Camera enumeration error (falling back to default):', camListErr);
      }

      let cameraTarget;
      const targetId = overrideCameraId || selectedCamera;

      if (targetId) {
        cameraTarget = targetId;
      } else if (cameraList && cameraList.length > 0) {
        // Default to rear/back camera on mobile devices if present
        const backCam = cameraList.find((c) =>
          /back|rear|environment|world/i.test(c.label || '')
        );
        cameraTarget = backCam ? backCam.id : cameraList[0].id;
        setSelectedCamera(cameraTarget);
      } else {
        cameraTarget = { facingMode: 'environment' };
      }

      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;

      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.max(180, Math.floor(edge * 0.75));
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      try {
        await scanner.start(
          cameraTarget,
          scanConfig,
          (text) => submitToken(String(text).trim()),
          () => {} // suppress per-frame no-QR log
        );
        setScanning(true);
        setStarting(false);
      } catch (firstErr) {
        console.warn('Initial camera start failed, attempting front camera fallback:', firstErr);
        try {
          await scanner.start(
            { facingMode: 'user' },
            scanConfig,
            (text) => submitToken(String(text).trim()),
            () => {}
          );
          setScanning(true);
          setStarting(false);
        } catch (secondErr) {
          // Direct fallback to true constraint
          await scanner.start(
            true,
            scanConfig,
            (text) => submitToken(String(text).trim()),
            () => {}
          );
          setScanning(true);
          setStarting(false);
        }
      }
    } catch (err) {
      console.error('Camera startup error:', err);
      scannerRef.current = null;
      setScanning(false);
      setStarting(false);

      const msg = err?.message || String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowedError') || msg.includes('Permission denied')) {
        toast.error('Camera access denied. Please click the 🔒 lock icon in your browser address bar and allow Camera permission.', { duration: 6000 });
      } else if (msg.includes('HTTPS') || msg.includes('getUserMedia')) {
        toast.error('Camera requires HTTPS connection or localhost.', { duration: 6000 });
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        toast.error('No camera detected on this device. Please type the code manually below.');
      } else {
        toast.error(`Camera error: ${msg}. You can enter the code manually below.`);
      }
    }
  };

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <style>{`
        #${READER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1rem !important;
        }
        #${READER_ID} {
          border: none !important;
        }
        #${READER_ID} __scan_region {
          border-radius: 1rem;
        }
      `}</style>

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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ScanLine size={18} className="text-[var(--primary)]" />
                <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Live QR Scanner</h2>
              </div>
              {scanning && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Camera
                </span>
              )}
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-[var(--border-light)] min-h-[290px] flex items-center justify-center">
              <div
                id={READER_ID}
                className="w-full h-full"
                style={{ display: scanning ? 'block' : 'none' }}
              />

              {starting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-white p-6 text-center z-10">
                  <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
                  <p className="text-sm font-bold">Requesting camera access & initializing stream...</p>
                  <p className="text-xs text-slate-400">Please click "Allow" if your browser prompts for permission.</p>
                </div>
              )}

              {!scanning && !starting && (
                <div className="p-8 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                    <CameraOff size={28} />
                  </div>
                  <p className="text-sm font-bold text-slate-200">Camera is currently inactive</p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Click <strong>Start Camera</strong> below to scan QR passes, or enter the pass code manually.
                  </p>
                </div>
              )}
            </div>

            {/* Camera Controls & Device Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {scanning ? (
                  <button onClick={stopScanner} className="btn-outline-premium text-sm px-4 py-2.5">
                    Stop camera
                  </button>
                ) : (
                  <button
                    onClick={() => startScanner()}
                    disabled={starting}
                    className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50"
                  >
                    {starting ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                    {starting ? 'Starting...' : 'Start camera'}
                  </button>
                )}
              </div>

              {cameras.length > 1 && (
                <div className="flex items-center gap-2">
                  <SwitchCamera size={15} className="text-[var(--text-secondary)]" />
                  <select
                    value={selectedCamera}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedCamera(newId);
                      if (scanning) {
                        startScanner(newId);
                      }
                    }}
                    className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] font-bold outline-none cursor-pointer"
                  >
                    {cameras.map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        {c.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Manual Code Check */}
            <form
              onSubmit={(e) => { e.preventDefault(); submitToken(manual.trim()); setManual(''); }}
              className="flex gap-2 pt-2 border-t border-[var(--border-light)]"
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Or type the code under the QR"
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-[var(--primary)]"
              />
              <button type="submit" className="btn-outline-premium text-sm px-4 py-2.5 font-bold">Check Code</button>
            </form>

            {result && (
              <div className={`rounded-2xl p-5 border-2 ${result.ok ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-red-500/10 border-red-500 shadow-md shadow-red-500/10'} transition-all`}>
                {result.ok ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <div className="font-display font-black text-lg text-emerald-700 leading-tight">
                            PASS APPROVED ✅
                          </div>
                          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                            Cleared to Exit Campus
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm">
                        APPROVED
                      </span>
                    </div>

                    {result.pass && (
                      <div className="space-y-2 text-xs">
                        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3.5 space-y-1.5 border border-emerald-500/20">
                          <div className="text-base font-black text-[var(--text-primary)]">
                            {result.pass.student?.name}
                          </div>
                          <div className="text-[12px] font-bold text-[var(--text-secondary)]">
                            Roll No: <span className="text-[var(--text-primary)] font-black">{result.pass.student?.enrollmentNumber || result.pass.student?.enrollmentNo || '—'}</span>
                            {result.pass.student?.department && ` • ${result.pass.student.department}`}
                            {result.pass.student?.semester && ` • Sem ${result.pass.student.semester}`}
                          </div>
                          <div className="text-[12px] text-[var(--text-secondary)]">
                            Reason: <strong className="text-[var(--text-primary)]">{result.pass.reason}</strong>
                          </div>
                          <div className="text-[12px] text-[var(--text-secondary)]">
                            Exit Time: <strong className="text-[var(--text-primary)]">{fmt(result.pass.exitTime)}</strong>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold px-1 pt-1">
                          <span>Verified: TG & Admin Approved</span>
                          <span>Scanned: {fmt(result.pass.usedAt || new Date())}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md">
                      <XCircle size={24} />
                    </div>
                    <div>
                      <div className="font-display font-black text-base text-red-700">
                        EXIT DENIED / INVALID PASS ❌
                      </div>
                      <p className="text-xs font-bold text-red-600 mt-1">
                        {result.message}
                      </p>
                    </div>
                  </div>
                )}
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

