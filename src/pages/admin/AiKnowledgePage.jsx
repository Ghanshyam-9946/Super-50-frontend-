import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, RefreshCw, Save, Wand2, Search, AlertTriangle, CheckCircle2,
  Loader2, Trash2, Plus, MessageSquareWarning, Database,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// What the assistant knows, and what it still needs told.
//
// The catalogue of features comes from the app's own navigation, so this
// page is mostly about the one part a machine cannot do for you: writing
// down how each feature is actually meant to be used.

const ROLES = ["student", "teacher", "guide", "admin", "super50_admin", "tp_admin", "pms_admin", "security", "alumni"];

const Stat = ({ label, value, tone = "" }) => (
  <div className="glass-card rounded-2xl p-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{label}</p>
    <p className={`text-2xl font-display font-black mt-1 ${tone}`}>{value}</p>
  </div>
);

export default function AiKnowledgePage() {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({ total: 0, withoutHelp: 0, enabled: false });
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, ins] = await Promise.all([
        api.get("/assistant/articles"),
        api.get("/assistant/insights").catch(() => ({ data: { data: null } })),
      ]);
      setArticles(list.data.data || []);
      setStats(list.data.stats || {});
      setInsights(ins.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the knowledge base");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = useMemo(
    () => articles.find((a) => a._id === selectedId) || null,
    [articles, selectedId],
  );

  useEffect(() => {
    setForm(selected ? { ...selected } : null);
  }, [selected]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (onlyMissing && a.body) return false;
      if (!q) return true;
      return `${a.title} ${a.breadcrumb} ${a.category}`.toLowerCase().includes(q);
    });
  }, [articles, query, onlyMissing]);

  const run = async (what, fn, done) => {
    setBusy(what);
    try {
      const { data } = await fn();
      toast.success(data.message || "Done");
      if (done) await done(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "That did not work");
    } finally {
      setBusy("");
    }
  };

  const save = () =>
    run("save", () => api.put(`/assistant/articles/${form._id}`, {
      title: form.title, body: form.body, roles: form.roles,
      category: form.category, path: form.path, breadcrumb: form.breadcrumb, active: form.active,
    }), load);

  const draft = () =>
    run("draft", () => api.post(`/assistant/draft/${form._id}`), (data) => {
      setForm((f) => ({ ...f, body: data.draft }));
      toast("Draft filled in — read it before saving", { icon: "✍️" });
    });

  const addNew = async () => {
    const title = window.prompt("What is this help about?");
    if (!title?.trim()) return;
    await run("new", () => api.post("/assistant/articles", { title: title.trim() }), async (data) => {
      await load();
      setSelectedId(data.data._id);
    });
  };

  const remove = async () => {
    if (!window.confirm(`Remove "${form.title}" from what the assistant knows?`)) return;
    await run("delete", () => api.delete(`/assistant/articles/${form._id}`), async () => {
      setSelectedId(null);
      await load();
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl flex items-center gap-2">
            <Sparkles className="text-[var(--primary)]" size={26} /> AI Knowledge
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            What the portal assistant knows. Features are found automatically — the help text is yours to write.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run("sync", () => api.post("/assistant/sync"), load)} disabled={!!busy}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--primary)] flex items-center gap-1.5 disabled:opacity-50">
            {busy === "sync" ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />} Find new features
          </button>
          <button onClick={() => run("reindex", () => api.post("/assistant/reindex"), load)} disabled={!!busy}
            className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
            {busy === "reindex" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Re-index
          </button>
        </div>
      </div>

      {!stats.enabled && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">The AI is not connected yet.</p>
            <p className="text-[var(--text-secondary)] text-[13px]">
              Add <code className="px-1 rounded bg-black/10">GEMINI_API_KEY</code> to the backend <code className="px-1 rounded bg-black/10">.env</code> and restart.
              Until then the assistant still points people at the right page, but cannot answer in sentences.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Features known" value={stats.total} />
        <Stat label="Still need help text" value={stats.withoutHelp} tone={stats.withoutHelp ? "text-amber-500" : "text-emerald-500"} />
        <Stat label="Asked (30 days)" value={insights?.totals?.asked ?? 0} />
        <Stat label="Used today" value={`${insights?.quota?.usedToday ?? 0}/${insights?.quota?.collegeLimit ?? "—"}`} />
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
        {/* the catalogue */}
        <div className="glass-card rounded-2xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-light)] rounded-xl px-3 py-2">
              <Search size={14} className="text-[var(--text-secondary)]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search features…"
                className="flex-1 bg-transparent text-sm outline-none text-[var(--text-primary)]" />
            </div>
            <button onClick={addNew} title="Add something that is not a page"
              className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20">
              <Plus size={15} />
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] cursor-pointer">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
            Only the ones with no help text ({stats.withoutHelp})
          </label>

          <div className="max-h-[540px] overflow-y-auto space-y-1 pr-1">
            {loading && <p className="text-sm text-[var(--text-secondary)] p-2">Loading…</p>}
            {!loading && shown.length === 0 && <p className="text-sm text-[var(--text-secondary)] p-2">Nothing matches.</p>}
            {shown.map((a) => (
              <button key={a._id} onClick={() => setSelectedId(a._id)}
                className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                  selectedId === a._id
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-transparent hover:bg-[var(--primary)]/5"
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold truncate">{a.title}</span>
                  {a.body
                    ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    : <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{a.breadcrumb || a.category || a.key}</p>
              </button>
            ))}
          </div>
        </div>

        {/* the editor */}
        <div className="space-y-5">
          {!form ? (
            <div className="glass-card rounded-2xl p-8 text-center text-[var(--text-secondary)]">
              <Sparkles size={28} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Pick a feature on the left to write or fix its help text.</p>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="font-display font-black text-lg bg-transparent outline-none border-b border-transparent focus:border-[var(--primary)] w-full" />
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {form.breadcrumb || "—"} {form.path && <span className="font-mono">· {form.path}</span>}
                    <span className="ml-2 uppercase font-black tracking-widest opacity-60">{form.source}</span>
                  </p>
                </div>
                <button onClick={remove} disabled={!!busy} title="Remove"
                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 disabled:opacity-50">
                  <Trash2 size={15} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                    How this feature works
                  </label>
                  <button onClick={draft} disabled={!!busy || !stats.enabled}
                    title={stats.enabled ? "Let the AI draft this, then correct it" : "Needs the API key"}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 flex items-center gap-1 disabled:opacity-40">
                    {busy === "draft" ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />} Draft it for me
                  </button>
                </div>
                <textarea
                  value={form.body || ""}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  rows={14}
                  placeholder="Explain it the way you would to a new student or a new faculty member. Steps are better than paragraphs."
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--primary)] font-mono leading-relaxed"
                />
                <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                  Markdown works: <code>**bold**</code>, <code>- bullets</code>, <code>1. steps</code>.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                  Who this is for
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ROLES.map((r) => {
                    const on = form.roles?.includes(r);
                    return (
                      <button key={r} type="button"
                        onClick={() => setForm({
                          ...form,
                          roles: on ? form.roles.filter((x) => x !== r) : [...(form.roles || []), r],
                        })}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          on ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                             : "border-[var(--border-light)] text-[var(--text-secondary)]"
                        }`}>
                        {r}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
                  None selected means everybody sees it in their answers.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] cursor-pointer">
                  <input type="checkbox" checked={form.active !== false}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  The assistant may use this
                </label>
                <button onClick={save} disabled={!!busy}
                  className="btn-premium text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-50">
                  {busy === "save" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                </button>
              </div>
            </div>
          )}

          {/* what people asked that we could not answer */}
          {insights?.gaps?.length > 0 && (
            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <h2 className="font-display font-black text-base flex items-center gap-2 mb-1">
                <MessageSquareWarning size={17} className="text-amber-500" /> Questions I had no good answer for
              </h2>
              <p className="text-[12px] text-[var(--text-secondary)] mb-3">
                Last 30 days. Each of these is help worth writing.
              </p>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {insights.gaps.map((g) => (
                  <div key={g.question} className="flex items-center justify-between gap-3 text-sm bg-[var(--primary)]/5 rounded-xl px-3 py-2">
                    <span className="truncate">{g.question}</span>
                    <span className="text-[11px] font-black text-[var(--text-secondary)] shrink-0">×{g.times}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
