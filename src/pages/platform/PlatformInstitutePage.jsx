import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Power, Save } from "lucide-react";
import toast from "react-hot-toast";
import platformApi from "../../services/platformApi";
import { DetailsFields, ModulePicker } from "./InstituteFields";
import InstituteBilling from "./InstituteBilling";
import { fromForm, inputCls, toForm } from "./instituteForm";

const dateTime = (d) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const ACTION = {
  "institute.create": "Created", "institute.update": "Changed", "institute.suspend": "Suspended",
  "institute.activate": "Activated", "institute.reset-admin": "Admin password reset",
  "institute.apply-plan": "Plan applied", "payment.add": "Payment recorded", "payment.delete": "Payment removed",
};

export default function PlatformInstitutePage() {
  const { id } = useParams();
  const [inst, setInst] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(null);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetResult, setResetResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const [i, m, a] = await Promise.all([
        platformApi.get(`/institutes/${id}`),
        platformApi.get("/modules"),
        platformApi.get("/audit", { params: { institute: id } }),
      ]);
      setInst(i.data.data);
      setForm(toForm(i.data.data));
      setCatalog(m.data.data);
      setAudit(a.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the institute");
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy("save");
    try {
      const body = fromForm(form);
      if (inst.legacy) delete body.domains;
      const { data } = await platformApi.put(`/institutes/${id}`, body);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setBusy("");
    }
  };

  const toggleStatus = async () => {
    const next = inst.status === "active" ? "suspended" : "active";
    if (next === "suspended" && !window.confirm(`Suspend ${inst.name}? Nobody there will be able to use the app until it is activated again. No data is deleted.`)) return;
    setBusy("status");
    try {
      const { data } = await platformApi.patch(`/institutes/${id}/status`, { status: next });
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change the status");
    } finally {
      setBusy("");
    }
  };

  const resetAdmin = async () => {
    if (!resetEmail.trim()) return toast.error("Whose password? Enter the admin's email");
    setBusy("reset");
    try {
      const { data } = await platformApi.post(`/institutes/${id}/reset-admin`, { email: resetEmail.trim() });
      setResetResult(data.data);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reset the password");
    } finally {
      setBusy("");
    }
  };

  if (!inst || !form) {
    return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/platform/institutes" className="p-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)]" title="All institutes"><ArrowLeft size={16} /></Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-display font-black tracking-tight truncate">{inst.name}</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {inst.legacy ? "SISTec's existing database — its data is never changed from here" : <>Code <b>{inst.code}</b>{inst.url && <> · <a href={inst.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">{inst.url}</a></>}</>}
            {inst.counts && <> · {inst.counts.students} students · {inst.counts.staff} staff</>}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${inst.status === "active" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"}`}>{inst.status}</span>
        {!inst.legacy && (
          <button onClick={toggleStatus} disabled={!!busy} className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 disabled:opacity-50 ${inst.status === "active" ? "border-red-500/40 text-red-500" : "border-green-500/40 text-green-600"}`}>
            {busy === "status" ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />} {inst.status === "active" ? "Suspend" : "Activate"}
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-base">Modules</h2>
        <p className="text-xs text-[var(--text-secondary)]">A module switched off disappears from the institute&apos;s menu and its API refuses it. Its data stays where it is and comes back when it is switched on again.</p>
        <ModulePicker catalog={catalog} value={form.modules} onChange={(modules) => setForm((f) => ({ ...f, modules }))} />
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-bold text-base">Details, plan and subscription</h2>
        <DetailsFields form={form} setForm={setForm} legacy={inst.legacy} />
      </div>

      <button onClick={save} disabled={!!busy} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
        {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
      </button>

      {!inst.legacy && <InstituteBilling institute={inst} onChanged={load} />}

      {!inst.legacy && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display font-bold text-base">Admin locked out?</h2>
          <p className="text-xs text-[var(--text-secondary)]">Sets a new temporary password for one of this institute&apos;s admins. They are asked to change it after signing in.</p>
          <div className="flex flex-wrap gap-2 max-w-lg">
            <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="admin@institute.edu" className={`${inputCls} flex-1 min-w-[200px]`} />
            <button onClick={resetAdmin} disabled={!!busy} className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
              {busy === "reset" ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />} Reset password
            </button>
          </div>
          {resetResult && (
            <p className="text-xs bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-xl px-3 py-2 break-all">
              New temporary password for {resetResult.email}: <b>{resetResult.temporaryPassword}</b> — shown once.
            </p>
          )}
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display font-bold text-base">History</h2>
        {audit.length === 0 ? <p className="text-xs text-[var(--text-secondary)]">Nothing recorded yet.</p> : (
          <div className="space-y-1.5">
            {audit.map((a) => (
              <div key={a._id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs px-3 py-2 rounded-xl bg-[var(--bg-input)]/60">
                <b className="text-[var(--text-primary)]">{ACTION[a.action] || a.action}</b>
                {a.detail?.modulesOn?.length > 0 && <span className="text-green-600">+ {a.detail.modulesOn.join(", ")}</span>}
                {a.detail?.modulesOff?.length > 0 && <span className="text-red-500">− {a.detail.modulesOff.join(", ")}</span>}
                {a.detail?.changed?.length > 0 && !a.detail.modulesOn && <span className="text-[var(--text-secondary)]">{a.detail.changed.join(", ")}</span>}
                <span className="ml-auto text-[var(--text-secondary)]">{a.adminEmail} · {dateTime(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
