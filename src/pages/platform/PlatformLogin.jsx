import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Loader2, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import platformApi from "../../services/platformApi";

// Sign-in for the people who run the platform — not for any institute's
// users, who sign in at their institute's own address.
export default function PlatformLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await platformApi.post("/auth/login", { email, password });
      localStorage.setItem("platform_token", data.token);
      localStorage.setItem("platform_admin", JSON.stringify(data.admin));
      navigate("/platform", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card w-full max-w-sm rounded-3xl p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]"><Building2 size={22} /></div>
          <div>
            <h1 className="text-xl font-display font-black text-[var(--text-primary)]">Platform Admin</h1>
            <p className="text-xs text-[var(--text-secondary)]">Manage institutes, modules and subscriptions</p>
          </div>
        </div>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]">
          Email
          <input id="platform-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2.5 text-sm normal-case" />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]">
          Password
          <input id="platform-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2.5 text-sm" />
        </label>
        <button type="submit" disabled={busy} className="btn-premium w-full text-sm px-4 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Sign in
        </button>
      </form>
    </div>
  );
}
