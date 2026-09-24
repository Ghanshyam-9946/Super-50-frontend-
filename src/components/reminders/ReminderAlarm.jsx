import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { BellRing, X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { speak } from "../../utils/speak";

const POLL_MS = 30000;
const BEEP_INTERVAL_MS = 1500;

// Plays a short two-tone beep via the Web Audio API — no audio asset to
// host, works everywhere the browser supports AudioContext (all modern
// browsers). Kept as a standalone function (not a hook) since it's a pure
// fire-and-forget side effect triggered on an interval, not tied to a
// component's render lifecycle.
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(880, now, 0.15);
    playTone(1046, now + 0.18, 0.15);
  } catch {
    // AudioContext can be blocked (no user gesture yet) or unsupported —
    // the visual modal + spoken title still get the reminder across.
  }
};

// Global, always-mounted alarm — same pattern as FloatingChatBubble
// (Layout.jsx renders it once app-wide, it self-gates by role and no-ops
// for anyone it doesn't apply to). Polls for due reminders and, while any
// are due and undismissed, beeps on an interval and shows a modal.
export default function ReminderAlarm() {
  const { user } = useSelector((s) => s.auth);
  const [dueReminders, setDueReminders] = useState([]);
  const [snoozedIds, setSnoozedIds] = useState(new Set());
  const beepTimerRef = useRef(null);
  const announcedIdsRef = useRef(new Set());

  const FACULTY_ROLES = ["teacher", "admin", "super50_admin", "tp_admin", "guide", "pms_admin"];
  const userRoles = user?.roles?.length ? user.roles : [user?.role];
  const isFaculty = userRoles.some((r) => FACULTY_ROLES.includes(r));

  const poll = async () => {
    try {
      const { data } = await api.get("/calendar-reminders/due");
      if (data.success) {
        setDueReminders(data.data.filter((r) => !snoozedIds.has(r._id)));
      }
    } catch {
      // Silent — a missed poll just gets retried next interval.
    }
  };

  useEffect(() => {
    if (!isFaculty) return;
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFaculty, snoozedIds]);

  // Speak each newly-due reminder's title once (not on every poll).
  useEffect(() => {
    dueReminders.forEach((r) => {
      if (!announcedIdsRef.current.has(r._id)) {
        announcedIdsRef.current.add(r._id);
        speak(`Reminder: ${r.title}`, "en-IN");
      }
    });
  }, [dueReminders]);

  // Beep on a repeating interval while any reminder is due.
  useEffect(() => {
    if (dueReminders.length === 0) {
      clearInterval(beepTimerRef.current);
      return;
    }
    playBeep();
    beepTimerRef.current = setInterval(playBeep, BEEP_INTERVAL_MS);
    return () => clearInterval(beepTimerRef.current);
  }, [dueReminders.length]);

  const dismiss = async (id) => {
    setDueReminders((prev) => prev.filter((r) => r._id !== id));
    try {
      await api.patch(`/calendar-reminders/${id}/dismiss`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dismiss reminder");
    }
  };

  const snooze = (id) => {
    setDueReminders((prev) => prev.filter((r) => r._id !== id));
    setSnoozedIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setSnoozedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      announcedIdsRef.current.delete(id);
    }, 5 * 60 * 1000);
  };

  if (!isFaculty || dueReminders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 border-2 border-[var(--primary)]">
        <div className="flex items-center gap-2 text-[var(--primary)]">
          <BellRing size={22} className="animate-pulse" />
          <span className="font-display font-black text-lg">Reminder{dueReminders.length > 1 ? "s" : ""}</span>
        </div>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {dueReminders.map((r) => (
            <div key={r._id} className="border border-[var(--border-light)] rounded-xl p-3 space-y-1.5">
              <div className="font-bold text-sm text-[var(--text-primary)]">{r.title}</div>
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                <Clock size={12} /> {new Date(r.date).toLocaleDateString()} at {r.time}
                {r.calendar?.session && <span> · {r.calendar.session}</span>}
              </div>
              {r.note && <p className="text-xs text-[var(--text-secondary)]">{r.note}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => dismiss(r._id)}
                  className="flex-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => snooze(r._id)}
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)]"
                >
                  <X size={12} /> Snooze 5 min
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
