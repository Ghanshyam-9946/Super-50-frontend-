import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, ShieldCheck, ShieldAlert, Check, X, Loader2, Trash2, Award, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PRESET_RESPONSIBILITIES = [
  'Class Coordinator',
  'HOD',
  'T&P Head',
  'Super 50 Mentor',
  'Academic Coordinator',
  'Placement Coordinator',
  'Exam Coordinator',
  'Club Coordinator'
];

export default function VerifyGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Responsibility Modal state
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [guideResps, setGuideResps] = useState([]);
  const [customResp, setCustomResp] = useState('');

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

  const changeRole = async (id, updatedRoles) => {
    try {
      const { data } = await api.patch(`/admin/guides/${id}/role`, { roles: updatedRoles });
      toast.success(data.message || 'Roles updated successfully');
      setGuides(guides.map(g => g._id === id ? { ...g, role: data.data.role, roles: data.data.roles } : g));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update roles');
    }
  };

  // Open modal handler
  const handleOpenRespModal = (guide) => {
    setSelectedGuide(guide);
    setGuideResps(guide.responsibilities || []);
    setCustomResp('');
  };

  // Toggle responsibility chip in state
  const toggleResp = (resp) => {
    if (guideResps.includes(resp)) {
      setGuideResps(guideResps.filter(r => r !== resp));
    } else {
      setGuideResps([...guideResps, resp]);
    }
  };

  // Add custom typed responsibility
  const addCustomResp = (e) => {
    e.preventDefault();
    if (!customResp.trim()) return;
    if (guideResps.includes(customResp.trim())) {
      toast.error('Responsibility already added');
      return;
    }
    setGuideResps([...guideResps, customResp.trim()]);
    setCustomResp('');
  };

  // Save responsibilities to database
  const saveResponsibilities = async () => {
    const toastId = toast.loading('Saving responsibilities...');
    try {
      const { data } = await api.patch(`/admin/guides/${selectedGuide._id}/responsibilities`, {
        responsibilities: guideResps
      });
      toast.success(data.message || 'Responsibilities saved successfully', { id: toastId });
      setGuides(guides.map(g => g._id === selectedGuide._id ? { ...g, responsibilities: data.data.responsibilities } : g));
      setSelectedGuide(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save responsibilities', { id: toastId });
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
            <span>Faculty & Admin Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">
            Verify Faculty & Admins
          </h1>
          <p className="text-[var(--text-secondary)] font-medium mt-1">Approve, verify roles, and assign custom responsibilities to faculty across the ecosystem.</p>
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
            className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 pl-11 pr-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
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
                        {/* Display assigned responsibilities */}
                        {guide.responsibilities && guide.responsibilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {guide.responsibilities.map((resp, rIdx) => (
                              <span key={rIdx} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] uppercase font-black">
                                {resp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {[
                        { value: 'teacher', label: 'Faculty' },
                        { value: 'admin', label: 'Admin' },
                        { value: 'guide', label: 'Guide' },
                        { value: 'pms_admin', label: 'PMS' },
                        { value: 'super50_admin', label: 'Super50' },
                        { value: 'tp_admin', label: 'T&P' }
                      ].map((roleObj) => {
                        const userRoles = guide.roles && guide.roles.length > 0 ? guide.roles : [guide.role];
                        const isActive = userRoles.includes(roleObj.value);
                        return (
                          <button
                            key={roleObj.value}
                            onClick={() => {
                              let updatedRoles;
                              if (isActive) {
                                  if (userRoles.length <= 1) {
                                    toast.error('User must have at least one role');
                                    return;
                                  }
                                  updatedRoles = userRoles.filter(r => r !== roleObj.value);
                              } else {
                                updatedRoles = [...userRoles, roleObj.value];
                              }
                              changeRole(guide._id, updatedRoles);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider border transition-all duration-200 shadow-sm ${
                              isActive
                                ? 'bg-purple-500/10 text-[var(--primary)] border-purple-500/30'
                                : 'bg-transparent text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {roleObj.label}
                          </button>
                        );
                      })}
                    </div>
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
                      onClick={() => handleOpenRespModal(guide)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-[0.8rem] text-[11px] uppercase font-black tracking-widest transition-all shadow-sm border bg-blue-500/5 text-blue-500 border-blue-500/20 hover:bg-blue-500/15 mr-2"
                    >
                      <Award size={13} /> Responsibilities
                    </button>
                    <button
                      onClick={() => toggleStatus(guide._id)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-[0.8rem] text-[11px] uppercase font-black tracking-widest transition-all shadow-sm border ${
                        guide.isActive
                          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {guide.isActive ? <><X size={13} /> Revoke</> : <><Check size={13} /> Approve</>}
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this user?')) {
                          try {
                            await api.delete(`/admin/guides/${guide._id}`);
                            toast.success('User deleted successfully');
                            setGuides(guides.filter(g => g._id !== guide._id));
                          } catch (error) {
                            toast.error('Failed to delete user');
                          }
                        }
                      }}
                      className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-[0.8rem] text-[11px] uppercase font-black tracking-widest transition-all shadow-sm border bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20"
                      title="Delete User"
                    >
                      <Trash2 size={13} /> Delete
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

      {/* Give Responsibilities Modal */}
      <AnimatePresence>
        {selectedGuide && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-modal)] border border-[var(--border-light)] rounded-3xl shadow-xl w-full max-w-lg p-8 relative"
            >
              <button
                onClick={() => setSelectedGuide(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-1">Assign Responsibilities</h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-6">Assign coordinator role or administrative responsibilities to <strong className="text-[var(--text-primary)]">{selectedGuide.name}</strong>.</p>

              {/* Selected Responsibilities View */}
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Current Assigned Responsibilities</label>
                {guideResps.length === 0 ? (
                  <p className="text-xs italic text-[var(--text-secondary)]">No responsibilities assigned yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {guideResps.map((resp, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-[var(--primary)] border border-purple-500/20 text-xs font-bold">
                        {resp}
                        <button type="button" onClick={() => toggleResp(resp)} className="hover:text-red-500 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Preset list selection */}
              <div className="space-y-2 mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Preset Options (Click to toggle)</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_RESPONSIBILITIES.map((preset) => {
                    const isSelected = guideResps.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => toggleResp(preset)}
                        className={`text-left px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-500/10 text-[var(--primary)] border-purple-500/30 shadow-sm'
                            : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)] hover:border-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom custom input form */}
              <form onSubmit={addCustomResp} className="space-y-2 mb-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Add Custom Responsibility</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Web Development Head, Cultural Incharge"
                    value={customResp}
                    onChange={(e) => setCustomResp(e.target.value)}
                    className="flex-1 bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                  <button type="submit" className="btn-premium px-4 rounded-xl flex items-center justify-center">
                    <Plus size={16} />
                  </button>
                </div>
              </form>

              <button
                onClick={saveResponsibilities}
                className="btn-premium w-full py-3.5 mt-2 flex items-center justify-center gap-2"
              >
                Save All Responsibilities
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
