import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { IdCard, Loader2, Plus, Trash2, Download, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { downloadFile } from "../../utils/downloadFile";
import { getImageUrl } from "../../utils/imageUrl";
import ProfileEditModal from "../../components/ProfileEditModal";

// Every section below (Qualifications, Experience, ..., Other Activities)
// is an array of small objects with different field shapes but an
// identical add/list/remove interaction — one generic repeater handles
// all 8, rather than hand-writing 8 near-identical card blocks.
function RepeaterSection({ title, items, fields, renderSummary, onChange }) {
  const emptyEntry = () => Object.fromEntries(fields.map((f) => [f.key, f.type === "checkbox" ? false : ""]));
  const [draft, setDraft] = useState(emptyEntry());
  const [adding, setAdding] = useState(false);

  const startAdd = () => {
    setDraft(emptyEntry());
    setAdding(true);
  };

  const confirmAdd = () => {
    const requiredKey = fields[0].key;
    if (!draft[requiredKey]?.toString().trim()) {
      return toast.error(`${fields[0].label} is required`);
    }
    onChange([...items, draft]);
    setAdding(false);
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="glass-card p-5 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{title}</h3>
        {!adding && (
          <button onClick={startAdd} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {items.length === 0 && !adding && <p className="text-xs text-[var(--text-secondary)]">Nothing added yet.</p>}

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-xl p-3">
            <div className="flex-1 text-xs">{renderSummary(item)}</div>
            <button onClick={() => remove(idx)}>
              <Trash2 size={14} className="text-red-400" />
            </button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="border-t border-[var(--border-light)] pt-3 space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            {fields.map((f) =>
              f.type === "checkbox" ? (
                <label key={f.key} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <input type="checkbox" checked={!!draft[f.key]} onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))} />
                  {f.label}
                </label>
              ) : f.type === "textarea" ? (
                <textarea
                  key={f.key}
                  placeholder={f.label}
                  value={draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  rows={2}
                  className="sm:col-span-2 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                />
              ) : (
                <input
                  key={f.key}
                  placeholder={f.label}
                  value={draft[f.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2.5 py-1.5 text-xs"
                />
              )
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={confirmAdd} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)]">
              Add Entry
            </button>
            <button onClick={() => setAdding(false)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyProfile = () => ({
  headline: "", bio: "", skills: [], qualifications: [], experience: [], certifications: [],
  papersPublished: [], booksPublished: [], patents: [], conferencesAttended: [], otherActivities: [],
});

export default function MyProfile() {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(emptyProfile());
  const [skillDraft, setSkillDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/faculty-profile/mine");
      if (data.success) setProfile({ ...emptyProfile(), ...data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addSkill = () => {
    const trimmed = skillDraft.trim();
    if (!trimmed) return;
    if (profile.skills.includes(trimmed)) return setSkillDraft("");
    setProfile((p) => ({ ...p, skills: [...p.skills, trimmed] }));
    setSkillDraft("");
  };
  const removeSkill = (skill) => setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/faculty-profile/mine", profile);
      if (data.success) {
        toast.success(data.message || "Profile saved");
        setProfile({ ...emptyProfile(), ...data.data });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadFile("/faculty-profile/mine/pdf", `${(user?.name || "Faculty").replace(/\s+/g, "-")}-Profile.pdf`);
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

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <IdCard size={26} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">My Profile</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Build a rich profile — Skills, Qualifications, Experience, Publications and more — then export it as a designed PDF anytime.
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

      {/* Basic Information */}
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Basic Information</h3>
          <button onClick={() => setEditModalOpen(true)} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
            <Pencil size={12} /> Edit
          </button>
        </div>
        <div className="flex items-center gap-4">
          {user?.profileImage ? (
            <img src={getImageUrl(user.profileImage)} alt={user.name} className="w-16 h-16 rounded-2xl object-cover border border-[var(--border-light)]" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-secondary)] font-bold text-lg">
              {(user?.name || "?").charAt(0)}
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-[var(--text-primary)]">{user?.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{user?.designation || user?.department} · {user?.email}</div>
          </div>
        </div>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          Headline
          <input
            value={profile.headline}
            onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
            placeholder="e.g. Associate Professor, CSE | Distributed Systems Researcher"
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
          About / Bio
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm"
          />
        </label>
      </div>

      {/* Skills */}
      <div className="glass-card p-5 rounded-2xl space-y-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span key={skill} className="badge flex items-center gap-1.5">
              {skill}
              <button onClick={() => removeSkill(skill)}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            placeholder="e.g. Node.js"
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm flex-1"
          />
          <button onClick={addSkill} className="text-xs font-bold px-3 py-2 rounded-lg border border-[var(--border-light)] flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      <RepeaterSection
        title="Qualifications"
        items={profile.qualifications}
        onChange={(items) => setProfile((p) => ({ ...p, qualifications: items }))}
        fields={[
          { key: "degree", label: "Degree" }, { key: "institution", label: "Institution" },
          { key: "specialization", label: "Specialization" }, { key: "year", label: "Year" },
        ]}
        renderSummary={(q) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{q.degree}</div>
            <div className="text-[var(--text-secondary)]">{[q.institution, q.specialization, q.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <RepeaterSection
        title="Experience"
        items={profile.experience}
        onChange={(items) => setProfile((p) => ({ ...p, experience: items }))}
        fields={[
          { key: "title", label: "Title" }, { key: "organization", label: "Organization" },
          { key: "startDate", label: "Start Year" }, { key: "endDate", label: "End Year" },
          { key: "current", label: "Currently working here", type: "checkbox" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        renderSummary={(e) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{[e.title, e.organization].filter(Boolean).join(" — ")}</div>
            <div className="text-[var(--text-secondary)]">{[e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")}</div>
            {e.description && <div className="text-[var(--text-secondary)] mt-1">{e.description}</div>}
          </>
        )}
      />

      <RepeaterSection
        title="Certifications"
        items={profile.certifications}
        onChange={(items) => setProfile((p) => ({ ...p, certifications: items }))}
        fields={[
          { key: "title", label: "Title" }, { key: "issuedBy", label: "Issued By" },
          { key: "year", label: "Year" }, { key: "credentialUrl", label: "Credential URL" },
        ]}
        renderSummary={(c) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{c.title}</div>
            <div className="text-[var(--text-secondary)]">{[c.issuedBy, c.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <RepeaterSection
        title="Papers Published"
        items={profile.papersPublished}
        onChange={(items) => setProfile((p) => ({ ...p, papersPublished: items }))}
        fields={[
          { key: "title", label: "Title" }, { key: "journal", label: "Journal" },
          { key: "year", label: "Year" }, { key: "link", label: "Link" },
        ]}
        renderSummary={(p) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{p.title}</div>
            <div className="text-[var(--text-secondary)]">{[p.journal, p.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <RepeaterSection
        title="Books Published"
        items={profile.booksPublished}
        onChange={(items) => setProfile((p) => ({ ...p, booksPublished: items }))}
        fields={[
          { key: "title", label: "Title" }, { key: "publisher", label: "Publisher" },
          { key: "year", label: "Year" }, { key: "isbn", label: "ISBN" },
        ]}
        renderSummary={(b) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{b.title}</div>
            <div className="text-[var(--text-secondary)]">{[b.publisher, b.year, b.isbn && `ISBN ${b.isbn}`].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <RepeaterSection
        title="Patents"
        items={profile.patents}
        onChange={(items) => setProfile((p) => ({ ...p, patents: items }))}
        fields={[
          { key: "title", label: "Title" }, { key: "patentNumber", label: "Patent Number" },
          { key: "year", label: "Year" }, { key: "status", label: "Status" },
        ]}
        renderSummary={(p) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{p.title}</div>
            <div className="text-[var(--text-secondary)]">{[p.patentNumber, p.year, p.status].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <RepeaterSection
        title="Conferences Attended"
        items={profile.conferencesAttended}
        onChange={(items) => setProfile((p) => ({ ...p, conferencesAttended: items }))}
        fields={[
          { key: "title", label: "Conference Title" }, { key: "event", label: "Event" },
          { key: "role", label: "Role (e.g. Speaker)" }, { key: "year", label: "Year" },
        ]}
        renderSummary={(c) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{c.title}</div>
            <div className="text-[var(--text-secondary)]">{[c.event, c.role, c.year].filter(Boolean).join(" · ")}</div>
          </>
        )}
      />

      <RepeaterSection
        title="Other Activities"
        items={profile.otherActivities}
        onChange={(items) => setProfile((p) => ({ ...p, otherActivities: items }))}
        fields={[
          { key: "title", label: "Title" }, { key: "year", label: "Year" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        renderSummary={(a) => (
          <>
            <div className="font-bold text-[var(--text-primary)]">{a.title} {a.year && <span className="text-[var(--text-secondary)] font-medium">({a.year})</span>}</div>
            {a.description && <div className="text-[var(--text-secondary)] mt-1">{a.description}</div>}
          </>
        )}
      />

      <button onClick={save} disabled={saving} className="btn-premium text-sm px-6 py-3 flex items-center gap-1.5 disabled:opacity-40">
        {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Profile"}
      </button>

      <ProfileEditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
  );
}
