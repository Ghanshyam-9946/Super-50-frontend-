import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMyActivities, addActivity, deleteActivity } from '../../features/activities/activitiesSlice';
import { Zap, Plus, Trash2, X, Loader2, Code2, Briefcase, FolderGit2, Trophy, BookOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const typeConfig = {
  coding: { icon: Code2, color: '#7c3aed', bg: 'rgba(124,58,237,0.15)', label: 'Coding' },
  internship: { icon: Briefcase, color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Internship' },
  project: { icon: FolderGit2, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', label: 'Project' },
  hackathon: { icon: Trophy, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Hackathon' },
  workshop: { icon: BookOpen, color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Workshop' },
  other: { icon: Star, color: '#64748b', bg: 'rgba(100,116,139,0.15)', label: 'Other' },
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass-card" style={{ width: '90%', maxWidth: 500, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add Activity</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Activity Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.entries(typeConfig).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                    style={{
                      padding: '10px 8px', borderRadius: 10, border: form.type === key ? `1px solid ${cfg.color}` : '1px solid var(--border)',
                      background: form.type === key ? cfg.bg : 'var(--bg-secondary)', color: form.type === key ? cfg.color : 'var(--text-muted)',
                      cursor: 'pointer', fontWeight: 600, fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                    }}>
                    <Icon size={18} />{cfg.label}
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
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{label}</label>
              <input className="input-field" value={form[key]} placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={key === 'title'} id={`activity-${key}`} />
            </div>
          ))}
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading} id="add-activity-submit">
            {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Adding...</> : <><Plus size={16} /> Add Activity</>}
          </button>
        </form>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    <div className="page-layout">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">My Activities</h1>
          <p className="page-subtitle">{myActivities.length} activities logged • {Math.min(myActivities.length * 5, 40)} score points earned</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="add-activity-btn">
          <Plus size={16} /> Add Activity
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{
          padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          border: filter === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
          background: filter === 'all' ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
          color: filter === 'all' ? 'var(--accent-light)' : 'var(--text-muted)',
        }}>All ({myActivities.length})</button>
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = myActivities.filter(a => a.type === key).length;
          if (!count) return null;
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === key ? `1px solid ${cfg.color}` : '1px solid var(--border)',
              background: filter === key ? cfg.bg : 'var(--bg-card)',
              color: filter === key ? cfg.color : 'var(--text-muted)',
            }}>{cfg.label} ({count})</button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Zap size={60} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No activities yet</p>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }}>
            <Plus size={15} /> Log First Activity
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {filtered.map((act, i) => {
              const cfg = typeConfig[act.type] || typeConfig.other;
              const Icon = cfg.icon;
              return (
                <motion.div key={act._id} className="glass-card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.04 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={cfg.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{act.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {act.platform && `${act.platform} • `}{act.duration && `${act.duration} • `}
                      {new Date(act.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600 }}>
                    {cfg.label}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--success-bg)', color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>
                    +{act.scoreWeight}pts
                  </span>
                  <button onClick={() => dispatch(deleteActivity(act._id)).then(r => !r.error && toast.success('Deleted'))}
                    className="btn-danger" style={{ padding: '6px 10px' }} id={`delete-act-${act._id}`}>
                    <Trash2 size={14} />
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
