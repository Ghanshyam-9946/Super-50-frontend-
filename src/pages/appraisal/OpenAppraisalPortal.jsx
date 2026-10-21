import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import api from "../../services/api";
import { APPRAISAL_URL, portalSignInUrl } from "../../utils/appraisalPortal";

// Any /appraisal/... address in MILE (the menu link, an old bookmark, a
// notification) opens the same page on the Appraisal portal, signed in.
export default function OpenAppraisalPortal() {
  const location = useLocation();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const next = location.pathname === "/appraisal" || location.pathname === "/appraisal/" ? "/appraisal/my" : location.pathname;
    api.post("/auth/handoff")
      .then(({ data }) => { if (!cancelled) window.location.assign(portalSignInUrl(data.code, next)); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || "Could not open the Appraisal portal."); });
    return () => { cancelled = true; };
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
        {error ? (
          <>
            <h1 className="text-xl font-display font-black text-[var(--text-primary)]">Appraisal Portal</h1>
            <p className="text-sm text-[var(--text-secondary)]">{error}</p>
            <a href={APPRAISAL_URL} className="btn-premium inline-flex items-center gap-2 text-sm px-5 py-2.5">
              <ExternalLink size={15} /> Open and sign in
            </a>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin mx-auto text-[var(--primary)]" size={32} />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Opening the Appraisal portal…</p>
            <p className="text-xs text-[var(--text-secondary)]">You will be signed in with your MILE account.</p>
          </>
        )}
      </div>
    </div>
  );
}
