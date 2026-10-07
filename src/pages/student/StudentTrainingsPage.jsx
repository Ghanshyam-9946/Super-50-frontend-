import { useEffect, useState } from "react";
import {
  GraduationCap, Loader2, Download, Calendar, MapPin, Award, ChevronDown, ChevronUp, Info,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { TrainingChoice, TrainingFeedbackForm } from "./TrainingChoiceAndFeedback";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }) : "—";

const Meter = ({ label, value, good }) => (
  <div className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-4">
    <div className={`text-2xl font-display font-black ${good ? "text-emerald-600" : "text-[var(--text-primary)]"}`}>
      {value === null || value === undefined ? "—" : `${value}%`}
    </div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mt-0.5">{label}</div>
    <div className="h-1.5 rounded-full bg-[var(--bg-card)] mt-2 overflow-hidden">
      <div className={`h-full ${good ? "bg-emerald-500" : "bg-[var(--primary)]"}`} style={{ width: `${Math.min(100, value || 0)}%` }} />
    </div>
  </div>
);

// A student's own training record: how much of it they attended, how they
// scored, and their certificate once the coordinator releases it.
export default function StudentTrainingsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/trainings/mine");
        setItems(data.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load your trainings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const download = async (item) => {
    setDownloading(item.training._id);
    try {
      const res = await api.get(`/trainings/${item.training._id}/my-certificate`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.training.name}-certificate.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      // The refusal comes back as a blob on this endpoint, so read it out.
      let message = "Could not download the certificate";
      try {
        if (err.response?.data instanceof Blob) message = JSON.parse(await err.response.data.text()).message || message;
        else message = err.response?.data?.message || message;
      } catch { /* keep the default */ }
      toast.error(message);
    } finally {
      setDownloading("");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <GraduationCap className="text-[var(--primary)]" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">My Trainings</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            Your attendance and assessment for each training, and your certificate once it is released.
          </p>
        </div>
      </header>

      {/* Which training they want to do, before any of it has run. Renders
          nothing when no round is open for them. */}
      <TrainingChoice />

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : items.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)] flex flex-col items-center gap-3">
          <Info size={36} className="opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">Nothing here yet</p>
          <p className="text-sm">A training appears once its coordinator releases the results and certificates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const open = openId === item.training._id;
            return (
              <div key={item.training._id} className="glass-card rounded-3xl p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{item.training.name}</h2>
                    <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {fmt(item.training.fromDate)} → {fmt(item.training.toDate)}</span>
                      {item.training.location && <span className="flex items-center gap-1"><MapPin size={12} /> {item.training.location}</span>}
                    </div>
                  </div>
                  {item.certificateNo ? (
                    <button onClick={() => download(item)} disabled={downloading === item.training._id}
                      className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
                      {downloading === item.training._id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Certificate
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600">
                      No certificate — needs {item.training.attendanceThreshold}% attendance
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Meter label="Attendance" value={item.attendance?.presentPercent} good={item.eligible} />
                  <Meter label="Assessment score" value={item.assessment?.percent} good={(item.assessment?.percent || 0) >= 60} />
                </div>

                {item.certificateNo && (
                  <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Award size={12} /> Certificate no: <strong className="text-[var(--text-primary)]">{item.certificateNo}</strong>
                  </p>
                )}

                {(item.assessment?.items || []).length > 0 && (
                  <div>
                    <button onClick={() => setOpenId(open ? null : item.training._id)}
                      className="text-xs font-bold text-[var(--primary)] flex items-center gap-1">
                      {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {open ? "Hide" : "Show"} activity-wise marks ({item.assessment.items.length})
                    </button>
                    {open && (
                      <div className="mt-2 grid sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto">
                        {item.assessment.items.map((a, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
                            <span className="text-[var(--text-secondary)] truncate" title={a.label}>{a.label}</span>
                            <span className={`font-bold shrink-0 ${a.status ? "text-amber-600" : "text-[var(--text-primary)]"}`}>
                              {a.status || a.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Only shows once the coordinator opens feedback. */}
                <TrainingFeedbackForm trainingId={item.training._id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
