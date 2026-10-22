import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap, Loader2, RefreshCw, Save, ExternalLink, Trash2, Info, Quote,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// A faculty member's Google Scholar link, and the papers fetched from it.
//
// Worth knowing while reading this: Google Scholar has no public API and
// blocks automated reading. The server falls back to OpenAlex, which is
// free and permits it, and says so on every result — hence the notice
// below rather than a silent substitution.

const dateTime = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ScholarSection() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(null);
  const [liveScholar, setLiveScholar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/scholar/me");
      setSaved(data.data || null);
      setUrl(data.data?.scholarUrl || "");
      setLiveScholar(!!data.liveScholar);
    } catch {
      /* the section simply stays empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveLink = async () => {
    setBusy("save");
    try {
      const { data } = await api.put("/scholar/me", { scholarUrl: url.trim() });
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the link");
    } finally {
      setBusy("");
    }
  };

  const sync = async () => {
    if (!url.trim()) return toast.error("Add your Google Scholar link first");
    setBusy("sync");
    setNote("");
    try {
      const { data } = await api.post("/scholar/me/sync", { scholarUrl: url.trim() });
      toast.success(data.message);
      setNote(data.note || "");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not fetch the papers");
    } finally {
      setBusy("");
    }
  };

  const clear = async () => {
    if (!window.confirm("Remove the fetched papers from your profile? The link stays.")) return;
    setBusy("clear");
    try {
      const { data } = await api.delete("/scholar/me/publications");
      toast.success(data.message);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove them");
    } finally {
      setBusy("");
    }
  };

  if (loading) return null;

  const papers = saved?.publications || [];
  const shown = showAll ? papers : papers.slice(0, 10);
  const citations = papers.reduce((n, p) => n + (p.citations || 0), 0);

  return (
    <div className="glass-card p-5 rounded-2xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
          <GraduationCap size={16} className="text-[var(--primary)]" /> Google Scholar
        </h3>
        {papers.length > 0 && (
          <span className="text-[11px] text-[var(--text-secondary)]">
            <b className="text-[var(--text-primary)]">{papers.length}</b> paper(s)
            {citations > 0 && <> · <b className="text-[var(--text-primary)]">{citations}</b> citation(s)</>}
            {saved?.publicationsSyncedAt && <> · updated {dateTime(saved.publicationsSyncedAt)}</>}
          </span>
        )}
      </div>

      <label className="flex flex-col text-[10px] font-bold uppercase text-[var(--text-secondary)] gap-1">
        Profile link
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://scholar.google.com/citations?user=..."
          className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm normal-case font-normal"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button onClick={saveLink} disabled={!!busy}
          className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {busy === "save" ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save link
        </button>
        <button onClick={sync} disabled={!!busy || !url.trim()}
          className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
          {busy === "sync" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Fetch my papers
        </button>
        {saved?.scholarUrl && (
          <a href={saved.scholarUrl} target="_blank" rel="noreferrer"
            className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 self-center">
            Open profile <ExternalLink size={12} />
          </a>
        )}
        {papers.length > 0 && (
          <button onClick={clear} disabled={!!busy}
            className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1 self-center ml-auto disabled:opacity-40">
            <Trash2 size={12} /> Remove papers
          </button>
        )}
      </div>

      {/* Said plainly, because the numbers differ between the two sources
          and a faculty member comparing them deserves to know why. */}
      {!liveScholar && (
        <p className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5 border-l-2 border-amber-500/40 pl-2">
          <Info size={12} className="mt-0.5 shrink-0 text-amber-600" />
          <span>
            Google Scholar has no public API and blocks automatic reading, so papers are fetched
            from <b>OpenAlex</b> by matching your name. Coverage and citation counts will differ
            from Scholar&rsquo;s. Your Scholar link is saved and shown either way.
          </span>
        </p>
      )}

      {note && (
        <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-input)] rounded-xl px-3 py-2">{note}</p>
      )}

      {papers.length > 0 && (
        <div className="space-y-2">
          {shown.map((p) => (
            <div key={p._id || p.title} className="border border-[var(--border-light)] rounded-xl px-3 py-2">
              <div className="text-sm font-bold text-[var(--text-primary)]">
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-[var(--primary)] hover:underline">{p.title}</a>
                ) : p.title}
              </div>
              {p.authors && <div className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{p.authors}</div>}
              <div className="text-[11px] text-[var(--text-secondary)] flex flex-wrap items-center gap-x-2.5 mt-0.5">
                {p.venue && <span className="italic">{p.venue}</span>}
                {p.year && <span>{p.year}</span>}
                {p.citations > 0 && <span className="flex items-center gap-1"><Quote size={10} /> {p.citations}</span>}
                {p.source && <span className="opacity-60">{p.source}</span>}
              </div>
            </div>
          ))}
          {papers.length > 10 && (
            <button onClick={() => setShowAll((v) => !v)} className="text-xs font-bold text-[var(--primary)] hover:underline">
              {showAll ? "Show fewer" : `Show all ${papers.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
