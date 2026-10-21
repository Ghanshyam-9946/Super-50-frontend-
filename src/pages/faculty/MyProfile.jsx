import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { IdCard, Loader2, Plus, Download, Pencil, X, Paperclip, Save, UserRound, Wrench, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { downloadFile } from "../../utils/downloadFile";
import { getImageUrl } from "../../utils/imageUrl";
import ProfileEditModal from "../../components/ProfileEditModal";
import ScholarSection from "../../components/profile/ScholarSection";
import EntryList, { AttachmentLink } from "../../components/profile/ProfileEntries";
import { BASIC_PROFILE_FIELDS, PROFILE_GROUPS, PROFILE_SECTIONS, emptyProfile } from "../../utils/facultyProfileSections";

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full";
const labelCls = "flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1";

const blankEntry = (section) => ({
  ...Object.fromEntries(section.fields.map((f) => [f.key, f.type === "checkbox" ? false : ""])),
  attachmentUrl: "",
  attachmentName: "",
});

// The add / edit form of one entry. The supporting document is uploaded as
// soon as it is chosen; the entry only keeps where it was stored.
function EntryForm({ section, initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("The file is larger than 10 MB");
    const body = new FormData();
    body.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/faculty-profile/mine/attachment", body, { headers: { "Content-Type": "multipart/form-data" } });
      setDraft((d) => ({ ...d, ...data.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not attach the file");
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const first = section.fields[0];
    if (!String(draft[first.key] || "").trim()) return toast.error(`${first.label} is required`);
    onSave(draft);
  };

  return (
    <div className="border border-[var(--primary)]/40 rounded-2xl p-4 space-y-3 bg-[var(--bg-input)]/40">
      <div className="grid sm:grid-cols-2 gap-3">
        {section.fields.map((f) =>
          f.type === "checkbox" ? (
            <label key={f.key} className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] sm:col-span-2">
              <input type="checkbox" checked={!!draft[f.key]} onChange={(e) => set(f.key, e.target.checked)} />
              {f.label}
            </label>
          ) : f.type === "textarea" ? (
            <label key={f.key} className={`${labelCls} sm:col-span-2`}>
              {f.label}
              <textarea value={draft[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} rows={3} className={inputCls} />
            </label>
          ) : f.options ? (
            <label key={f.key} className={labelCls}>
              {f.label}
              <select value={draft[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} className={inputCls}>
                <option value="">Select</option>
                {/* A value saved before the list existed stays selectable. */}
                {[...new Set([...f.options, draft[f.key]].filter(Boolean))].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ) : (
            <label key={f.key} className={labelCls}>
              {f.label}
              <input type={f.type === "date" ? "date" : "text"} value={draft[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
            </label>
          )
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Attachment (certificate / proof)</div>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" className="hidden" onChange={pickFile} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
            {draft.attachmentUrl ? "Replace file" : "Attach a file"}
          </button>
          {draft.attachmentUrl && (
            <>
              <AttachmentLink url={draft.attachmentUrl} name={draft.attachmentName} />
              <button type="button" onClick={() => setDraft((d) => ({ ...d, attachmentUrl: "", attachmentName: "" }))}
                className="text-[11px] font-bold text-red-500 hover:underline">Remove</button>
            </>
          )}
          <span className="text-[11px] text-[var(--text-secondary)]">PDF, image or Word · up to 10 MB</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={submit} disabled={uploading} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          <Save size={13} /> Save entry
        </button>
        <button onClick={onCancel} className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5">
          <X size={13} /> Cancel
        </button>
      </div>
    </div>
  );
}

// One repeating section: its entries, and the form to add or change one.
function EntrySection({ section, items, onChange, saving }) {
  // null = closed, -1 = adding, n = editing the n-th entry
  const [editing, setEditing] = useState(null);
  const Icon = section.icon;

  const save = (entry) => {
    onChange(editing === -1 ? [...items, entry] : items.map((x, i) => (i === editing ? entry : x)));
    setEditing(null);
  };
  const remove = (idx) => {
    if (!window.confirm("Delete this entry?")) return;
    onChange(items.filter((_, i) => i !== idx));
    setEditing(null);
  };

  return (
    <div className="glass-card p-5 rounded-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0"><Icon size={18} /></div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">{section.title}</h3>
            <p className="text-xs text-[var(--text-secondary)]">{section.hint}</p>
          </div>
        </div>
        {editing === null && (
          <button onClick={() => setEditing(-1)} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5">
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {editing === -1 && <EntryForm section={section} initial={blankEntry(section)} onSave={save} onCancel={() => setEditing(null)} />}
      {editing !== null && editing >= 0 && (
        <EntryForm key={editing} section={section} initial={{ ...blankEntry(section), ...items[editing] }} onSave={save} onCancel={() => setEditing(null)} />
      )}

      <EntryList section={section} items={items} onEdit={saving ? undefined : setEditing} onRemove={saving ? undefined : remove} />
    </div>
  );
}

export default function MyProfile() {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState(emptyProfile());
  const [skillDraft, setSkillDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [tab, setTab] = useState("basic");

  useEffect(() => {
    api.get("/faculty-profile/mine")
      .then(({ data }) => { if (data.success) setProfile({ ...emptyProfile(), ...data.data }); })
      .catch((err) => toast.error(err.response?.data?.message || "Failed to load your profile"))
      .finally(() => setLoading(false));
  }, []);

  // Every change is saved as it is made — an entry added and then lost to
  // a forgotten Save button is the one thing this page must not do.
  const persist = async (next, { quiet = true } = {}) => {
    setProfile(next);
    setSaving(true);
    try {
      const { data } = await api.put("/faculty-profile/mine", next);
      if (data.success) {
        setProfile({ ...emptyProfile(), ...data.data });
        setSavedAt(new Date());
        if (!quiet) toast.success("Profile saved");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save — your last change was not stored");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillDraft.trim();
    setSkillDraft("");
    if (!trimmed || profile.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    persist({ ...profile, skills: [...profile.skills, trimmed] });
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

  // The menu, in groups.
  const tabs = [
    { key: "basic", title: "Basic Information", icon: UserRound },
    { key: "skills", title: "Skills", icon: Wrench, count: profile.skills.length },
    ...PROFILE_GROUPS.flatMap((g) => [
      { key: `group-${g.key}`, heading: g.title },
      ...PROFILE_SECTIONS.filter((x) => x.group === g.key)
        .map((x) => ({ key: x.key, title: x.title, icon: x.icon, count: (profile[x.key] || []).length })),
    ]),
  ];
  const section = PROFILE_SECTIONS.find((s) => s.key === tab);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
          <IdCard size={26} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">My Profile</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Fill in each section and attach the certificate or proof with it. Whatever you add here is what the admin sees on your profile.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button onClick={downloadPdf} disabled={downloading} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Download PDF
          </button>
          <span className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1 h-4">
            {saving ? <><Loader2 size={11} className="animate-spin" /> Saving…</>
              : savedAt ? <><CheckCircle2 size={11} className="text-green-500" /> All changes saved</> : null}
          </span>
        </div>
      </header>

      <div className="grid lg:grid-cols-[230px_1fr] gap-6 items-start">
        {/* Section menu: a column on wide screens, a scrolling strip on narrow ones. */}
        <nav className="glass-card rounded-2xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:sticky lg:top-4">
          {tabs.map((t) => (t.heading ? (
            <div key={t.key} className="hidden lg:block px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t.heading}</div>
          ) : (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left whitespace-nowrap lg:whitespace-normal transition-colors ${
                tab === t.key ? "bg-[var(--primary)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
              }`}
            >
              <t.icon size={15} className="shrink-0" />
              <span className="flex-1">{t.title}</span>
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${tab === t.key ? "bg-white/20" : "bg-[var(--border-light)] text-[var(--text-secondary)]"}`}>
                  {t.count}
                </span>
              )}
            </button>
          )))}
        </nav>

        <div className="space-y-6 min-w-0">
          {tab === "basic" && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Basic Information</h3>
                <button onClick={() => setEditModalOpen(true)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
                  <Pencil size={12} /> Edit name, photo, contact
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
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)]">{user?.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] break-words">
                    {[user?.designation, user?.department, user?.email, user?.mobile].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <label className={labelCls}>
                Headline
                <input
                  value={profile.headline}
                  onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))}
                  placeholder="e.g. Associate Professor, CSE | Distributed Systems Researcher"
                  className={inputCls}
                />
              </label>
              <label className={labelCls}>
                About / Bio
                <textarea value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={4} className={inputCls} />
              </label>
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Joining &amp; experience</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {BASIC_PROFILE_FIELDS.map((f) => (
                    <label key={f.key} className={labelCls}>
                      {f.label}
                      <input type={f.type === "date" ? "date" : "text"} value={profile[f.key] || ""}
                        onChange={(e) => setProfile((p) => ({ ...p, [f.key]: e.target.value }))} className={inputCls} />
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={() => persist(profile, { quiet: false })} disabled={saving}
                className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save basic information
              </button>
            </div>
          )}

          {tab === "skills" && (
            <div className="glass-card p-5 rounded-2xl space-y-4">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">Skills</h3>
                <p className="text-xs text-[var(--text-secondary)]">Technologies, tools and subject areas you work in.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.length === 0 && <span className="text-sm text-[var(--text-secondary)]">No skills added yet.</span>}
                {profile.skills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    {skill}
                    <button onClick={() => persist({ ...profile, skills: profile.skills.filter((s) => s !== skill) })} title="Remove">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-md">
                <input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="e.g. Machine Learning"
                  className={inputCls}
                />
                <button onClick={addSkill} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 shrink-0">
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          )}

          {section && (
            <>
              {/* The papers fetched from Google Scholar sit with the ones typed in by hand. */}
              {section.key === "papersPublished" && <ScholarSection />}
              <EntrySection
                key={section.key}
                section={section}
                items={profile[section.key] || []}
                saving={saving}
                onChange={(items) => persist({ ...profile, [section.key]: items })}
              />
            </>
          )}
        </div>
      </div>

      <ProfileEditModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
  );
}
