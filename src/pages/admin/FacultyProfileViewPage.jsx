import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Building2, ChevronDown, ClipboardList, Clock, Download, ExternalLink, FileText,
  FlaskConical, FolderOpen, Gauge, GraduationCap, Layers, Loader2, Lock, Mail, MessageSquareText,
  NotebookText, Phone, Search, Star, UserRound, Users, Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { downloadFile } from "../../utils/downloadFile";
import { getFileUrl, getImageUrl } from "../../utils/imageUrl";
import EntryList from "../../components/profile/ProfileEntries";
import { PROFILE_SECTIONS } from "../../utils/facultyProfileSections";

const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const dateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ROLE_LABEL = { teacher: "Faculty", admin: "Admin", guide: "Guide", pms_admin: "PMS Admin", super50_admin: "Super 50 Admin", tp_admin: "T&P Admin" };
const TASK_STATUS = {
  pending: ["Pending", "bg-amber-500/10 text-amber-600"],
  on_track: ["On track", "bg-sky-500/10 text-sky-600"],
  complete: ["Complete", "bg-green-500/10 text-green-600"],
  reject: ["Rejected", "bg-red-500/10 text-red-500"],
};
const ACTIVITY_TYPE = { tick: "No Dues item", marks: "Marks", both: "Marks + No Dues" };

