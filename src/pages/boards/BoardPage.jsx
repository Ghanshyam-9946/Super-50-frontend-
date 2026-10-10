import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Pen, Highlighter, Eraser, Undo2, Redo2, Trash2, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Save, Share2, Users, ChevronLeft, ChevronRight, Plus, Loader2, AlertCircle, Check, Crosshair, X,
  Type, Bold, Italic,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import useBoard, { COLOURS, WIDTHS, FONTS, TEXT_SIZES, fontStack } from "./useBoard";
import BoardCanvas from "./BoardCanvas";

// The board itself: a full-bleed writing surface with the controls tucked
// into one bar, so the paper gets the screen.

const Tool = ({ active, title, onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
      active ? "bg-[var(--primary)] text-white" : "text-slate-600 hover:bg-slate-200/70"
    }`}
  >
    {children}
  </button>
);

export default function BoardPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const shareCode = params.get("code") || undefined;
  const navigate = useNavigate();

  const board = useBoard({ boardId: id, shareCode });
  const shellRef = useRef(null);
  const [full, setFull] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { role, canDraw } = board;
  const isOwner = role === "owner";

  /* ----------------------------- full screen ---------------------------- */

  const toggleFull = async () => {
    try {
      if (!document.fullscreenElement) {
        await shellRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.error("Your browser would not go full screen");
    }
  };

  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ------------------------------ shortcuts ----------------------------- */

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); board.undo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); board.redo(); }
      else if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
      else if (e.key === "p") board.setTool("pen");
      else if (e.key === "h") board.setTool("highlighter");
      else if (e.key === "t") board.setTool("text");
      else if (e.key === "e") board.setTool("eraser");
      else if (e.key === "0") board.resetView?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const save = async () => {
    if (!isOwner) return;
    try {
      await board.save();
      toast.success("Board saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the board");
    }
  };

  /* -------------------------------- share ------------------------------- */

  const shareLink = board.board?.shareCode
    ? `${window.location.origin}/boards/live?code=${board.board.shareCode}`
    : "";

  const toggleShare = async () => {
    setSharing(true);
    try {
      const { data } = await api.patch(`/boards/${board.board._id}`, { isShared: !board.board.isShared });
      board.board.isShared = data.data.isShared;
      toast.success(data.data.isShared ? "Anyone with the link can watch now" : "Sharing stopped");
      setSharing(false);
      // Nudge a re-render without reloading the strokes.
      board.setZoom((z) => z);
    } catch (err) {
      setSharing(false);
      toast.error(err.response?.data?.message || "Could not change sharing");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  };

  /* -------------------------------- views ------------------------------- */

  if (board.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 text-[var(--text-secondary)]">
        <Loader2 className="animate-spin" size={22} /> Opening the board…
      </div>
    );
  }

  if (board.status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle size={34} className="text-amber-500" />
        <p className="text-lg font-bold text-[var(--text-primary)]">{board.error}</p>
        <button onClick={() => navigate("/boards")} className="btn-premium text-sm px-5 py-2.5">My boards</button>
      </div>
    );
  }

  return (
    <div ref={shellRef} className="fixed inset-0 z-[120] flex flex-col bg-slate-100">
      {/* one bar, so the paper keeps the screen */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 shrink-0">
        <button onClick={() => (full ? document.exitFullscreen() : navigate("/boards"))}
          title="Back" className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/70">
          <X size={17} />
        </button>

        <span className="font-display font-black text-sm text-slate-800 truncate max-w-[180px]">
          {board.board?.title}
        </span>

        {canDraw && (
          <>
            <span className="w-px h-6 bg-slate-200 mx-1" />
            <Tool active={board.tool === "pen"} title="Pen (P)" onClick={() => board.setTool("pen")}><Pen size={17} /></Tool>
            <Tool active={board.tool === "highlighter"} title="Highlighter (H)" onClick={() => board.setTool("highlighter")}><Highlighter size={17} /></Tool>
            <Tool active={board.tool === "text"} title="Text (T)" onClick={() => board.setTool("text")}><Type size={17} /></Tool>
            <Tool active={board.tool === "eraser"} title="Eraser (E)" onClick={() => board.setTool("eraser")}><Eraser size={17} /></Tool>

            <span className="w-px h-6 bg-slate-200 mx-1" />
            <div className="flex items-center gap-1">
              {COLOURS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { board.setColour(c.value); if (board.tool === "eraser") board.setTool("pen"); }}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    board.colour === c.value && board.tool !== "eraser"
                      ? "border-[var(--primary)] scale-110" : "border-slate-300"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>

            <span className="w-px h-6 bg-slate-200 mx-1" />
            {board.tool === "text" ? (
              // While typing, this slot carries the font instead of the
              // nib — the toolbar stays one row on a classroom laptop.
              <div className="flex items-center gap-1.5">
                <select
                  value={board.font}
                  onChange={(e) => board.setFont(e.target.value)}
                  title="Font"
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
                  style={{ fontFamily: fontStack(board.font) }}
                >
                  {FONTS.map((f) => (
                    <option key={f.key} value={f.key} style={{ fontFamily: f.stack }}>{f.name}</option>
                  ))}
                </select>
                <select
                  value={board.textSize}
                  onChange={(e) => board.setTextSize(Number(e.target.value))}
                  title="Text size"
                  className="text-xs font-bold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
                >
                  {TEXT_SIZES.map((n) => <option key={n} value={n}>{n}px</option>)}
                </select>
                <Tool active={board.bold} title="Bold" onClick={() => board.setBold(!board.bold)}><Bold size={15} /></Tool>
                <Tool active={board.italic} title="Italic" onClick={() => board.setItalic(!board.italic)}><Italic size={15} /></Tool>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {WIDTHS.map((w) => (
                  <button key={w} onClick={() => board.setWidth(w)} title={`${w}px`}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      board.width === w ? "bg-[var(--primary)]/15" : "hover:bg-slate-200/70"
                    }`}>
                    <span className="rounded-full bg-slate-700 block"
                      style={{ width: Math.min(w, 16), height: Math.min(w, 16) }} />
                  </button>
                ))}
              </div>
            )}

            <span className="w-px h-6 bg-slate-200 mx-1" />
            <Tool title="Undo (Ctrl+Z)" onClick={board.undo} disabled={!board.canUndo}><Undo2 size={17} /></Tool>
            <Tool title="Redo (Ctrl+Y)" onClick={board.redo} disabled={!board.canRedo}><Redo2 size={17} /></Tool>
            <Tool title="Clear this page" onClick={() => {
              if (window.confirm("Clear everything on this page?")) board.clearPage();
            }}><Trash2 size={17} /></Tool>
          </>
        )}

        <span className="w-px h-6 bg-slate-200 mx-1" />
        <Tool title="Zoom out" onClick={() => board.zoomBy?.(1 / 1.25)}><ZoomOut size={17} /></Tool>
        <Tool title="Actual size (0)" onClick={() => board.resetView?.()}><Crosshair size={16} /></Tool>
        <Tool title="Zoom in" onClick={() => board.zoomBy?.(1.25)}><ZoomIn size={17} /></Tool>

        <span className="w-px h-6 bg-slate-200 mx-1" />
        <div className="flex items-center gap-1 text-xs font-bold text-slate-600">
          <Tool title="Previous page" onClick={() => board.goToPage(board.page - 1)} disabled={board.page === 0}>
            <ChevronLeft size={16} />
          </Tool>
          <span className="tabular-nums">{board.page + 1} / {board.pageCount}</span>
          <Tool title="Next page" onClick={() => board.goToPage(board.page + 1)} disabled={!isOwner && board.page + 1 >= board.pageCount}>
            <ChevronRight size={16} />
          </Tool>
          {isOwner && (
            <Tool title="New page" onClick={() => board.goToPage(board.pageCount)}><Plus size={15} /></Tool>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {board.watching > 1 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl">
              <Users size={13} /> {board.watching} watching
            </span>
          )}

          {!isOwner && (
            <span className="text-[11px] font-bold text-slate-500 px-2">
              {canDraw ? "You can draw" : "Watching live"}
            </span>
          )}

          {isOwner && (
            <>
              <button onClick={toggleShare} disabled={sharing}
                title={board.board.isShared ? "Stop sharing" : "Let anyone with the link watch"}
                className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border ${
                  board.board.isShared
                    ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/10"
                    : "border-slate-200 text-slate-600"
                }`}>
                {sharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
                {board.board.isShared ? "Live" : "Share"}
              </button>

              {board.board.isShared && (
                <button onClick={copyLink} title={shareLink}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 flex items-center gap-1.5">
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                  {copied ? "Copied" : "Copy link"}
                </button>
              )}

              <button onClick={save} disabled={board.saving}
                className="btn-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50">
                {board.saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {board.dirty ? "Save" : "Saved"}
              </button>
            </>
          )}

          <Tool title={full ? "Leave full screen" : "Full screen"} onClick={toggleFull}>
            {full ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </Tool>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <BoardCanvas board={board} />
      </div>
    </div>
  );
}
