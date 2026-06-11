import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFacultyPlacementDashboard, clearPlacementError } from '../../features/placement/placementSlice';
import { motion } from 'framer-motion';
import { Upload, Filter, Search, BarChart3, Users, Briefcase, AlertCircle, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FacultyPlacementDashboard = () => {
  const dispatch = useDispatch();
  const { drives, stats, selections, loading, error } = useSelector((state) => state.placement);
  const [activeTab, setActiveTab] = useState('drives');

  useEffect(() => {
    dispatch(fetchFacultyPlacementDashboard());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPlacementError());
    }
  }, [error, dispatch]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Uploading round data...');

    try {
      const response = await api.post('/placement/rounds/upload', formData);

      toast.success(response.data.message || 'Upload successful!', { id: toastId });
      dispatch(fetchFacultyPlacementDashboard());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    }
  };

  if (loading && drives.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
      <p className="text-[var(--text-secondary)] font-medium">Loading placement analytics...</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Placement Management</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Manage drives, track rounds, and monitor student selections.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <input
            type="file"
            id="round-upload"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => document.getElementById('round-upload').click()}
            className="btn-outline-premium px-6 py-3 flex items-center gap-2"
          >
            <Upload size={18} /> Round Data
          </button>
        </motion.div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 shadow-sm">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          { label: 'Active Drives', value: drives.length, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Total Placed', value: stats?.find(s => s._id === 'selected')?.count || 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Avg Package', value: '8.4 LPA', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Ongoing Rounds', value: '12', icon: Filter, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="glass-card p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-[1rem] ${stat.bg} ${stat.color} border border-[var(--border-light)]`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Real-time</span>
            </div>
            <div className="mt-6">
              <span className="text-3xl font-display font-black text-[var(--text-primary)]">{stat.value}</span>
              <p className="text-[var(--text-secondary)] text-[13px] font-bold mt-1 tracking-wide uppercase opacity-80">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="space-y-8 mt-4">
        <div className="flex items-center gap-8 border-b border-[var(--border-light)] px-2">
          {['drives', 'analytics', 'selections'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[13px] font-black uppercase tracking-[0.1em] transition-all relative ${
                activeTab === tab ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTabDashboard" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--primary)] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'drives' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
            {drives.map((drive, idx) => (
              <motion.div
                key={drive._id}
                variants={itemVariants}
                className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-[var(--primary)] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] group-hover:border-[var(--primary)] group-hover:shadow-sm transition-all duration-300">
                    <Briefcase className="text-[var(--primary)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{drive.companyName}</h3>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)] mt-1.5">
                      <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md">{drive.package}</span>
                      <span className="opacity-50">•</span>
                      <span>{drive.rounds?.length || 0} Rounds</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 mt-4 md:mt-0">
                  <div className="hidden lg:flex flex-col items-end pr-8 border-r border-[var(--border-light)]">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest opacity-80">Eligibility</p>
                    <div className="flex items-center gap-1.5 mt-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200 shadow-sm">
                      <CheckCircle size={12} />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest opacity-80">Deadline</p>
                    <p className="text-[14px] font-bold text-[var(--text-primary)] mt-1">{new Date(drive.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)] group-hover:text-white transition-all duration-300">
                    <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-white" />
                  </div>
                </div>
              </motion.div>
            ))}

            {drives.length === 0 && (
              <motion.div variants={itemVariants} className="glass-card p-16 text-center border-dashed">
                <div className="w-20 h-20 bg-slate-50 border border-[var(--border-light)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Clock className="text-[#CBD5E1]" size={36} />
                </div>
                <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">No Drives Found</h3>
                <p className="text-[var(--text-secondary)] font-medium mt-3 max-w-md mx-auto">Start by creating a new placement drive.</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'selections' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selections?.map((selection, idx) => (
              <motion.div
                key={selection._id}
                variants={itemVariants}
                className="glass-card p-6 flex flex-col gap-4 group hover:border-emerald-300 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 blur-[40px] opacity-20 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 flex items-center justify-center border border-emerald-200 shrink-0 shadow-sm">
                    <CheckCircle className="text-emerald-500" size={24} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-display font-black text-[var(--text-primary)] truncate">{selection.student?.name}</h3>
                    <p className="text-[13px] text-[var(--text-secondary)] font-medium truncate mt-0.5">{selection.student?.email} • {selection.student?.department}</p>
                  </div>
                </div>
                
                <div className="mt-2 p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-light)] flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80">Company</p>
                    <p className="font-bold text-[var(--text-primary)] mt-1">{selection.drive?.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-80">Package</p>
                    <p className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1">{selection.drive?.package}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {(!selections || selections.length === 0) && (
              <motion.div variants={itemVariants} className="col-span-full glass-card p-16 text-center border-dashed">
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Users className="text-emerald-300" size={36} />
                </div>
                <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">No Selections Yet</h3>
                <p className="text-[var(--text-secondary)] font-medium mt-3 max-w-md mx-auto">Selected students will appear here once they pass all rounds.</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FacultyPlacementDashboard;
