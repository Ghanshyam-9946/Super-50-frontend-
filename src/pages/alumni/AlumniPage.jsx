import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, Briefcase, Lightbulb, CalendarDays, Users, Loader2, Plus, Search, Heart,
  Trash2, ExternalLink, MapPin, Building2, Video, X, UserPlus, Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";
import AlumniProfileModal from "./AlumniProfileModal";
import MyAlumniProfile from "./MyAlumniProfile";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }) : "";

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";
const labelCls = "flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

const TABS = [
  { key: "jobs", label: "Job Openings", icon: Briefcase, kind: "job" },
  { key: "tech", label: "Trending Tech", icon: Lightbulb, kind: "tech" },
  { key: "meets", label: "Alumni Meets", icon: CalendarDays, kind: "meet" },
  { key: "directory", label: "Alumni", icon: Users },
];

export default function AlumniPage() {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const roles = user?.roles?.length ? user.roles : [user?.role];
  const isAlumni = roles.includes("alumni");
  const isAdmin = roles.includes("admin");

  const [tab, setTab] = useState("jobs");
  const [posts, setPosts] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState(null); // 'job' | 'tech' | 'meet'
  const [openProfile, setOpenProfile] = useState(null);
  const [editingMine, setEditingMine] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const [p, a] = await Promise.all([api.get("/alumni/posts"), api.get("/alumni")]);
      setPosts(p.data.data || []);
      setAlumni(a.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the alumni board");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const kindOf = TABS.find((t) => t.key === tab)?.kind;
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (tab === "directory") {
      return alumni.filter((a) =>
        !q || `${a.user?.name} ${a.currentCompany} ${a.designation} ${(a.skills || []).join(" ")}`.toLowerCase().includes(q)
      );
    }
    return posts.filter((p) => p.kind === kindOf && (!q || `${p.title} ${p.company} ${p.body} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q)));
  }, [tab, kindOf, posts, alumni, search]);

  const like = async (post) => {
    try {
      const { data } = await api.post(`/alumni/posts/${post._id}/like`);
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, likeCount: data.likeCount, likedByMe: data.likedByMe } : p)));
    } catch { /* a like is not worth a toast */ }
  };

  const remove = async (post) => {
    if (!window.confirm("Remove this post?")) return;
    try {
      await api.delete(`/alumni/posts/${post._id}`);
      toast.success("Post removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove");
    }
  };

  const call = async (person) => {
    try {
      const { data } = await api.post("/meetings/call", { userId: person._id });
      toast.success(data.message);
      navigate(`/meetings/${data.roomCode}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start the call");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card p-6 md:p-8 rounded-3xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Alumni Network</h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Openings and advice from people who sat where you sit. Students can read everything and call an alumnus who is open to mentoring.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAlumni && (
            <button onClick={() => setEditingMine(true)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
              <Pencil size={13} /> My profile
            </button>
          )}
          {(isAlumni || isAdmin) && (
            <button
              onClick={() => setComposer(isAlumni ? (kindOf === "meet" ? "job" : kindOf || "job") : "meet")}
              className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5"
            >
              <Plus size={15} /> {isAlumni ? "Share something" : "Announce a meet"}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setPromoting(true)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
              <UserPlus size={13} /> Make alumni
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${
              tab === key ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)]"
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="glass-card px-4 py-2.5 rounded-2xl flex items-center gap-2">
        <Search size={15} className="text-[var(--text-secondary)]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]" />
      </div>

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : shown.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)]">
          Nothing here yet.
        </div>
      ) : tab === "directory" ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {shown.map((a) => (
            <div key={a._id} className="glass-card rounded-2xl p-5 flex items-start gap-4">
              {a.photo?.url ? (
                <img src={getImageUrl(a.photo.url)} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-xl font-black">
                  {a.user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[var(--text-primary)] truncate">{a.user?.name}</div>
                <div className="text-xs text-[var(--text-secondary)] truncate">{a.headline || a.designation || "Alumnus"}</div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex flex-wrap gap-2">
                  {a.currentCompany && <span className="flex items-center gap-1"><Building2 size={11} /> {a.currentCompany}</span>}
                  {a.location && <span className="flex items-center gap-1"><MapPin size={11} /> {a.location}</span>}
                  {a.passoutYear && <span>Batch {a.passoutYear}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setOpenProfile(a.user?._id)} className="btn-outline-premium text-[11px] px-3 py-1.5">View profile</button>
                  {a.openToMentoring && a.user?._id !== user?._id && (
                    <button onClick={() => call(a.user)} className="btn-premium text-[11px] px-3 py-1.5 flex items-center gap-1">
                      <Video size={11} /> Call
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((p) => (
            <div key={p._id} className="glass-card rounded-2xl p-5 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-[var(--text-primary)]">{p.title}</h3>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex flex-wrap gap-2">
                    <button onClick={() => setOpenProfile(p.author?._id)} className="font-bold hover:text-[var(--primary)]">
                      {p.author?.name}
                    </button>
                    <span>· {fmt(p.createdAt)}</span>
                    {p.kind === "job" && p.company && <span className="flex items-center gap-1"><Building2 size={11} /> {p.company}</span>}
                    {p.kind === "job" && p.location && <span className="flex items-center gap-1"><MapPin size={11} /> {p.location}</span>}
                    {p.kind === "job" && p.experience && <span>{p.experience}</span>}
                    {p.kind === "meet" && p.eventDate && <span className="flex items-center gap-1"><CalendarDays size={11} /> {fmt(p.eventDate)}</span>}
                    {p.kind === "meet" && p.venue && <span>{p.venue}</span>}
                  </div>
                </div>
                {(p.mine || isAdmin) && (
                  <button onClick={() => remove(p)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                )}
              </div>

              {p.body && <p className="text-sm text-[var(--text-primary)] whitespace-pre-line">{p.body}</p>}

              {(p.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">{t}</span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button onClick={() => like(p)} className={`text-xs font-bold flex items-center gap-1 ${p.likedByMe ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
                  <Heart size={13} fill={p.likedByMe ? "currentColor" : "none"} /> {p.likeCount || 0}
                </button>
                {(p.applyLink || p.link) && (
                  <a href={p.applyLink || p.link} target="_blank" rel="noreferrer"
                    className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline">
                    <ExternalLink size={12} /> {p.kind === "job" ? "Apply" : "Read more"}
                  </a>
                )}
                {p.kind === "job" && p.lastDate && (
                  <span className="text-[11px] text-amber-600 font-bold">Apply by {fmt(p.lastDate)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {composer && <Composer kind={composer} isAdmin={isAdmin} isAlumni={isAlumni} onClose={() => setComposer(null)} onDone={() => { setComposer(null); load(); }} />}
      {openProfile && <AlumniProfileModal userId={openProfile} onClose={() => setOpenProfile(null)} onCall={call} />}
      {editingMine && <MyAlumniProfile onClose={() => { setEditingMine(false); load(); }} />}
      {promoting && <PromotePanel onClose={() => { setPromoting(false); load(); }} />}
    </div>
  );
}

/* ---------------------------- the composer ---------------------------- */

const Composer = ({ kind: initial, isAdmin, isAlumni, onClose, onDone }) => {
  const [kind, setKind] = useState(initial);
  const [form, setForm] = useState({
    title: "", body: "", company: "", role: "", location: "", experience: "", applyLink: "",
    lastDate: "", tags: "", link: "", eventDate: "", venue: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/alumni/posts", {
        ...form,
        kind,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        lastDate: form.lastDate || null,
        eventDate: form.eventDate || null,
      });
      toast.success(data.message);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not post");
    } finally {
      setSaving(false);
    }
  };

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} className="glass-card w-full max-w-lg rounded-3xl p-6 my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-black text-lg text-[var(--text-primary)]">Share with the network</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        <div className="flex gap-2">
          {[
            ...(isAlumni ? [["job", "Job opening"], ["tech", "Trending tech"]] : []),
            ...(isAdmin ? [["meet", "Alumni meet"]] : []),
          ].map(([k, label]) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                kind === k ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border-light)] text-[var(--text-secondary)]"
              }`}>{label}</button>
          ))}
        </div>

        <label className={labelCls}>
          Title
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} required
            placeholder={kind === "job" ? "SDE-1 at Infosys — referral open" : kind === "tech" ? "Why everyone is moving to Rust" : "Alumni meet 2026"}
            className={`${inputCls} font-normal normal-case tracking-normal`} />
        </label>

        {kind === "job" && (
          <div className="grid sm:grid-cols-2 gap-3">
            {[["company", "Company"], ["role", "Role"], ["location", "Location"], ["experience", "Experience needed"]].map(([key, label]) => (
              <label key={key} className={labelCls}>
                {label}
                <input value={form[key]} onChange={(e) => set({ [key]: e.target.value })} className={`${inputCls} font-normal normal-case tracking-normal`} />
              </label>
            ))}
            <label className={labelCls}>
              Apply link
              <input value={form.applyLink} onChange={(e) => set({ applyLink: e.target.value })} placeholder="https://…" className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
            <label className={labelCls}>
              Last date
              <input type="date" value={form.lastDate} onChange={(e) => set({ lastDate: e.target.value })} className={inputCls} />
            </label>
          </div>
        )}

        {kind === "tech" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={labelCls}>
              Tags (comma separated)
              <input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="rust, systems" className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
            <label className={labelCls}>
              Link
              <input value={form.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
          </div>
        )}

        {kind === "meet" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={labelCls}>
              Date
              <input type="date" value={form.eventDate} onChange={(e) => set({ eventDate: e.target.value })} className={inputCls} />
            </label>
            <label className={labelCls}>
              Venue
              <input value={form.venue} onChange={(e) => set({ venue: e.target.value })} className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>
          </div>
        )}

        <label className={labelCls}>
          Details
          <textarea value={form.body} onChange={(e) => set({ body: e.target.value })} rows={4}
            className={`${inputCls} font-normal normal-case tracking-normal`} />
        </label>

        <button type="submit" disabled={saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Post
        </button>
      </form>
    </div>
  );
};

/* ------------------------- admin: make alumni ------------------------- */

const PromotePanel = ({ onClose }) => {
  const [students, setStudents] = useState([]);
  const [picked, setPicked] = useState([]);
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/alumni/students")
      .then(({ data }) => setStudents(data.data || []))
      .catch((err) => toast.error(err.response?.data?.message || "Could not load students"))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students.slice(0, 200);
    return students.filter((s) => `${s.name} ${s.enrollmentNumber} ${s.batch}`.toLowerCase().includes(q)).slice(0, 200);
  }, [students, search]);

  const promote = async () => {
    if (picked.length === 0) return toast.error("Pick at least one student");
    setSaving(true);
    try {
      const { data } = await api.post("/alumni/promote", { studentIds: picked, passoutYear: year });
      toast.success(data.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not promote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl rounded-3xl p-6 my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display font-black text-lg text-[var(--text-primary)]">Move students to the alumni network</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Their record stays exactly as it is — they simply get the alumni side of the app instead of the student side.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className={`${labelCls} flex-1 min-w-[200px]`}>
            Search
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, enrollment or batch"
              className={`${inputCls} font-normal normal-case tracking-normal`} />
          </label>
          <label className={labelCls}>
            Passout year
            <input value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} />
          </label>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {shown.map((s) => (
              <label key={s._id} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl border cursor-pointer ${
                picked.includes(s._id) ? "bg-[var(--primary)]/10 border-[var(--primary)]" : "bg-[var(--bg-input)] border-[var(--border-light)]"
              }`}>
                <input type="checkbox" checked={picked.includes(s._id)}
                  onChange={() => setPicked((p) => (p.includes(s._id) ? p.filter((x) => x !== s._id) : [...p, s._id]))} />
                <span className="truncate">
                  <strong className="text-[var(--text-primary)]">{s.name}</strong>
                  <span className="text-[var(--text-secondary)]"> · {s.enrollmentNumber || "no enrollment"} · {s.batch || "—"} · Sem {s.semester || "—"}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <button onClick={promote} disabled={saving || picked.length === 0} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Make {picked.length || ""} alumni
        </button>
      </div>
    </div>
  );
};
