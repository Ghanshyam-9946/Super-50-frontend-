import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  fetchFacultyPlacementDashboard, 
  clearPlacementError,
  fetchAllFeedbacks 
} from '../../features/placement/placementSlice';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Filter, 
  Search, 
  BarChart3, 
  Users, 
  Briefcase, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ChevronRight,
  User,
  Calendar,
  HelpCircle,
  ArrowRight,
  MessageSquare,
  UserPlus,
  Plus,
  X,
  Loader2,
  FileSpreadsheet,
  Trash2,
  FileText,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import FeedbackDetailModal from '../../components/FeedbackDetailModal';

function EnrollStudentsModal({ onClose, onRefresh }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select an Excel file');

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    const toastId = toast.loading('Enrolling students for placements...');
    try {
      const response = await api.post('/placement/enroll-students', formData);
      toast.success(response.data.message || 'Students enrolled successfully!', { id: toastId });
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll students', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 480, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm">
          <UserPlus size={24} />
        </div>
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Enroll Students for T&P</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Upload Excel containing: Name, Enrollment Number, Email, Mobile</p>
        
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer" onClick={() => document.getElementById('enroll-file').click()}>
            <input type="file" id="enroll-file" accept=".xlsx, .xls" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet className="text-emerald-500 mx-auto animate-bounce" size={32} />
                <p className="text-sm font-bold text-[var(--text-primary)]">{file.name}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase">Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="text-slate-400 mx-auto" size={32} />
                <p className="text-sm font-bold text-[var(--text-primary)]">Select Excel file</p>
                <p className="text-xs text-[var(--text-secondary)]">Only .xlsx or .xls files</p>
              </div>
            )}
          </div>
          
          <button type="submit" className="btn-premium w-full py-3.5 flex items-center justify-center gap-2" disabled={uploading || !file}>
            {uploading ? 'Processing...' : 'Upload & Enroll Students'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function CreateDriveModal({ onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [targetFile, setTargetFile] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    package: '',
    driveType: 'campus drive',
    jobDescription: '',
    deadline: '',
    batch: '2023-27',
    eligibilityCriteria: {
      minAttendance: 0,
      minPerformanceScore: 0,
      departments: []
    }
  });
  
  // Rounds management
  const [rounds, setRounds] = useState([
    { name: 'Aptitude', description: 'Initial Aptitude Test' },
    { name: 'Technical', description: 'Technical Coding & Core Concepts Interview' },
    { name: 'HR', description: 'Human Resources & Alignment Round' }
  ]);
  
  const handleAddRound = () => {
    setRounds([...rounds, { name: '', description: '' }]);
  };
  
  const handleRemoveRound = (idx) => {
    setRounds(rounds.filter((_, i) => i !== idx));
  };
  
  const handleRoundChange = (idx, field, val) => {
    const updated = rounds.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    setRounds(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rounds.some(r => !r.name.trim())) {
      return toast.error('Please enter names for all rounds');
    }
    if (!targetFile) {
      return toast.error('Please upload an eligible students list file (Excel/PDF)');
    }
    
    setLoading(true);
    const toastId = toast.loading('Creating placement drive...');
    try {
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('package', form.package);
      formData.append('driveType', form.driveType);
      formData.append('jobDescription', form.jobDescription);
      formData.append('deadline', form.deadline);
      formData.append('batch', form.batch);
      formData.append('rounds', JSON.stringify(rounds));
      formData.append('eligibilityCriteria', JSON.stringify(form.eligibilityCriteria));
      formData.append('file', targetFile);

      await api.post('/placement/drives', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Placement drive created successfully!', { id: toastId });
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drive', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative overflow-y-auto max-h-[90vh]" style={{ width: '90%', maxWidth: 580, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center border border-purple-500/20 mb-4 shadow-sm">
          <Briefcase size={24} />
        </div>
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Create Placement Drive</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Centrally publish a new company hiring drive</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Company Name *</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                type="text"
                placeholder="e.g., Centylitics"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Batch *</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                type="text"
                placeholder="e.g., 2023-27"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Package Details</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                type="text"
                placeholder="e.g., 6.5 LPA (optional)"
                value={form.package}
                onChange={(e) => setForm({ ...form, package: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Drive Type *</label>
              <select
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                value={form.driveType}
                onChange={(e) => setForm({ ...form, driveType: e.target.value })}
                required
              >
                <option value="internship">Internship</option>
                <option value="internship+ppo">Internship + PPO</option>
                <option value="campus drive">Campus Drive</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Application Deadline *</label>
              <input 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Job Description (JD) */}
          <div className="border-t border-[var(--border-light)] pt-4 mt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Job Description (JD)</label>
            <textarea 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm min-h-[80px]"
              placeholder="Enter job roles, responsibilities, etc."
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            />
          </div>

          {/* Target Enrollment File (Required) */}
          <div className="border-t border-[var(--border-light)] pt-4 mt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Eligible Students List (Excel/PDF) *</label>
            <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer" onClick={() => document.getElementById('target-excel-file').click()}>
              <input type="file" id="target-excel-file" accept=".xlsx, .xls, .pdf" className="hidden" onChange={(e) => setTargetFile(e.target.files[0])} required />
              {targetFile ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="text-[var(--primary)] mx-auto animate-bounce" size={24} />
                  <p className="text-xs font-bold text-[var(--text-primary)]">{targetFile.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Click to change</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="text-slate-400 mx-auto" size={24} />
                  <p className="text-xs font-bold text-[var(--text-primary)]">Select student list file</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Only .xlsx, .xls, or .pdf</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-[var(--border-light)] pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hiring Rounds</span>
              <button type="button" onClick={handleAddRound} className="text-xs text-[var(--primary)] font-black uppercase tracking-wider hover:opacity-80 flex items-center gap-1">
                <Plus size={14} /> Add Round
              </button>
            </div>
            
            <div className="space-y-3">
              {rounds.map((round, index) => (
                <div key={index} className="flex gap-3 items-start bg-[var(--bg-input)]/20 p-3 rounded-2xl border border-[var(--border-light)]">
                  <div className="flex-1 space-y-2">
                    <input 
                      className="w-full bg-white border border-[var(--border-light)] rounded-lg py-1.5 px-3 text-[12px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      type="text"
                      placeholder={`Round ${index + 1} Name`}
                      value={round.name}
                      onChange={(e) => handleRoundChange(index, 'name', e.target.value)}
                      required
                    />
                    <input 
                      className="w-full bg-white border border-[var(--border-light)] rounded-lg py-1.5 px-3 text-[12px] font-medium text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
                      type="text"
                      placeholder="Brief description (optional)"
                      value={round.description}
                      onChange={(e) => handleRoundChange(index, 'description', e.target.value)}
                    />
                  </div>
                  {rounds.length > 1 && (
                    <button type="button" onClick={() => handleRemoveRound(index)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <button type="submit" className="btn-premium w-full py-3.5 mt-6 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? 'Creating...' : 'Create Placement Drive'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function UploadResultsModal({ drives, onClose, onRefresh }) {
  const [driveId, setDriveId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const selectedDrive = drives.find(d => d._id === driveId);
  const roundNames = selectedDrive?.rounds?.map(r => r.name) || [];

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!driveId) return toast.error('Please select a drive');
    if (!file) return toast.error('Please select an Excel file');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('driveId', driveId);
    if (roundNames.length > 0) {
      formData.append('headings', JSON.stringify(roundNames));
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
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 500, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 mb-4 shadow-sm">
          <Upload size={24} />
        </div>
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Upload Round Results</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Excel columns should match the round names. Emails will be sent automatically.</p>

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Select Drive *</label>
            <select
              value={driveId}
              onChange={(e) => setDriveId(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
              required
            >
              <option value="">-- Choose a placement drive --</option>
              {drives.map(d => (
                <option key={d._id} value={d._id}>{d.companyName} ({d.batch || 'All'})</option>
              ))}
            </select>
          </div>

          {roundNames.length > 0 && (
            <div className="bg-[var(--bg-input)]/30 border border-[var(--border-light)] rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expected Excel Columns (Round Names)</p>
              <div className="flex flex-wrap gap-2">
                {roundNames.map((r, i) => (
                  <span key={i} className="text-[11px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2.5 py-1 rounded-lg">{r}</span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Also include: <strong>Enrollment No</strong> or <strong>Email</strong> column to identify students.</p>
            </div>
          )}

          <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer" onClick={() => document.getElementById('results-file').click()}>
            <input type="file" id="results-file" accept=".xlsx, .xls" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-1">
                <FileSpreadsheet className="text-blue-500 mx-auto animate-bounce" size={28} />
                <p className="text-sm font-bold text-[var(--text-primary)]">{file.name}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase">Click to change</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="text-slate-400 mx-auto" size={28} />
                <p className="text-sm font-bold text-[var(--text-primary)]">Select Excel file</p>
                <p className="text-xs text-[var(--text-secondary)]">Only .xlsx or .xls</p>
              </div>
            )}
          </div>

          <button type="submit" className="btn-premium w-full py-3.5 flex items-center justify-center gap-2" disabled={uploading || !file || !driveId}>
            {uploading ? 'Uploading...' : 'Upload Results & Notify Students'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ViewStudentsModal({ group, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative flex flex-col" style={{ width: '90%', maxWidth: 600, maxHeight: '85vh', padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm shrink-0">
          <Users size={24} />
        </div>
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1 shrink-0">
          Selected Students
        </h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6 shrink-0">
          {group.drive.companyName} • {group.drive.package}
        </p>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {group.students.map((student, idx) => (
            <div key={student._id || idx} className="p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-input)]/20 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
                    {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="font-bold text-[14px] text-[var(--text-primary)]">{student.name || 'Unknown Student'}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{student.email || 'N/A'} • {student.department || 'N/A'}</p>
                  </div>
               </div>
               <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-[12px] font-bold text-[var(--text-primary)]">{student.enrollmentNumber || 'N/A'}</p>
                  {student.mentor ? (
                    <span className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      Mentor: {student.mentor.name || student.mentor}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[9px] italic">No Mentor</span>
                  )}
               </div>
            </div>
          ))}
          {group.students.length === 0 && (
             <div className="text-center py-8 text-slate-400 text-sm font-medium">No students found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
function UploadQuestionModal({ onClose, onRefresh }) {
  const [file, setFile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) return toast.error('Please enter the company name');
    if (!file) return toast.error('Please select a file');

    const formData = new FormData();
    formData.append('companyName', companyName.trim());
    formData.append('file', file);

    setUploading(true);
    const toastId = toast.loading('Uploading question file...');
    try {
      const response = await api.post('/placement/questions', formData);
      toast.success(response.data.message || 'File uploaded successfully!', { id: toastId });
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload question file', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justify: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 480, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-[var(--primary)] flex items-center justify-center border border-purple-500/20 mb-4 shadow-sm">
          <Upload size={24} />
        </div>
        <h2 className="text-xl font-display font-black text-[var(--text-primary)] mb-1">Upload PYQ Document</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Upload Word or PDF document of previous year questions</p>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Company Name *</label>
            <input 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
              type="text"
              placeholder="e.g., TCS"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-8 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer" onClick={() => document.getElementById('pyq-file').click()}>
            <input type="file" id="pyq-file" accept=".docx, .doc, .pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-2">
                <FileText className="text-[var(--primary)] mx-auto animate-bounce" size={32} />
                <p className="text-sm font-bold text-[var(--text-primary)]">{file.name}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase">Click to change</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="text-slate-400 mx-auto" size={32} />
                <p className="text-sm font-bold text-[var(--text-primary)]">Select Word/PDF file</p>
                <p className="text-xs text-[var(--text-secondary)]">Only .doc, .docx, or .pdf</p>
              </div>
            )}
          </div>
          
          <button type="submit" className="btn-premium w-full py-3.5 flex items-center justify-center gap-2 mt-6" disabled={uploading || !file || !companyName.trim()}>
            {uploading ? 'Processing...' : 'Upload PYQ Document'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

const FacultyPlacementDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { drives, stats, selections, feedbacks, loading, error } = useSelector((state) => state.placement);
  const [activeTab, setActiveTab] = useState('drives');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showCreateDriveModal, setShowCreateDriveModal] = useState(false);
  const [showUploadResultsModal, setShowUploadResultsModal] = useState(false);
  const [selectedDriveGroup, setSelectedDriveGroup] = useState(null);

  // Single feedback detail modal
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Past Questions state and functions
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showUploadQuestionModal, setShowUploadQuestionModal] = useState(false);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await api.get('/placement/questions');
      setQuestions(res.data.data);
    } catch (err) {
      toast.error('Failed to load past questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    const toastId = toast.loading('Deleting question file...');
    try {
      const res = await api.delete(`/placement/questions/${id}`);
      toast.success(res.data.message || 'Deleted successfully', { id: toastId });
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete question file', { id: toastId });
    }
  };

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab]);

  useEffect(() => {
    dispatch(fetchFacultyPlacementDashboard());
  }, [dispatch]);

  // Auto-open modal based on ?modal= query param
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modal = params.get('modal');
    if (modal === 'enroll') {
      setShowEnrollModal(true);
    } else if (modal === 'create-drive') {
      setShowCreateDriveModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeTab === 'feedback') {
      dispatch(fetchAllFeedbacks());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPlacementError());
    }
  }, [error, dispatch]);

  const filteredFeedbacks = feedbacks?.filter(f => 
    f.drive?.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.experience?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.interviewQuestions?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.student?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedSelections = React.useMemo(() => {
    if (!selections) return [];
    const map = {};
    selections.forEach(sel => {
      const dId = sel.drive?._id;
      if (!dId) return;
      if (!map[dId]) {
        map[dId] = {
          drive: sel.drive,
          students: []
        };
      }
      if (sel.student) {
        map[dId].students.push(sel.student);
      }
    });
    return Object.values(map);
  }, [selections]);

  if (loading && drives.length === 0 && feedbacks.length === 0) return (
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
          {['drives', 'feedback', 'selections', 'questions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[13px] font-black uppercase tracking-[0.1em] transition-all relative ${
                activeTab === tab ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'feedback' ? 'Experiences' : tab === 'questions' ? 'Past Questions' : tab}
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
                onClick={() => navigate(`/tp/drives/${drive._id}`)}
                className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between hover:border-[var(--primary)] transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] group-hover:border-[var(--primary)] group-hover:shadow-sm transition-all duration-300">
                    <Briefcase className="text-[var(--primary)]" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{drive.companyName}</h3>
                    <div className="flex items-center gap-3 text-[13px] font-medium text-[var(--text-secondary)] mt-1.5">
                      <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md capitalize">{drive.driveType || 'Campus Drive'}</span>
                      {drive.package && (
                        <>
                          <span className="opacity-50">•</span>
                          <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md">{drive.package}</span>
                        </>
                      )}
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

        {/* Global Interview Experiences Tab (Faculty View) */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-3.5 text-[var(--text-secondary)] opacity-60" size={18} />
                <input 
                  type="text" 
                  placeholder="Search company, student or topics..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                Showing {filteredFeedbacks.length} experiences
              </p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredFeedbacks.map((f) => (
                <motion.div
                  key={f._id}
                  variants={itemVariants}
                  onClick={() => {
                    setSelectedFeedback(f);
                    setIsDetailOpen(true);
                  }}
                  className="glass-card p-6 flex flex-col justify-between border-[var(--border-light)] hover:border-[var(--primary)] cursor-pointer transition-all duration-300 group relative hover:shadow-[var(--shadow-hover)]"
                >
                  <div className="space-y-4">
                    {/* Company Info */}
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] text-[var(--primary)] font-display font-black text-sm">
                          {f.drive?.companyName?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                            {f.drive?.companyName}
                          </h4>
                          <span className="text-[11px] font-bold text-[var(--primary-dark)] dark:text-[var(--primary)] bg-purple-500/5 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                            {f.drive?.package}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          f.difficultyLevel === 'Easy' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          f.difficultyLevel === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {f.difficultyLevel}
                        </span>
                      </div>
                    </div>

                    {/* Snippet Experience */}
                    <div>
                      <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--bg-app)] p-3.5 rounded-xl border border-[var(--border-light)] line-clamp-3">
                        {f.experience}
                      </p>
                    </div>

                    {/* Highlights tag */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-[var(--primary)]/5 text-[var(--primary)] font-bold border border-[var(--primary)]/10">
                        Outcome: {f.statusAtDrive}
                      </span>
                      {f.interviewQuestions && (
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1">
                          <HelpCircle size={12} /> Questions shared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviewer info */}
                  <div className="mt-5 pt-4 border-t border-[var(--border-light)] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--bg-app)] flex items-center justify-center text-[var(--text-secondary)] border border-[var(--border-light)]">
                        <User size={13} />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--text-primary)] block">
                          {f.student?.name}
                        </span>
                        <span className="text-[9px] text-[var(--text-secondary)] block">
                          {f.student?.department} • {f.student?.batch}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-[var(--primary)] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                      Read Details <ArrowRight size={12} />
                    </span>
                  </div>
                </motion.div>
              ))}

              {filteredFeedbacks.length === 0 && (
                <div className="col-span-full py-16 text-center bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl">
                  <MessageSquare size={48} className="mx-auto mb-4 text-[#CBD5E1]" />
                  <h4 className="text-lg font-black text-[var(--text-primary)]">No interview experiences found</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                    Try searching for a different keyword or company.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === 'selections' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedSelections.map((group, idx) => (
              <motion.div
                key={group.drive._id}
                variants={itemVariants}
                className="glass-card p-6 flex flex-col justify-between group hover:border-emerald-300 transition-all duration-300 relative overflow-hidden min-h-[160px]"
              >
                <div className="absolute -right-10 -top-10 w-32 h-32 blur-[40px] opacity-20 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                
                <div className="flex items-start justify-between relative z-10 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 flex items-center justify-center border border-emerald-200 shrink-0 shadow-sm">
                      <Briefcase className="text-emerald-500" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-black text-[var(--text-primary)]">{group.drive.companyName}</h3>
                      <p className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 inline-block">{group.drive.package}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-3xl font-black text-[var(--text-primary)]">{group.students.length}</span>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Selected</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedDriveGroup(group)}
                  className="w-full py-2.5 mt-auto rounded-xl bg-[var(--bg-input)] hover:bg-[var(--primary)] hover:text-white text-[13px] font-bold text-[var(--text-primary)] border border-[var(--border-light)] transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Users size={16} /> View Students
                </button>
              </motion.div>
            ))}
            {groupedSelections.length === 0 && (
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

        {activeTab === 'questions' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-3.5 text-[var(--text-secondary)] opacity-60" size={18} />
                <input 
                  type="text" 
                  placeholder="Search company name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                />
              </div>
              <button 
                onClick={() => setShowUploadQuestionModal(true)}
                className="btn-premium py-2.5 px-5 flex items-center gap-2 text-xs"
              >
                <Plus size={16} /> Upload PYQ Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {questions
                .filter(q => q.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((q) => (
                  <div key={q._id} className="glass-card p-6 flex flex-col justify-between border-[var(--border-light)] hover:border-[var(--primary)] transition-all duration-300 relative group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-[var(--primary)] font-display font-black text-sm shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-black text-[var(--text-primary)] truncate">{q.companyName}</h4>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-bold truncate">{q.fileName}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <div>
                          <span className="font-bold">Uploaded By:</span> {q.uploadedBy?.name || 'Admin'}
                        </div>
                        <div>
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <a 
                      href={q.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-premium text-center w-full py-2.5 mt-5 flex items-center justify-center gap-2 text-xs"
                    >
                      <Download size={14} className="inline" /> Download Document
                    </a>
                  </div>
                ))}

              {questions.filter(q => q.companyName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="col-span-full py-16 text-center bg-[var(--bg-card)] border border-[var(--border-light)] rounded-3xl animate-fade-in">
                  <FileText size={48} className="mx-auto mb-4 text-[#CBD5E1]" />
                  <h4 className="text-lg font-black text-[var(--text-primary)]">No past questions found</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                    Try searching for a different company or check back later.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <FeedbackDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedFeedback(null);
        }} 
        feedback={selectedFeedback} 
      />

      {showEnrollModal && (
        <EnrollStudentsModal
          onClose={() => setShowEnrollModal(false)}
          onRefresh={() => dispatch(fetchFacultyPlacementDashboard())}
        />
      )}

      {showCreateDriveModal && (
        <CreateDriveModal
          onClose={() => setShowCreateDriveModal(false)}
          onRefresh={() => dispatch(fetchFacultyPlacementDashboard())}
        />
      )}

      {showUploadResultsModal && (
        <UploadResultsModal
          drives={drives}
          onClose={() => setShowUploadResultsModal(false)}
          onRefresh={() => dispatch(fetchFacultyPlacementDashboard())}
        />
      )}

      {selectedDriveGroup && (
        <ViewStudentsModal
          group={selectedDriveGroup}
          onClose={() => setSelectedDriveGroup(null)}
        />
      )}

      {showUploadQuestionModal && (
        <UploadQuestionModal
          onClose={() => setShowUploadQuestionModal(false)}
          onRefresh={fetchQuestions}
        />
      )}
    </div>
  );
};

export default FacultyPlacementDashboard;
