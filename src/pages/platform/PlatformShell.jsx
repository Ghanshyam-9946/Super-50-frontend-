import { Link, NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Building2, LogOut } from "lucide-react";

// The frame around every platform page: who is signed in, and a way out.
// Nobody without a platform token gets past it.
export default function PlatformShell() {
  const navigate = useNavigate();
  const token = localStorage.getItem("platform_token");
  if (!token) return <Navigate to="/platform/login" replace />;
  let admin = null;
  try { admin = JSON.parse(localStorage.getItem("platform_admin") || "null"); } catch { /* shown without a name */ }

  const signOut = () => {
    localStorage.removeItem("platform_token");
    localStorage.removeItem("platform_admin");
    navigate("/platform/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-20 bg-[var(--bg-card)]/90 backdrop-blur border-b border-[var(--border-light)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/platform" className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]"><Building2 size={18} /></div>
            <div className="min-w-0">
              <div className="font-display font-black text-sm">Platform Admin</div>
              <div className="text-[11px] text-[var(--text-secondary)] truncate">{admin?.name} · {admin?.email}</div>
            </div>
          </Link>
          <nav className="ml-auto flex items-center gap-1">
            {[["/platform", "Overview", true], ["/platform/institutes", "Institutes"], ["/platform/plans", "Plans"]].map(([to, label, end]) => (
              <NavLink key={to} to={to} end={!!end}
                className={({ isActive }) => `text-xs font-bold px-3 py-2 rounded-xl ${isActive ? "bg-[var(--primary)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--bg-input)]"}`}>
                {label}
              </NavLink>
            ))}
          </nav>
          <button onClick={signOut} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
