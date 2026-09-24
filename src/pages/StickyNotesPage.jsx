import { useState, useEffect, useRef } from "react";
import { StickyNote as StickyNoteIcon, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const COLORS = {
  yellow: { bg: "bg-amber-100 dark:bg-amber-500/20", border: "border-amber-300 dark:border-amber-400/40", swatch: "bg-amber-400" },
  pink: { bg: "bg-pink-100 dark:bg-pink-500/20", border: "border-pink-300 dark:border-pink-400/40", swatch: "bg-pink-400" },
  blue: { bg: "bg-blue-100 dark:bg-blue-500/20", border: "border-blue-300 dark:border-blue-400/40", swatch: "bg-blue-400" },
  green: { bg: "bg-emerald-100 dark:bg-emerald-500/20", border: "border-emerald-300 dark:border-emerald-400/40", swatch: "bg-emerald-400" },
  purple: { bg: "bg-purple-100 dark:bg-purple-500/20", border: "border-purple-300 dark:border-purple-400/40", swatch: "bg-purple-400" },
  orange: { bg: "bg-orange-100 dark:bg-orange-500/20", border: "border-orange-300 dark:border-orange-400/40", swatch: "bg-orange-400" },
};
const COLOR_KEYS = Object.keys(COLORS);

function NoteCard({ note, onChange, onDelete }) {
  const [text, setText] = useState(note.text);
  const saveTimer = useRef(null);
  const palette = COLORS[note.color] || COLORS.yellow;

  const scheduleSave = (nextText) => {
    setText(nextText);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onChange(note._id, { text: nextText }), 600);
  };

  return (
    <div className={`rounded-2xl border-2 p-4 shadow-sm flex flex-col gap-3 ${palette.bg} ${palette.border}`}>
      <textarea
        value={text}
        onChange={(e) => scheduleSave(e.target.value)}
        rows={5}
        placeholder="Write a note…"
        className="bg-transparent outline-none resize-none text-sm text-[var(--text-primary)] font-medium flex-1"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {COLOR_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => onChange(note._id, { color: c })}
              title={c}
              className={`w-4 h-4 rounded-full ${COLORS[c].swatch} ${note.color === c ? "ring-2 ring-offset-1 ring-[var(--text-primary)]" : ""}`}
            />
          ))}
        </div>
        <button onClick={() => onDelete(note._id)} className="text-[var(--text-secondary)] hover:text-red-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function StickyNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/sticky-notes");
      if (data.success) setNotes(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addNote = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/sticky-notes", { text: "" });
      if (data.success) setNotes((prev) => [...prev, data.data]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add note");
    } finally {
      setCreating(false);
    }
  };

  const updateNote = async (id, patch) => {
    setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, ...patch } : n)));
    try {
      await api.patch(`/sticky-notes/${id}`, patch);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note");
    }
  };

  const deleteNote = async (id) => {
    setNotes((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/sticky-notes/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete note");
      load();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center justify-between gap-4 p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20">
            <StickyNoteIcon size={26} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Sticky Notes</h1>
            <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">Your own private notes — only you can see these.</p>
          </div>
        </div>
        <button onClick={addNote} disabled={creating} className="btn-premium flex items-center gap-2 text-xs disabled:opacity-40">
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} New Note
        </button>
      </header>

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl">
          <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
        </div>
      ) : notes.length === 0 ? (
        <div className="glass-card p-16 text-center rounded-3xl text-[var(--text-secondary)] flex flex-col items-center gap-3">
          <StickyNoteIcon size={40} className="opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No notes yet</p>
          <button onClick={addNote} className="btn-premium flex items-center gap-2 text-xs mt-1">
            <Plus size={16} /> Add your first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => (
            <NoteCard key={note._id} note={note} onChange={updateNote} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </div>
  );
}
