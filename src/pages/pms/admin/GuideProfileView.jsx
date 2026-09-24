import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { IdCard, Loader2, Download, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../services/api";
import { downloadFile } from "../../../utils/downloadFile";
import { getImageUrl } from "../../../utils/imageUrl";

// Read-only counterpart to faculty/MyProfile.jsx — same sections, no
// edit controls, fetched by userId instead of the logged-in user.
function ReadOnlySection({ title, items, renderSummary }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="glass-card p-5 rounded-2xl space-y-3">
      <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{title}</h3>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-3 text-xs">
            {renderSummary(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuideProfileView() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/faculty-profile/${userId}/view`)
      .then(({ data }) => {
        if (data.success) {
          setUser(data.user);
          setProfile(data.data);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [userId]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/faculty-profile/${userId}/pdf`, `${(user?.name || "Faculty").replace(/\s+/g, "-")}-Profile.pdf`);
    } catch {
      toast.error("Failed to download profile PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Faculty not found.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link to="/pms/admin/guides" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <ArrowLeft size={14} /> Back to Guides
      </Link>

      <header className="glass-card flex flex-wrap items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <IdCard size={26} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">{user.name}</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            {profile?.headline || user.designation || user.department}
          </p>
        </div>
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
        </button>
      </header>

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Basic Information</h3>
        <div className="flex items-center gap-4">
          {user.profileImage ? (
            <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-light)]" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-lg">
              {(user.name || "?").charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-[var(--text-primary)]">{user.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{user.designation || user.department} · {user.email}</div>
            {user.mobile && <div className="text-xs text-[var(--text-secondary)]">{user.mobile}</div>}
          </div>
        </div>
        {profile?.bio && <p className="text-sm text-[var(--text-secondary)]">{profile.bio}</p>}
      </div>

      {profile?.skills?.length > 0 && (
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="badge">{skill}</span>
            ))}
          </div>
        </div>
      )}

      <ReadOnlySection
        title="Qualifications"
        items={profile?.qualifications}
        renderSummary={(q) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{q.degree}</div>
            <div className="text-[var(--text-secondary)]">{[q.institution, q.specialization, q.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <ReadOnlySection
        title="Experience"
        items={profile?.experience}
        renderSummary={(e) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{[e.title, e.organization].filter(Boolean).join(" — ")}</div>
            <div className="text-[var(--text-secondary)]">{[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")}</div>
            {e.description && <div className="text-[var(--text-secondary)] mt-1">{e.description}</div>}
          </>
        )}
      />

      <ReadOnlySection
        title="Certifications"
        items={profile?.certifications}
        renderSummary={(c) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{c.title}</div>
            <div className="text-[var(--text-secondary)]">{[c.issuedBy, c.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <ReadOnlySection
        title="Papers Published"
        items={profile?.papersPublished}
        renderSummary={(p) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{p.title}</div>
            <div className="text-[var(--text-secondary)]">{[p.journal, p.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <ReadOnlySection
        title="Books Published"
        items={profile?.booksPublished}
        renderSummary={(b) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{b.title}</div>
            <div className="text-[var(--text-secondary)]">{[b.publisher, b.year, b.isbn && `ISBN ${b.isbn}`].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <ReadOnlySection
        title="Patents"
        items={profile?.patents}
        renderSummary={(p) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{p.title}</div>
            <div className="text-[var(--text-secondary)]">{[p.patentNumber, p.year, p.status].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <ReadOnlySection
        title="Conferences Attended"
        items={profile?.conferencesAttended}
        renderSummary={(c) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{c.title}</div>
            <div className="text-[var(--text-secondary)]">{[c.event, c.role, c.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <ReadOnlySection
        title="Other Activities"
        items={profile?.otherActivities}
        renderSummary={(a) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{a.title} {a.year && <span className="text-[var(--text-secondary)] font-medium">({a.year})</span>}</div>
            {a.description && <div className="text-[var(--text-secondary)] mt-1">{a.description}</div>}
          </>
        )}
      />
    </div>
  );
}
