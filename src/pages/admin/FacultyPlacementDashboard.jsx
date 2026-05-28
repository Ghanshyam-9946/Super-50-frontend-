import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFacultyPlacementDashboard, clearPlacementError } from '../../features/placement/placementSlice';
import { motion } from 'framer-motion';
import { Upload, Filter, Search, BarChart3, Users, Briefcase, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const FacultyPlacementDashboard = () => {
  const dispatch = useDispatch();
  const { drives, stats, loading, error } = useSelector((state) => state.placement);
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
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading placement analytics...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Placement Management</h1>
          <p className="text-slate-500 mt-1">Manage drives, track rounds, and monitor student selections.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="round-upload"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => document.getElementById('round-upload').click()}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl transition-all font-bold px-4 py-2 flex items-center gap-2"
          >
            <Upload size={18} /> Round Data
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Drives', value: drives.length, icon: Briefcase, color: 'text-purple-400' },
          { label: 'Total Placed', value: stats?.find(s => s._id === 'selected')?.count || 0, icon: Users, color: 'text-green-400' },
          { label: 'Avg Package', value: '8.4 LPA', icon: BarChart3, color: 'text-blue-400' },
          { label: 'Ongoing Rounds', value: '12', icon: Filter, color: 'text-yellow-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
            </div>
            <p className="text-slate-600 text-sm mt-4 font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="flex items-center gap-6 border-b border-slate-100">
          {['drives', 'analytics', 'selections'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-purple-400' : 'text-slate-600 hover:text-gray-300'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'drives' && (
          <div className="grid grid-cols-1 gap-4">
            {drives.map((drive, idx) => (
              <motion.div
                key={drive._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Briefcase className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{drive.companyName}</h3>
                    <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                      <span>{drive.package}</span>
                      <span>•</span>
                      <span>{drive.rounds?.length || 0} Rounds</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="hidden lg:flex items-center gap-4 text-right px-6 border-x border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Eligibility</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                          <CheckCircle size={12} /> Active
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="text-xs text-slate-600 uppercase font-bold tracking-wider">Deadline</p>
                    <p className="text-sm text-gray-300">{new Date(drive.deadline).toLocaleDateString()}</p>
                  </div>
                  <ChevronRight className="text-gray-600" />
                </div>
              </motion.div>
            ))}

            {drives.length === 0 && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center">
                <Clock className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-900">No Drives Found</h3>
                <p className="text-slate-500 mt-2">Start by creating a new placement drive.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ChevronRight = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export default FacultyPlacementDashboard;
