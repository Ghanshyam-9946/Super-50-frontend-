import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { UserCheck, Loader2, Send, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import SectionSelect from "../../components/SectionSelect";

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const STATUS_BADGE = {
  pending: "bg-amber-500/10 text-amber-500",
  approved: "bg-green-500/10 text-green-500",
  rejected: "bg-red-500/10 text-red-500",
};

function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_BADGE[status] || ""}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function RejectControl({ onReject, busy }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-red-500">
        <X size={12} /> Reject
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Reason for rejecting"
        className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-xs w-48"
      />
      <button
        onClick={() => onReject(note)}
        disabled={busy || !note.trim()}
        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-red-500 disabled:opacity-40"
      >
        Confirm
      </button>
      <button onClick={() => setOpen(false)} className="text-xs font-bold px-2 py-1.5">
        Cancel
      </button>
    </div>
  );
}

export default function ClassEngagementPage() {
  const { user } = useSelector((s) => s.auth);
  const [facultyList, setFacultyList] = useState([]);
  const [form, setForm] = useState({ semester: "", section: "", date: "", fromTime: "", toTime: "", engagedBy: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [assignedToMe, setAssignedToMe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const loadLists = async () => {
    setLoading(true);
    try {
      const [mineRes, assignedRes] = await Promise.all([
        api.get("/class-engagements/mine"),
        api.get("/class-engagements/assigned-to-me"),
      ]);
      if (mineRes.data.success) setMyRequests(mineRes.data.data);
      if (assignedRes.data.success) setAssignedToMe(assignedRes.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load class engagements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get("/class-engagements/faculty-list")
      .then(({ data }) => {
        if (data.success) setFacultyList(data.data.filter((f) => f._id !== user?._id));
      })
      .catch(() => {});
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!form.semester || !form.section || !form.date || !form.fromTime || !form.toTime || !form.engagedBy || !form.reason.trim()) {
      return toast.error("Semester, section, date, from/to time, engaged-by faculty and reason are all required");
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/class-engagements", form);
      if (data.success) {
        toast.success(data.message);
        setForm({ semester: "", section: "", date: "", fromTime: "", toTime: "", engagedBy: "", reason: "" });
        loadLists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (id, status, responseNote) => {
    setRespondingId(id);
    try {
      const { data } = await api.patch(`/class-engagements/${id}/respond`, { status, responseNote });
      if (data.success) {
        toast.success(data.message);
        loadLists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to respond");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <UserCheck size={26} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Class Engagement</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Ask another faculty to cover your class — it's only approved once they accept.
          </p>
        </div>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">New Request</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Semester
            <select value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm">
              <option value="">Select semester</option>
              {SEMESTERS.map((n) => (
                <option key={n} value={n}>
                  Semester {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Section
            <SectionSelect value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Date
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            From Time
            <input type="time" value={form.fromTime} onChange={(e) => setForm((f) => ({ ...f, fromTime: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            To Time
            <input type="time" value={form.toTime} onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
            Engaged By
            <select value={form.engagedBy} onChange={(e) => setForm((f) => ({ ...f, engagedBy: e.target.value }))} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm">
              <option value="">Select faculty</option>
              {facultyList.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Reason
          <textarea
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            rows={2}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <button onClick={submit} disabled={submitting} className="btn-premium text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Request
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-10 flex justify-center rounded-2xl">
          <Loader2 className="animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <>
          <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
            <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
              Requests To Me
            </div>
            {assignedToMe.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">No requests directed to you.</div>
            ) : (
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Requested By</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignedToMe.map((r) => (
                    <tr key={r._id} className="border-b border-[var(--border-light)] align-top">
                      <td className="px-4 py-3">
                        {new Date(r.date).toLocaleDateString()}
                        <div className="text-xs text-[var(--text-secondary)]">{r.fromTime} - {r.toTime}</div>
                      </td>
                      <td className="px-4 py-3">Sem {r.semester} - {r.section}</td>
                      <td className="px-4 py-3">{r.requestedBy?.name}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{r.reason}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                        {r.status === "rejected" && r.responseNote && (
                          <div className="text-xs text-[var(--text-secondary)] mt-1">{r.responseNote}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => respond(r._id, "approved", "")}
                              disabled={respondingId === r._id}
                              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] text-green-500 disabled:opacity-40"
                            >
                              <Check size={12} /> Accept
                            </button>
                            <RejectControl busy={respondingId === r._id} onReject={(note) => respond(r._id, "rejected", note)} />
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-secondary)]">
                            {r.respondedAt && new Date(r.respondedAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-card rounded-2xl overflow-hidden overflow-x-auto">
            <div className="px-4 py-3 border-b border-[var(--border-light)] text-xs font-bold text-[var(--text-secondary)]">
              My Requests
            </div>
            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-secondary)]">You haven't sent any requests yet.</div>
            ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-left text-[11px] uppercase tracking-widest text-[var(--text-secondary)]">
                    <th className="px-4 py-3">Date / Time</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Engaged By</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((r) => (
                    <tr key={r._id} className="border-b border-[var(--border-light)] align-top">
                      <td className="px-4 py-3">
                        {new Date(r.date).toLocaleDateString()}
                        <div className="text-xs text-[var(--text-secondary)]">{r.fromTime} - {r.toTime}</div>
                      </td>
                      <td className="px-4 py-3">Sem {r.semester} - {r.section}</td>
                      <td className="px-4 py-3">{r.engagedBy?.name}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{r.reason}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                        {r.status === "rejected" && r.responseNote && (
                          <div className="text-xs text-[var(--text-secondary)] mt-1">{r.responseNote}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
