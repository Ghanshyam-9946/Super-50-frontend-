import { useEffect, useState } from "react";
import {
  FolderOpen, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Save, Rocket, EyeOff, FlaskConical, BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

// The admin writes the list of headings a course file must contain — one
// list for theory, one for the lab. The order here is the order the faculty
// see, and the order the merged PDF comes out in.
const KINDS = [
  { key: "theory", label: "Theory Course File", icon: BookOpen },
  { key: "lab", label: "Lab Course File", icon: FlaskConical },
];

const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] w-full";

export default function CourseFileIndexPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("theory");
  const [items, setItems] = useState([]);
  const [released, setReleased] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/course-file/index");
      setData(res.data.data);
      setCanManage(!!res.data.canManage);
      const current = res.data.data[kind];
      setItems(current?.items || []);
      setReleased(!!current?.released);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the course file index");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const switchKind = (next) => {
    setKind(next);
    setItems(data?.[next]?.items || []);
    setReleased(!!data?.[next]?.released);
  };

  const setItem = (idx, patch) => setItems((list) => list.map((i, n) => (n === idx ? { ...i, ...patch } : i)));
  const addItem = () => setItems((list) => [...list, { title: "", description: "", required: true }]);
  const removeItem = (idx) => setItems((list) => list.filter((_, n) => n !== idx));
  const move = (idx, by) =>
    setItems((list) => {
      const next = [...list];
      const target = idx + by;
      if (target < 0 || target >= next.length) return next;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const save = async (publish) => {
    if (items.some((i) => !i.title.trim())) return toast.error("Every heading needs a title");
    setSaving(true);
    try {
      const body = { items };
      if (publish !== undefined) body.released = publish;
      const res = await api.put(`/course-file/index/${kind}`, body);
      toast.success(res.data.message + (publish === true ? " · released to faculty" : publish === false ? " · hidden from faculty" : ""));
      setData((d) => ({ ...d, [kind]: res.data.data }));
      setItems(res.data.data.items);
      setReleased(!!res.data.data.released);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-6 md:p-8 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
          <FolderOpen className="text-[var(--primary)]" size={26} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-[var(--text-primary)]">Course File Index</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium text-sm">
            The headings every subject&apos;s course file must contain. Faculty upload one PDF per heading in My Subjects, and download the whole file merged in this order.
          </p>
        </div>
      </header>

      <div className="flex gap-2">
        {KINDS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => switchKind(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border ${
              kind === key ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-light)]"
            }`}>
            <Icon size={15} /> {label}
            {data?.[key]?.released && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700">live</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card p-16 flex justify-center rounded-3xl"><Loader2 className="animate-spin text-[var(--primary)]" /></div>
      ) : (
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-black text-lg text-[var(--text-primary)]">{KINDS.find((k) => k.key === kind).label}</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {items.length} heading{items.length === 1 ? "" : "s"} · {released ? "released to faculty" : "not released yet"}
              </p>
            </div>
            {canManage && (
              <div className="flex flex-wrap gap-2">
                <button onClick={addItem} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5"><Plus size={13} /> Add heading</button>
                <button onClick={() => save()} disabled={saving} className="btn-outline-premium text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-40">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                </button>
                {released ? (
                  <button onClick={() => save(false)} disabled={saving} className="text-xs font-bold px-3 py-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] flex items-center gap-1.5">
                    <EyeOff size={13} /> Hide from faculty
                  </button>
                ) : (
                  <button onClick={() => save(true)} disabled={saving} className="btn-premium text-xs px-4 py-2 flex items-center gap-1.5">
                    <Rocket size={13} /> Release
                  </button>
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] border border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center">
              No headings yet — add the first one (e.g. &quot;Vision &amp; Mission&quot;, &quot;Syllabus copy&quot;, &quot;Lesson plan&quot;).
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item._id || idx} className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl p-3 flex flex-wrap items-start gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-black flex items-center justify-center shrink-0 mt-1">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-[220px] space-y-2">
                    <input value={item.title} onChange={(e) => setItem(idx, { title: e.target.value })}
                      placeholder="Heading, e.g. Lesson Plan" className={inputCls} disabled={!canManage} />
                    <input value={item.description || ""} onChange={(e) => setItem(idx, { description: e.target.value })}
                      placeholder="Note for faculty (optional)" className={`${inputCls} text-xs`} disabled={!canManage} />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2">
                    <input type="checkbox" checked={item.required !== false} disabled={!canManage}
                      onChange={(e) => setItem(idx, { required: e.target.checked })} /> Required
                  </label>
                  {canManage && (
                    <div className="flex items-center gap-1 mt-1">
                      <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-30"><ChevronUp size={15} /></button>
                      <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} title="Move down"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] disabled:opacity-30"><ChevronDown size={15} /></button>
                      <button onClick={() => removeItem(idx)} title="Remove"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={15} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
