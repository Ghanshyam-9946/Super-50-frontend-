import { useEffect, useState } from "react";
import {
  X, Loader2, Building2, MapPin, Linkedin, Github, Globe, Video, Target, Route, Lightbulb, Briefcase,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";

// One alumnus as a current student reads it: where they are now, how they
// got there, and the way to reach them.
const Section = ({ icon: Icon, title, children }) => (
  <div className="space-y-1.5">
    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
      <Icon size={14} className="text-[var(--primary)]" /> {title}
    </h4>
    {children}
  </div>
);

export default function AlumniProfileModal({ userId, onClose, onCall }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/alumni/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) => { toast.error(err.response?.data?.message || "Could not load the profile"); onClose(); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const p = data?.data;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl rounded-3xl p-6 my-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        {loading || !p ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {p.photo?.url ? (
                  <img src={getImageUrl(p.photo.url)} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-2xl font-black">
                    {p.user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-display font-black text-[var(--text-primary)]">{p.user?.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{p.headline || p.designation}</p>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap gap-3">
                    {p.currentCompany && <span className="flex items-center gap-1"><Building2 size={12} /> {p.currentCompany}</span>}
                    {p.location && <span className="flex items-center gap-1"><MapPin size={12} /> {p.location}</span>}
                    {p.passoutYear && <span>Batch of {p.passoutYear}</span>}
                    {p.branch && <span>{p.branch}</span>}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {p.linkedin && <a href={p.linkedin} target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)]"><Linkedin size={15} /></a>}
                    {p.github && <a href={p.github} target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)]"><Github size={15} /></a>}
                    {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--primary)]"><Globe size={15} /></a>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
            </div>

            {p.openToMentoring && onCall && (
              <button onClick={() => onCall(p.user)} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5">
                <Video size={15} /> Start a call
              </button>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              {p.about && (
                <div className="sm:col-span-2">
                  <Section icon={Lightbulb} title="About">
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{p.about}</p>
                  </Section>
                </div>
              )}
              {p.myJourney && (
                <div className="sm:col-span-2">
                  <Section icon={Route} title="My journey">
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{p.myJourney}</p>
                  </Section>
                </div>
              )}
              {p.adviceForStudents && (
                <div className="sm:col-span-2">
                  <Section icon={Target} title="Advice for juniors">
                    <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{p.adviceForStudents}</p>
                  </Section>
                </div>
              )}
              {(p.skills || []).length > 0 && (
                <Section icon={Target} title="Skills">
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills.map((s) => (
                      <span key={s} className="text-[11px] font-bold px-2 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">{s}</span>
                    ))}
                  </div>
                </Section>
              )}
              {(p.experience || []).length > 0 && (
                <Section icon={Briefcase} title="Experience">
                  <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                    {p.experience.map((e) => (
                      <li key={e._id}>
                        <strong className="text-[var(--text-primary)]">{e.title}</strong>{e.organization ? ` — ${e.organization}` : ""}
                        {e.startYear ? ` (${e.startYear}${e.current ? " – present" : e.endYear ? ` – ${e.endYear}` : ""})` : ""}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {(data.posts || []).length > 0 && (
              <div className="border-t border-[var(--border-light)] pt-4 space-y-2">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">What they have shared</h4>
                {data.posts.slice(0, 5).map((post) => (
                  <div key={post._id} className="text-xs bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
                    <span className="font-bold text-[var(--text-primary)]">{post.title}</span>
                    <span className="text-[var(--text-secondary)]"> · {post.kind === "job" ? "opening" : post.kind === "tech" ? "tech" : "meet"}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
