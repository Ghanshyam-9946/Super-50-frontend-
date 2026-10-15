import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import PeoplePicker from "./PeoplePicker";
import { STATUS_STYLE, downloadBlob } from "./appraisalHelpers";

// One released round, for HR: everyone in it, where each form is, who
// their HOD is, and the downloads.
export default function AppraisalRoundPage() {
  const { id } = useParams();
  const [cycle, setCycle] = useState(null);
  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState([]);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState("pdf");

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([api.get(`/appraisal/cycles/${id}`), api.get("/appraisal/people")]);
      setCycle(c.data.data);
      setRows(c.data.appraisals);
      setPeople(p.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the round");
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const setReviewer = async (row, reviewerId) => {
    if (!reviewerId) return;
    try {
      const { data } = await api.patch(`/appraisal/appraisals/${row._id}/reviewer`, { reviewerId });
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not set the HOD");
    }
  };

  const add = async () => {
    if (!picked.length) return toast.error("Select people to add");
    setBusy("add");
    try {
      const { data } = await api.post(`/appraisal/cycles/${id}/people`, { people: picked });
      toast.success(data.message);
      setPicked([]);
      setAdding(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add");
    } finally {
      setBusy("");
    }
  };

  const zip = async () => {
    setBusy("zip");
    try {
      await downloadBlob(`/appraisal/cycles/${id}/download`, `${cycle.title}.zip`, { format, ...(status ? { status } : {}) });
    } catch (err) {
      toast.error(err.response?.status === 404 ? "No forms in that state" : "Could not download");
    } finally {
      setBusy("");
    }
  };

  if (!cycle) return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  const hods = people.filter((p) => p.isHod);
  const inRound = new Set(rows.map((r) => r.appraisee?._id));
  const shown = rows.filter((r) => !status || r.status === status);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card rounded-3xl p-6 flex flex-wrap items-center gap-3">
        <Link to="/appraisal/hr" className="p-2.5 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--primary)]" title="All rounds"><ArrowLeft size={16} /></Link>
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-2xl font-display font-black tracking-tight text-[var(--text-primary)]">{cycle.title}</h1>
          <p className="text-xs text-[var(--text-secondary)]">{cycle.formFor === "hod" ? "HOD" : "Faculty"} appraisal · {cycle.period} · {rows.length} form(s)</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs">
          <option value="">All forms</option>
          <option value="faculty">With the appraisee</option>
          {cycle.formFor === "faculty" && <option value="hod">With the HOD</option>}
          <option value="principal">With the Principal</option>
          <option value="completed">Completed</option>
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-xs">
          <option value="pdf">PDF</option>
          <option value="docx">Word</option>
        </select>
        <button onClick={zip} disabled={!!busy} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "zip" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Download {status ? "these" : "all"} ({format === "pdf" ? "PDF" : "Word"}, zip)
        </button>
        <button onClick={() => setAdding(!adding)} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><UserPlus size={13} /> Add people</button>
      </header>

      {adding && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <PeoplePicker people={people.filter((p) => !inRound.has(p._id))} value={picked} onChange={setPicked} hodsOnly={cycle.formFor === "hod"} />
          <button onClick={add} disabled={busy === "add"} className="btn-premium text-xs px-4 py-2 disabled:opacity-50">Add to this round</button>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full text-xs min-w-[760px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border-light)]">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Department</th>
              {cycle.formFor === "faculty" && <th className="px-4 py-3">HOD</th>}
              <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Marks</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r._id} className="border-b border-[var(--border-light)] last:border-0">
                <td className="px-4 py-2.5 font-bold text-[var(--text-primary)]">
                  <Link to={`/appraisal/form/${r._id}`} className="hover:text-[var(--primary)] hover:underline">{r.appraisee?.name}</Link>
                  <div className="font-medium text-[var(--text-secondary)]">{r.appraisee?.designation}</div>
                </td>
                <td className="px-4 py-2.5">{r.appraisee?.department || "—"}</td>
                {cycle.formFor === "faculty" && (
                  <td className="px-4 py-2.5">
                    {["principal", "completed"].includes(r.status) ? (r.reviewer?.name || "—") : (
                      <select value={r.reviewer?._id || ""} onChange={(e) => setReviewer(r, e.target.value)}
                        className={`bg-[var(--bg-input)] border rounded-lg px-2 py-1.5 text-xs ${r.reviewer ? "border-[var(--border-light)]" : "border-red-500/60 text-red-600"}`}>
                        <option value="">{r.reviewer ? r.reviewer.name : "No HOD — choose"}</option>
                        {hods.filter((h) => h._id !== r.appraisee?._id && h._id !== r.reviewer?._id).map((h) => <option key={h._id} value={h._id}>{h.name} ({h.department || "—"})</option>)}
                      </select>
                    )}
                  </td>
                )}
                <td className="px-4 py-2.5"><span className={`font-bold px-2 py-0.5 rounded-md ${STATUS_STYLE[r.status]}`}>{r.statusLabel}</span></td>
                <td className="px-4 py-2.5 text-right font-bold">{r.total ?? "—"} <span className="font-medium text-[var(--text-secondary)]">/ {r.totalMax}</span></td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  {["pdf", "docx"].map((f) => (
                    <button key={f} onClick={() => downloadBlob(`/appraisal/appraisals/${r._id}/download`, `Appraisal.${f}`, { format: f }).catch(() => toast.error("Could not download"))}
                      title={f === "pdf" ? "Download PDF" : "Download Word"} className="ml-1 px-2 py-1 rounded-lg border border-[var(--border-light)] text-[10px] font-bold hover:bg-[var(--bg-input)] inline-flex items-center gap-1">
                      <Download size={11} /> {f === "pdf" ? "PDF" : "Word"}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-secondary)]">No forms in this state.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
