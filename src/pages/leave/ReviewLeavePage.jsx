import { useEffect, useState } from "react";
import { FileText, Loader2, Inbox, History, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { LeaveRow, ReviewDialog, fmtDate, studentLine, semLine, Attachment } from "./leaveShared";

// One page, two audiences: the TG's own tutor group (`scope="tg"`) and the
// admin's final approvals (`scope="admin"`). The flow is identical, only
// the endpoint and the wording differ.
const CONFIG = {
  tg: {
    title: "Leave Applications (TG)",
    blurb: "Applications from your tutor group. What you approve goes to the admin for final approval.",
    list: "/leave/tg",
    review: (id) => `/leave/${id}/tg-review`,
    waiting: "Waiting for you",
  },
  admin: {
    title: "Leave Applications",
    blurb: "Applications the TGs have cleared. Your approval is final — the student and their TG are emailed.",
    list: "/leave/admin",
    review: (id) => `/leave/${id}/admin-review`,
    waiting: "TG-approved, waiting for you",
  },
};

export default function ReviewLeavePage({ scope = "tg" }) {
  const cfg = CONFIG[scope];
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get(cfg.list);
      setPending(data.data?.pending || []);
      setHistory(data.data?.history || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load leave applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [scope]);

  const review = async (decision, remark) => {
    try {
      const { data } = await api.patch(cfg.review(reviewing._id), { decision, remark });
      toast.success(data.message);
      load(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the decision");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <FileText className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">{cfg.title}</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">{cfg.blurb}</p>
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
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{cfg.waiting} ({pending.length})</h2>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nothing to review right now.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((a) => (
                  <div key={a._id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[var(--text-primary)]">{studentLine(a.student)}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{semLine(a.student)}</div>
                      <div className="text-sm text-[var(--text-primary)] mt-1">{a.subject}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {fmtDate(a.fromDate)} → {fmtDate(a.toDate)} · {a.days} day{a.days === 1 ? "" : "s"}
                        {a.parentInformed ? " · parent informed" : " · parent not informed"}
                        {a.tgDecision?.by?.name ? ` · TG ${a.tgDecision.by.name} approved` : ""}
                      </div>
                      <div className="mt-1"><Attachment file={a.attachment} /></div>
                    </div>
                    <button onClick={() => setReviewing(a)} className="btn-premium text-xs px-4 py-2">Review</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-[var(--primary)]" />
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">Already decided</h2>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nothing here yet.</p>
            ) : (
              <div className="space-y-2">{history.map((a) => <LeaveRow key={a._id} application={a} />)}</div>
            )}
          </div>
        </>
      )}

      {reviewing && <ReviewDialog application={reviewing} onClose={() => setReviewing(null)} onSubmit={review} />}
    </div>
  );
}
