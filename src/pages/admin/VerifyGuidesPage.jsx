import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, ShieldCheck, ShieldAlert, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function VerifyGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchGuides = async () => {
    try {
      const { data } = await api.get('/admin/guides');
      setGuides(data.data);
    } catch (error) {
      toast.error('Failed to fetch guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const toggleStatus = async (id) => {
    try {
      const { data } = await api.patch(`/admin/guides/${id}/toggle-status`);
      toast.success(data.message);
      setGuides(guides.map(g => g._id === id ? { ...g, isActive: data.data.isActive } : g));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredGuides = guides.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[var(--primary)] text-[11px] font-black uppercase tracking-widest w-max mb-2 shadow-sm">
            <UserPlus size={14} />
            <span>Guide Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Verify Admins & Guides
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Approve or revoke access for administrators and project guides across the ecosystem.</p>
        </motion.div>
      </header>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-2xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Table */}
      <motion.div className="glass-card overflow-hidden shadow-sm"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[var(--text-secondary)] font-medium">
            <thead className="text-[10px] uppercase bg-[var(--bg-app)] text-slate-500 font-black tracking-widest border-b border-[var(--border-light)]">
              <tr>
                <th className="px-6 py-4">User Info</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {filteredGuides.map((guide, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                  key={guide._id}
                  className="hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-[var(--border-light)] shadow-sm flex items-center justify-center font-black text-white text-sm" style={{ background: `hsl(${(guide.name.charCodeAt(0) * 37) % 360}, 60%, 40%)` }}>
                        {guide.name[0]}
                      </div>
                      <div>
                        <div className="text-[14px] font-bold text-[var(--text-primary)]">{guide.name}</div>
                        <div className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80 mt-0.5">{guide.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-light)] text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">
                      {guide.role === 'guide' ? 'Project Guide' : guide.role === 'pms_admin' ? 'PMS Admin' : guide.role === 'super50_admin' ? 'Super 50 Admin' : 'T&P Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                    {guide.department || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {guide.isActive ? (
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5 w-max">
                        <ShieldCheck size={14} /> Active
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] px-2.5 py-1 rounded-md uppercase font-black tracking-widest shadow-sm flex items-center gap-1.5 w-max">
                        <ShieldAlert size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatus(guide._id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-[0.8rem] text-[11px] uppercase font-black tracking-widest transition-all shadow-sm border ${
                        guide.isActive
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {guide.isActive ? <><X size={14} /> Revoke Access</> : <><Check size={14} /> Approve User</>}
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredGuides.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                    <ShieldAlert size={40} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold uppercase tracking-widest text-[11px]">No guides or admins found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
