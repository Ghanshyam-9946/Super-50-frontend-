import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, Loader2, Plus, Save, Search, ShieldCheck, Trash2, UserMinus, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const ACTION_LABEL = { view: "View", create: "Create", edit: "Edit", delete: "Delete", export: "Export", approve: "Approve" };
const inputCls = "bg-[var(--bg-input)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm w-full";

// The matrix: one row per module, one column per action.
function Matrix({ modules, actions, value, onChange }) {
  const cell = (key, action) => !!value?.[key]?.[action];
  const setCell = (key, action, on) => onChange({ ...value, [key]: { ...Object.fromEntries(actions.map((a) => [a, cell(key, a)])), [action]: on } });
  const setRow = (key, on) => onChange({ ...value, [key]: Object.fromEntries(actions.map((a) => [a, on])) });
  const setCol = (action, on) => onChange(Object.fromEntries(modules.map((m) => [m.key, { ...Object.fromEntries(actions.map((a) => [a, cell(m.key, a)])), [action]: on }])));
  const colAll = (action) => modules.every((m) => cell(m.key, action));

  return (
    <div className="overflow-x-auto border border-[var(--border-light)] rounded-2xl">
      <table className="w-full text-xs min-w-[640px]">
        <thead className="sticky top-0 bg-[var(--bg-card)]">
          <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            <th className="px-3 py-2.5">Module</th>
            {actions.map((a) => (
              <th key={a} className="px-2 py-2.5 text-center">
                <label className="flex flex-col items-center gap-1 cursor-pointer">
                  {ACTION_LABEL[a] || a}
                  <input type="checkbox" checked={colAll(a)} onChange={(e) => setCol(a, e.target.checked)} title={`${ACTION_LABEL[a]} in every module`} />
                </label>
              </th>
            ))}
            <th className="px-2 py-2.5 text-center">All</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => {
            const all = actions.every((a) => cell(m.key, a));
            return (
              <tr key={m.key} className="border-t border-[var(--border-light)] hover:bg-[var(--bg-input)]/50">
                <td className="px-3 py-2 font-bold text-[var(--text-primary)]">{m.label}</td>
                {actions.map((a) => (
                  <td key={a} className="px-2 py-2 text-center">
                    <input type="checkbox" checked={cell(m.key, a)} onChange={(e) => setCell(m.key, a, e.target.checked)} />
                  </td>
                ))}
                <td className="px-2 py-2 text-center">
                  <input type="checkbox" checked={all} onChange={(e) => setRow(m.key, e.target.checked)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Who holds a custom role, and finding people to give it to.
function RolePeople({ role, onCount }) {
  const [holders, setHolders] = useState([]);
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState([]);

  const load = useCallback(async (q = "") => {
    try {
      const { data } = await api.get(`/roles/${role._id}/people`, { params: { search: q } });
      setHolders(data.holders);
      setCandidates(data.candidates);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load people");
    }
  }, [role._id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { if (search.trim().length >= 2) load(search.trim()); else setCandidates([]); }, 350);
    return () => clearTimeout(t);
  }, [search, load]);

  const change = async (body) => {
    try {
      const { data } = await api.put(`/roles/${role._id}/people`, body);
      setHolders(data.holders);
      onCount?.(data.holders.length);
      setCandidates((list) => list.filter((c) => !(body.add || []).includes(c._id)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save");
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a faculty member or staff by name or email"
          className={`${inputCls} pl-8`} />
      </div>
      {candidates.length > 0 && (
        <div className="space-y-1.5">
          {candidates.map((p) => (
            <div key={p._id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[var(--border-light)] text-xs">
              <span className="font-bold text-[var(--text-primary)]">{p.name}</span>
              <span className="text-[var(--text-secondary)] truncate">{p.email} · {p.department || "—"}</span>
              <button onClick={() => change({ add: [p._id] })} className="ml-auto btn-outline-premium text-[11px] px-2.5 py-1 flex items-center gap-1">
                <UserPlus size={12} /> Give role
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">{holders.length} person(s) hold this role</div>
      {holders.length === 0 ? <p className="text-xs text-[var(--text-secondary)]">Nobody yet — search above to give it to someone.</p> : (
        <div className="space-y-1.5">
          {holders.map((p) => (
            <div key={p._id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-input)]/60 text-xs">
              <span className="font-bold text-[var(--text-primary)]">{p.name}</span>
              <span className="text-[var(--text-secondary)] truncate">{p.email} · {p.department || "—"}</span>
              <button onClick={() => change({ remove: [p._id] })} className="ml-auto text-red-500 hover:bg-red-500/10 rounded-lg px-2 py-1 flex items-center gap-1 text-[11px] font-bold">
                <UserMinus size={12} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(async (keepId) => {
    try {
      const { data } = await api.get("/roles");
      setRoles(data.data);
      setModules(data.modules);
      setActions(data.actions);
      const pick = data.data.find((r) => r._id === keepId) || data.data[0];
      if (pick) { setSelectedId(pick._id); setDraft(structuredClone(pick)); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load the roles");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const select = (role) => { setSelectedId(role._id); setDraft(structuredClone(role)); };
  const selected = useMemo(() => roles.find((r) => r._id === selectedId), [roles, selectedId]);
  const editable = (r) => r && JSON.stringify([r.name, r.description || "", r.scope, r.permissions]);
  const dirty = selected && draft && editable(selected) !== editable(draft);

  const save = async () => {
    setSaving(true);
    try {
      const body = { description: draft.description, permissions: draft.permissions };
      if (!draft.system) { body.name = draft.name; body.scope = draft.scope; }
      const { data } = await api.put(`/roles/${draft._id}`, body);
      toast.success(data.message);
      load(draft._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the role");
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    if (!newName.trim()) return toast.error("Give the role a name");
    try {
      const { data } = await api.post("/roles", { name: newName.trim() });
      toast.success(data.message);
      setCreating(false);
      setNewName("");
      load(data.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the role");
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete the role "${draft.name}"? Everyone who holds it loses what it gave them.`)) return;
    try {
      const { data } = await api.delete(`/roles/${draft._id}`);
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the role");
    }
  };

  if (loading) return <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-[var(--primary)]" /></div>;

  const systemRoles = roles.filter((r) => r.system);
  const customRoles = roles.filter((r) => !r.system);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <header className="glass-card flex items-center gap-4 p-8 rounded-3xl">
        <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl border border-[var(--primary)]/20"><KeyRound size={26} /></div>
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Roles & Permissions</h1>
          <p className="text-[var(--text-secondary)] font-medium text-sm mt-1">
            Decide who can view, create, edit, delete, export and approve in each module. Admins always have full access.
          </p>
        </div>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
        <div className="glass-card rounded-2xl p-3 space-y-3 lg:sticky lg:top-4">
          <div>
            <div className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Account types</div>
            {systemRoles.map((r) => (
              <button key={r._id} onClick={() => select(r)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left ${selectedId === r._id ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--bg-input)] text-[var(--text-primary)]"}`}>
                <ShieldCheck size={14} /> <span className="flex-1">{r.name}</span>
                <span className={`text-[10px] ${selectedId === r._id ? "opacity-80" : "text-[var(--text-secondary)]"}`}>{r.holders}</span>
              </button>
            ))}
          </div>
          <div>
            <div className="px-2 pb-1 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Custom roles</div>
            {customRoles.length === 0 && <p className="px-3 py-1 text-[11px] text-[var(--text-secondary)]">None yet.</p>}
            {customRoles.map((r) => (
              <button key={r._id} onClick={() => select(r)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left ${selectedId === r._id ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--bg-input)] text-[var(--text-primary)]"}`}>
                <KeyRound size={14} /> <span className="flex-1">{r.name}</span>
                <span className={`text-[10px] ${selectedId === r._id ? "opacity-80" : "text-[var(--text-secondary)]"}`}>{r.holders}</span>
              </button>
            ))}
            {creating ? (
              <div className="p-2 space-y-2">
                <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()}
                  placeholder="e.g. HOD, Exam Cell" className={inputCls} />
                <div className="flex gap-1.5">
                  <button onClick={create} className="btn-premium text-[11px] px-3 py-1.5">Create</button>
                  <button onClick={() => setCreating(false)} className="btn-outline-premium text-[11px] px-3 py-1.5"><X size={12} /></button>
                </div>
              </div>
            ) : (
              <button onClick={() => setCreating(true)} className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[var(--primary)] hover:bg-[var(--bg-input)]">
                <Plus size={14} /> New role
              </button>
            )}
          </div>
        </div>

        {draft && (
          <div className="space-y-5 min-w-0">
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[220px] space-y-2">
                  {draft.system ? (
                    <h2 className="font-display font-bold text-lg text-[var(--text-primary)]">{draft.name}</h2>
                  ) : (
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={`${inputCls} font-bold`} />
                  )}
                  <input value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="What is this role for?" className={inputCls} />
                </div>
                {!draft.system && (
                  <button onClick={remove} className="text-xs font-bold px-3 py-2 rounded-xl border border-red-500/40 text-red-500 flex items-center gap-1.5">
                    <Trash2 size={13} /> Delete role
                  </button>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-input)]/60 rounded-xl px-3 py-2">
                {draft.system
                  ? `Everyone whose account type is ${draft.name}. Untick something to take it away from all of them — they keep everything that stays ticked, as before.`
                  : "Given to chosen people on top of their account type. Tick what it should open for them — pages they could not use before appear in their menu under \"From My Roles\"."}
              </p>
              {!draft.system && (
                <label className="flex flex-wrap items-center gap-3 text-xs font-bold text-[var(--text-primary)]">
                  Sees in student/staff lists:
                  <select value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} className={`${inputCls} w-auto`}>
                    <option value="institute">The whole institute</option>
                    <option value="department">Only their own department</option>
                  </select>
                </label>
              )}
              <Matrix modules={modules} actions={actions} value={draft.permissions} onChange={(permissions) => setDraft({ ...draft, permissions })} />
              <button onClick={save} disabled={!dirty || saving} className="btn-premium text-sm px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-40">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save role
              </button>
            </div>

            {!draft.system && (
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="font-display font-bold text-base text-[var(--text-primary)]">People with this role</h3>
                <RolePeople key={draft._id} role={draft}
                  onCount={(n) => setRoles((list) => list.map((r) => (r._id === draft._id ? { ...r, holders: n } : r)))} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
