import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, Loader2, RefreshCw, Save, Send, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import RowsTable from "./RowsTable";
import { STATUS_STYLE, computeTotals, downloadBlob } from "./appraisalHelpers";

const card = "glass-card rounded-2xl p-5 space-y-4";
const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full disabled:opacity-70";
const labelCls = "flex flex-col gap-1 text-[10px] font-bold uppercase text-[var(--text-secondary)]";
const H2 = ({ children, hint }) => (
  <div>
    <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{children}</h2>
    {hint && <p className="text-xs text-[var(--text-secondary)]">{hint}</p>}
  </div>
);
const H3 = ({ children }) => <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">{children}</h3>;

const Points = ({ value, max, onChange, disabled }) => (
  <div className="flex items-center gap-1.5 shrink-0">
    <input type="number" min="0" max={max} step="0.5" value={value ?? ""} disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? "" : Math.min(max, Math.max(0, Number(e.target.value))))}
      className="w-20 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-2 py-1.5 text-sm text-right disabled:opacity-70" />
    <span className="text-[11px] text-[var(--text-secondary)]">/ {max}</span>
  </div>
);

export default function AppraisalFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tpl, setTpl] = useState(null);
  const [data, setData] = useState(null);
  const [self, setSelf] = useState(null);
  const [review, setReview] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [t, a] = await Promise.all([api.get("/appraisal/template"), api.get(`/appraisal/appraisals/${id}`)]);
      setTpl(t.data.data);
      setData(a.data.data);
      setSelf(a.data.data.self);
      setReview(a.data.data.review || null);
      setComment(a.data.data.principalComment || "");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open the appraisal");
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => (review ? computeTotals(tpl, review) : null), [tpl, review]);

  if (!tpl || !data || !self) return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  const can = data.can;
  const editSelf = can.editSelf;
  const setBasic = (k, v) => setSelf((s) => ({ ...s, basic: { ...s.basic, [k]: v } }));
  const setKey = (k, v) => setSelf((s) => ({ ...s, [k]: v }));
  const setDetail = (k, rows) => setSelf((s) => ({ ...s, details: { ...s.details, [k]: rows } }));
  const setR = (patch) => setReview((r) => ({ ...r, ...patch }));
  const reviewer = data.formFor === "hod" ? "the Principal" : "your HOD";

  const act = async (key, fn, after = load) => {
    setBusy(key);
    try {
      const { data: res } = await fn();
      toast.success(res.message || "Done");
      await after();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusy("");
    }
  };

  const saveSelf = () => act("save", () => api.put(`/appraisal/appraisals/${id}/self`, { self }), async () => {});
  const refill = () => {
    if (!window.confirm("Fill the lists that come from your profile again? What you typed in those lists will be replaced; everything else stays.")) return;
    act("refill", async () => {
      await api.put(`/appraisal/appraisals/${id}/self`, { self });
      return api.post(`/appraisal/appraisals/${id}/refill`);
    });
  };
  const submitSelf = () => {
    if (!window.confirm(`Submit your appraisal? It goes to ${reviewer} and can no longer be changed (unless it is sent back).`)) return;
    act("submit", () => api.post(`/appraisal/appraisals/${id}/submit`, { self }));
  };
  const saveReview = () => act("save", () => api.put(`/appraisal/appraisals/${id}/review`, { review, principalComment: comment }), async () => {});
  const forward = () => {
    if (!window.confirm("Send this appraisal to the Principal? You will not be able to change your marks after that.")) return;
    act("forward", () => api.post(`/appraisal/appraisals/${id}/forward`, { review }));
  };
  const complete = () => {
    if (!window.confirm("Complete this appraisal with the marks and comment shown?")) return;
    act("complete", () => api.post(`/appraisal/appraisals/${id}/complete`, { review, principalComment: comment }));
  };
  const sendBack = () => {
    const note = window.prompt("Why is it being sent back? (The person will see this.)");
    if (!note || !note.trim()) return;
    act("back", () => api.post(`/appraisal/appraisals/${id}/send-back`, { note: note.trim() }));
  };
  const download = () => downloadBlob(`/appraisal/appraisals/${id}/download`, "Appraisal.docx").catch(() => toast.error("Could not download"));

  const sentBack = [...(data.history || [])].reverse().find((h) => h.action === "sent back");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="glass-card rounded-3xl p-6 space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <button onClick={() => navigate(-1)} title="Back" className="p-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)]"><ArrowLeft size={16} /></button>
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-2xl font-display font-black tracking-tight text-[var(--text-primary)]">{data.cycle.title}</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {data.formFor === "hod" ? "HOD" : "Faculty"} appraisal · {data.cycle.period} · {data.appraisee?.name}{data.appraisee?.department ? `, ${data.appraisee.department}` : ""}
              {data.reviewer && ` · HOD: ${data.reviewer.name}`}
            </p>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${STATUS_STYLE[data.status]}`}>{data.statusLabel}</span>
          {can.download && (
            <button onClick={download} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><Download size={13} /> Word file</button>
          )}
        </div>
        {sentBack && data.status !== "completed" && (editSelf || can.review) && (
          <p className="text-xs font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
            Sent back by {sentBack.byName}: {sentBack.note}
          </p>
        )}
        {editSelf && (
          <p className="text-xs text-[var(--text-secondary)]">
            Much of this has been filled in from your profile for this period. Check it, add what is missing, then submit — it goes to {reviewer}.
          </p>
        )}
      </header>

      {/* ───────────── SECTION A ───────────── */}
      <div className={card}>
        <H2 hint={editSelf ? "Filled in by you" : "Filled in by the appraisee"}>SECTION-A: Self appraisal</H2>
        <H3>PART-1: Basic details</H3>
        <div className="grid sm:grid-cols-2 gap-3">
          {tpl.BASIC_FIELDS.map((f) => (
            <label key={f.key} className={labelCls}>{f.label}
              <input value={self.basic?.[f.key] || ""} disabled={!editSelf} onChange={(e) => setBasic(f.key, e.target.value)} className={inputCls} />
            </label>
          ))}
        </div>
      </div>

      <div className={card}>
        <H3>PART-2: Academic activities ({data.cycle.period})</H3>
        {tpl.SECTION_A_TABLES.map((t) => (
          <div key={t.key} className="space-y-1.5">
            <div className="text-xs font-bold text-[var(--text-primary)]">{t.title}</div>
            <RowsTable columns={t.columns} rows={self[t.key] || []} onChange={editSelf ? (rows) => setKey(t.key, rows) : undefined} />
          </div>
        ))}
        {tpl.SECTION_A_TEXTS.map((t) => (
          <label key={t.key} className={labelCls}>{t.title}
            <textarea rows={3} value={self[t.key] || ""} disabled={!editSelf} onChange={(e) => setKey(t.key, e.target.value)} className={inputCls} />
          </label>
        ))}
      </div>

      <div className={card}>
        <H3>PART-4: Please respond in brief</H3>
        {tpl.QUESTIONS.map((q) => (
          <div key={q.key} className="space-y-1.5">
            <div className="text-xs font-bold text-[var(--text-primary)]">{q.label}</div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-secondary)] w-4">{"abc"[i]})</span>
                <input value={self[q.key]?.[i] || ""} disabled={!editSelf}
                  onChange={(e) => setKey(q.key, [0, 1, 2].map((n) => (n === i ? e.target.value : self[q.key]?.[n] || "")))} className={inputCls} />
              </div>
            ))}
          </div>
        ))}
        <label className={labelCls}>Any specific note / comments
          <textarea rows={2} value={self.note || ""} disabled={!editSelf} onChange={(e) => setKey("note", e.target.value)} className={inputCls} />
        </label>
      </div>

      <div className={card}>
        <H2 hint="A short supporting statement for each — the Principal marks these.">Teaching effectiveness</H2>
        {tpl.TEACHING_ITEMS.map((t) => (
          <div key={t.key} className="space-y-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="text-xs font-bold text-[var(--text-primary)] flex-1 min-w-[200px]">{t.key}) {t.label}</div>
              {review && (
                <Points value={review.principalFeedback?.[t.key]} max={t.max} disabled={!can.principal}
                  onChange={(v) => setR({ principalFeedback: { ...review.principalFeedback, [t.key]: v } })} />
              )}
            </div>
            <textarea rows={2} value={self.teaching?.[t.key] || ""} disabled={!editSelf}
              onChange={(e) => setKey("teaching", { ...self.teaching, [t.key]: e.target.value })} className={inputCls} />
          </div>
        ))}
        {review && !can.principal && <p className="text-[11px] text-[var(--text-secondary)]">These marks are given by the Principal.</p>}
      </div>

      {/* The details the reviewer marks against; filled by the appraisee. */}
      <div className={card}>
        <H2 hint={editSelf ? "List your work under each — your HOD gives the points." : "Listed by the appraisee"}>Supporting details</H2>
        {Object.entries(tpl.DETAIL_TABLES).map(([k, t]) => (
          <div key={k} className="space-y-1.5">
            <div className="text-xs font-bold text-[var(--text-primary)]">{t.title}</div>
            <RowsTable columns={t.columns} rows={self.details?.[k] || []} onChange={editSelf ? (rows) => setDetail(k, rows) : undefined} />
          </div>
        ))}
      </div>

      {editSelf && (
        <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-2 sticky bottom-4 z-10">
          <button onClick={saveSelf} disabled={!!busy} className="btn-outline-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save draft
          </button>
          <button onClick={refill} disabled={!!busy} className="btn-outline-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
            {busy === "refill" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Fill again from my profile
          </button>
          <button onClick={submitSelf} disabled={!!busy} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50 ml-auto">
            {busy === "submit" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Submit to {data.formFor === "hod" ? "Principal" : "HOD"}
          </button>
        </div>
      )}

      {/* ───────────── SECTION B / C (reviewers only) ───────────── */}
      {review && (
        <>
          <div className={card}>
            <H2 hint={data.formFor === "hod" ? "Marked by the Principal" : "Marked by the HOD"}>SECTION-B: Appraisal rating</H2>
            {tpl.SECTION_B.map((g) => (
              <div key={g.key} className="space-y-3 border-t border-[var(--border-light)] pt-3">
                <div className="flex items-center justify-between gap-2">
                  <H3>{g.title} (max. {g.max})</H3>
                  <span className="text-xs font-bold text-[var(--primary)]">{totals?.groups[g.key]} / {g.max}</span>
                </div>
                {g.parts.map((p) => (
                  <div key={p.key} className="space-y-2 pl-1">
                    <div className="text-xs font-bold text-[var(--text-secondary)]">{p.title} ({p.max} max)</div>
                    {p.rows && (
                      <div className="overflow-x-auto border border-[var(--border-light)] rounded-xl">
                        <table className="w-full text-xs min-w-[560px]">
                          <thead className="bg-[var(--bg-input)]/70">
                            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                              <th className="px-2.5 py-2" /><th className="px-2.5 py-2">Subject Title</th><th className="px-2.5 py-2">{p.valueLabel}</th><th className="px-2.5 py-2 text-right">Points (max 100)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(review[p.key] || []).map((r, i) => {
                              const setRow = (patch) => setR({ [p.key]: review[p.key].map((x, n) => (n === i ? { ...x, ...patch } : x)) });
                              return (
                                <tr key={i} className="border-t border-[var(--border-light)]">
                                  <td className="px-2.5 py-1.5 font-bold whitespace-nowrap">{r.label}</td>
                                  <td className="px-1.5 py-1.5"><input value={r.subject || ""} disabled={!can.review} onChange={(e) => setRow({ subject: e.target.value })} className={inputCls} /></td>
                                  <td className="px-1.5 py-1.5 w-28"><input type="number" min="0" max="100" value={r.percent ?? ""} disabled={!can.review} onChange={(e) => setRow({ percent: e.target.value })} className={inputCls} /></td>
                                  <td className="px-1.5 py-1.5"><div className="flex justify-end"><Points value={r.points} max={100} disabled={!can.review} onChange={(v) => setRow({ points: v })} /></div></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {p.principal && (
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Given in "Teaching effectiveness" above · {totals ? Object.values(review.principalFeedback || {}).reduce((n, v) => n + (Number(v) || 0), 0) : 0} / {p.max}
                      </p>
                    )}
                    {p.items && p.items.map((it) => (
                      <div key={it.key} className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-[var(--text-primary)] flex-1 min-w-[200px]">{it.label}</span>
                          <Points value={review.points?.[it.key]} max={it.max} disabled={!can.review}
                            onChange={(v) => setR({ points: { ...review.points, [it.key]: v } })} />
                        </div>
                        {it.details && (self.details?.[it.details] || []).length > 0 && (
                          <RowsTable columns={tpl.DETAIL_TABLES[it.details].columns} rows={self.details[it.details]} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            <div className="space-y-3 border-t border-[var(--border-light)] pt-3">
              <H3>Questions regarding employee performance</H3>
              {tpl.REVIEW_QUESTIONS.map((q) => (
                <label key={q.key} className={labelCls}>{q.label}
                  <textarea rows={2} value={review[q.key] || ""} disabled={!can.review} onChange={(e) => setR({ [q.key]: e.target.value })} className={inputCls} />
                </label>
              ))}
            </div>
          </div>

          <div className={card}>
            <H2>SECTION-C: Appraisal with reporting authority</H2>
            <div className="overflow-x-auto border border-[var(--border-light)] rounded-xl">
              <table className="w-full text-xs min-w-[560px]">
                <thead className="bg-[var(--bg-input)]/70">
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                    <th className="px-2.5 py-2">#</th><th className="px-2.5 py-2">Key skills / competencies</th><th className="px-2.5 py-2">Rating (10)</th><th className="px-2.5 py-2">Comments (if any)</th>
                  </tr>
                </thead>
                <tbody>
                  {tpl.COMPETENCIES.map((c, i) => {
                    const row = review.competencies?.[i] || {};
                    const setC = (patch) => setR({ competencies: tpl.COMPETENCIES.map((_, n) => (n === i ? { ...row, ...patch } : review.competencies?.[n] || { rating: "", comment: "" })) });
                    return (
                      <tr key={c} className="border-t border-[var(--border-light)]">
                        <td className="px-2.5 py-1.5 font-bold">{i + 1}</td>
                        <td className="px-2.5 py-1.5 text-[var(--text-primary)]">{c}</td>
                        <td className="px-1.5 py-1.5"><Points value={row.rating} max={10} disabled={!can.review} onChange={(v) => setC({ rating: v })} /></td>
                        <td className="px-1.5 py-1.5"><input value={row.comment || ""} disabled={!can.review} onChange={(e) => setC({ comment: e.target.value })} className={inputCls} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-xs font-bold text-[var(--text-primary)] mb-2">Personality matrix — the best-fit quadrant</div>
              <div className="grid grid-cols-[auto_1fr_1fr] gap-2 max-w-md text-xs">
                <span />
                <span className="text-center text-[10px] font-bold uppercase text-[var(--text-secondary)]">Capability low</span>
                <span className="text-center text-[10px] font-bold uppercase text-[var(--text-secondary)]">Capability high</span>
                {[["Willingness high", "Q3", "Q4"], ["Willingness low", "Q1", "Q2"]].map(([label, a, b]) => (
                  [<span key={label} className="text-[10px] font-bold uppercase text-[var(--text-secondary)] self-center">{label}</span>,
                    ...[a, b].map((q) => (
                      <button key={q} type="button" disabled={!can.review} onClick={() => setR({ quadrant: q })}
                        className={`py-4 rounded-xl border font-black ${review.quadrant === q ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border-light)] text-[var(--text-primary)]"} disabled:cursor-default`}>
                        {q.replace("Q", "Q-")}
                      </button>
                    ))]
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          {totals && (
            <div className={card}>
              <H2>Summary</H2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[["Section B", totals.sectionB, totals.sectionBMax], ["Section C", totals.sectionC, totals.sectionCMax], ["Total", totals.total, totals.totalMax]].map(([label, v, max]) => (
                  <div key={label} className="rounded-2xl bg-[var(--bg-input)]/70 border border-[var(--border-light)] p-4">
                    <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">{label}</div>
                    <div className="text-2xl font-display font-black text-[var(--text-primary)]">{v} <span className="text-sm text-[var(--text-secondary)]">/ {max}</span></div>
                    <div className="text-xs text-[var(--text-secondary)]">{Math.round((v / max) * 10000) / 100}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(can.principal || data.principalComment) && (
            <div className={card}>
              <H2>Principal&apos;s final comment</H2>
              <textarea rows={3} value={comment} disabled={!can.principal} onChange={(e) => setComment(e.target.value)} className={inputCls} />
            </div>
          )}

          {can.review && (
            <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-2 sticky bottom-4 z-10">
              <button onClick={saveReview} disabled={!!busy} className="btn-outline-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
                {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save
              </button>
              <button onClick={sendBack} disabled={!!busy} className="btn-outline-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
                {busy === "back" ? <Loader2 size={15} className="animate-spin" /> : <Undo2 size={15} />} Send back
              </button>
              {can.principal ? (
                <button onClick={complete} disabled={!!busy} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50 ml-auto">
                  {busy === "complete" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Complete appraisal
                </button>
              ) : (
                <button onClick={forward} disabled={!!busy} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50 ml-auto">
                  {busy === "forward" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Send to Principal
                </button>
              )}
            </div>
          )}
        </>
      )}

      {data.history?.length > 0 && (
        <div className={card}>
          <H3>History</H3>
          <div className="space-y-1.5">
            {data.history.map((h, i) => (
              <div key={i} className="flex flex-wrap gap-x-3 text-xs px-3 py-2 rounded-xl bg-[var(--bg-input)]/60">
                <b className="text-[var(--text-primary)] capitalize">{h.action}</b>
                <span className="text-[var(--text-secondary)]">{h.byName}</span>
                {h.note && <span className="text-[var(--text-secondary)]">— {h.note}</span>}
                <span className="ml-auto text-[var(--text-secondary)]">{new Date(h.at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
