import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Bell, X, Volume2, VolumeX, ArrowRight } from "lucide-react";
import api from "../../services/api";
import { playAlarm, isAlarmMuted, setAlarmMuted } from "../../utils/alarmSound";

// Anything new that arrives while somebody is using the portal.
//
// Mounted once app-wide for EVERY role — a student waiting on a gate pass
// decision has as much reason to hear it as a faculty member. It only ever
// announces notifications it has not announced before, so a refresh or a
// second tab does not set the alarm off again.

const POLL_MS = 25000;
const seenKey = (userId) => `notif_seen_${userId}`;

const loadSeen = (userId) => {
  try {
    const raw = localStorage.getItem(seenKey(userId));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    // Private windows and cleared storage just mean nothing is remembered.
    return new Set();
  }
};

const saveSeen = (userId, ids) => {
  try {
    // Only the recent ones matter; an unbounded list would grow forever.
    localStorage.setItem(seenKey(userId), JSON.stringify([...ids].slice(-200)));
  } catch {
    /* nothing to do */
  }
};

export default function NotificationAlerts() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [fresh, setFresh] = useState([]);
  const [muted, setMuted] = useState(isAlarmMuted());
  const seenRef = useRef(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (!user?._id) return;
    seenRef.current = loadSeen(user._id);
    primedRef.current = false;
  }, [user?._id]);

  const poll = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await api.get("/notifications/recent");
      const items = data.data || data.notifications || [];
      const unseen = items.filter((n) => !seenRef.current.has(String(n._id)));

      items.forEach((n) => seenRef.current.add(String(n._id)));
      saveSeen(user._id, seenRef.current);

      // The first poll of a session only learns what already exists. Without
      // this, signing in would set the alarm off for a week of old news.
      if (!primedRef.current) {
        primedRef.current = true;
        return;
      }

      if (unseen.length) {
        setFresh((prev) => [...unseen, ...prev].slice(0, 6));
        if (!isAlarmMuted()) playAlarm();
      }
    } catch {
      // A missed poll is picked up by the next one.
    }
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return undefined;
    poll();
    const id = setInterval(poll, POLL_MS);
    // Coming back to the tab is exactly when somebody wants to know.
    const onVisible = () => { if (document.visibilityState === "visible") poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user?._id, poll]);

  if (!user?._id || fresh.length === 0) return null;

  const dismiss = (id) => setFresh((prev) => prev.filter((n) => String(n._id) !== String(id)));

  return (
    <div className="fixed top-4 right-4 z-[220] w-[min(360px,calc(100vw-2rem))] space-y-2">
      {fresh.map((n) => (
        <div key={n._id} className="glass-card rounded-2xl border border-[var(--primary)]/30 shadow-xl overflow-hidden">
          <div className="p-3 flex items-start gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bell size={15} />
            </span>
            <button
              onClick={() => { dismiss(n._id); if (n.link) navigate(n.link); }}
              className="min-w-0 flex-1 text-left"
            >
              <div className="font-bold text-sm text-[var(--text-primary)] truncate">{n.title}</div>
              {n.message && (
                <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{n.message}</div>
              )}
              {n.link && (
                <div className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1 mt-0.5">
                  Open <ArrowRight size={11} />
                </div>
              )}
            </button>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button onClick={() => dismiss(n._id)} title="Dismiss"
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={14} />
              </button>
              <button
                onClick={() => { const next = !muted; setAlarmMuted(next); setMuted(next); }}
                title={muted ? "Turn the sound back on" : "Mute the sound"}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// The same notifications as a panel, for a dashboard to drop in.
export function DashboardNotifications({ limit = 6 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/recent");
      setItems((data.data || data.notifications || []).slice(0, limit));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (loading || items.length === 0) return null;

  return (
    <div className="glass-card rounded-3xl p-5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-black text-base text-[var(--text-primary)] flex items-center gap-2">
          <Bell size={17} className="text-[var(--primary)]" /> What is new
        </h2>
        <button onClick={() => navigate("/notifications")} className="text-[11px] font-bold text-[var(--primary)] hover:underline">
          See all
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((n) => (
          <button
            key={n._id}
            onClick={() => n.link && navigate(n.link)}
            className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-2xl border transition-colors ${
              n.isRead
                ? "border-transparent hover:bg-[var(--primary)]/5"
                : "border-[var(--primary)]/30 bg-[var(--primary)]/5"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${n.isRead ? "bg-transparent" : "bg-[var(--primary)]"}`} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-sm text-[var(--text-primary)] truncate">{n.title}</span>
              {n.message && <span className="block text-[11px] text-[var(--text-secondary)] line-clamp-2">{n.message}</span>}
              <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">
                {new Date(n.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
