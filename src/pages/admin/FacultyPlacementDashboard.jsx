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
  Download,
  GraduationCap,
  Building2,
  Award,
  UserCheck,
  Eye,
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import FeedbackDetailModal from '../../components/FeedbackDetailModal';
import StudentProfileModal from '../../components/StudentProfileModal';
import { batchLabel } from '../../utils/batchLabel';
import { getFileUrl, getImageUrl } from '../../utils/imageUrl';

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

function CreateDriveModal({ onClose, onRefresh, initialCampusType = 'on campus' }) {
  const [loading, setLoading] = useState(false);
  const [targetFile, setTargetFile] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    package: '',
    driveType: 'placement drive',
    campusType: initialCampusType || 'on campus',
    profileType: 'tech',
    jobDescription: '',
    deadline: '',
    batch: '2023-27',
    enrollmentNumber: '',
    studentName: '',
    studentDepartment: '',
    studentEmail: '',
    eligibilityCriteria: {
      minAttendance: 0,
      minPerformanceScore: 0,
      departments: []
    }
  });
  
  const [isCustomDriveType, setIsCustomDriveType] = useState(false);
  const [isCustomCampusType, setIsCustomCampusType] = useState(false);

  const isSelfPlaced = (form.campusType || '').toLowerCase().replace(/[-_]/g, ' ').includes('self');

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
    if (!form.driveType?.trim()) {
      return toast.error('Please specify Drive Type');
    }
    if (!form.campusType?.trim()) {
      return toast.error('Please specify Campus Type');
    }

    if (isSelfPlaced) {
      if (!form.companyName?.trim()) return toast.error('Please enter Company Name');
      if (!form.enrollmentNumber?.trim() && !form.studentName?.trim()) {
        return toast.error('Please enter Student Enrollment Number or Name');
      }
      if (!targetFile) return toast.error('Please upload student offer letter (PDF, Word, or Image)');

      setLoading(true);
      const toastId = toast.loading('Recording self placed student...');
      try {
        const formData = new FormData();
        formData.append('companyName', form.companyName);
        formData.append('package', form.package);
        formData.append('driveType', form.driveType || 'placement drive');
        formData.append('campusType', 'self placed');
        formData.append('profileType', form.profileType || 'tech');
        formData.append('batch', form.batch);
        formData.append('offerLetter', targetFile);
        formData.append('file', targetFile);
        if (form.enrollmentNumber) formData.append('enrollmentNumber', form.enrollmentNumber.trim());
        if (form.studentName) formData.append('studentName', form.studentName.trim());
        if (form.studentDepartment) formData.append('studentDepartment', form.studentDepartment.trim());
        if (form.studentEmail) formData.append('studentEmail', form.studentEmail.trim());

        await api.post('/placement/drives', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Self placed student recorded successfully!', { id: toastId });
        onRefresh();
        onClose();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to record self placed student', { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

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
      formData.append('campusType', form.campusType);
      formData.append('profileType', form.profileType || 'tech');
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Drive Type *</label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isCustomDriveType;
                    setIsCustomDriveType(next);
                    if (next) {
                      setForm({ ...form, driveType: '' });
                    } else {
                      setForm({ ...form, driveType: 'placement drive' });
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:opacity-80 transition-all bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--primary)]/20"
                >
                  <Plus size={11} />
                  {isCustomDriveType ? 'Preset list' : '+ Add Custom'}
                </button>
              </div>

              {isCustomDriveType ? (
                <div className="space-y-1">
                  <input
                    className="w-full bg-[var(--bg-input)] border-2 border-[var(--primary)]/40 rounded-xl py-2 px-3 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                    type="text"
                    placeholder="Enter custom drive type..."
                    value={form.driveType}
                    onChange={(e) => setForm({ ...form, driveType: e.target.value })}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">✍️ Custom drive type active</p>
                </div>
              ) : (
                <select
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                  value={form.driveType}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomDriveType(true);
                      setForm({ ...form, driveType: '' });
                    } else {
                      setForm({ ...form, driveType: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="placement drive">Placement Drive (Full-Time)</option>
                  <option value="internship">Internship</option>
                  <option value="internship+ppo">Internship + PPO</option>
                  <option value="apprenticeship">Apprenticeship</option>
                  <option value="hackathon">Hackathon / Contest</option>
                  <option value="off campus drive">Off-Campus Placement</option>
                  <option value="__custom__">+ Add Custom Drive Type...</option>
                </select>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Campus Type *</label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isCustomCampusType;
                    setIsCustomCampusType(next);
                    if (next) {
                      setForm({ ...form, campusType: '' });
                    } else {
                      setForm({ ...form, campusType: 'on campus' });
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--primary)] hover:opacity-80 transition-all bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg border border-[var(--primary)]/20"
                >
                  <Plus size={11} />
                  {isCustomCampusType ? 'Preset list' : '+ Add Custom'}
                </button>
              </div>

              {isCustomCampusType ? (
                <div className="space-y-1">
                  <input
                    className="w-full bg-[var(--bg-input)] border-2 border-[var(--primary)]/40 rounded-xl py-2 px-3 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                    type="text"
                    placeholder="Enter custom campus type..."
                    value={form.campusType}
                    onChange={(e) => setForm({ ...form, campusType: e.target.value })}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">✍️ Custom campus type active</p>
                </div>
              ) : (
                <select
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                  value={form.campusType}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCampusType(true);
                      setForm({ ...form, campusType: '' });
                    } else {
                      setForm({ ...form, campusType: e.target.value });
                    }
                  }}
                  required
                >
                  <option value="on campus">On Campus</option>
                  <option value="off campus">Off Campus</option>
                  <option value="pool campus">Pool Campus</option>
                  <option value="self placed">Self Placed</option>
                  <option value="__custom__">+ Add Custom Campus Type...</option>
                </select>
              )}
            </div>
            {!isSelfPlaced && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Application Deadline *</label>
                <input 
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required={!isSelfPlaced}
                />
              </div>
            )}
          </div>

          {/* Job Profile Type (Tech vs Non-Tech) */}
          <div className="border-t border-[var(--border-light)] pt-3 mt-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Job Profile Type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, profileType: 'tech' })}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  (form.profileType || 'tech') === 'tech'
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500 shadow-sm'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Code size={14} />
                Tech Role
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, profileType: 'non-tech' })}
                className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  form.profileType === 'non-tech'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500 shadow-sm'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-light)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Briefcase size={14} />
                Non-Tech Role
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-medium">
              {(form.profileType || 'tech') === 'tech'
                ? '💻 Software, Dev, QA, Data, Core IT, Cloud, etc.'
                : '💼 Sales, Marketing, HR, Finance, Operations, Business Dev, etc.'}
            </p>
          </div>

          {/* Self Placed Student Information */}
          {isSelfPlaced && (
            <div className="border-t border-[var(--border-light)] pt-4 mt-2 space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-purple-500" />
                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">Self Placed Student Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Enrollment Number *</label>
                  <input
                    type="text"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2 px-3 text-[12px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] uppercase"
                    placeholder="e.g. 0187CS231084"
                    value={form.enrollmentNumber}
                    onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })}
                    required={isSelfPlaced}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Student Name *</label>
                  <input
                    type="text"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2 px-3 text-[12px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                    placeholder="Full Name"
                    value={form.studentName}
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    required={isSelfPlaced}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Job Description (JD) — only for standard drives */}
          {!isSelfPlaced && (
            <div className="border-t border-[var(--border-light)] pt-4 mt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Job Description (JD)</label>
              <textarea 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-2.5 px-4 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm min-h-[80px]"
                placeholder="Enter job roles, responsibilities, etc."
                value={form.jobDescription}
                onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              />
            </div>
          )}

          {/* Upload Offer Letter (for Self Placed) OR Eligible Students List (for regular drives) */}
          <div className="border-t border-[var(--border-light)] pt-4 mt-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              {isSelfPlaced ? 'Upload Student Offer Letter (PDF / Word / Image) *' : 'Eligible Students List (Excel/PDF) *'}
            </label>
            <div className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-6 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer" onClick={() => document.getElementById('target-excel-file').click()}>
              <input
                type="file"
                id="target-excel-file"
                accept={isSelfPlaced ? '.pdf, .jpg, .jpeg, .png, .webp, .doc, .docx' : '.xlsx, .xls, .pdf'}
                className="hidden"
                onChange={(e) => setTargetFile(e.target.files[0])}
                required
              />
              {targetFile ? (
                <div className="space-y-1">
                  <FileSpreadsheet className="text-[var(--primary)] mx-auto animate-bounce" size={24} />
                  <p className="text-xs font-bold text-[var(--text-primary)]">{targetFile.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] uppercase">Click to change</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="text-slate-400 mx-auto" size={24} />
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {isSelfPlaced ? 'Select Offer Letter File' : 'Select student list file'}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {isSelfPlaced ? 'Only .pdf, .jpg, .png, or .doc files' : 'Only .xlsx, .xls, or .pdf'}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Hiring Rounds — only for standard drives */}
          {!isSelfPlaced && (
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
                        required={!isSelfPlaced}
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
          )}
          
          <button type="submit" className="btn-premium w-full py-3.5 mt-6 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? (isSelfPlaced ? 'Recording Student...' : 'Creating...') : (isSelfPlaced ? 'Record Self Placed Student' : 'Create Placement Drive')}
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
    const toastId = toast.loading('Uploading round results...');
    try {
      const response = await api.post('/placement/results/dynamic-upload', formData);
      const { updated, notFound } = response.data.data || {};
      toast.success(
        `Done! ${updated} students updated${notFound > 0 ? `, ${notFound} not found` : ''}.`,
        { id: toastId, duration: 4000 }
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
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Excel columns should match the round names.</p>

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
            {uploading ? 'Uploading...' : 'Upload Results'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ViewStudentsModal({ group, onClose, onViewStudentProfile }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-2xl rounded-3xl relative flex flex-col" style={{ width: '92%', maxWidth: 680, maxHeight: '85vh', padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors cursor-pointer">
          <X size={20} />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mb-4 shadow-sm shrink-0">
          <Users size={24} />
        </div>
        <div className="flex items-center justify-between mb-1 shrink-0 pr-8">
          <h2 className="text-xl font-display font-black text-[var(--text-primary)]">
            Selected Students
          </h2>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black border border-emerald-500/20">
            {group.students.length} {group.students.length === 1 ? 'Student' : 'Students'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-6 shrink-0">
          <span className="text-[13px] text-[var(--text-secondary)] font-medium">
            {group.drive.companyName} • {group.drive.package}
          </span>
          <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md text-[11px] border border-purple-200 capitalize">
            {group.drive?.driveType || 'Placement Drive'}
          </span>
          <span className={`px-2 py-0.5 rounded-md font-bold capitalize text-[10px] inline-flex items-center gap-1 border ${
            (group.drive?.profileType || 'tech').toLowerCase() === 'tech'
              ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
              : 'text-amber-700 bg-amber-50 border-amber-200'
          }`}>
            <Code size={11} /> {(group.drive?.profileType || 'tech').toLowerCase() === 'tech' ? 'Tech Role' : 'Non-Tech Role'}
          </span>
          {group.drive?.campusType && (
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200 capitalize">
              {group.drive.campusType}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {group.students.map((student, idx) => (
            <div key={student._id || idx} className="p-4 rounded-2xl border border-[var(--border-light)] bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 hover:border-[var(--primary)]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
               <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-display font-black text-base shrink-0 border border-[var(--primary)]/20">
                    {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] text-[var(--text-primary)] truncate">{student.name || 'Unknown Student'}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate font-medium">
                      <span className="font-mono font-bold text-[var(--text-primary)]">{student.enrollmentNumber || 'N/A'}</span>
                      {student.department ? ` • ${student.department}` : ''}
                      {student.batch ? ` • Batch ${normalizeBatch(student.batch)}` : ''}
                    </p>
                    {student.mentor && (
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                        Mentor: {student.mentor.name || student.mentor}
                      </p>
                    )}
                  </div>
               </div>

               <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-light)]/60">
                  <button
                    type="button"
                    onClick={() => onViewStudentProfile && onViewStudentProfile(student)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 transition-all text-xs font-black shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                    title="View complete student data (Academics, Attendance, Placement, Activities)"
                  >
                    <Eye size={14} />
                    <span>View Data</span>
                  </button>
               </div>
            </div>
          ))}
          {group.students.length === 0 && (
             <div className="text-center py-12 text-slate-400 text-sm font-medium">No students found for this drive.</div>
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

const normalizeBatch = (rawBatch) => {
  if (!rawBatch) return '2023';
  let str = String(rawBatch).trim();
  if (str.includes('-') || str.includes('/')) {
    const parts = str.split(/[-/]/);
    if (parts.length === 2) {
      let firstPart = parts[0].trim();
      if (firstPart.length === 2) firstPart = '20' + firstPart;
      if (firstPart.length === 4) return firstPart;
    }
  }
  if (str === '2028') return '2024';
  if (str === '2027') return '2023';
  if (str === '2029') return '2025';
  if (str === '2026') return '2022';
  return str;
};

const FacultyPlacementDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { drives, stats, selections, selfPlaced, feedbacks, loading, error } = useSelector((state) => state.placement);
  const [activeTab, setActiveTab] = useState('drives');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState(null);
  const [selfPlacedProfileTypeFilter, setSelfPlacedProfileTypeFilter] = useState('all');
  const [selfPlacedDriveTypeFilter, setSelfPlacedDriveTypeFilter] = useState('all');
  const [selectionsProfileTypeFilter, setSelectionsProfileTypeFilter] = useState('all');
  const [selectionsDriveTypeFilter, setSelectionsDriveTypeFilter] = useState('all');
  const [createDriveInitialType, setCreateDriveInitialType] = useState('on campus');

  const allSelfPlaced = React.useMemo(() => {
    if (selfPlaced && selfPlaced.length > 0) return selfPlaced;
    return (selections || []).filter(s => {
      const cType = (s.drive?.campusType || '').toLowerCase().replace(/[-_]/g, ' ');
      return cType.includes('self') || !!s.offerLetter || !!s.drive?.offerLetter;
    });
  }, [selfPlaced, selections]);

  // Self placed records within selected batch
  const selfPlacedInBatch = React.useMemo(() => {
    let list = allSelfPlaced || [];
    if (selectedBatch !== 'all') {
      list = list.filter(s => {
        const studentB = s?.student?.batch ? normalizeBatch(s.student.batch) : '';
        const driveB = s?.drive?.batch ? normalizeBatch(s.drive.batch) : '';
        return studentB === selectedBatch || driveB === selectedBatch;
      });
    }
    return list;
  }, [allSelfPlaced, selectedBatch]);

  const selfPlacedTechCount = selfPlacedInBatch.filter(s => (s.drive?.profileType || 'tech').toLowerCase() === 'tech').length;
  const selfPlacedNonTechCount = selfPlacedInBatch.filter(s => (s.drive?.profileType || '').toLowerCase() === 'non-tech').length;

  const availableSelfPlacedDriveTypes = React.useMemo(() => {
    const set = new Set();
    (selfPlacedInBatch || []).forEach(s => {
      const dt = s.drive?.driveType;
      if (dt && dt.trim()) set.add(dt.trim());
    });
    return Array.from(set);
  }, [selfPlacedInBatch]);

  const filteredSelfPlaced = React.useMemo(() => {
    let list = selfPlacedInBatch;
    if (selfPlacedProfileTypeFilter !== 'all') {
      list = list.filter(s => (s?.drive?.profileType || 'tech').toLowerCase() === selfPlacedProfileTypeFilter);
    }
    if (selfPlacedDriveTypeFilter !== 'all') {
      list = list.filter(s => (s?.drive?.driveType || '').toLowerCase() === selfPlacedDriveTypeFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.student?.name?.toLowerCase().includes(q) ||
        s.student?.enrollmentNumber?.toLowerCase().includes(q) ||
        s.drive?.companyName?.toLowerCase().includes(q) ||
        s.student?.department?.toLowerCase().includes(q) ||
        s.drive?.driveType?.toLowerCase().includes(q) ||
        s.drive?.profileType?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selfPlacedInBatch, searchQuery, selfPlacedProfileTypeFilter, selfPlacedDriveTypeFilter]);

  // Available batches calculation (null-safe) — built from actual drive/
  // selection records rather than the current student roster, since this
  // dashboard's history can include batches that have since graduated.
  const availableBatches = React.useMemo(() => {
    const set = new Set();
    (drives || []).forEach(d => {
      if (d?.batch) set.add(normalizeBatch(d.batch));
    });
    (selections || []).forEach(s => {
      if (s?.student?.batch) set.add(normalizeBatch(s.student.batch));
      if (s?.drive?.batch) set.add(normalizeBatch(s.drive.batch));
    });
    (allSelfPlaced || []).forEach(s => {
      if (s?.student?.batch) set.add(normalizeBatch(s.student.batch));
      if (s?.drive?.batch) set.add(normalizeBatch(s.drive.batch));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [drives, selections, allSelfPlaced]);

  // Filtered drives by selected batch (null-safe)
  const filteredDrives = React.useMemo(() => {
    const safeDrives = drives || [];
    if (selectedBatch === 'all') return safeDrives;
    return safeDrives.filter(d => normalizeBatch(d?.batch) === selectedBatch);
  }, [drives, selectedBatch]);

  // Base selections in selected batch
  const selectionsInBatch = React.useMemo(() => {
    const safeSelections = selections || [];
    if (selectedBatch === 'all') return safeSelections;
    return safeSelections.filter(s => {
      const studentB = s?.student?.batch ? normalizeBatch(s.student.batch) : '';
      const driveB = s?.drive?.batch ? normalizeBatch(s.drive.batch) : '';
      return studentB === selectedBatch || driveB === selectedBatch;
    });
  }, [selections, selectedBatch]);

  const selectionsTechCount = React.useMemo(() => {
    return selectionsInBatch.filter(s => (s.drive?.profileType || 'tech').toLowerCase() === 'tech').length;
  }, [selectionsInBatch]);

  const selectionsNonTechCount = React.useMemo(() => {
    return selectionsInBatch.filter(s => (s.drive?.profileType || '').toLowerCase() === 'non-tech').length;
  }, [selectionsInBatch]);

  const availableSelectionsDriveTypes = React.useMemo(() => {
    const set = new Set();
    (selectionsInBatch || []).forEach(s => {
      const dt = s.drive?.driveType;
      if (dt && dt.trim()) set.add(dt.trim());
    });
    return Array.from(set);
  }, [selectionsInBatch]);

  // Filtered selections by selected batch, profile type, drive type, and search query
  const filteredSelections = React.useMemo(() => {
    let list = selectionsInBatch;
    if (selectionsProfileTypeFilter !== 'all') {
      list = list.filter(s => (s?.drive?.profileType || 'tech').toLowerCase() === selectionsProfileTypeFilter);
    }
    if (selectionsDriveTypeFilter !== 'all') {
      list = list.filter(s => (s?.drive?.driveType || '').toLowerCase() === selectionsDriveTypeFilter.toLowerCase());
    }
    if (searchQuery.trim() && activeTab === 'selections') {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.student?.name?.toLowerCase().includes(q) ||
        s.student?.enrollmentNumber?.toLowerCase().includes(q) ||
        s.drive?.companyName?.toLowerCase().includes(q) ||
        s.student?.department?.toLowerCase().includes(q) ||
        s.drive?.driveType?.toLowerCase().includes(q) ||
        s.drive?.profileType?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectionsInBatch, selectionsProfileTypeFilter, selectionsDriveTypeFilter, searchQuery, activeTab]);

  // Dynamic real-time stats calculation
  const activeDrivesCount = React.useMemo(() => {
    return filteredDrives.filter(d => {
      if (d.isCompleted || d.isActive === false) return false;
      if (!d.deadline) return true;
      const deadlineDate = new Date(d.deadline);
      const today = new Date();
      today.setHours(0,0,0,0);
      return deadlineDate >= today;
    }).length;
  }, [filteredDrives]);

  const totalPlacedCount = React.useMemo(() => {
    return selectionsInBatch.length;
  }, [selectionsInBatch]);

  const avgPackageStr = React.useMemo(() => {
    const extractNumericPackage = (pkgStr) => {
      if (!pkgStr) return 0;
      const match = String(pkgStr).match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    };

    const selectedPackages = selectionsInBatch
      .map(s => extractNumericPackage(s.drive?.package))
      .filter(p => p > 0);

    if (selectedPackages.length > 0) {
      const avg = selectedPackages.reduce((a, b) => a + b, 0) / selectedPackages.length;
      return `${avg.toFixed(1)} LPA`;
    }

    const drivePackages = filteredDrives
      .map(d => extractNumericPackage(d.package))
      .filter(p => p > 0);

    if (drivePackages.length > 0) {
      const avg = drivePackages.reduce((a, b) => a + b, 0) / drivePackages.length;
      return `${avg.toFixed(1)} LPA`;
    }

    return '0 LPA';
  }, [filteredSelections, filteredDrives]);

  const ongoingRoundsCount = React.useMemo(() => {
    return filteredDrives.reduce((acc, d) => {
      const isDriveActive = !d.deadline || new Date(d.deadline) >= new Date(new Date().setHours(0,0,0,0));
      if (isDriveActive) {
        return acc + (d.rounds?.length || 0);
      }
      return acc;
    }, 0);
  }, [filteredDrives]);
  
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

  // Auto-open modal based on ?modal= query param or switch tab based on ?tab=
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modal = params.get('modal');
    const tabParam = params.get('tab');
    if (tabParam === 'self_placed' || tabParam === 'self-placed') {
      setActiveTab('self_placed');
    }
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
    if (!filteredSelections) return [];
    const map = {};
    filteredSelections.forEach(sel => {
      if (!sel || !sel.drive || !sel.drive._id) return;
      const dId = sel.drive._id;
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
  }, [filteredSelections]);

  if (loading && (!drives || drives.length === 0) && (!feedbacks || feedbacks.length === 0)) return (
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

      {/* Header with Batch Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">Placement Analytics</h1>
          <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">Real-time drive tracking, hiring rounds & placement statistics.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/tp/enroll-students')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <UserPlus size={15} /> Enroll Students
          </button>
          <button
            onClick={() => navigate('/tp/create-drive')}
            className="btn-premium flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer shadow-md"
          >
            <Plus size={15} /> Create Drive
          </button>
          <div className="flex items-center gap-2.5 bg-[var(--bg-input)] border border-[var(--border-light)] px-4 py-2.5 rounded-2xl shadow-sm">
            <Filter size={16} className="text-[var(--primary)] shrink-0" />
            <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-transparent text-sm font-black text-[var(--text-primary)] focus:outline-none cursor-pointer pr-2"
              id="placement-batch-filter"
            >
              <option value="all">All Batches</option>
              {availableBatches.map(b => (
                <option key={b} value={b}>Batch {batchLabel(b)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5"
      >
        {[
          { label: 'Active Drives', value: activeDrivesCount, icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', tab: 'drives' },
          { label: 'Total Placed', value: totalPlacedCount, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', tab: 'selections' },
          { label: 'Self Placed', value: filteredSelfPlaced.length, icon: Award, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30', tab: 'self_placed' },
          { label: 'Avg Package', value: avgPackageStr, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Ongoing Rounds', value: ongoingRoundsCount, icon: Filter, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', tab: 'drives' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            onClick={() => stat.tab && setActiveTab(stat.tab)}
            className={`glass-card p-5 md:p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              stat.tab ? 'cursor-pointer hover:border-[var(--primary)]/50' : ''
            } ${activeTab === stat.tab ? 'ring-2 ring-[var(--primary)] shadow-md border-[var(--primary)]/40' : ''}`}
            title={stat.tab ? `Click to view ${stat.label}` : undefined}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 md:p-3 rounded-[1rem] ${stat.bg} ${stat.color} border border-[var(--border-light)]`}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">Real-time</span>
            </div>
            <div className="mt-5 md:mt-6">
              <span className="text-2xl md:text-3xl font-display font-black text-[var(--text-primary)]">{stat.value}</span>
              <p className="text-[var(--text-secondary)] text-[12px] md:text-[13px] font-bold mt-1 tracking-wide uppercase opacity-80">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="space-y-8 mt-4">
        <div className="flex items-center gap-8 border-b border-[var(--border-light)] px-2 overflow-x-auto">
          {['drives', 'self_placed', 'selections', 'feedback', 'questions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[13px] font-black uppercase tracking-[0.1em] transition-all relative flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>
                {tab === 'self_placed'
                  ? 'Self Placed'
                  : tab === 'feedback'
                  ? 'Experiences'
                  : tab === 'questions'
                  ? 'Past Questions'
                  : tab === 'selections'
                  ? 'Campus Selections'
                  : 'Drives'}
              </span>
              {tab === 'self_placed' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab ? 'bg-[var(--primary)]/15 text-[var(--primary)]' : 'bg-slate-200/60 dark:bg-slate-800 text-[var(--text-secondary)]'
                }`}>
                  {filteredSelfPlaced.length}
                </span>
              )}
              {activeTab === tab && (
                <motion.div layoutId="activeTabDashboard" className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--primary)] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'drives' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4">
            {filteredDrives.map((drive, idx) => (
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
                    <div className="flex items-center flex-wrap gap-3 text-[13px] font-medium text-[var(--text-secondary)] mt-1.5">
                      <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md capitalize">{drive.driveType || 'Placement Drive'}</span>
                      {drive.campusType && (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md capitalize">{drive.campusType}</span>
                      )}
                      {(drive.profileType || 'tech').toLowerCase() === 'non-tech' ? (
                        <span className="text-amber-700 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 uppercase">
                          <Briefcase size={11} /> Non-Tech
                        </span>
                      ) : (
                        <span className="text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1 uppercase">
                          <Code size={11} /> Tech
                        </span>
                      )}
                      <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-md text-[12px] flex items-center gap-1">
                        <GraduationCap size={13} /> Batch {normalizeBatch(drive.batch || '2023')}
                      </span>
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
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest opacity-80">Status</p>
                    {drive.isCompleted || drive.isActive === false ? (
                      <div className="flex items-center gap-1.5 mt-1.5 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded border border-blue-200 shadow-sm">
                        <CheckCircle size={12} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded border border-emerald-200 shadow-sm">
                        <CheckCircle size={12} />
                        <span className="text-[11px] font-black uppercase tracking-wider">Active</span>
                      </div>
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-end">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest opacity-80">Deadline</p>
                    <p className="text-[14px] font-bold text-[var(--text-primary)] mt-1">{drive.deadline ? new Date(drive.deadline).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-app)] flex items-center justify-center border border-[var(--border-light)] group-hover:bg-[var(--primary)] group-hover:border-[var(--primary)] group-hover:text-white transition-all duration-300">
                    <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-white" />
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredDrives.length === 0 && (
              <motion.div variants={itemVariants} className="glass-card p-16 text-center border-dashed">
                <div className="w-20 h-20 bg-slate-50 border border-[var(--border-light)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Clock className="text-[#CBD5E1]" size={36} />
                </div>
                <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">No Drives Found</h3>
                <p className="text-[var(--text-secondary)] font-medium mt-3 max-w-md mx-auto">No placement drives found for {selectedBatch === 'all' ? 'any batch' : `Batch ${selectedBatch}`}.</p>
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

        {/* Self Placed Students Tab */}
        {activeTab === 'self_placed' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-3.5 text-[var(--text-secondary)] opacity-60" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student name, enrollment no, company..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium shadow-sm"
                />
              </div>
              <button 
                onClick={() => {
                  setCreateDriveInitialType('self placed');
                  setShowCreateDriveModal(true);
                }}
                className="btn-premium py-2.5 px-5 flex items-center gap-2 text-xs cursor-pointer shadow-sm"
              >
                <Plus size={16} /> Add Self Placed Student
              </button>
            </div>

            {/* Filter Controls for Self Placed: Profile Type & Drive Type */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mr-1">
                  Profile:
                </span>
                <button
                  type="button"
                  onClick={() => setSelfPlacedProfileTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selfPlacedProfileTypeFilter === 'all'
                      ? 'bg-[var(--primary)] text-white shadow-sm font-black'
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-light)]'
                  }`}
                >
                  All ({selfPlacedInBatch.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelfPlacedProfileTypeFilter('tech')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selfPlacedProfileTypeFilter === 'tech'
                      ? 'bg-cyan-600 text-white shadow-sm font-black'
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                  }`}
                >
                  <Code size={13} />
                  Tech ({selfPlacedTechCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelfPlacedProfileTypeFilter('non-tech')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selfPlacedProfileTypeFilter === 'non-tech'
                      ? 'bg-amber-600 text-white shadow-sm font-black'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  <Briefcase size={13} />
                  Non-Tech ({selfPlacedNonTechCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] shrink-0">
                  Drive Type:
                </span>
                <select
                  value={selfPlacedDriveTypeFilter}
                  onChange={(e) => setSelfPlacedDriveTypeFilter(e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-1.5 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] capitalize cursor-pointer shadow-sm"
                >
                  <option value="all">All Drive Types</option>
                  <option value="placement drive">Placement Drive</option>
                  <option value="internship">Internship</option>
                  <option value="internship+ppo">Internship + PPO</option>
                  <option value="apprenticeship">Apprenticeship</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="off campus drive">Off-Campus Placement</option>
                  {availableSelfPlacedDriveTypes
                    .filter(t => !['placement drive', 'internship', 'internship+ppo', 'apprenticeship', 'hackathon', 'off campus drive'].includes(t.toLowerCase()))
                    .map(t => (
                      <option key={t} value={t.toLowerCase()}>{t}</option>
                    ))}
                </select>

                {(selfPlacedProfileTypeFilter !== 'all' || selfPlacedDriveTypeFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelfPlacedProfileTypeFilter('all');
                      setSelfPlacedDriveTypeFilter('all');
                    }}
                    className="text-xs text-[var(--primary)] font-bold hover:underline ml-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSelfPlaced.map((app) => {
                const offerUrl = app.offerLetter || app.drive?.offerLetter;
                return (
                  <motion.div
                    key={app._id}
                    variants={itemVariants}
                    className="glass-card p-6 flex flex-col justify-between group hover:border-purple-400/50 transition-all duration-300 relative overflow-hidden shadow-sm"
                  >
                    <div className="space-y-4">
                      {/* Top: Student Details & Status badge */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[var(--border-light)]">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-display font-black text-sm flex items-center justify-center border border-purple-500/20">
                            {app.student?.name?.[0]?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-[var(--text-primary)]">
                              {app.student?.name || app.enrollmentNumber}
                            </h4>
                            <p className="text-[11px] font-bold text-[var(--text-secondary)] font-mono">
                              {app.student?.enrollmentNumber || app.enrollmentNumber || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                            Self Placed
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold capitalize bg-purple-50 dark:bg-purple-950/40 text-[var(--primary)] border border-purple-200/50">
                            {app.drive?.driveType || 'Placement Drive'}
                          </span>
                          {(app.drive?.profileType || 'tech').toLowerCase() === 'non-tech' ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Briefcase size={10} /> Non-Tech
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                              <Code size={10} /> Tech
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Company & Package Card */}
                      <div className="bg-[var(--bg-app)] p-3.5 rounded-2xl border border-[var(--border-light)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Company</span>
                          <span className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1.5">
                            <Building2 size={14} className="text-purple-500 shrink-0" />
                            {app.drive?.companyName || 'Self Placed'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Drive Type</span>
                          <span className="text-xs font-bold text-[var(--text-primary)] capitalize">
                            {app.drive?.driveType || 'Placement Drive'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Profile Type</span>
                          <span className={`text-xs font-black capitalize flex items-center gap-1 ${(app.drive?.profileType || 'tech').toLowerCase() === 'non-tech' ? 'text-amber-600 dark:text-amber-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                            {(app.drive?.profileType || 'tech').toLowerCase() === 'non-tech' ? '💼 Non-Tech' : '💻 Tech'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Package / CTC</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                            {app.drive?.package || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Dept & Batch</span>
                          <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                            {app.student?.department || '—'} • Batch {app.student?.batch || app.drive?.batch || '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Offer Letter & Student Data CTAs */}
                    <div className="mt-4 pt-3 border-t border-[var(--border-light)] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {offerUrl ? (
                          <a
                            href={getImageUrl(offerUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-xl border border-purple-500/20 transition-all cursor-pointer"
                          >
                            <FileText size={14} /> View Offer Letter
                          </a>
                        ) : (
                          <span className="text-[11px] text-[var(--text-secondary)] italic">
                            No offer letter attached
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForProfile(app.student?._id || app.student || app.enrollmentNumber)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 px-3 py-1.5 rounded-xl border border-[var(--primary)]/20 transition-all cursor-pointer active:scale-95"
                          title="View complete student data"
                        >
                          <Eye size={14} /> View Data
                        </button>
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {filteredSelfPlaced.length === 0 && (
                <div className="col-span-full py-16 text-center bg-[var(--bg-card)] border border-dashed border-[var(--border-light)] rounded-3xl">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500">
                    <Award size={32} />
                  </div>
                  <h4 className="text-lg font-black text-[var(--text-primary)]">No Self Placed Students Found</h4>
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-1 max-w-sm mx-auto">
                    Students who secure job offers independently or off-campus can be recorded here along with their offer letters.
                  </p>
                  <button
                    onClick={() => {
                      setCreateDriveInitialType('self placed');
                      setShowCreateDriveModal(true);
                    }}
                    className="btn-premium py-2 px-4 text-xs mt-4 inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Record Self Placed Student
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {activeTab === 'selections' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-3.5 text-[var(--text-secondary)] opacity-60" size={18} />
                <input 
                  type="text" 
                  placeholder="Search student name, enrollment no, company..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl text-sm focus:outline-none focus:border-[var(--primary)] transition-all font-medium shadow-sm"
                />
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                Showing {filteredSelections.length} selections across {groupedSelections.length} {groupedSelections.length === 1 ? 'drive' : 'drives'}
              </p>
            </div>

            {/* Filter Controls for Selections: Profile Type & Drive Type */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-2xl shadow-sm">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mr-1">
                  Profile:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectionsProfileTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectionsProfileTypeFilter === 'all'
                      ? 'bg-[var(--primary)] text-white shadow-sm font-black'
                      : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-light)]'
                  }`}
                >
                  All ({selectionsInBatch.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionsProfileTypeFilter('tech')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectionsProfileTypeFilter === 'tech'
                      ? 'bg-cyan-600 text-white shadow-sm font-black'
                      : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20'
                  }`}
                >
                  <Code size={13} />
                  Tech ({selectionsTechCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionsProfileTypeFilter('non-tech')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectionsProfileTypeFilter === 'non-tech'
                      ? 'bg-amber-600 text-white shadow-sm font-black'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  }`}
                >
                  <Briefcase size={13} />
                  Non-Tech ({selectionsNonTechCount})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] shrink-0">
                  Drive Type:
                </span>
                <select
                  value={selectionsDriveTypeFilter}
                  onChange={(e) => setSelectionsDriveTypeFilter(e.target.value)}
                  className="bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-1.5 px-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] capitalize cursor-pointer shadow-sm"
                >
                  <option value="all">All Drive Types</option>
                  <option value="placement drive">Placement Drive</option>
                  <option value="internship">Internship</option>
                  <option value="internship+ppo">Internship + PPO</option>
                  <option value="apprenticeship">Apprenticeship</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="off campus drive">Off-Campus Placement</option>
                  {availableSelectionsDriveTypes
                    .filter(t => !['placement drive', 'internship', 'internship+ppo', 'apprenticeship', 'hackathon', 'off campus drive'].includes(t.toLowerCase()))
                    .map(t => (
                      <option key={t} value={t.toLowerCase()}>{t}</option>
                    ))}
                </select>

                {(selectionsProfileTypeFilter !== 'all' || selectionsDriveTypeFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionsProfileTypeFilter('all');
                      setSelectionsDriveTypeFilter('all');
                    }}
                    className="text-xs text-[var(--primary)] font-bold hover:underline ml-1 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedSelections.map((group, idx) => (
                <motion.div
                  key={group.drive._id}
                  variants={itemVariants}
                  className="glass-card p-6 flex flex-col justify-between group hover:border-emerald-300 transition-all duration-300 relative overflow-hidden min-h-[190px]"
                >
                  <div className="absolute -right-10 -top-10 w-32 h-32 blur-[40px] opacity-20 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                  
                  <div className="flex items-start justify-between relative z-10 mb-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 flex items-center justify-center border border-emerald-200 shrink-0 shadow-sm">
                        <Briefcase className="text-emerald-500" size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-display font-black text-[var(--text-primary)] truncate">{group.drive?.companyName || 'Drive'}</h3>
                        <p className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1 inline-block">{group.drive?.package || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                       <span className="text-3xl font-black text-[var(--text-primary)]">{group.students.length}</span>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Selected</p>
                    </div>
                  </div>

                  {/* Drive Type & Profile Type Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 relative z-10 mb-4 pt-1 border-t border-[var(--border-light)]/60">
                    <span className="text-[var(--primary-dark)] font-bold bg-purple-50 px-2 py-0.5 rounded-md text-[10px] border border-purple-200 capitalize">
                      {group.drive?.driveType || 'Placement Drive'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold capitalize text-[10px] inline-flex items-center gap-1 border ${
                      (group.drive?.profileType || 'tech').toLowerCase() === 'tech'
                        ? 'text-cyan-700 bg-cyan-50 border-cyan-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                      <Code size={10} /> {(group.drive?.profileType || 'tech').toLowerCase() === 'tech' ? 'Tech' : 'Non-Tech'}
                    </span>
                    {group.drive?.campusType && (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200 capitalize">
                        {group.drive.campusType}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setSelectedDriveGroup(group)}
                    className="w-full py-2.5 mt-auto rounded-xl bg-[var(--bg-input)] hover:bg-[var(--primary)] hover:text-white text-[13px] font-bold text-[var(--text-primary)] border border-[var(--border-light)] transition-all flex items-center justify-center gap-2 relative z-10 cursor-pointer"
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
                  <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">No Selections Found</h3>
                  <p className="text-[var(--text-secondary)] font-medium mt-3 max-w-md mx-auto">
                    {(selectionsProfileTypeFilter !== 'all' || selectionsDriveTypeFilter !== 'all' || searchQuery.trim()) 
                      ? 'No selections match the current filters or search query.'
                      : 'Selected students will appear here once they pass all rounds.'}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
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
          initialCampusType={createDriveInitialType}
          onClose={() => {
            setShowCreateDriveModal(false);
            setCreateDriveInitialType('on campus');
          }}
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
          onViewStudentProfile={(student) => setSelectedStudentForProfile(student)}
        />
      )}

      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={true}
          studentId={selectedStudentForProfile?._id || selectedStudentForProfile}
          initialTab="profile"
          onClose={() => setSelectedStudentForProfile(null)}
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
