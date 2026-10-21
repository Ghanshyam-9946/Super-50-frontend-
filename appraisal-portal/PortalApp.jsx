import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ClipboardCheck, ExternalLink, Loader2, LogOut } from "lucide-react";
import api from "../src/services/api";
import { MILE_URL } from "../src/utils/appraisalPortal";
import AppraisalListPage from "../src/pages/appraisal/AppraisalListPage";
import AppraisalFormPage from "../src/pages/appraisal/AppraisalFormPage";
import AppraisalHRPage from "../src/pages/appraisal/AppraisalHRPage";
import AppraisalRoundPage from "../src/pages/appraisal/AppraisalRoundPage";
import { getUser, isStaff, signIn, signOut } from "./session";

const Brand = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-xl bg-[var(--primary)] text-white grid place-items-center"><ClipboardCheck size={18} /></div>
    <div className="leading-tight">
      <div className="font-display font-black text-[var(--text-primary)]">SISTec Appraisal</div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Sign in with MILE</div>
    </div>
  </div>
);

/* ── Sign in with a MILE email and password ── */
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpFor, setOtpFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = location.state?.from || "/appraisal/my";

  const finish = (data) => {
    if (!isStaff(data.user)) {
      signOut();
      setError("The Appraisal portal is for faculty and staff. Students can use MILE.");
      return;
    }
    signIn(data);
    navigate(next, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      if (otpFor) {
        const { data } = await api.post("/auth/verify-login-otp", { email: otpFor, otp });
        finish(data);
      } else {
        const { data } = await api.post("/auth/login", { email: form.email.trim(), password: form.password });
        if (data.otpRequired) setOtpFor(form.email.trim());
        else finish(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not sign in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm";
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-card rounded-3xl p-8 w-full max-w-md space-y-5">
        <Brand />
        <div>
          <h1 className="text-2xl font-display font-black text-[var(--text-primary)]">Sign in</h1>
          <p className="text-sm text-[var(--text-secondary)]">Use the same email and password as MILE.</p>
        </div>
        {otpFor ? (
          <label className="block space-y-1.5 text-xs font-bold text-[var(--text-secondary)]">
            Code sent to {otpFor}
            <input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className={input} autoFocus required />
          </label>
        ) : (
          <>
            <label className="block space-y-1.5 text-xs font-bold text-[var(--text-secondary)]">
              Email
              <input id="email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} required />
            </label>
            <label className="block space-y-1.5 text-xs font-bold text-[var(--text-secondary)]">
              Password
              <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={input} required />
            </label>
          </>
        )}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-premium w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {busy && <Loader2 size={16} className="animate-spin" />} {otpFor ? "Verify and sign in" : "Sign in"}
        </button>
        <p className="text-xs text-[var(--text-secondary)] text-center">
          Already signed in to MILE? Open <b>Appraisal Portal</b> from the MILE menu — no password needed.
          <br />Forgot your password? Reset it on <a href={`${MILE_URL}/forgot-password`} className="text-[var(--primary)] font-semibold">MILE</a>.
        </p>
      </form>
    </div>
  );
}

/* ── One-click arrival from MILE: /sso#code=...&next=... ── */
function SsoPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const code = params.get("code");
    const next = params.get("next");
    // Drop the code from the address bar and history straight away.
    window.history.replaceState(null, "", "/sso");
    const target = next && next.startsWith("/appraisal") ? next : "/appraisal/my";
    if (!code) { navigate(getUser() ? target : "/login", { replace: true }); return; }
    api.post("/auth/handoff/exchange", { code })
      .then(({ data }) => { signIn(data); navigate(target, { replace: true }); })
      .catch((err) => setError(err.response?.data?.message || "This sign-in link did not work."));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4">
      <div className="glass-card rounded-3xl p-8 w-full max-w-md space-y-4 text-center">
        <div className="flex justify-center"><Brand /></div>
        {error ? (
          <>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <a href="/login" className="btn-premium inline-block px-5 py-2.5 text-sm">Sign in with email</a>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin mx-auto text-[var(--primary)]" size={30} />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Signing you in with MILE…</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Signed-in frame: the appraisal menu across the top ── */
function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [roles, setRoles] = useState({ hr: false, principal: false, hod: false });

  useEffect(() => {
    if (!user) return;
    api.get("/appraisal/me").then(({ data }) => setRoles(data.data || {})).catch(() => {});
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isStaff(user)) { signOut(); return <Navigate to="/login" replace />; }

  const isAdmin = [user.role, ...(user.roles || [])].includes("admin");
  const links = [
    { to: "/appraisal/my", label: "My Appraisal" },
    ...(roles.hod ? [{ to: "/appraisal/review", label: "Review (HOD)" }] : []),
    ...(isAdmin || roles.principal ? [{ to: "/appraisal/principal", label: "Principal" }] : []),
    ...(isAdmin || roles.hr ? [{ to: "/appraisal/hr", label: "HR" }] : []),
  ];
  const logout = () => { signOut(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <header className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur border-b border-[var(--border-light)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Brand />
          <nav className="flex flex-wrap gap-1 order-3 md:order-none w-full md:w-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `px-3 py-2 rounded-xl text-sm font-semibold ${isActive || location.pathname.startsWith(`${l.to}/`) ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:block text-right leading-tight">
              <span className="block text-sm font-bold text-[var(--text-primary)]">{user.name}</span>
              <span className="block text-[11px] text-[var(--text-secondary)]">{user.designation || user.department || ""}</span>
            </span>
            <a href={MILE_URL} title="Open MILE" className="p-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)]"><ExternalLink size={16} /></a>
            <button onClick={logout} title="Sign out" className="p-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-red-600"><LogOut size={16} /></button>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  );
}

export default function PortalApp() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sso" element={<SsoPage />} />
        <Route element={<PortalLayout />}>
          <Route path="/appraisal/my" element={<AppraisalListPage mode="my" />} />
          <Route path="/appraisal/review" element={<AppraisalListPage mode="review" />} />
          <Route path="/appraisal/principal" element={<AppraisalListPage mode="principal" />} />
          <Route path="/appraisal/hr" element={<AppraisalHRPage />} />
          <Route path="/appraisal/hr/:id" element={<AppraisalRoundPage />} />
          <Route path="/appraisal/form/:id" element={<AppraisalFormPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/appraisal/my" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
