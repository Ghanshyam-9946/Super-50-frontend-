import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMyActivities, addActivity, deleteActivity } from '../../features/activities/activitiesSlice';
import { Zap, Plus, Trash2, X, Loader2, Code2, Briefcase, FolderGit2, Trophy, BookOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const typeConfig = {
  coding: { icon: Code2, color: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50', hover: 'hover:border-purple-300', active: 'border-purple-500 bg-purple-100', label: 'Coding' },
  internship: { icon: Briefcase, color: 'text-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300', active: 'border-emerald-500 bg-emerald-100', label: 'Internship' },
  project: { icon: FolderGit2, color: 'text-cyan-600', border: 'border-cyan-200', bg: 'bg-cyan-50', hover: 'hover:border-cyan-300', active: 'border-cyan-500 bg-cyan-100', label: 'Project' },
  hackathon: { icon: Trophy, color: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50', hover: 'hover:border-amber-300', active: 'border-amber-500 bg-amber-100', label: 'Hackathon' },
  workshop: { icon: BookOpen, color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50', hover: 'hover:border-orange-300', active: 'border-orange-500 bg-orange-100', label: 'Workshop' },
  other: { icon: Star, color: 'text-slate-600', border: 'border-slate-200', bg: 'bg-slate-50', hover: 'hover:border-slate-300', active: 'border-slate-500 bg-slate-100', label: 'Other' },
};

function AddModal({ onClose }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'coding', title: '', description: '', platform: '', link: '', duration: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await dispatch(addActivity(form));
    setLoading(false);
    if (!result.error) { toast.success('Activity added!'); onClose(); }
    else toast.error(result.payload);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white border border-[var(--border-light)] shadow-xl rounded-[1.5rem] relative" style={{ width: '90%', maxWidth: 520, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-slate-50 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 mb-4 shadow-sm">
          <Zap size={24} />
        </div>
        <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-6">Log New Activity</h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Activity Type</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(typeConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                const isSelected = form.type === key;
                return (
                  <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all duration-200 ${
                      isSelected ? `${cfg.active} ${cfg.color} shadow-sm scale-[0.98]` : `bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:shadow-sm ${cfg.hover}`
                    }`}>
                    <Icon size={20} />
                    <span className="text-[11px] font-bold">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {[
            { key: 'title', label: 'Title *', placeholder: 'e.g., Built a REST API with Node.js' },
            { key: 'platform', label: 'Platform/Organization', placeholder: 'e.g., GitHub, LeetCode, TCS' },
            { key: 'link', label: 'Link (optional)', placeholder: 'https://github.com/...' },
            { key: 'duration', label: 'Duration', placeholder: 'e.g., 2 months' },
            { key: 'description', label: 'Description', placeholder: 'Brief description of what you did...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">{label}</label>
              <input 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm placeholder:font-medium placeholder:text-slate-400" 
                value={form[key]} 
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === 'title'} id={`activity-${key}`} 
              />
            </div>
          ))}
          <button type="submit" className="btn-premium w-full py-3.5 mt-2 flex items-center justify-center gap-2" disabled={loading} id="add-activity-submit">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Logging...</> : <><Plus size={18} /> Add Activity</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ActivitiesPage() {
  const dispatch = useDispatch();
  const { myActivities, loading } = useSelector((s) => s.activities);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { dispatch(fetchMyActivities()); }, [dispatch]);

  const filtered = filter === 'all' ? myActivities : myActivities.filter((a) => a.type === filter);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)] flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-200 shadow-sm shrink-0">
              <Zap size={32} className="fill-amber-500" />
            </div>
            My Activities
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">{myActivities.length} activities logged • <strong className="text-[var(--primary)]">{Math.min(myActivities.length * 5, 40)} score points</strong> earned</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <button className="btn-premium flex items-center gap-2 px-6 py-3" onClick={() => setShowModal(true)} id="add-activity-btn">
            <Plus size={18} /> Log Activity
          </button>
        </motion.div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setFilter('all')} 
          className={`px-5 py-2.5 rounded-[1.2rem] text-[13px] font-black uppercase tracking-widest transition-all ${
            filter === 'all' ? 'bg-[var(--primary)] text-white shadow-md shadow-purple-500/20' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'
          }`}>
          All ({myActivities.length})
        </button>
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = myActivities.filter(a => a.type === key).length;
          if (!count) return null;
          return (
            <button key={key} onClick={() => setFilter(key)} 
              className={`px-4 py-2.5 rounded-[1.2rem] text-[12px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                filter === key ? `${cfg.active} ${cfg.color} shadow-sm` : `bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm`
              }`}>
              <cfg.icon size={14} /> {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-[1.2rem] h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed">
          <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Zap size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-display font-black text-[var(--text-primary)] mb-2">No activities yet</h3>
          <p className="text-[var(--text-secondary)] font-medium mb-8">Log your coding, projects, or hackathons to earn score points.</p>
          <button className="btn-premium flex items-center gap-2 px-6 py-3 mx-auto" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Log First Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filtered.map((act, i) => {
              const cfg = typeConfig[act.type] || typeConfig.other;
              const Icon = cfg.icon;
              return (
                <motion.div key={act._id} className="glass-card p-6 flex items-start gap-5 hover:border-[var(--primary)] transition-colors group relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}>
                  <div className={`w-14 h-14 rounded-2xl ${cfg.bg} flex items-center justify-center shrink-0 border ${cfg.border} shadow-sm`}>
                    <Icon size={24} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="font-display font-black text-lg text-[var(--text-primary)] mb-1 truncate">{act.title}</div>
                    <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-3 flex flex-wrap gap-x-2 gap-y-1">
                      {act.platform && <span className="bg-[var(--bg-app)] border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">{act.platform}</span>}
                      {act.duration && <span className="bg-[var(--bg-app)] border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">{act.duration}</span>}
                      <span className="text-slate-400 mt-0.5">{new Date(act.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                        <Star size={10} className="fill-emerald-600" /> +{act.scoreWeight}pts
                      </span>
                    </div>
                  </div>
                  <button onClick={() => dispatch(deleteActivity(act._id)).then(r => !r.error && toast.success('Deleted'))}
                    className="absolute top-6 right-6 p-2 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" id={`delete-act-${act._id}`} title="Delete Activity">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      {showModal && <AddModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
