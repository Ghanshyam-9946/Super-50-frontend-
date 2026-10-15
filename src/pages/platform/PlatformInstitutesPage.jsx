import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Check, Copy, Loader2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import platformApi from "../../services/platformApi";
import { DetailsFields, ModulePicker } from "./InstituteFields";
import { fromForm, inputCls, labelCls, toForm } from "./instituteForm";

const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 31);

// Shown once, right after an institute is made: where it lives and how its
// first admin gets in. The password is not stored anywhere readable.
function CreatedNotice({ result, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = [
    `Institute: ${result.data.name}`,
    result.data.url && `Address: ${result.data.url}`,
    `Admin email: ${result.firstAdmin.email}`,
    `Temporary password: ${result.firstAdmin.temporaryPassword}`,
  ].filter(Boolean).join("\n");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { toast.error("Copy it by hand"); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 space-y-4">
        <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{result.data.name} is ready</h2>
        <pre className="text-xs bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl p-3 whitespace-pre-wrap break-all">{text}</pre>
        <p className="text-xs text-amber-600">
          Give this to the institute&apos;s admin now — the password is not shown again. They will be asked to change it after signing in.
        </p>
        <div className="flex gap-2">
          <button onClick={copy} className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onClose} className="btn-premium text-xs px-4 py-2">Done</button>
        </div>
      </div>
    </div>
  );
}

export default function PlatformInstitutesPage() {
  const [list, setList] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(null);
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [admin, setAdmin] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    try {
      const [inst, mods] = await Promise.all([platformApi.get("/institutes"), platformApi.get("/modules")]);
      setList(inst.data.data);
      setCatalog(mods.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the institutes");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const startCreate = () => {
    setForm(toForm({ modules: catalog.filter((m) => !m.core).map((m) => m.key) }));
    setCode("");
    setCodeTouched(false);
    setAdmin({ name: "", email: "" });
    setCreating(true);
  };

  const create = async () => {
    if (!form.name.trim()) return toast.error("Give the institute a name");
    if (!code) return toast.error("Give the institute a code");
    if (!admin.name.trim() || !admin.email.trim()) return toast.error("The first admin needs a name and an email");
    setSaving(true);
    try {
      const { data } = await platformApi.post("/institutes", { ...fromForm(form), code, admin });
      setCreated(data);
      setCreating(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the institute");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">Institutes</h1>
          <p className="text-sm text-[var(--text-secondary)]">Every institute on the platform, with its own database and modules.</p>
        </div>
        {!creating && (
          <button onClick={startCreate} disabled={loading} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            <Plus size={15} /> New institute
          </button>
        )}
      </div>

      {creating && form && (
        <div className="glass-card rounded-2xl p-5 space-y-5 border border-[var(--primary)]/40">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base">New institute</h2>
            <button onClick={() => setCreating(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" title="Close"><X size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={labelCls}>Institute name
              <input value={form.name} onChange={(e) => { const name = e.target.value; setForm((f) => ({ ...f, name })); if (!codeTouched) setCode(slug(name)); }} className={inputCls} />
            </label>
            <label className={labelCls}>Code (its address and database — cannot be changed later)
              <input value={code} onChange={(e) => { setCodeTouched(true); setCode(slug(e.target.value)); }} placeholder="abc-college" className={inputCls} />
            </label>
            <label className={labelCls}>First admin&apos;s name
              <input value={admin.name} onChange={(e) => setAdmin((a) => ({ ...a, name: e.target.value }))} className={inputCls} />
            </label>
            <label className={labelCls}>First admin&apos;s email
              <input type="email" value={admin.email} onChange={(e) => setAdmin((a) => ({ ...a, email: e.target.value }))} className={inputCls} />
            </label>
          </div>
          <DetailsFields form={form} setForm={setForm} />
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-2">Modules</div>
            <ModulePicker catalog={catalog} value={form.modules} onChange={(modules) => setForm((f) => ({ ...f, modules }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={create} disabled={saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create institute
            </button>
            <button onClick={() => setCreating(false)} className="btn-outline-premium text-sm px-4 py-2.5">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((i) => {
            const optional = catalog.filter((m) => !m.core).length;
            const expired = i.subscription?.endsAt && new Date(i.subscription.endsAt) < new Date();
            return (
              <Link key={i._id} to={`/platform/institutes/${i._id}`} className="glass-card rounded-2xl p-5 space-y-3 hover:border-[var(--primary)]/50 border border-transparent transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0"><Building2 size={18} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-sm text-[var(--text-primary)] truncate">{i.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">{i.legacy ? "Existing SISTec database" : i.url || i.code}</div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0 ${i.status === "active" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>{i.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[var(--bg-input)]/70 py-2"><div className="font-black text-sm">{i.counts?.students ?? "—"}</div><div className="text-[10px] text-[var(--text-secondary)]">Students</div></div>
                  <div className="rounded-xl bg-[var(--bg-input)]/70 py-2"><div className="font-black text-sm">{i.counts?.staff ?? "—"}</div><div className="text-[10px] text-[var(--text-secondary)]">Staff</div></div>
                  <div className="rounded-xl bg-[var(--bg-input)]/70 py-2"><div className="font-black text-sm">{i.modules.length}/{optional}</div><div className="text-[10px] text-[var(--text-secondary)]">Modules</div></div>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap gap-x-3">
                  <span>Plan: <b className="text-[var(--text-primary)]">{i.plan}</b></span>
                  <span className={expired ? "text-red-500 font-bold" : ""}>Ends: {day(i.subscription?.endsAt)}{expired ? " (expired)" : ""}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {created && <CreatedNotice result={created} onClose={() => setCreated(null)} />}
    </div>
  );
}
