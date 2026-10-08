import { useEffect, useMemo, useState } from "react";
import { Users, Loader2, Search, KeyRound, Copy, Check, X, ShieldCheck, RefreshCw, AlertCircle, Pencil, ClipboardList, Phone, FileText, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";
import StudentProfileModal from "../../components/StudentProfileModal";

// The TG's own tutor group. The one action here is setting a student's
// password — a student who can't log in usually asks their TG first, and
// this saves a round trip through the admin.
export default function TgStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState(null); // student whose password is being set
  // The full student profile modal, opened straight on the tab we want.
  const [profile, setProfile] = useState(null);
  // The remarks this TG has written, as a PDF, for whatever dates they pick.
  const [range, setRange] = useState({ from: "", to: "" });
  const [downloading, setDownloading] = useState(false);

  const downloadRemarks = async () => {
    setDownloading(true);
    try {
      const res = await api.get("/mentoring/report.pdf", {
        params: { from: range.from || undefined, to: range.to || undefined },
        responseType: "blob",
      });
      const named = /filename="([^"]+)"/.exec(res.headers["content-disposition"] || "")?.[1] || "Mentoring-Records.pdf";
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = named;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast.success(`Downloaded ${named}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not build the report");
    } finally {
      setDownloading(false);
    }
  }; // { id, tab, edit }

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/mentor/students");
      setStudents(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load your students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      `${s.name} ${s.enrollmentNumber || s.enrollmentNo || ""} ${s.email || ""} ${s.section || ""} ${s.mobile || ""} ${s.parentMobile || ""}`.toLowerCase().includes(q)
    );
  }, [students, search]);

  const onChanged = (updated) =>
    setStudents((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <Users className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">My TG Students</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              The students assigned to you as Tutor Guardian — you can set a new password for any of them.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {/* The remarks this TG has written, for whatever dates they pick. */}
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            From
            <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })}
              className="mt-1 block bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            To
            <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })}
              className="mt-1 block bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-normal normal-case tracking-normal" />
          </label>
          <button onClick={downloadRemarks} disabled={downloading}
            className="btn-premium text-xs px-3 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />} Remark report
          </button>
          <button onClick={load} className="btn-outline-premium text-xs px-3 py-2.5 flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : students.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          No students are assigned to you yet — the admin assigns a TG under Master Data › Assign Mentor.
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, enrollment, email or section…"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
              />
            </div>
            <span className="text-xs text-[var(--text-secondary)]">{filtered.length} of {students.length}</span>
          </div>

          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s._id} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)]">
                {s.profileImage ? (
                  <img src={getImageUrl(s.profileImage)} alt="" className="w-10 h-10 rounded-xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black">
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">{s.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] truncate">
                    {s.enrollmentNumber || s.enrollmentNo || "No enrollment"}
                    {s.email ? ` · ${s.email}` : ""}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {[s.department, s.semester ? `Sem ${s.semester}` : "", s.section ? `Sec ${s.section}` : "", s.batch].filter(Boolean).join(" · ")}
                  </div>
                  {/* The two numbers a TG actually reaches for, and where
                      their attendance stands. */}
                  <div className="text-[11px] mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Phone size={10} />
                      {s.mobile
                        ? <a href={`tel:${s.mobile}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--primary)]">{s.mobile}</a>
                        : <span className="italic">no mobile</span>}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Users size={10} /> Parent:
                      {s.parentMobile
                        ? <a href={`tel:${s.parentMobile}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--primary)]">{s.parentMobile}</a>
                        : <span className="italic">not on record</span>}
                    </span>
                  </div>
                  {/* The last thing said about this student and what was
                      done about it — the two lines a TG opens the page for.
                      Shown here so they do not have to open each profile to
                      remember where they left off. */}
                  <div className="text-[11px] mt-1.5 border-l-2 border-[var(--border-light)] pl-2">
                    {s.lastRemark ? (
                      <>
                        <div className="flex items-start gap-1 text-[var(--text-secondary)]">
                          <ClipboardList size={10} className="mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="font-bold text-[var(--text-primary)]">Last remark:</span>{" "}
                            <span className="line-clamp-2">{s.lastRemark.text || "—"}</span>
                          </span>
                        </div>
                        <div className="flex items-start gap-1 text-[var(--text-secondary)] mt-0.5">
                          <CheckCheck size={10} className="mt-0.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="font-bold text-[var(--text-primary)]">Action:</span>{" "}
                            {s.lastRemark.actionTaken
                              ? <span className="line-clamp-2">{s.lastRemark.actionTaken}</span>
                              : <span className="italic">nothing recorded</span>}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          {s.lastRemark.purpose ? `${s.lastRemark.purpose} · ` : ""}
                          {new Date(s.lastRemark.addedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          {s.lastRemark.editedAt ? " · edited" : ""}
                        </div>
                      </>
                    ) : (
                      <span className="text-[var(--text-secondary)] italic">No remark yet</span>
                    )}
                  </div>
                </div>

                {(() => {
                  const att = s.currentAttendance || { percent: s.attendancePercentage || 0, live: false };
                  const pct = Math.round(att.percent || 0);
                  return (
                    <div className="w-24 shrink-0">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                        <span>Attendance</span>
                        <span className={pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}>{pct}%</span>
                      </div>
                      <div className="h-1.5 mt-1 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border-light)]">
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <div className="text-[9px] text-[var(--text-secondary)] mt-0.5">
                        {att.live
                          ? `Sem ${att.semester}${att.totalDays ? ` · ${att.totalPresent}/${att.totalDays}` : ""}`
                          : "last recorded"}
                      </div>
                    </div>
                  );
                })()}
                {s.passwordChanged === false && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Must set own password
                  </span>
                )}
                {/* Icons only: the labels took the width the remark now
                    uses. Each keeps its tooltip and an aria-label, so what
                    the button does is still available to anybody who cannot
                    read the icon. */}
                <div className="flex items-center gap-1 shrink-0">
                  {[
                    [Pencil, "Edit profile", () => setProfile({ id: s._id, tab: "profile", edit: true })],
                    [ClipboardList, "Add or read remarks", () => setProfile({ id: s._id, tab: "remarks", edit: false })],
                    [KeyRound, "Set password", () => setTarget(s)],
                  ].map(([Icon, label, onClick]) => (
                    <button
                      key={label}
                      onClick={onClick}
                      title={label}
                      aria-label={label}
                      className="p-1.5 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No student matches that search.</p>}
          </div>
        </div>
      )}

      {target && <PasswordDialog student={target} onClose={() => setTarget(null)} onChanged={onChanged} />}

      {profile && (
        <StudentProfileModal
          isOpen
          studentId={profile.id}
          initialTab={profile.tab}
          startInEditMode={profile.edit}
          onClose={() => { setProfile(null); load(); }}
        />
      )}
    </div>
  );
}

const PasswordDialog = ({ student, onClose, onChanged }) => {
  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);
  const [emailStudent, setEmailStudent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { password, emailed }
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (password && password.trim().length < 6) return toast.error("Password must be at least 6 characters");
    setBusy(true);
    try {
      const { data } = await api.post(`/mentor/students/${student._id}/password`, {
        password: password.trim(),
        forceChange,
        emailStudent,
      });
      setResult({ password: data.password, emailed: data.emailed });
      onChanged(data.data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change the password");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — note it down manually");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-card w-full max-w-md rounded-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-black text-lg text-[var(--text-primary)]">Set password</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {student.name} · {student.enrollmentNumber || student.enrollmentNo || student.email}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        {result ? (
          <>
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <ShieldCheck size={16} /> Password changed
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm font-mono text-[var(--text-primary)] break-all">
                  {result.password}
                </code>
                <button onClick={copy} title="Copy" className="p-2 rounded-lg border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)]">
                  {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                {result.emailed ? "Also emailed to the student. " : ""}Give this to the student now — it is not shown again.
              </p>
            </div>
            <button onClick={onClose} className="btn-premium text-sm px-5 py-2.5 w-full">Done</button>
          </>
        ) : (
          <>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
              New password
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty to generate one"
                className="mt-1.5 w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
              />
            </label>

            <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" checked={forceChange} onChange={(e) => setForceChange(e.target.checked)} className="mt-0.5" />
              <span>Ask the student to choose their own password right after they log in <strong className="text-[var(--text-primary)]">(recommended)</strong></span>
            </label>
            <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" checked={emailStudent} onChange={(e) => setEmailStudent(e.target.checked)} className="mt-0.5" disabled={!student.email} />
              <span>Email it to {student.email || "the student"}{!student.email && " — no email on file"}</span>
            </label>

            <div className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-input)] rounded-xl p-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              This is recorded in the activity log. Only do it for a student who asked you.
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="text-sm font-bold px-4 py-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)]">Cancel</button>
              <button onClick={submit} disabled={busy} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Change password
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
