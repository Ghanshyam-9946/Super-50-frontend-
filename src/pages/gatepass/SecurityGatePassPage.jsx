import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  DoorOpen,
  Loader2,
  ScanLine,
  CameraOff,
  CheckCircle2,
  XCircle,
  History,
  RefreshCw,
  SwitchCamera,
  X,
  QrCode,
  ArrowRight,
  ShieldCheck,
  User,
  Clock,
  Calendar,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import { PassRow, StatusBadge, fmt, studentLine, semLine } from './gatePassShared';
import GatePassLeaderboard from './GatePassLeaderboard';

const READER_ID = 'gate-pass-qr-reader-modal';

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
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore audio errors if blocked
  }
};

export default function SecurityGatePassPage() {
  const { user } = useSelector((state) => state.auth);
  const [queue, setQueue] = useState([]);
  const [recent, setRecent] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('scan');
  const [loading, setLoading] = useState(true);

  // Scanner modal states
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');

  // Result dialog state
  const [showResultModal, setShowResultModal] = useState(false);
  const [result, setResult] = useState(null); // { ok, message, pass }
  const [checkingManual, setCheckingManual] = useState(false);
  const [manual, setManual] = useState('');

  const scannerRef = useRef(null);
  const busyRef = useRef(false);

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

    // Immediately stop & close the scanner modal
    await stopScanner();
    setShowScannerModal(false);

    try {
      const { data } = await api.post('/gate-pass/guard/scan', { token });
      playSuccessBeep();
      setResult({ ok: true, message: data.message, pass: data.data });
      setShowResultModal(true);
      toast.success(data.message);
      loadQueue();
    } catch (err) {
      setResult({
        ok: false,
        message: err.response?.data?.message || 'Could not verify this gate pass',
        pass: null,
      });
      setShowResultModal(true);
    } finally {
      setTimeout(() => {
        busyRef.current = false;
      }, 1000);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    setCheckingManual(true);
    try {
      const { data } = await api.post('/gate-pass/guard/scan', { token: code });
      playSuccessBeep();
      setResult({ ok: true, message: data.message, pass: data.data });
      setShowResultModal(true);
      toast.success(data.message);
      setManual('');
      loadQueue();
    } catch (err) {
      setResult({
        ok: false,
        message: err.response?.data?.message || 'Invalid gate pass code',
        pass: null,
      });
      setShowResultModal(true);
    } finally {
      setCheckingManual(false);
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
    setStarting(true);

    // Wait for modal and DOM container layout to render
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const containerEl = document.getElementById(READER_ID);
      if (!containerEl) {
        throw new Error('Scanner container element not found in DOM');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not accessible. Please ensure you are accessing via HTTPS or localhost.');
      }

      let cameraList = [];
      try {
        cameraList = await Html5Qrcode.getCameras();
        if (cameraList && cameraList.length > 0) {
          setCameras(cameraList);
        }
      } catch (camListErr) {
        console.warn('Camera enumeration error:', camListErr);
      }

      let cameraTarget;
      const targetId = overrideCameraId || selectedCamera;

      if (targetId) {
        cameraTarget = targetId;
      } else if (cameraList && cameraList.length > 0) {
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
          const size = Math.max(200, Math.floor(edge * 0.75));
          return { width: size, height: size };
        },
        aspectRatio: 1.0,
      };

      try {
        await scanner.start(
          cameraTarget,
          scanConfig,
          (text) => submitToken(String(text).trim()),
          () => {}
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
        toast.error('Camera access denied. Please allow camera access in your browser settings (🔒 icon).', { duration: 6000 });
      } else {
        toast.error(`Camera error: ${msg}. You can enter the code manually.`);
      }
    }
  };

  const handleOpenScanner = () => {
    setShowResultModal(false);
    setShowScannerModal(true);
  };

  const handleCloseScanner = async () => {
    await stopScanner();
    setShowScannerModal(false);
  };

  // Start camera when modal opens
  useEffect(() => {
    if (showScannerModal) {
      startScanner();
    } else {
      stopScanner();
    }
  }, [showScannerModal]);

  useEffect(() => () => { stopScanner(); }, []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <style>{`
        #${READER_ID} video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.5rem !important;
        }
        #${READER_ID} {
          border: none !important;
        }
      `}</style>

      {/* Header */}
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <DoorOpen className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Gate Pass — Security</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              {user?.name ? `${user.name} · ` : ''}Scan student gate pass QR code to verify and approve campus exit.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {[['scan', 'Gate Terminal'], ['leaderboard', 'Leaderboard'], ['history', 'Exit History']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                tab === key
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'leaderboard' ? (
        <GatePassLeaderboard />
      ) : tab === 'history' ? (
        <div className="glass-card p-6 rounded-3xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Gate Pass Exit History</h2>
            </div>
            <button onClick={loadHistory} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No exited gate passes recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((p) => <PassRow key={p._id} pass={p} />)}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Main Action Card */}
          <div className="glass-card p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <ScanLine size={20} />
                <span className="text-xs font-black uppercase tracking-widest">Gate Security Scanner</span>
              </div>
              <h2 className="text-2xl font-display font-black text-[var(--text-primary)]">
                Scan Student Gate Pass
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Click the <strong>Scan QR</strong> button below to open the camera scanner. Once scanned, the camera will close automatically and show full approval details.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="py-4">
              <button
                onClick={handleOpenScanner}
                className="btn-premium w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-base shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-display font-black tracking-wide"
              >
                <QrCode size={24} /> Scan QR Code
              </button>
            </div>

            {/* Manual Code Form */}
            <div className="pt-4 border-t border-[var(--border-light)] space-y-3">
              <p className="text-xs font-bold text-[var(--text-secondary)]">Or Enter Code Manually:</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="e.g., GP-ABC123XYZ"
                  className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] font-bold outline-none focus:border-[var(--primary)] shadow-sm"
                />
                <button
                  type="submit"
                  disabled={checkingManual || !manual.trim()}
                  className="btn-outline-premium text-sm px-5 py-3 font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {checkingManual ? <Loader2 size={16} className="animate-spin" /> : 'Verify'}
                </button>
              </form>
            </div>
          </div>

          {/* Cleared to exit right now list */}
          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">
                Approved for Exit ({queue.length})
              </h2>
              <button onClick={loadQueue} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[var(--primary)]" />
              </div>
            ) : queue.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] py-4">Nobody is approved to leave at the moment.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
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

      {/* 📷 MODAL 1: QR Camera Scanner */}
      {showScannerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCloseScanner}
        >
          <div
            className="glass-card bg-[var(--bg-card)] w-full max-w-lg rounded-3xl p-6 space-y-5 border border-[var(--border-light)] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <ScanLine size={22} />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-[var(--text-primary)]">Scan Student QR</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Point camera at the QR code on student phone</p>
                </div>
              </div>
              <button
                onClick={handleCloseScanner}
                className="p-2 rounded-full hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[320px] flex items-center justify-center shadow-inner">
              <div
                id={READER_ID}
                className="w-full h-full"
                style={{ display: scanning ? 'block' : 'none' }}
              />

              {starting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 text-white p-6 text-center z-10">
                  <Loader2 className="animate-spin text-[var(--primary)]" size={36} />
                  <p className="text-sm font-bold">Starting camera stream...</p>
                  <p className="text-xs text-slate-400">Please allow camera access if prompted</p>
                </div>
              )}

              {!scanning && !starting && (
                <div className="p-8 flex flex-col items-center gap-3 text-center">
                  <CameraOff size={32} className="text-slate-500" />
                  <p className="text-sm font-bold text-slate-300">Camera initialization paused</p>
                  <button onClick={() => startScanner()} className="btn-premium text-xs px-4 py-2 mt-2">
                    Try Starting Again
                  </button>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-2">
              {cameras.length > 1 ? (
                <div className="flex items-center gap-2">
                  <SwitchCamera size={16} className="text-[var(--text-secondary)]" />
                  <select
                    value={selectedCamera}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedCamera(newId);
                      startScanner(newId);
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
              ) : <div />}

              <button
                onClick={handleCloseScanner}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 MODAL 2: Full Approved Details Popup */}
      {showResultModal && result && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowResultModal(false)}
        >
          <div
            className="glass-card bg-[var(--bg-card)] w-full max-w-lg rounded-3xl p-6 md:p-8 space-y-6 border border-[var(--border-light)] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={20} />
            </button>

            {result.ok ? (
              <div className="space-y-6">
                {/* Header Badge */}
                <div className="flex items-center gap-4 pb-4 border-b border-emerald-500/20">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-2xl text-emerald-600">PASS APPROVED ✅</h3>
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-700 mt-0.5">
                      Student is Cleared to Exit Campus
                    </p>
                  </div>
                </div>

                {/* Detailed Student & Pass Information */}
                {result.pass && (
                  <div className="space-y-4">
                    <div className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black">
                          <User size={20} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-[var(--text-primary)]">
                            {result.pass.student?.name}
                          </h4>
                          <p className="text-xs font-bold text-[var(--text-secondary)]">
                            {result.pass.student?.enrollmentNumber || result.pass.student?.enrollmentNo || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-light)] text-xs">
                        <div>
                          <span className="text-[var(--text-secondary)] block font-bold text-[10px] uppercase">Department</span>
                          <strong className="text-[var(--text-primary)]">{result.pass.student?.department || '—'}</strong>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block font-bold text-[10px] uppercase">Semester</span>
                          <strong className="text-[var(--text-primary)]">{result.pass.student?.semester ? `Sem ${result.pass.student.semester}` : '—'}</strong>
                        </div>
                        <div className="col-span-2 pt-2">
                          <span className="text-[var(--text-secondary)] block font-bold text-[10px] uppercase">Reason for Exit</span>
                          <p className="text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-light)] mt-1">
                            {result.pass.reason}
                          </p>
                        </div>
                        <div className="pt-1">
                          <span className="text-[var(--text-secondary)] block font-bold text-[10px] uppercase">Exit Time</span>
                          <strong className="text-[var(--text-primary)] text-xs">{fmt(result.pass.exitTime)}</strong>
                        </div>
                        <div className="pt-1">
                          <span className="text-[var(--text-secondary)] block font-bold text-[10px] uppercase">Scanned Time</span>
                          <strong className="text-emerald-600 text-xs">{fmt(result.pass.usedAt || new Date())}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl">
                      <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> TG & Admin Approved</span>
                      <span>Verified at Gate</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleOpenScanner}
                    className="btn-premium flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black"
                  >
                    <QrCode size={18} /> Scan Next Student
                  </button>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="px-5 py-3.5 rounded-xl text-sm font-bold border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-red-500/20">
                  <div className="w-14 h-14 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0">
                    <XCircle size={32} />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-2xl text-red-600">EXIT DENIED ❌</h3>
                    <p className="text-xs font-black uppercase tracking-wider text-red-700 mt-0.5">
                      Gate Pass is Not Valid
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
                  <p className="text-sm font-bold text-red-700 leading-relaxed">
                    {result.message}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleOpenScanner}
                    className="btn-premium flex-1 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-black"
                  >
                    <QrCode size={18} /> Try Scanning Again
                  </button>
                  <button
                    onClick={() => setShowResultModal(false)}
                    className="px-5 py-3.5 rounded-xl text-sm font-bold border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


