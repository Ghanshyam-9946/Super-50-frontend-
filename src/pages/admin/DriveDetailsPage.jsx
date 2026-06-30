import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, ArrowLeft, Users, CheckCircle, Clock, X, Upload,
  FileSpreadsheet, Mail, RefreshCw, ChevronRight, Layers, BarChart,
  Trash2, GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DriveDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRoundName, setSelectedRoundName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [roundsList, setRoundsList] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    if (drive?.rounds) {
      setRoundsList(drive.rounds);
    }
  }, [drive]);

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const list = [...roundsList];
    const draggedItem = list[draggedIdx];
    list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, draggedItem);

    setRoundsList(list);
    setDraggedIdx(null);
    await saveRounds(list);
  };

  const handleDeleteRound = async (roundIdx) => {
    const roundToDelete = roundsList[roundIdx];
    if (!window.confirm(`Are you sure you want to delete the round "${roundToDelete.name}"?`)) return;

    const list = roundsList.filter((_, idx) => idx !== roundIdx);
    setRoundsList(list);
    await saveRounds(list);
  };

  const saveRounds = async (updatedRounds) => {
    const toastId = toast.loading('Updating rounds...');
    try {
      await api.patch(`/placement/drives/${id}/rounds`, { rounds: updatedRounds });
      toast.success('Rounds updated successfully!', { id: toastId });
      fetchDriveDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update rounds', { id: toastId });
    }
  };

  const fetchDriveDetails = async () => {
    setLoading(true);
    try {
      const driveRes = await api.get('/placement/faculty/dashboard'); // we can find the drive here or filter
      const allDrives = driveRes.data.data.drives || [];
      const currentDrive = allDrives.find(d => d._id === id);
      setDrive(currentDrive);

      if (currentDrive) {
        const appRes = await api.get(`/placement/drives/${id}/applications`);
        setApplications(appRes.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load drive details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveDetails();
  }, [id]);

  const handleUploadResults = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('driveId', id);
    if (selectedRoundName) {
      formData.append('roundName', selectedRoundName);
    }

    setUploading(true);
    const toastId = toast.loading('Uploading round results & sending emails...');
    try {
      const response = await api.post('/placement/results/dynamic-upload', formData);
      const { updated, notFound } = response.data.data || {};
      toast.success(
        `Done! ${updated} students updated${notFound > 0 ? `, ${notFound} not found` : ''}. Emails sent!`,
        { id: toastId, duration: 5000 }
      );
      setFile(null);
      setShowUploadModal(false);
      fetchDriveDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)] font-medium">Loading drive details...</p>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <h2 className="text-2xl font-black text-[var(--text-primary)]">Drive Not Found</h2>
        <button onClick={() => navigate(-1)} className="btn-premium px-6 py-2.5">Go Back</button>
      </div>
    );
  }

  const roundNames = drive.rounds?.map(r => r.name) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <button onClick={() => navigate('/faculty/placement')} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-bold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Drives
        </button>

        <div className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.2rem] bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-sm">
              <Briefcase className="text-[var(--primary)]" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">{drive.companyName}</h1>
              <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)] mt-1.5">
                <span className="text-[var(--primary-dark)] bg-[var(--primary)]/5 px-2.5 py-0.5 rounded-lg border border-[var(--primary)]/10 capitalize">{drive.driveType || 'Campus Drive'}</span>
                {drive.package && (
                  <>
                    <span>•</span>
                    <span className="text-[var(--primary-dark)] bg-[var(--primary)]/5 px-2.5 py-0.5 rounded-lg border border-[var(--primary)]/10">{drive.package}</span>
                  </>
                )}
                <span>•</span>
                <span>Batch: {drive.batch || 'All'}</span>
                <span>•</span>
                <span>Deadline: {new Date(drive.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchDriveDetails} className="btn-outline-premium p-3 rounded-xl">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Rounds Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-display font-black text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="text-[var(--primary)]" size={20} /> Hiring Rounds Pipeline
          </h2>
          <a
            href="/upload/round%20result.xlsx"
            download="round_result.xlsx"
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary)]/20 transition-all text-xs font-bold whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet size={14} /> Download Template
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {roundsList?.map((round, idx) => {
            const isLocked = idx > 0 && !applications.some(app => app.roundsProgress?.some(p => p.roundName === (roundsList[idx - 1]?.name)));
            return (
              <div 
                key={round._id || idx} 
                draggable={true}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                className={`bg-[var(--bg-input)]/20 border border-[var(--border-light)] rounded-2xl p-5 relative overflow-hidden group transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-[var(--primary)]/50 ${isLocked ? 'opacity-50 grayscale' : ''} ${draggedIdx === idx ? 'border-dashed border-[var(--primary)] opacity-40' : ''}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <GripVertical size={16} className="text-slate-400 cursor-grab" />
                    <span className="text-xs font-black text-slate-400 bg-[var(--primary)]/5 px-2 py-0.5 rounded border border-[var(--primary)]/10">R{idx + 1}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteRound(idx); }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Round"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h3 className="font-black text-[var(--text-primary)] pr-8 text-base">{round.name}</h3>
                <p className="text-[12px] text-[var(--text-secondary)] mt-2 mb-4 font-medium leading-relaxed">{round.description || 'No description provided.'}</p>
                
                <button 
                  disabled={isLocked}
                  onClick={() => {
                    setSelectedRoundName(round.name);
                    setShowUploadModal(true);
                  }} 
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                    isLocked 
                      ? 'bg-[var(--bg-input)] text-slate-400 cursor-not-allowed border border-[var(--border-light)]'
                      : 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)] hover:text-white'
                  }`}
                >
                  <Upload size={14} /> {isLocked ? 'Locked' : 'Upload Result'}
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Student List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card overflow-hidden">
        <div className="p-8 border-b border-[var(--border-light)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-black text-[var(--text-primary)]">Student Applications ({applications.length})</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Detailed tracking of all student progress in this hiring drive.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-input)]/30 border-b border-[var(--border-light)]">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Student Info</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Enrollment No</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Current Round</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Round-by-Round Clearance</th>
                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Final Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {applications.map((app) => {
                const currentRoundIdx = app.currentRound || 0;
                const activeRoundName = currentRoundIdx > 0 && drive.rounds?.[currentRoundIdx - 1]?.name
                  ? drive.rounds[currentRoundIdx - 1].name
                  : 'Applied';

                return (
                  <tr key={app._id} className="hover:bg-[var(--bg-input)]/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-[var(--primary)] font-black text-sm flex items-center justify-center">
                          {app.student?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[var(--text-primary)]">{app.student?.name}</p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{app.student?.email} • {app.student?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-primary)]">
                      {app.student?.enrollmentNumber || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-bold text-[var(--text-primary)] bg-[var(--bg-app)] border border-[var(--border-light)] px-3 py-1 rounded-lg">
                        {(app.status === 'not-applied' || app.status === 'eligible') ? 'Pending Action' : currentRoundIdx === drive.rounds?.length && app.status === 'selected' ? 'Cleared All' : activeRoundName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {drive.rounds?.map((round, rIdx) => {
                          const progress = app.roundsProgress?.find(p => p.roundName === round.name);
                          let badgeStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                          if (progress?.status === 'cleared') badgeStyle = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                          if (progress?.status === 'eliminated') badgeStyle = 'bg-red-500/10 text-red-500 border-red-500/20';

                          return (
                            <span key={rIdx} className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badgeStyle}`} title={round.name}>
                              {round.name}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg inline-block border ${
                        (app.status === 'not-applied' || app.status === 'eligible') ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                        app.status === 'selected' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        app.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {(app.status === 'not-applied' || app.status === 'eligible') ? 'Not Applied' : app.status === 'selected' ? 'Selected' : app.status === 'rejected' ? 'Eliminated' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {applications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[var(--text-secondary)] font-medium">
                    No students configured or eligible for this batch/drive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 500, padding: 32 }}>
            <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)]/50 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 mb-4 shadow-sm">
              <Upload size={24} />
            </div>
            <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Upload Result for {selectedRoundName}</h2>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Select Excel to update candidate statuses for rounds and automatically notify them.</p>

            <form onSubmit={handleUploadResults} className="space-y-5">
              {selectedRoundName && (
                <div className="bg-[var(--bg-input)]/30 border border-[var(--border-light)] rounded-xl p-3.5">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Required Excel Column</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded border border-[var(--primary)]/20">{selectedRoundName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Plus: <strong>Enrollment No</strong> or <strong>Email</strong> to identify students.</p>
                </div>
              )}

              <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer" onClick={() => document.getElementById('details-results-file').click()}>
                <input type="file" id="details-results-file" accept=".xlsx, .xls, .pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                {file ? (
                  <div className="space-y-1">
                    <FileSpreadsheet className="text-blue-500 mx-auto animate-bounce" size={28} />
                    <p className="text-sm font-bold text-[var(--text-primary)]">{file.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] uppercase">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="text-slate-400 mx-auto" size={28} />
                    <p className="text-sm font-bold text-[var(--text-primary)]">Select List File</p>
                    <p className="text-xs text-[var(--text-secondary)]">.xlsx, .xls, or .pdf</p>
                  </div>
                )}
              </div>

              <button type="submit" className="btn-premium w-full py-3.5 flex items-center justify-center gap-2" disabled={uploading || !file}>
                {uploading ? 'Processing...' : 'Upload Results & Notify Students'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DriveDetailsPage;