const card = "glass-card rounded-2xl";
const Empty = ({ children }) => (
  <div className="border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center text-sm text-[var(--text-secondary)]">{children}</div>
);
const SectionTitle = ({ icon: Icon, title, hint, right }) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex items-start gap-3 min-w-0">
      <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0"><Icon size={18} /></div>
      <div className="min-w-0">
        <h3 className="font-display font-bold text-base text-[var(--text-primary)]">{title}</h3>
        {hint && <p className="text-xs text-[var(--text-secondary)]">{hint}</p>}
      </div>
    </div>
    {right}
  </div>
);
const Stat = ({ label, value, onClick }) => (
  <button onClick={onClick} className="text-left px-4 py-3 rounded-2xl bg-[var(--bg-input)]/70 border border-[var(--border-light)] hover:border-[var(--primary)]/50 transition-colors min-w-[104px]">
    <div className="text-xl font-display font-black text-[var(--text-primary)]">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
  </button>
);
const FileLink = ({ url, children }) => (
  <a href={getFileUrl(url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:underline">
    <ExternalLink size={11} /> {children}
  </a>
);

/* ───────────────────────── Basic Information ───────────────────────── */

function BasicTab({ user, profile }) {
  const rows = [
    [Mail, "Email", user.email],
    [Phone, "Mobile", user.mobile],
    [Phone, "WhatsApp", user.whatsapp],
    [Building2, "Department", user.department],
    [UserRound, "Designation", user.designation],
    [Clock, "Date of joining SGI", profile.joiningDate],
    [Clock, "Teaching experience", profile.expTeaching],
    [Clock, "Industrial experience", profile.expIndustrial],
    [Clock, "Research experience", profile.expResearch],
    [Clock, "Account created", day(user.createdAt)],
  ].filter((r) => r[2]);
  const basicSections = PROFILE_SECTIONS.filter((s) => s.basic);
  return (
    <div className="space-y-6">
      <div className={`${card} p-5 space-y-4`}>
        <SectionTitle icon={UserRound} title="Basic Information" hint={profile.headline} />
        <div className="grid sm:grid-cols-2 gap-3">
          {rows.map(([Icon, label, value]) => (
            <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-input)]/60 border border-[var(--border-light)]">
              <Icon size={15} className="text-[var(--primary)] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">{label}</div>
                <div className="text-sm font-bold text-[var(--text-primary)] break-words">{value}</div>
              </div>
            </div>
          ))}
        </div>
        {(user.responsibilities || []).length > 0 && (
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1.5">Responsibilities</div>
            <div className="flex flex-wrap gap-1.5">
              {user.responsibilities.map((r) => (
                <span key={r} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600">{r}</span>
              ))}
            </div>
          </div>
        )}
        {profile.bio && (
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1">About</div>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{profile.bio}</p>
          </div>
        )}
      </div>
      {basicSections.map((s) => (
        <div key={s.key} className={`${card} p-5 space-y-4`}>
          <SectionTitle icon={s.icon} title={s.title} />
          <EntryList section={s} items={profile[s.key] || []} emptyText={`No ${s.title.toLowerCase()} added by the faculty yet.`} />
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Weekly Report ─────────────────────────── */

function WeeklyTab({ weekly }) {
  const [open, setOpen] = useState(weekly[0]?._id || null);
  const hours = Math.round(weekly.reduce((n, w) => n + w.hours, 0) * 10) / 10;
  return (
    <div className={`${card} p-5 space-y-4`}>
      <SectionTitle icon={ClipboardList} title="Weekly Report" hint={`Last ${weekly.length} week(s) on record · ${hours} hours logged`} />
      {weekly.length === 0 ? <Empty>No weekly report has been filled yet.</Empty> : (
        <div className="space-y-2">
          {weekly.map((w) => {
            const isOpen = open === w._id;
            return (
              <div key={w._id} className="border border-[var(--border-light)] rounded-2xl overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : w._id)} className="w-full flex flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-input)]/60">
                  <ChevronDown size={15} className={`text-[var(--text-secondary)] transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  <span className="font-bold text-sm text-[var(--text-primary)]">Week ending {day(w.weekOf)}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${w.status === "draft" ? "bg-amber-500/10 text-amber-600" : "bg-green-500/10 text-green-600"}`}>
                    {w.status === "draft" ? "Draft" : w.autoSubmitted ? "Auto-submitted" : "Submitted"}
                  </span>
                  <span className="ml-auto text-xs text-[var(--text-secondary)]">{w.tasks.length} entr{w.tasks.length === 1 ? "y" : "ies"} · {w.hours} h</span>
                </button>
                {isOpen && (
                  <div className="overflow-x-auto border-t border-[var(--border-light)]">
                    <table className="w-full text-xs min-w-[640px]">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                          <th className="px-4 py-2">Work</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2">Hours</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {w.tasks.map((t, i) => {
                          const [label, cls] = TASK_STATUS[t.status] || [t.status, ""];
                          return (
                            <tr key={i} className="border-t border-[var(--border-light)]">
                              <td className="px-4 py-2 font-bold text-[var(--text-primary)]">{t.taskName}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{day(t.date)}</td>
                              <td className="px-4 py-2 whitespace-nowrap">{t.timeFrom}–{t.timeTo}</td>
                              <td className="px-4 py-2">{t.totalHours}</td>
                              <td className="px-4 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cls}`}>{label}</span></td>
                              <td className="px-4 py-2 text-[var(--text-secondary)]">
                                {t.note || "—"}
                                {t.expectedCompletionDate && t.status !== "complete" && <div>Expected by {day(t.expectedCompletionDate)}</div>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────── Mentoring System ────────────────────────── */

function MentoringTab({ mentoring, facultyName }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(mentoring[0]?._id || null);
  const [onlyMine, setOnlyMine] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? mentoring.filter((m) => `${m.name} ${m.enrollmentNumber}`.toLowerCase().includes(q)) : mentoring;
  }, [mentoring, query]);
  const student = mentoring.find((m) => m._id === selected);
  const remarks = student ? student.remarks.filter((r) => !onlyMine || r.byThisFaculty) : [];
  const total = mentoring.reduce((n, m) => n + m.remarksByFaculty, 0);
  const without = mentoring.filter((m) => m.remarks.length === 0).length;

  return (
    <div className={`${card} p-5 space-y-4`}>
      <SectionTitle
        icon={Users}
        title="Mentoring System"
        hint={`${mentoring.length} student(s) assigned · ${total} remark(s) written by ${facultyName} · ${without} student(s) with no remark yet`}
      />
      {mentoring.length === 0 ? <Empty>No students are assigned to this faculty as mentor (TG).</Empty> : (
        <div className="grid md:grid-cols-[280px_1fr] gap-4 items-start">
          <div className="border border-[var(--border-light)] rounded-2xl overflow-hidden">
            <div className="p-2 border-b border-[var(--border-light)] relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search student"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg pl-8 pr-3 py-2 text-xs" />
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {list.map((m) => (
                <button key={m._id} onClick={() => setSelected(m._id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-[var(--border-light)] last:border-0 ${selected === m._id ? "bg-[var(--primary)]/10" : "hover:bg-[var(--bg-input)]/60"}`}>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">{m.name}</div>
                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                      {[m.enrollmentNumber, m.semester && `Sem ${m.semester}`, m.section && `Sec ${m.section}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${m.remarks.length ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-red-500/10 text-red-500"}`}>
                    {m.remarks.length}
                  </span>
                </button>
              ))}
              {list.length === 0 && <div className="p-4 text-xs text-center text-[var(--text-secondary)]">No student matches.</div>}
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            {student && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">{student.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {[student.enrollmentNumber, student.batch, student.semester && `Sem ${student.semester}`, student.section && `Section ${student.section}`].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
                    <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
                    Only remarks by {facultyName}
                  </label>
                </div>
                {remarks.length === 0 ? <Empty>{student.remarks.length ? "No remark by this faculty for this student." : "No remark has been written for this student yet."}</Empty> : (
                  <div className="space-y-2.5">
                    {remarks.map((r) => (
                      <div key={r._id} className="border border-[var(--border-light)] rounded-2xl p-4 space-y-2 bg-[var(--bg-input)]/50">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {r.purpose && <span className="font-bold px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">{r.purpose}</span>}
                          <span className="text-[var(--text-secondary)]">{dateTime(r.addedAt)}</span>
                          <span className={`font-bold ${r.byThisFaculty ? "text-green-600" : "text-[var(--text-secondary)]"}`}>by {r.addedBy || "—"}</span>
                          {r.editedAt && <span className="text-amber-600">edited {day(r.editedAt)}</span>}
                        </div>
                        {r.text && <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{r.text}</p>}
                        {r.actionTaken && (
                          <p className="text-xs text-[var(--text-secondary)]"><b className="text-[var(--text-primary)]">Action taken:</b> {r.actionTaken}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Academic ───────────────────────────── */

const SUBJECT_TABS = [
  ["overview", "Overview", Layers], ["activities", "Assignments & Activities", ClipboardList], ["notes", "Notes", NotebookText],
  ["qb", "Question Bank", FileText], ["sessional", "Sessional", GraduationCap], ["coverage", "Course Coverage", Gauge],
  ["file", "Course File", FolderOpen], ["feedback", "Feedback", Star],
];

function FileTable({ files, empty }) {
  if (!files.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-1.5">
      {files.map((f, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)]/50 text-xs">
          <FileText size={13} className="text-[var(--primary)] shrink-0" />
          <span className="font-bold text-[var(--text-primary)]">{f.title || f.fileName || "File"}</span>
          {f.unit > 0 && <span className="text-[var(--text-secondary)]">Unit {f.unit}</span>}
          <span className="text-[var(--text-secondary)] ml-auto">{day(f.uploadedAt)}</span>
          <FileLink url={f.url}>Open</FileLink>
        </div>
      ))}
    </div>
  );
}

function SubjectCard({ s }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const students = s.sessional.reduce((n, c) => n + c.students, 0);
  const courseFiles = s.courseFile.reduce((n, c) => n + c.files.length, 0);
  const chips = [
    [`${s.sections.length} section(s)`, true],
    [`${s.activities.length} activities`, s.activities.length > 0],
    [`${s.notes.length} notes`, s.notes.length > 0],
    [`${s.questionBanks.length} question bank`, s.questionBanks.length > 0],
    [`Sessional: ${students} students`, students > 0],
    [`Coverage: ${s.coverage.length}`, s.coverage.length > 0],
    [`Course file: ${courseFiles}`, courseFiles > 0],
  ];
  const counts = { activities: s.activities.length, notes: s.notes.length, qb: s.questionBanks.length, sessional: s.sessional.length, coverage: s.coverage.length, file: courseFiles, feedback: s.feedback.length };

  return (
    <div className="border border-[var(--border-light)] rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left p-4 hover:bg-[var(--bg-input)]/50 space-y-2.5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
            {s.hasLab ? <FlaskConical size={18} /> : <BookOpen size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm text-[var(--text-primary)]">
              {s.code ? `${s.code} — ` : ""}{s.name}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {[s.semester && `Semester ${s.semester}`, s.hours && `${s.hours.theory || s.hours.lectures} theory hrs`, s.hasLab && `${s.hours.practical} practical hrs`].filter(Boolean).join(" · ")}
              {!s.inCatalogue && <span className="text-amber-600"> · not linked to the Subject master</span>}
            </div>
          </div>
          <ChevronDown size={16} className={`text-[var(--text-secondary)] transition-transform mt-1 ${open ? "" : "-rotate-90"}`} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chips.map(([text, ok]) => (
            <span key={text} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${ok ? "bg-green-500/10 text-green-600" : "bg-[var(--border-light)] text-[var(--text-secondary)]"}`}>{text}</span>
          ))}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border-light)] p-4 space-y-4">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {SUBJECT_TABS.map(([key, label, Icon]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap border ${tab === key ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border-light)] text-[var(--text-primary)]"}`}>
                <Icon size={12} /> {label}
                {counts[key] !== undefined && <span className={tab === key ? "opacity-80" : "text-[var(--text-secondary)]"}>({counts[key]})</span>}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1.5">Classes taught</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.sections.map((c, i) => (
                    <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-input)]/60">
                      {c.batch} · Sem {c.semester} · Section {c.section}
                      <span className="text-[var(--text-secondary)] font-medium"> — {c.role}</span>
                    </span>
                  ))}
                </div>
              </div>
              {[["Course Outcomes (Theory)", s.courseOutcomes], ["Course Outcomes (Lab)", s.labCourseOutcomes]].filter(([, list]) => list.length).map(([title, list]) => (
                <div key={title}>
                  <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1.5">
                    {title} — {list.filter(Boolean).length} of {list.length} written
                  </div>
                  <ol className="space-y-1 text-xs">
                    {list.map((co, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-bold text-[var(--text-secondary)] shrink-0">CO{i + 1}</span>
                        <span className={co ? "text-[var(--text-primary)]" : "text-red-500"}>{co || "Not written"}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {tab === "activities" && (s.activities.length === 0 ? <Empty>No assignment or activity has been set up for this subject.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="py-2 pr-3">Activity</th><th className="py-2 pr-3">Used for</th><th className="py-2 pr-3">Max marks</th>
                    <th className="py-2 pr-3">Deadline</th><th className="py-2">Attachment</th>
                  </tr>
                </thead>
                <tbody>
                  {s.activities.map((a, i) => (
                    <tr key={i} className="border-t border-[var(--border-light)]">
                      <td className="py-2 pr-3 font-bold text-[var(--text-primary)]">{a.label}{a.unitWise ? " (unit-wise)" : ""}</td>
                      <td className="py-2 pr-3">{ACTIVITY_TYPE[a.type] || a.type}</td>
                      <td className="py-2 pr-3">{a.type === "tick" ? "—" : a.maxMarks}</td>
                      <td className="py-2 pr-3">{a.deadline ? day(a.deadline) : "—"}</td>
                      <td className="py-2">{a.pdfUrl ? <FileLink url={a.pdfUrl}>{a.pdfFileName || "Open"}</FileLink> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!s.activitiesAreOwn && <p className="text-[11px] text-[var(--text-secondary)] mt-2">These are the subject's default activities — the faculty has not made their own list.</p>}
            </div>
          ))}

          {tab === "notes" && <FileTable files={s.notes} empty="This faculty has not uploaded any notes for this subject." />}
          {tab === "qb" && <FileTable files={s.questionBanks} empty="This faculty has not uploaded a question bank for this subject." />}

          {tab === "sessional" && (s.sessional.length === 0 ? <Empty>No sessional marks sheet exists for this faculty in this subject.</Empty> : (
            <div className="space-y-2.5">
              {s.sessional.map((c, i) => (
                <div key={i} className="border border-[var(--border-light)] rounded-xl p-3 space-y-2 bg-[var(--bg-input)]/50">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[var(--text-primary)]">{c.batch} · Sem {c.semester} · Section {c.section}</span>
                    <span className="text-[var(--text-secondary)]">{c.students} student(s)</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${c.locked === c.students ? "text-green-600" : "text-amber-600"}`}>
                      <Lock size={11} /> {c.locked} of {c.students} locked
                    </span>
                    <span className="ml-auto text-[var(--text-secondary)]">Avg CA {c.avgCa10}/10 · Avg final {c.avgFinal30}/30</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.categories.length === 0 && <span className="text-[11px] text-red-500">No CA marks entered yet</span>}
                    {c.categories.map((cat) => (
                      <span key={cat.label} className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${cat.count === c.students ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {cat.label}: {cat.count}/{c.students}
                      </span>
                    ))}
                    {s.hasLab && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${c.labFilled === c.students ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"}`}>
                        Lab: {c.labFilled}/{c.students}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {tab === "coverage" && (s.coverage.length === 0 ? <Empty>No course coverage form has been filled for this subject.</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="py-2 pr-3">Form</th><th className="py-2 pr-3">Total lectures</th><th className="py-2 pr-3">Completed</th>
                    <th className="py-2 pr-3">Units covered</th><th className="py-2 pr-3">Planned for MST</th><th className="py-2">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {s.coverage.map((c, i) => (
                    <tr key={i} className="border-t border-[var(--border-light)]">
                      <td className="py-2 pr-3 font-bold text-[var(--text-primary)]">{c.form || `MST ${c.round}`}</td>
                      <td className="py-2 pr-3">{c.totalLectures}</td>
                      <td className="py-2 pr-3">{c.completedTillDate ?? "—"}</td>
                      <td className="py-2 pr-3">{c.unitCovered || "—"}</td>
                      <td className="py-2 pr-3">{(c.round === 2 ? c.lecturesForMst2 : c.lecturesForMst1) ?? "—"}</td>
                      <td className="py-2">{day(c.submittedAt)}{c.late && <span className="text-amber-600 font-bold"> · late</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {tab === "file" && (courseFiles === 0 ? <Empty>Nothing has been uploaded to the course file for this subject.</Empty> : (
            <div className="space-y-3">
              {s.courseFile.map((c) => (
                <div key={c.kind}>
                  <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-1.5">{c.kind === "lab" ? "Lab" : "Theory"} course file — {c.files.length} file(s)</div>
                  <FileTable files={c.files} empty="No files." />
                </div>
              ))}
            </div>
          ))}

          {tab === "feedback" && (s.feedback.length === 0 ? <Empty>No student feedback has been collected for this subject.</Empty> : (
            <div className="flex flex-wrap gap-3">
              {s.feedback.map((f) => (
                <div key={f.kind} className="px-4 py-3 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-input)]/50">
                  <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">{f.kind === "lab" ? "Lab" : "Theory"} feedback</div>
                  <div className={`text-xl font-display font-black ${f.avg >= 4 ? "text-green-600" : f.avg >= 3 ? "text-amber-600" : "text-red-500"}`}>{f.avg.toFixed(2)} / 5</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{f.ratings} rating(s)</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AcademicTab({ academic }) {
  return (
    <div className={`${card} p-5 space-y-4`}>
      <SectionTitle icon={GraduationCap} title="Academic — Allotted Subjects" hint={`${academic.length} subject(s). Click a subject to see everything about it.`} />
      {academic.length === 0 ? <Empty>No subject is allotted to this faculty.</Empty> : (
        <div className="space-y-3">{academic.map((s) => <SubjectCard key={`${s.code}|${s.name}`} s={s} />)}</div>
      )}
    </div>
  );
}

/* ─────────────────────────── Skills, papers ─────────────────────────── */

function ScholarPapers({ user }) {
  const papers = user.publications || [];
  if (!user.scholarUrl && papers.length === 0) return null;
  return (
    <div className={`${card} p-5 space-y-3`}>
      <SectionTitle
        icon={GraduationCap}
        title="Fetched from Google Scholar"
        hint={`${papers.length} paper(s)${user.publicationsSyncedAt ? ` · last fetched ${day(user.publicationsSyncedAt)}` : ""}`}
        right={user.scholarUrl && (
          <a href={user.scholarUrl} target="_blank" rel="noreferrer" className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
            <ExternalLink size={12} /> Scholar profile
          </a>
        )}
      />
      {papers.length === 0 ? <Empty>The Scholar link is saved, but no papers have been fetched from it.</Empty> : (
        <div className="space-y-2">
          {papers.map((p) => (
            <div key={p._id} className="px-4 py-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)]/50">
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.title}</a> : p.title}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {[p.authors, p.venue, p.year, p.citations != null && `${p.citations} citation(s)`].filter(Boolean).join(" · ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── page ─────────────────────────────── */

export default function FacultyProfileViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("basic");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTab("basic");
    api.get(`/faculty-profile/${id}/overview`)
      .then(({ data: res }) => setData(res.data))
      .catch((err) => { toast.error(err.response?.data?.message || "Could not load this faculty's profile"); setData(null); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={28} /></div>;
  }
  if (!data) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className={`${card} p-10 text-center space-y-3`}>
          <p className="text-sm text-[var(--text-secondary)]">This faculty profile could not be opened.</p>
          <button onClick={() => navigate(-1)} className="btn-outline-premium text-xs px-4 py-2">Go back</button>
        </div>
      </div>
    );
  }

  const { user, profile, weekly, mentoring, academic } = data;
  const sections = PROFILE_SECTIONS.filter((s) => !s.basic);
  const papers = (profile.papersPublished || []).length + (user.publications || []).length;
  const countOf = (key) => (key === "papersPublished" ? papers : (profile[key] || []).length);

  const tabs = [
    { key: "basic", title: "Basic Information", icon: UserRound },
    { key: "weekly", title: "Weekly Report", icon: ClipboardList, count: weekly.length },
    { key: "mentoring", title: "Mentoring System", icon: MessageSquareText, count: mentoring.length },
    { key: "academic", title: "Academic", icon: GraduationCap, count: academic.length },
    { key: "skills", title: "Skills", icon: Wrench, count: profile.skills.length },
    ...sections.map((s) => ({ key: s.key, title: s.title, icon: s.icon, count: countOf(s.key) })),
  ];
  const section = sections.find((s) => s.key === tab);
  const roles = user.roles?.length ? user.roles : [user.role];

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/faculty-profile/${id}/pdf`, `${(user.name || "Faculty").replace(/\s+/g, "-")}-Profile.pdf`);
    } catch {
      toast.error("Failed to download the profile PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Who this is, and the numbers that open each part. */}
      <header className={`${card} p-6 md:p-8 rounded-3xl space-y-5`}>
        <div className="flex flex-wrap items-start gap-5">
          <button onClick={() => navigate(-1)} title="Back" className="p-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)]">
            <ArrowLeft size={18} />
          </button>
          {user.profileImage ? (
            <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-20 h-20 rounded-3xl object-cover border border-[var(--border-light)]" />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-display font-black text-3xl">
              {(user.name || "?").charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-[220px] space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">{user.name}</h1>
              {user.isActive === false && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-red-500/10 text-red-500">Inactive</span>}
            </div>
            <div className="text-sm text-[var(--text-secondary)] font-medium">
              {profile.headline || [user.designation, user.department].filter(Boolean).join(" · ") || "Faculty"}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
              {user.email && <span className="flex items-center gap-1"><Mail size={12} /> {user.email}</span>}
              {user.mobile && <span className="flex items-center gap-1"><Phone size={12} /> {user.mobile}</span>}
              {user.department && <span className="flex items-center gap-1"><Building2 size={12} /> {user.department}</span>}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {roles.map((r) => (
                <span key={r} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">{ROLE_LABEL[r] || r}</span>
              ))}
            </div>
          </div>
          <button onClick={downloadPdf} disabled={downloading} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Profile PDF
          </button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Stat label="Subjects" value={academic.length} onClick={() => setTab("academic")} />
          <Stat label="TG students" value={mentoring.length} onClick={() => setTab("mentoring")} />
          <Stat label="Weekly reports" value={weekly.length} onClick={() => setTab("weekly")} />
          <Stat label="Research papers" value={papers} onClick={() => setTab("papersPublished")} />
          <Stat label="Certifications" value={countOf("certifications")} onClick={() => setTab("certifications")} />
          <Stat label="Patents" value={countOf("patents")} onClick={() => setTab("patents")} />
          <Stat label="Projects" value={countOf("projects")} onClick={() => setTab("projects")} />
        </div>
      </header>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6 items-start">
        <nav className={`${card} p-2 flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-4`}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left whitespace-nowrap lg:whitespace-normal transition-colors ${
                tab === t.key ? "bg-[var(--primary)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
              }`}>
              <t.icon size={15} className="shrink-0" />
              <span className="flex-1">{t.title}</span>
              {t.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${tab === t.key ? "bg-white/20" : "bg-[var(--border-light)] text-[var(--text-secondary)]"}`}>{t.count}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="space-y-6 min-w-0">
          {tab === "basic" && <BasicTab user={user} profile={profile} />}
          {tab === "weekly" && <WeeklyTab weekly={weekly} />}
          {tab === "mentoring" && <MentoringTab mentoring={mentoring} facultyName={user.name} />}
          {tab === "academic" && <AcademicTab academic={academic} />}
          {tab === "skills" && (
            <div className={`${card} p-5 space-y-4`}>
              <SectionTitle icon={Wrench} title="Skills" />
              {profile.skills.length === 0 ? <Empty>No skills added by the faculty yet.</Empty> : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((s) => (
                    <span key={s} className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">{s}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {section && (
            <>
              <div className={`${card} p-5 space-y-4`}>
                <SectionTitle icon={section.icon} title={section.title} hint={`${(profile[section.key] || []).length} entr${(profile[section.key] || []).length === 1 ? "y" : "ies"} filled in by the faculty`} />
                <EntryList section={section} items={profile[section.key] || []} emptyText={`Nothing added under ${section.title} by the faculty yet.`} />
              </div>
              {section.key === "papersPublished" && <ScholarPapers user={user} />}
            </>
          )}
        </div>
      </div>

      <p className="text-[11px] text-center text-[var(--text-secondary)]">
        Skills, certifications, publications and the other profile sections are filled in by the faculty from their own My Profile page; this page only shows them.
      </p>
    </div>
  );
}
