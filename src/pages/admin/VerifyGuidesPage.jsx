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
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-4">
            <UserPlus size={14} />
            <span>Guide Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
            Verify Admins & Guides
          </h1>
          <p className="text-slate-500 text-lg">Approve or revoke access for administrators and project guides.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-3xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500">
            <thead className="text-xs uppercase bg-black/50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">User Info</th>
                <th className="px-6 py-4 font-bold tracking-wider">Role</th>
                <th className="px-6 py-4 font-bold tracking-wider">Department</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGuides.map((guide, idx) => (
                <motion.tr
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={guide._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-slate-200 flex items-center justify-center text-slate-900 font-bold">
                        {guide.name[0]}
                      </div>
                      <div>
                        <div className="text-slate-900 font-semibold">{guide.name}</div>
                        <div className="text-xs text-slate-600">{guide.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg bg-slate-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                      {guide.role === 'guide' ? 'Project Guide' : guide.role === 'pms_admin' ? 'PMS Admin' : guide.role === 'super50_admin' ? 'Super 50 Admin' : 'T&P Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-lg bg-slate-50 text-gray-400 text-xs font-medium">
                      {guide.department || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {guide.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold">
                        <ShieldCheck size={14} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-semibold">
                        <ShieldAlert size={14} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatus(guide._id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${guide.isActive
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                    >
                      {guide.isActive ? <><X size={14} /> Revoke Access</> : <><Check size={14} /> Approve User</>}
                    </button>
                  </td>
                </motion.tr>
              ))}
              {filteredGuides.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-600">
                    No guides found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
