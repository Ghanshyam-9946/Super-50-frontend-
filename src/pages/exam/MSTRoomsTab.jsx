import { useEffect, useMemo, useState } from "react";
import { DoorOpen, Loader2, Pencil, Plus, Power, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { Modal } from "./mstShared";
import { errText, inputCls, labelCls } from "./mstUtils";

// Exam rooms: a grid of benches (rows × columns), each double (2 seats),
// single (1) or not used. Capacity is worked out from the benches.

const NEXT = { double: "single", single: "none", none: "double" };
const BENCH_STYLE = {
  double: "bg-indigo-500/15 border-indigo-500/40 text-indigo-700",
  single: "bg-emerald-500/15 border-emerald-500/40 text-emerald-700",
  none: "bg-transparent border-dashed border-[var(--border-light)] text-[var(--text-secondary)]",
};

// Same rule as the server: double benches first, then single, rest unused.
const buildLayout = (rows, cols, d, s) => {
  const out = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      let type = "none";
      if (d > 0) { type = "double"; d -= 1; } else if (s > 0) { type = "single"; s -= 1; }
      out.push({ r, c, type });
    }
  }
  return out;
};

export const BenchGrid = ({ rows, cols, layout, onToggle, small }) => (
  <div>
    <div className="mx-auto mb-2 w-40 text-center text-[9px] font-black uppercase tracking-widest rounded-md bg-[var(--bg-input)] py-1 text-[var(--text-secondary)]">Front / Board</div>
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols); const c = i % cols;
        const b = layout.find((x) => x.r === r && x.c === c) || { type: "none" };
        const Tag = onToggle ? "button" : "div";
        return (
          <Tag key={i} type={onToggle ? "button" : undefined} onClick={onToggle ? () => onToggle(r, c) : undefined}
            title={`Row ${r + 1}, Bench ${c + 1}: ${b.type === "none" ? "not used" : b.type}`}
            className={`rounded-lg border flex items-center justify-center font-black ${small ? "h-5 text-[8px]" : "h-10 text-[10px]"} ${BENCH_STYLE[b.type]} ${onToggle ? "hover:ring-2 hover:ring-[var(--primary)]/40" : ""}`}>
            {small ? "" : b.type === "double" ? "2" : b.type === "single" ? "1" : "—"}
          </Tag>
        );
      })}
    </div>
  </div>
);

