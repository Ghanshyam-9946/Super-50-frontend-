import { useEffect, useState } from "react";
import { X, Loader2, Save, Camera, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";

// An alumnus writing their own page. Students read this, so the fields are
// the ones juniors actually ask about — where you are, how you got there,
// and what you would tell them.
const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";
const labelCls = "flex flex-col gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]";

export default function MyAlumniProfile({ onClose }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/alumni/me")
      .then(({ data }) => setForm({ ...data.data, skills: (data.data.skills || []).join(", ") }))
      .catch((err) => { toast.error(err.response?.data?.message || "Could not load your profile"); onClose(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/alumni/me", {
        ...form,
        skills: String(form.skills || "").split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success(data.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await api.post("/alumni/me/photo", fd);
      set({ photo: data.data.photo });
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const setExperience = (idx, patch) =>
    set({ experience: form.experience.map((e, i) => (i === idx ? { ...e, ...patch } : e)) });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="glass-card w-full max-w-2xl rounded-3xl p-6 my-8 space-y-4" onClick={(e) => e.stopPropagation()}>
        {!form ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display font-black text-lg text-[var(--text-primary)]">My alumni profile</h3>
              <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
            </div>

            <div className="flex items-center gap-4">
              {form.photo?.url ? (
                <img src={getImageUrl(form.photo.url)} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-2xl font-black">
                  {form.user?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <label className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] flex items-center gap-1.5 cursor-pointer hover:border-[var(--primary)]">
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />} Change photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { uploadPhoto(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["headline", "Headline", "SDE-2 at Infosys"],
                ["currentCompany", "Company", "Infosys"],
                ["designation", "Designation", "Software Engineer"],
                ["location", "Location", "Bengaluru"],
                ["passoutYear", "Passout year", "2024"],
                ["branch", "Branch", "CSE"],
              ].map(([key, label, ph]) => (
                <label key={key} className={labelCls}>
                  {label}
                  <input value={form[key] || ""} onChange={(e) => set({ [key]: e.target.value })} placeholder={ph}
                    className={`${inputCls} font-normal normal-case tracking-normal`} />
                </label>
              ))}
            </div>

            {[
              ["about", "About you", "A couple of lines about yourself"],
              ["myJourney", "My journey", "How you got from college to where you are — juniors read this most"],
              ["adviceForStudents", "Advice for juniors", "What you would tell a 3rd year today"],
            ].map(([key, label, ph]) => (
              <label key={key} className={labelCls}>
                {label}
                <textarea value={form[key] || ""} onChange={(e) => set({ [key]: e.target.value })} rows={3} placeholder={ph}
                  className={`${inputCls} font-normal normal-case tracking-normal`} />
              </label>
            ))}

            <label className={labelCls}>
              Skills (comma separated)
              <input value={form.skills || ""} onChange={(e) => set({ skills: e.target.value })} placeholder="React, Node, System Design"
                className={`${inputCls} font-normal normal-case tracking-normal`} />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Experience</span>
                <button onClick={() => set({ experience: [...(form.experience || []), { title: "", organization: "", startYear: "", endYear: "", current: false }] })}
                  className="text-xs font-bold text-[var(--primary)] flex items-center gap-1"><Plus size={12} /> Add</button>
              </div>
              {(form.experience || []).map((e, idx) => (
                <div key={idx} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-center bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-2.5">
                  <input value={e.title || ""} onChange={(ev) => setExperience(idx, { title: ev.target.value })} placeholder="Role" className={inputCls} />
                  <input value={e.organization || ""} onChange={(ev) => setExperience(idx, { organization: ev.target.value })} placeholder="Company" className={inputCls} />
                  <button onClick={() => set({ experience: form.experience.filter((_, i) => i !== idx) })}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  <input value={e.startYear || ""} onChange={(ev) => setExperience(idx, { startYear: ev.target.value })} placeholder="From (2024)" className={inputCls} />
                  <input value={e.endYear || ""} onChange={(ev) => setExperience(idx, { endYear: ev.target.value })} placeholder="To (2026)" className={inputCls} disabled={e.current} />
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <input type="checkbox" checked={!!e.current} onChange={(ev) => setExperience(idx, { current: ev.target.checked })} /> Now
                  </label>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[["linkedin", "LinkedIn"], ["github", "GitHub"], ["website", "Website"]].map(([key, label]) => (
                <label key={key} className={labelCls}>
                  {label}
                  <input value={form[key] || ""} onChange={(e) => set({ [key]: e.target.value })} placeholder="https://…"
                    className={`${inputCls} font-normal normal-case tracking-normal`} />
                </label>
              ))}
            </div>

            <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="checkbox" checked={!!form.openToMentoring} onChange={(e) => set({ openToMentoring: e.target.checked })} className="mt-0.5" />
              <span>
                <strong className="text-[var(--text-primary)]">Open to mentoring</strong> — students can start a video call with you from your profile.
              </span>
            </label>

            <button onClick={save} disabled={saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save profile
            </button>
          </>
        )}
      </div>
    </div>
  );
}
