import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users2, FileCheck2, Search, Loader2, Check, ChevronRight, PartyPopper, Circle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import NoDuesFormDetail from '../../components/nodues/NoDuesFormDetail';

export default function NoDuesAdminPage() {
  const { user } = useSelector((s) => s.auth);
  const [tab, setTab] = useState('assign'); // assign | overview

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-3">
            <FileCheck2 className="text-[var(--primary)]" size={30} /> No Dues & Mentors
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">
            Assign students to a mentor's TG group, and track No Dues completion across the department.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border-light)] pb-1">
        {[
          { key: 'assign', label: 'Assign Mentor (TG)', icon: Users2 },
          { key: 'overview', label: 'No Dues Overview', icon: FileCheck2 },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                active ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <t.icon size={16} /> {t.label}
              {active && <motion.div layoutId="noDuesAdminTabUnderline" className="absolute -bottom-[5px] left-3 right-3 h-[3px] rounded-full bg-[var(--primary)]" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          {tab === 'assign' ? <AssignMentorTab /> : <OverviewTab user={user} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────  ASSIGN MENTOR  ───────────────────────────── */

function AssignMentorTab() {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [selected, setSelected] = useState([]);
  const [mentorId, setMentorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (semesterFilter) params.semester = semesterFilter;
      const [s, m] = await Promise.all([
        api.get('/admin/students', { params }),
        api.get('/admin/guides'),
      ]);
      if (s.data.success) setStudents(s.data.data);
      if (m.data.success) setMentors(m.data.data);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, semesterFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAll = () => {
    const ids = students.map((s) => s._id);
    setSelected((prev) => (ids.every((id) => prev.includes(id)) ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const assign = async () => {
    if (selected.length === 0) return toast.error('Select at least one student');
    if (!mentorId) return toast.error('Please select a mentor from the dropdown first');
    setAssigning(true);
    try {
      const { data } = await api.patch('/admin/assign-mentor', { studentIds: selected, mentorId });
      if (data.success) {
        toast.success(data.message);
        setSelected([]);
        await load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign mentor');
    } finally {
      setAssigning(false);
    }
  };

  const unassign = async () => {
    if (selected.length === 0) return toast.error('Select at least one student');
    if (!window.confirm(`Unassign the mentor for ${selected.length} student(s)?`)) return;
    setAssigning(true);
    try {
      const { data } = await api.patch('/admin/assign-mentor', { studentIds: selected, mentorId: null });
      if (data.success) {
        toast.success(data.message);
        setSelected([]);
        await load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign mentor');
    } finally {
      setAssigning(false);
    }
  };

  const allSelected = students.length > 0 && students.every((s) => selected.includes(s._id));

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl px-3 py-2">
          <Search size={15} className="text-[var(--text-secondary)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, enrollment, email…" className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]" />
        </div>
        <select value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none">
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
        <select value={mentorId} onChange={(e) => setMentorId(e.target.value)} className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none min-w-[200px]">
          <option value="">Select a mentor…</option>
          {mentors.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
        </select>
        <button onClick={assign} disabled={assigning || selected.length === 0 || !mentorId} className="btn-premium text-xs px-4 py-2.5 flex items-center gap-2 disabled:opacity-40" title={!mentorId ? 'Select a mentor first' : ''}>
          {assigning ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Assign ({selected.length})
        </button>
        <button onClick={unassign} disabled={assigning || selected.length === 0} className="text-xs px-4 py-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold transition-all disabled:opacity-40">
          Unassign
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-light)] text-left">
                  <th className="px-5 py-4 w-10">
                    <button onClick={selectAll} className={`w-4.5 h-4.5 rounded border flex items-center justify-center ${allSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-light)]'}`}>
                      {allSelected && <Check size={11} className="text-white" />}
                    </button>
                  </th>
                  {['Name', 'Enrollment', 'Semester', 'Current Mentor'].map((h) => (
                    <th key={h} className="px-5 py-4 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const on = selected.includes(s._id);
                  const currentMentor = mentors.find((m) => m._id === s.mentor);
                  return (
                    <tr key={s._id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="px-5 py-3">
                        <button onClick={() => toggle(s._id)} className={`w-4.5 h-4.5 rounded border flex items-center justify-center ${on ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--border-light)]'}`}>
                          {on && <Check size={11} className="text-white" />}
                        </button>
                      </td>
                      <td className="px-5 py-3 font-bold text-[var(--text-primary)]">{s.name}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{s.enrollmentNumber || '—'}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{s.semester || '—'}</td>
                      <td className="px-5 py-3 text-[var(--text-secondary)]">{currentMentor ? currentMentor.name : <span className="italic opacity-60">Unassigned</span>}</td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[var(--text-secondary)]">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────  OVERVIEW  ───────────────────────────── */

function OverviewTab({ user }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [openFormId, setOpenFormId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.completed = filter;
      const { data } = await api.get('/no-dues', { params });
      if (data.success) setForms(data.data);
    } catch (err) {
      toast.error('Failed to load No Dues forms');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (updated) => setForms((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));

  const completedCount = forms.filter((f) => f.isCompleted).length;

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <StatCard label="Total Forms" value={forms.length} />
        <StatCard label="Completed" value={completedCount} accent="text-emerald-500" />
        <StatCard label="In Progress" value={forms.length - completedCount} accent="text-amber-500" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Filter</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[var(--bg-select)] border border-[var(--border-light)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] outline-none">
          <option value="">All</option>
          <option value="true">Completed</option>
          <option value="false">In Progress</option>
        </select>
      </div>

      {loading ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center gap-4 rounded-3xl">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : forms.length === 0 ? (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-3 rounded-3xl">
          <FileCheck2 size={40} className="text-[var(--text-secondary)] opacity-50" />
          <p className="text-[var(--text-primary)] font-bold">No No Dues forms found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => {
            const open = openFormId === form._id;
            return (
              <div key={form._id} className={`glass-card rounded-2xl overflow-hidden ${form.isCompleted ? 'ring-1 ring-emerald-500/30' : ''}`}>
                <button onClick={() => setOpenFormId(open ? null : form._id)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
                  <div className="min-w-0 flex items-center gap-3">
                    {form.isCompleted ? (
                      <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0"><PartyPopper size={15} className="text-emerald-500" /></span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0"><Circle size={15} className="text-slate-400" /></span>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[var(--text-primary)] truncate">{form.student?.name} <span className="text-[var(--text-secondary)] font-medium">— {form.session}</span></div>
                      <div className="text-[11px] text-[var(--text-secondary)]">Sem {form.semester}{form.section ? ` · ${form.section}` : ''} · Mentor: {form.createdBy?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge ${form.isCompleted ? 'badge-approved' : 'bg-slate-500/10 border-slate-500/20 text-slate-500'}`}>
                      {form.isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                    <ChevronRight size={16} className={`text-[var(--text-secondary)] transition-transform ${open ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1 border-t border-[var(--border-light)]">
                        <NoDuesFormDetail form={form} currentUser={user} onChange={handleChange} showDeleteButton={false} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className={`text-3xl font-display font-black leading-none ${accent || 'text-[var(--text-primary)]'}`}>{value}</div>
      <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
}
