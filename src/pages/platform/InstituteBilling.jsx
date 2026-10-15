import { useCallback, useEffect, useState } from "react";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import platformApi from "../../services/platformApi";
import { inputCls, labelCls } from "./instituteForm";

const day = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const today = () => new Date().toISOString().slice(0, 10);

// On an institute's page: its plan, and the payments received from it.
export default function InstituteBilling({ institute, onChanged }) {
  const [plans, setPlans] = useState([]);
  const [planId, setPlanId] = useState("");
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState({ amount: "", paidOn: today(), periodFrom: "", periodTo: "", method: "", reference: "", note: "", extendSubscription: true });

  const load = useCallback(async () => {
    try {
      const [p, pay] = await Promise.all([platformApi.get("/plans"), platformApi.get(`/institutes/${institute._id}/payments`)]);
      setPlans(p.data.data.filter((x) => x.active));
      setPayments(pay.data.data);
      setTotal(pay.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load billing");
    }
  }, [institute._id]);
  useEffect(() => { load(); }, [load]);

  const applyPlan = async () => {
    const plan = plans.find((p) => p._id === planId);
    if (!plan) return toast.error("Choose a plan");
    if (!window.confirm(`Put ${institute.name} on ${plan.name}? Its modules and limits become the plan's.`)) return;
    setBusy("plan");
    try {
      const { data } = await platformApi.post(`/institutes/${institute._id}/apply-plan`, { planId });
      toast.success(data.message);
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not apply the plan");
    } finally {
      setBusy("");
    }
  };

  const addPayment = async () => {
    setBusy("pay");
    try {
      const { data } = await platformApi.post(`/institutes/${institute._id}/payments`, form);
      toast.success(data.message);
      setAdding(false);
      setForm((f) => ({ ...f, amount: "", reference: "", note: "" }));
      load();
      if (data.extended) onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not record the payment");
    } finally {
      setBusy("");
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Remove ${p.invoiceNo}?`)) return;
    try {
      const { data } = await platformApi.delete(`/payments/${p._id}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove it");
    }
  };

  const receipt = async (p) => {
    try {
      const res = await platformApi.get(`/payments/${p._id}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${p.invoiceNo}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch {
      toast.error("Could not download the receipt");
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  return (
    <>
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-display font-bold text-base">Plan</h2>
        <p className="text-xs text-[var(--text-secondary)]">Currently <b className="text-[var(--text-primary)]">{institute.plan}</b>. Applying a plan replaces the modules and limits above with the plan&apos;s.</p>
        <div className="flex flex-wrap gap-2 max-w-xl">
          <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={`${inputCls} flex-1 min-w-[200px]`}>
            <option value="">Choose a plan…</option>
            {plans.map((p) => <option key={p._id} value={p._id}>{p.name} — {p.modules.length} modules</option>)}
          </select>
          <button onClick={applyPlan} disabled={!!busy || !planId} className="btn-outline-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-40">
            {busy === "plan" && <Loader2 size={13} className="animate-spin" />} Apply plan
          </button>
        </div>
        {plans.length === 0 && <p className="text-[11px] text-[var(--text-secondary)]">No plans yet — make them on the Plans page.</p>}
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-bold text-base">Payments <span className="text-xs font-bold text-[var(--text-secondary)]">· ₹{total.toLocaleString("en-IN")} received</span></h2>
          {!adding && <button onClick={() => setAdding(true)} className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5"><Plus size={13} /> Record payment</button>}
        </div>
        {adding && (
          <div className="border border-[var(--primary)]/40 rounded-2xl p-4 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <label className={labelCls}>Amount (₹)<input type="number" min="1" value={form.amount} onChange={set("amount")} className={inputCls} /></label>
              <label className={labelCls}>Received on<input type="date" value={form.paidOn} onChange={set("paidOn")} className={inputCls} /></label>
              <label className={labelCls}>Method<input value={form.method} onChange={set("method")} placeholder="Bank transfer / UPI / Cheque" className={inputCls} /></label>
              <label className={labelCls}>Pays for — from<input type="date" value={form.periodFrom} onChange={set("periodFrom")} className={inputCls} /></label>
              <label className={labelCls}>Pays for — to<input type="date" value={form.periodTo} onChange={set("periodTo")} className={inputCls} /></label>
              <label className={labelCls}>Reference<input value={form.reference} onChange={set("reference")} placeholder="UTR / cheque no." className={inputCls} /></label>
              <label className={`${labelCls} sm:col-span-3`}>Note<input value={form.note} onChange={set("note")} className={inputCls} /></label>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <input type="checkbox" checked={form.extendSubscription} onChange={set("extendSubscription")} />
              Extend the subscription to the end of this period
            </label>
            <div className="flex gap-2">
              <button onClick={addPayment} disabled={!!busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
                {busy === "pay" && <Loader2 size={13} className="animate-spin" />} Save payment
              </button>
              <button onClick={() => setAdding(false)} className="btn-outline-premium text-xs px-4 py-2">Cancel</button>
            </div>
          </div>
        )}
        {payments.length === 0 ? <p className="text-xs text-[var(--text-secondary)]">No payments recorded.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[560px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="py-2 pr-3">Receipt</th><th className="py-2 pr-3">Received</th><th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Period</th><th className="py-2 pr-3">Method</th><th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-[var(--border-light)]">
                    <td className="py-2 pr-3 font-bold text-[var(--text-primary)]">{p.invoiceNo}</td>
                    <td className="py-2 pr-3">{day(p.paidOn)}</td>
                    <td className="py-2 pr-3 font-bold">₹{p.amount.toLocaleString("en-IN")}</td>
                    <td className="py-2 pr-3">{p.periodFrom || p.periodTo ? `${day(p.periodFrom)} – ${day(p.periodTo)}` : "—"}</td>
                    <td className="py-2 pr-3">{p.method || "—"}{p.reference ? ` · ${p.reference}` : ""}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => receipt(p)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" title="Download receipt"><Download size={13} /></button>
                      <button onClick={() => remove(p)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" title="Remove"><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
