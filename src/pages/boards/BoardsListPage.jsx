import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine, Plus, Loader2, Trash2, Share2, Radio, Clock, Pencil, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// The filing cabinet. One card per board, plus whatever somebody else is
// teaching on right now.

const when = (d) => new Date(d).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
});

export default function BoardsListPage() {
  const [boards, setBoards] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [mine, live] = await Promise.all([
        api.get("/boards"),
        api.get("/boards/shared").catch(() => ({ data: { data: [] } })),
      ]);
      setBoards(mine.data.data || []);
      setShared(live.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load your boards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    const title = window.prompt("Name this board", `Class ${new Date().toLocaleDateString("en-IN")}`);
    if (title === null) return;
    setBusy("new");
    try {
      const { data } = await api.post("/boards", { title });
      navigate(`/boards/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the board");
      setBusy("");
    }
  };

  const rename = async (board) => {
    const title = window.prompt("Rename this board", board.title);
    if (!title) return;
    try {
      await api.patch(`/boards/${board._id}`, { title });
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not rename it");
    }
  };

  const remove = async (board) => {
    if (!window.confirm(`Delete "${board.title}"? Everything written on it goes too.`)) return;
    setBusy(board._id);
    try {
      await api.delete(`/boards/${board._id}`);
      toast.success("Board deleted");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete it");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="glass-card flex flex-wrap items-center justify-between gap-4 p-6 md:p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
            <PenLine className="text-[var(--primary)]" size={26} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">
              Whiteboard
            </h1>
            <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
              Write with a pen or a mouse, zoom in on the working, and share a link so the class
              watches it appear live.
            </p>
          </div>
        </div>
        <button onClick={create} disabled={busy === "new"} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5 disabled:opacity-50">
          {busy === "new" ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} New board
        </button>
      </header>

      {shared.length > 0 && (
        <div className="glass-card p-5 rounded-3xl space-y-2">
          <h2 className="font-display font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Radio size={15} className="text-red-500" /> Being shared right now
          </h2>
          {shared.map((b) => (
            <button key={b._id} onClick={() => navigate(`/boards/live?code=${b.shareCode}`)}
              className="w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl border border-[var(--border-light)] hover:border-[var(--primary)] transition-colors">
              <span className="min-w-0">
                <span className="block font-bold text-sm text-[var(--text-primary)] truncate">{b.title}</span>
                <span className="block text-[11px] text-[var(--text-secondary)]">
                  {b.owner?.name}{b.owner?.designation ? ` · ${b.owner.designation}` : ""}
                </span>
              </span>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                <Users size={12} /> Watch
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : boards.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)] flex flex-col items-center gap-3">
          <PenLine size={36} className="opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No boards yet</p>
          <p className="text-sm">Make one for your next class — it opens full screen and saves as you go.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((b) => (
            <div key={b._id} className="glass-card rounded-3xl p-5 flex flex-col gap-3">
              <button onClick={() => navigate(`/boards/${b._id}`)} className="text-left flex-1">
                <h3 className="font-display font-black text-base text-[var(--text-primary)] truncate">{b.title}</h3>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                  <Clock size={11} /> {when(b.lastOpenedAt || b.updatedAt)}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {b.pageCount} page{b.pageCount === 1 ? "" : "s"} · {b.strokeCount} stroke{b.strokeCount === 1 ? "" : "s"}
                </p>
              </button>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-light)]">
                {b.isShared ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                    <Share2 size={11} /> shared
                  </span>
                ) : <span className="text-[10px] text-[var(--text-secondary)]">private</span>}
                <span className="flex items-center gap-1">
                  <button onClick={() => rename(b)} title="Rename"
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)]"><Pencil size={13} /></button>
                  <button onClick={() => remove(b)} disabled={busy === b._id} title="Delete"
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-40">
                    {busy === b._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
