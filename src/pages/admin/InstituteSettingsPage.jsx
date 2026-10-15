import { useEffect, useRef, useState } from "react";
import { Building2, ImageUp, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { getImageUrl } from "../../utils/imageUrl";
import { loadInstitute } from "../../utils/institute";

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full";
const labelCls = "flex flex-col gap-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]";

// How the institute presents itself: the names on its documents, the app's
// name and colour in the menu, its logo, and who may register.
export default function InstituteSettingsPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const take = (branding) => setForm({ ...branding, emailDomains: (branding.emailDomains || []).join(", ") });

  useEffect(() => {
    api.get("/institute/settings")
      .then(({ data: res }) => { setData(res); take(res.branding); })
      .catch((err) => toast.error(err.response?.data?.message || "Could not load the settings"));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: res } = await api.put("/institute/settings", form);
      toast.success(res.message);
      take(res.branding);
      loadInstitute(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.append("logo", file);
    setUploading(true);
    try {
      const { data: res } = await api.post("/institute/settings/logo", body);
      toast.success(res.message);
      take(res.branding);
      loadInstitute(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not upload the logo");
    } finally {
      setUploading(false);
    }
  };

  if (!data || !form) return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  const editable = data.editable;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20"><Building2 size={26} /></div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Institute Settings</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Your institute&apos;s name, logo and colour, and which email addresses may register.</p>
        </div>
      </header>

      {!editable && (
        <p className="text-xs font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
          These settings can be changed once the platform is switched on for this server. Until then the app uses the values shown.
        </p>
      )}

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Logo</h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-20 h-20 rounded-2xl border border-[var(--border-light)] bg-white flex items-center justify-center overflow-hidden">
            {form.logoUrl ? <img src={getImageUrl(form.logoUrl)} alt="Logo" className="w-full h-full object-contain" /> : <Building2 size={28} className="text-slate-400" />}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={uploadLogo} />
          <button onClick={() => fileRef.current?.click()} disabled={!editable || uploading} className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageUp size={13} />} {form.logoUrl ? "Change logo" : "Upload logo"}
          </button>
          <span className="text-[11px] text-[var(--text-secondary)]">PNG, JPG, WEBP or SVG, up to 5 MB. A square logo looks best.</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Names</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={`${labelCls} sm:col-span-2`}>Full name (on reports, certificates and PDFs)
            <input disabled={!editable} value={form.name || ""} onChange={set("name")} className={inputCls} />
          </label>
          <label className={labelCls}>Short name (e.g. ABC College)
            <input disabled={!editable} value={form.shortName || ""} onChange={set("shortName")} className={inputCls} />
          </label>
          <label className={labelCls}>App name in the menu
            <input disabled={!editable} value={form.appName || ""} onChange={set("appName")} placeholder="MILE" className={inputCls} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>Tagline on the sign-in page (optional)
            <input disabled={!editable} value={form.tagline || ""} onChange={set("tagline")} className={inputCls} />
          </label>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-base text-[var(--text-primary)]">Look and contact</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={labelCls}>Accent colour
            <div className="flex items-center gap-2">
              <input type="color" disabled={!editable} value={form.primaryColor || "#7c3aed"} onChange={set("primaryColor")} className="w-12 h-10 rounded-lg border border-[var(--border-light)] bg-transparent" />
              <input disabled={!editable} value={form.primaryColor || ""} onChange={set("primaryColor")} placeholder="Default" className={inputCls} />
            </div>
          </label>
          <label className={labelCls}>Staff may register with emails ending in (comma-separated; blank = any)
            <input disabled={!editable} value={form.emailDomains} onChange={set("emailDomains")} placeholder="abccollege.edu" className={inputCls} />
          </label>
          <label className={labelCls}>Support email
            <input disabled={!editable} value={form.supportEmail || ""} onChange={set("supportEmail")} className={inputCls} />
          </label>
          <label className={labelCls}>Website
            <input disabled={!editable} value={form.website || ""} onChange={set("website")} className={inputCls} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>Address
            <textarea rows={2} disabled={!editable} value={form.address || ""} onChange={set("address")} className={inputCls} />
          </label>
        </div>
      </div>

      <button onClick={save} disabled={!editable || saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save settings
      </button>
    </div>
  );
}
