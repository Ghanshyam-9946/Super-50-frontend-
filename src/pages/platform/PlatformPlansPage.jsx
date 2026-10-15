import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import platformApi from "../../services/platformApi";
import { ModulePicker } from "./InstituteFields";
import { inputCls, labelCls } from "./instituteForm";

const PER = { "student-year": "per student per year", year: "per year", month: "per month" };
const blank = () => ({ name: "", description: "", modules: [], limits: { students: "", faculty: "" }, price: { amount: "", per: "student-year" }, active: true });

// Ready-made packages: which modules an institute gets, its limits and its
// price. Applying a plan to an institute sets its modules and limits.
export default function PlatformPlansPage() {
  const [plans, setPlans] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [editing, setEditing] = useState(null); // plan being edited, or a blank one
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([platformApi.get("/plans"), platformApi.get("/modules")]);
      setPlans(p.data.data);
      setCatalog(m.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the plans");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const edit = (plan) => setEditing({
    ...plan,
    limits: { students: plan.limits?.students ?? "", faculty: plan.limits?.faculty ?? "" },
    price: { amount: plan.price?.amount ?? "", per: plan.price?.per || "year" },
  });

  const save = async () => {
    if (!editing.name.trim()) return toast.error("Give the plan a name");
    setSaving(true);
    try {
      const { data } = editing._id
        ? await platformApi.put(`/plans/${editing._id}`, editing)
        : await platformApi.post("/plans", editing);
      toast.success(data.message);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the plan");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (plan) => {
    if (!window.confirm(`Delete the plan "${plan.name}"?`)) return;
    try {
      const { data } = await platformApi.delete(`/plans/${plan._id}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the plan");
    }
  };

  const set = (path, value) => setEditing((p) => {
    const next = structuredClone(p);
    const keys = path.split(".");
    let o = next;
    keys.slice(0, -1).forEach((k) => { o = o[k]; });
    o[keys.at(-1)] = value;
    return next;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight">Plans</h1>
          <p className="text-sm text-[var(--text-secondary)]">Packages of modules, limits and price that an institute can be put on.</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(blank())} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5"><Plus size={15} /> New plan</button>
        )}
      </div>

      {editing && (
        <div className="glass-card rounded-2xl p-5 space-y-4 border border-[var(--primary)]/40">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-base">{editing._id ? `Edit ${editing.name}` : "New plan"}</h2>
            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" title="Close"><X size={16} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={labelCls}>Name<input value={editing.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Description<input value={editing.description} onChange={(e) => set("description", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Price (₹)<input type="number" min="0" value={editing.price.amount} onChange={(e) => set("price.amount", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Charged
              <select value={editing.price.per} onChange={(e) => set("price.per", e.target.value)} className={inputCls}>
                {Object.entries(PER).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className={labelCls}>Student limit (blank = none)<input type="number" min="0" value={editing.limits.students} onChange={(e) => set("limits.students", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Staff limit (blank = none)<input type="number" min="0" value={editing.limits.faculty} onChange={(e) => set("limits.faculty", e.target.value)} className={inputCls} /></label>
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <input type="checkbox" checked={editing.active} onChange={(e) => set("active", e.target.checked)} /> Offered (untick to retire it)
            </label>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)] mb-2">Modules in this plan</div>
            <ModulePicker catalog={catalog} value={editing.modules} onChange={(modules) => set("modules", modules)} />
          </div>
          <button onClick={save} disabled={saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save plan
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No plans yet.</p>}
        {plans.map((p) => (
          <div key={p._id} className={`glass-card rounded-2xl p-5 space-y-3 ${p.active ? "" : "opacity-60"}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-base text-[var(--text-primary)]">{p.name}{!p.active && " (retired)"}</div>
                <div className="text-xs text-[var(--text-secondary)]">{p.description}</div>
              </div>
              <button onClick={() => remove(p)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" title="Delete"><Trash2 size={14} /></button>
            </div>
            <div className="text-xl font-display font-black text-[var(--text-primary)]">₹{Number(p.price?.amount || 0).toLocaleString("en-IN")} <span className="text-xs font-bold text-[var(--text-secondary)]">{PER[p.price?.per]}</span></div>
            <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
              <div>{p.modules.length} modules · {p.institutes} institute(s) on it</div>
              <div>Students: {p.limits?.students ?? "no limit"} · Staff: {p.limits?.faculty ?? "no limit"}</div>
            </div>
            <button onClick={() => edit(p)} className="btn-outline-premium text-xs px-3 py-1.5">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}