function RoomForm({ room, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    name: room?.name || "", block: room?.block || "", rows: room?.rows || 5, cols: room?.cols || 4,
    doubleCount: room?.doubleCount ?? 20, singleCount: room?.singleCount ?? 0, notes: room?.notes || "",
  }));
  // Benches edited by hand (click to change); null = from the counts.
  const [layout, setLayout] = useState(room?.layout || null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); if (["rows", "cols", "doubleCount", "singleCount"].includes(k)) setLayout(null); };
  const rows = Math.max(1, Math.min(30, Number(f.rows) || 1));
  const cols = Math.max(1, Math.min(20, Number(f.cols) || 1));
  const shown = useMemo(() => layout || buildLayout(rows, cols, Number(f.doubleCount) || 0, Number(f.singleCount) || 0), [layout, rows, cols, f.doubleCount, f.singleCount]);
  const counts = { double: shown.filter((b) => b.type === "double").length, single: shown.filter((b) => b.type === "single").length };
  const capacity = counts.single + counts.double * 2;
  const overflow = !layout && (Number(f.doubleCount) || 0) + (Number(f.singleCount) || 0) > rows * cols;
  const toggle = (r, c) => setLayout(shown.map((b) => (b.r === r && b.c === c ? { ...b, type: NEXT[b.type] } : b)));

  const save = async (e) => {
    e.preventDefault();
    if (overflow) return toast.error(`More benches than ${rows} × ${cols} places`);
    setBusy(true);
    try {
      const body = { ...f, rows, cols, ...(layout ? { layout } : {}) };
      const { data } = room ? await api.put(`/mst-exam/rooms/${room._id}`, body) : await api.post("/mst-exam/rooms", body);
      toast.success(data.message);
      onSaved();
    } catch (err) {
      toast.error(errText(err, "Could not save"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={room ? `Edit — ${room.name}` : "Create room"} onClose={onClose} wide>
      <form onSubmit={save} className="grid md:grid-cols-[1fr_1.2fr] gap-6">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>Classroom name<input id="room-name" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. 204" className={inputCls} required /></label>
            <label className={labelCls}>Block / floor<input value={f.block} onChange={(e) => set("block", e.target.value)} placeholder="e.g. A block, 2nd floor" className={inputCls} /></label>
            <label className={labelCls}>No. of rows<input id="room-rows" type="number" min="1" max="30" value={f.rows} onChange={(e) => set("rows", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>No. of columns<input id="room-cols" type="number" min="1" max="20" value={f.cols} onChange={(e) => set("cols", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Double benches (2 seats)<input id="room-double" type="number" min="0" value={f.doubleCount} onChange={(e) => set("doubleCount", e.target.value)} className={inputCls} /></label>
            <label className={labelCls}>Single benches (1 seat)<input id="room-single" type="number" min="0" value={f.singleCount} onChange={(e) => set("singleCount", e.target.value)} className={inputCls} /></label>
          </div>
          <div className={`rounded-2xl border p-4 ${overflow ? "border-red-500/40 bg-red-500/5" : "border-[var(--border-light)] bg-[var(--bg-input)]/50"}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Seating capacity</div>
            <div className="text-3xl font-display font-black text-[var(--text-primary)]">{capacity}</div>
            <div className="text-xs text-[var(--text-secondary)]">{counts.double} double × 2 + {counts.single} single · {rows * cols} places in the grid</div>
            {overflow && <div className="text-xs font-bold text-red-600 mt-1">More benches than places — add rows or columns</div>}
          </div>
          <label className={labelCls}>Notes<input value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional" className={inputCls} /></label>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)]">Click a bench to change it: <b className="text-indigo-600">double</b> → <b className="text-emerald-600">single</b> → not used.</div>
          <BenchGrid rows={rows} cols={cols} layout={shown} onToggle={toggle} />
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="btn-outline-premium text-sm px-4 py-2">Cancel</button>
            <button id="room-save" type="submit" disabled={busy} className="btn-premium text-sm px-5 py-2 flex items-center gap-1.5 disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {room ? "Save" : "Create room"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function MSTRoomsTab() {
  const [rooms, setRooms] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | room

  const load = () => api.get("/mst-exam/rooms").then(({ data }) => setRooms(data.data)).catch((err) => { toast.error(errText(err, "Could not load rooms")); setRooms([]); });
  useEffect(() => { load(); }, []);

  const toggle = async (room) => {
    try { await api.put(`/mst-exam/rooms/${room._id}`, { isActive: !room.isActive }); toast.success(room.isActive ? `${room.name} is inactive` : `${room.name} is active`); load(); } catch (err) { toast.error(errText(err, "Could not change")); }
  };
  const remove = async (room) => {
    if (!window.confirm(`Remove room ${room.name}?`)) return;
    try { const { data } = await api.delete(`/mst-exam/rooms/${room._id}`); toast.success(data.message); load(); } catch (err) { toast.error(errText(err, "Could not remove")); }
  };
  const active = (rooms || []).filter((r) => r.isActive);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-[var(--text-secondary)] flex-1 min-w-[240px]">
          Only <b>active</b> rooms are used for the seating plan. {active.length} active · {active.reduce((n, r) => n + r.capacity, 0)} seats.
        </p>
        <button onClick={() => setEditing("new")} className="btn-premium text-sm px-4 py-2.5 flex items-center gap-1.5"><Plus size={15} /> Create room</button>
      </div>
      {!rooms ? <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
        : rooms.length === 0 ? <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--text-secondary)]">No rooms yet — create the exam rooms first.</div> : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room._id} className={`glass-card rounded-2xl p-4 space-y-3 ${room.isActive ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display font-black text-lg text-[var(--text-primary)] flex items-center gap-2"><DoorOpen size={17} className="text-[var(--primary)]" /> {room.name}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{room.block || "—"} · {room.rows} × {room.cols}</div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${room.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-500"}`}>{room.isActive ? "Active" : "Inactive"}</span>
                </div>
                <BenchGrid rows={room.rows} cols={room.cols} layout={room.layout} small />
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs"><b className="text-lg font-black text-[var(--text-primary)]">{room.capacity}</b> seats · {room.doubleCount} double, {room.singleCount} single</div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditing(room)} title="Edit" aria-label={`Edit ${room.name}`} className="p-2 rounded-lg border border-[var(--border-light)] hover:text-[var(--primary)]"><Pencil size={13} /></button>
                    <button onClick={() => toggle(room)} title={room.isActive ? "Make inactive" : "Make active"} aria-label={`${room.isActive ? "Deactivate" : "Activate"} ${room.name}`} className="p-2 rounded-lg border border-[var(--border-light)] hover:text-[var(--primary)]"><Power size={13} /></button>
                    <button onClick={() => remove(room)} title="Remove" aria-label={`Remove ${room.name}`} className="p-2 rounded-lg border border-[var(--border-light)] hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      {editing && <RoomForm room={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}
