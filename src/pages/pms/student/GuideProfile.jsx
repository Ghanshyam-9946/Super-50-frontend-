import { useEffect, useState } from 'react';
import { X, Loader2, Mail, Phone, Award, BookOpen, Briefcase, Target, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { handleError } from '../../../api/pms/client';
import { getImageUrl } from '../../../utils/imageUrl';

// The guide's profile as a student sees it, with a match score against
// their own project's technology stack.
const ring = (score) => (score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-amber-600' : 'text-red-500');

const Section = ({ icon: Icon, title, children, empty }) => (
  <div className="space-y-2">
    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
      <Icon className="w-4 h-4 text-brand-600" /> {title}
    </h4>
    {children || <p className="text-xs text-slate-500">{empty}</p>}
  </div>
);

export default function GuideProfile({ guideId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/pms/student/guides/${guideId}`)
      .then((res) => setData(res.data))
      .catch((err) => { toast.error(handleError(err)); onClose(); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guideId]);

  const match = data?.match;
  const profile = data?.profile;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-3xl rounded-2xl p-6 my-8 space-y-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {loading || !data ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-600" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {data.guide.profileImage ? (
                  <img src={getImageUrl(data.guide.profileImage)} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-xl font-black">
                    {data.guide.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{data.guide.name}</h3>
                  <p className="text-sm text-slate-500">
                    {[data.guide.designation, data.guide.department].filter(Boolean).join(' · ')}
                  </p>
                  {profile?.headline && <p className="text-sm text-slate-700 mt-1">{profile.headline}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    {data.guide.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {data.guide.email}</span>}
                    {data.guide.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {data.guide.mobile}</span>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>

            {/* match score */}
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" /> Match with your project
                </h4>
                {match?.score === null ? (
                  <span className="text-xs text-slate-500">
                    {match.technologies.length === 0 ? 'Add your technology stack to see this' : 'Your guide has not listed any skills yet'}
                  </span>
                ) : (
                  <span className={`text-2xl font-black ${ring(match.score)}`}>{match.score}%</span>
                )}
              </div>

              {match?.score !== null && (
                <>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full ${match.score >= 70 ? 'bg-emerald-500' : match.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${match.score}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {match.matched.length} of {match.technologies.length} technologies in your project are covered by your guide&apos;s skills.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {match.matched.map((m) => (
                      <div key={m.tech} className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded-xl px-3 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate"><strong>{m.tech}</strong> — {m.skill}</span>
                      </div>
                    ))}
                    {match.missing.map((t) => (
                      <div key={t} className="flex items-center gap-2 text-xs bg-slate-100 text-slate-600 border border-slate-200 rounded-xl px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t} — not in their listed skills</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {!profile ? (
              <p className="text-sm text-slate-500">Your guide has not filled in their profile yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                <Section icon={Target} title="Skills" empty="No skills listed.">
                  {profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((s) => (
                        <span key={s} className="text-[11px] font-bold px-2 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-100">{s}</span>
                      ))}
                    </div>
                  )}
                </Section>

                <Section icon={Award} title="Qualifications" empty="Not listed.">
                  {profile.qualifications.length > 0 && (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {profile.qualifications.map((q) => (
                        <li key={q._id}>{[q.degree, q.specialization, q.institution, q.year].filter(Boolean).join(' · ')}</li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section icon={Briefcase} title="Experience" empty="Not listed.">
                  {profile.experience.length > 0 && (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {profile.experience.map((e) => (
                        <li key={e._id}>
                          <strong>{e.title}</strong>{e.organization ? ` — ${e.organization}` : ''}
                          {e.startDate ? ` (${e.startDate}${e.current ? ' – present' : e.endDate ? ` – ${e.endDate}` : ''})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                <Section icon={BookOpen} title="Publications & patents" empty="Not listed.">
                  {(profile.papersPublished.length > 0 || profile.patents.length > 0) && (
                    <ul className="text-xs text-slate-700 space-y-1">
                      {profile.papersPublished.map((p) => <li key={p._id}>{p.title}{p.journal ? ` — ${p.journal}` : ''}{p.year ? ` (${p.year})` : ''}</li>)}
                      {profile.patents.map((p) => <li key={p._id}>Patent: {p.title}{p.year ? ` (${p.year})` : ''}</li>)}
                    </ul>
                  )}
                </Section>

                {profile.bio && (
                  <div className="sm:col-span-2">
                    <Section icon={BookOpen} title="About">
                      <p className="text-xs text-slate-700 whitespace-pre-line">{profile.bio}</p>
                    </Section>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
