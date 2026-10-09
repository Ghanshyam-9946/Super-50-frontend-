import { useCallback, useEffect, useState, Fragment } from "react";
import {
  GraduationCap, Loader2, Download, RefreshCw, ExternalLink, Info, Search, ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// Every faculty member's Google Scholar papers, and the spreadsheet of
// them. The fetch itself is the same one the faculty runs on their own
// profile — this is the admin doing it for somebody who has not.

const dateTime = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function FacultyPublicationsPage() {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [search, setSearch] = useState("");
  // Whose papers are open, and the papers themselves. Fetched per person
  // rather than with the list: every paper for every faculty is a lot to
  // carry in order to read one person's.
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);

  const openFaculty = async (row) => {
    if (openId === row._id) { setOpenId(null); setDetail(null); return; }
    setOpenId(row._id);
    setDetail(null);
    try {
      const { data } = await api.get(`/scholar/admin/${row._id}`);
      setDetail(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load their papers");
      setOpenId(null);
    }
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/scholar/admin");
      setRows(data.data || []);
      setTotals(data.totals || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const download = async () => {
    setBusy("export");
    try {
      const res = await api.get("/scholar/admin/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faculty_publications_${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the sheet");
    } finally {
      setBusy("");
    }
  };

  const syncOne = async (row) => {
    setBusy(row._id);
    try {
      const { data } = await api.post(`/scholar/admin/${row._id}/sync`);
      toast.success(data.message);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not fetch");
    } finally {
      setBusy("");
    }
  };

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.department, r.designation, r.email].filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  if (loading) {
    return <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-[var(--text-primary)] flex items-center gap-2">
            <GraduationCap size={22} className="text-[var(--primary)]" /> Faculty Publications
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Everything on record from each faculty member&rsquo;s Google Scholar link.
          </p>
        </div>
        <button onClick={download} disabled={busy === "export"}
          className="btn-premium text-xs px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
          {busy === "export" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Download Excel
        </button>
      </div>

      {totals && (
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            ["Faculty", totals.faculty],
            ["With a Scholar link", totals.withLink],
            ["Papers on record", totals.papers],
          ].map(([label, n]) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{label}</div>
              <div className="font-display font-black text-2xl text-[var(--text-primary)] mt-0.5">{n}</div>
            </div>
          ))}
        </div>
      )}

      {/* The sheet has a line for faculty with nothing on record too, so a
          blank row means "nothing fetched", not "left out". */}
      <p className="text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
        <Info size={12} className="mt-0.5 shrink-0" />
        Click a name to read that person&rsquo;s papers here. The spreadsheet has one row per
        paper, and one line for each faculty member with nothing on record yet, so nobody is
        silently missing from it.
      </p>

      <div className="glass-card rounded-3xl p-4 space-y-3">
        <label className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
          <Search size={14} className="text-[var(--text-secondary)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, department or designation"
            className="bg-transparent outline-none text-sm text-[var(--text-primary)] w-full" />
        </label>

        <div className="overflow-x-auto border border-[var(--border-light)] rounded-2xl">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="bg-[var(--primary)]/5 text-[var(--text-secondary)] text-left">
                <th className="px-3 py-2 font-black uppercase tracking-wider">Faculty</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider">Scholar link</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider">Papers</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider">Citations</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider">Last fetched</th>
                <th className="px-3 py-2 font-black uppercase tracking-wider text-right">Fetch</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <Fragment key={r._id}>
                <tr className="border-t border-[var(--border-light)]">
                  <td className="px-3 py-2">
                    <button onClick={() => openFaculty(r)} disabled={!r.papers}
                      title={r.papers ? "Show their papers" : "No papers on record yet"}
                      className="text-left disabled:cursor-default">
                      <div className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                        {r.papers > 0 && (
                          <ChevronDown size={12}
                            className={`transition-transform ${openId === r._id ? "" : "-rotate-90"}`} />
                        )}
                        {r.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] pl-[14px]">
                        {[r.designation, r.department].filter(Boolean).join(" · ")}
                      </div>
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {r.scholarUrl ? (
                      <a href={r.scholarUrl} target="_blank" rel="noreferrer"
                        className="text-[var(--primary)] hover:underline flex items-center gap-1">
                        Open <ExternalLink size={11} />
                      </a>
                    ) : <span className="text-[var(--text-secondary)] italic">not added</span>}
                  </td>
                  <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{r.papers}</td>
                  <td className="px-3 py-2">{r.citations || "—"}</td>
                  <td className="px-3 py-2 text-[var(--text-secondary)]">
                    {r.syncedAt ? (
                      <>
                        {dateTime(r.syncedAt)}
                        {r.source && <span className="block text-[10px] opacity-70">via {r.source}</span>}
                      </>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => syncOne(r)} disabled={!r.scholarUrl || !!busy}
                      title={r.scholarUrl ? "Fetch this person's papers now" : "They have not added a Scholar link"}
                      className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-30">
                      {busy === r._id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                  </td>
                </tr>
                {openId === r._id && (
                  <tr className="border-t border-[var(--border-light)]">
                    <td colSpan={6} className="px-3 py-3 bg-[var(--bg-input)]/40">
                      {detail === null ? (
                        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" size={18} /></div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              <b className="text-[var(--text-primary)]">{detail.publications.length}</b> paper(s)
                              {detail.citations > 0 && <> · <b className="text-[var(--text-primary)]">{detail.citations}</b> citation(s)</>}
                              {detail.source && <> · via {detail.source}</>}
                            </span>
                            {detail.scholarUrl && (
                              <a href={detail.scholarUrl} target="_blank" rel="noreferrer"
                                className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                                Open their Scholar profile <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                            {detail.publications.map((p, i) => (
                              <div key={p._id || `${p.title}-${i}`} className="bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl px-3 py-2">
                                <div className="text-[13px] font-bold text-[var(--text-primary)]">
                                  {p.url ? (
                                    <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-[var(--primary)] hover:underline">{p.title}</a>
                                  ) : p.title}
                                </div>
                                {p.authors && <div className="text-[10px] text-[var(--text-secondary)] line-clamp-1">{p.authors}</div>}
                                <div className="text-[10px] text-[var(--text-secondary)] flex flex-wrap items-center gap-x-2.5 mt-0.5">
                                  {p.venue && <span className="italic">{p.venue}</span>}
                                  {p.year && <span>{p.year}</span>}
                                  {p.citations > 0 && <span>{p.citations} citation(s)</span>}
                                </div>
                              </div>
                            ))}
                            {detail.publications.length === 0 && (
                              <div className="text-[11px] text-[var(--text-secondary)] py-4 text-center">
                                Nothing fetched for them yet.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-[var(--text-secondary)]">Nobody matches that search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
