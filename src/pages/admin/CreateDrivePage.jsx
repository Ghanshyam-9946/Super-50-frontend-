import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase, Plus, Trash2, CheckCircle, Building2,
  Calendar, DollarSign, Users, ArrowLeft, Layers, Upload, FileSpreadsheet,
  FileText, UserCheck, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CreateDrivePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdDrive, setCreatedDrive] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  const [form, setForm] = useState({
    companyName: '',
    package: '',
    driveType: 'placement drive',
    campusType: 'on campus',
    jobDescription: '',
    deadline: '',
    batch: '2023-27',
    studentId: '',
    enrollmentNumber: '',
    studentName: '',
    studentDepartment: '',
    studentEmail: '',
  });

  const isSelfPlaced = (form.campusType || '').toLowerCase().replace(/[-_]/g, ' ').includes('self');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type') || params.get('campusType');
    if (typeParam && typeParam.toLowerCase().includes('self')) {
      setForm(prev => ({ ...prev, campusType: 'self placed' }));
    }

    // Pre-fetch enrolled students for easy student lookup
    api.get('/placement/enrolled-students')
      .then(res => {
        const list = (res.data?.data?.batches || []).flatMap(b => b.students || []);
        setEnrolledStudents(list);
      })
      .catch(() => {});
  }, [location.search]);

  const handleEnrollmentLookup = (val) => {
    const term = val.trim().toUpperCase();
    const match = enrolledStudents.find(
      s => (s.enrollmentNumber || '').toUpperCase() === term
    );
    if (match) {
      setForm(prev => ({
        ...prev,
        enrollmentNumber: val,
        studentId: match._id,
        studentName: match.name || prev.studentName,
        studentDepartment: match.department || prev.studentDepartment,
        studentEmail: match.email || prev.studentEmail,
        batch: match.batch || prev.batch,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        enrollmentNumber: val,
        studentId: '',
      }));
    }
  };

  const [isCustomDriveType, setIsCustomDriveType] = useState(false);
  const [isCustomCampusType, setIsCustomCampusType] = useState(false);

  const [rounds, setRounds] = useState([
    { name: 'Aptitude', description: 'Initial aptitude & reasoning test' },
    { name: 'Technical', description: 'Technical coding & core concepts' },
    { name: 'HR', description: 'Human resources & culture fit' },
  ]);

  const handleAddRound = () => setRounds([...rounds, { name: '', description: '' }]);
  const handleRemoveRound = (idx) => setRounds(rounds.filter((_, i) => i !== idx));
  const handleRoundChange = (idx, field, val) => {
    setRounds(rounds.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.driveType?.trim()) return toast.error('Please specify Drive Type');
    if (!form.campusType?.trim()) return toast.error('Please specify Campus Type');

    if (isSelfPlaced) {
      if (!form.companyName?.trim()) return toast.error('Please specify Company Name');
      if (!form.enrollmentNumber?.trim() && !form.studentName?.trim()) {
        return toast.error('Please specify Student Enrollment Number or Name');
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
        formData.append('batch', form.batch);
        formData.append('offerLetter', targetFile);
        formData.append('file', targetFile);
        if (form.studentId) formData.append('studentId', form.studentId);
        if (form.enrollmentNumber) formData.append('enrollmentNumber', form.enrollmentNumber.trim());
        if (form.studentName) formData.append('studentName', form.studentName.trim());
        if (form.studentDepartment) formData.append('studentDepartment', form.studentDepartment.trim());
        if (form.studentEmail) formData.append('studentEmail', form.studentEmail.trim());

        const res = await api.post('/placement/drives', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        toast.success('Self placed student recorded successfully!', { id: toastId });
        setCreatedDrive(res.data.data);
        setSubmitted(true);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to record self placed student', { id: toastId });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (rounds.some(r => !r.name.trim())) return toast.error('All rounds must have a name');
    if (rounds.length === 0) return toast.error('Add at least one round');
    if (!targetFile) return toast.error('Please upload an eligible students list file (Excel/PDF)');

    setLoading(true);
    const toastId = toast.loading('Creating placement drive...');
    try {
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('package', form.package);
      formData.append('driveType', form.driveType);
      formData.append('campusType', form.campusType);
      formData.append('jobDescription', form.jobDescription);
      formData.append('deadline', form.deadline);
      formData.append('batch', form.batch);
      formData.append('rounds', JSON.stringify(rounds));
      formData.append('file', targetFile);
      if (jdFile) {
        formData.append('jdFile', jdFile);
      }

      const res = await api.post('/placement/drives', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Placement drive created successfully!', { id: toastId });
      setCreatedDrive(res.data.data);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drive', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (submitted && createdDrive) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-3xl font-display font-black text-[var(--text-primary)] mb-2">
            {isSelfPlaced ? 'Self Placed Student Recorded!' : 'Drive Created!'}
          </h2>
          <p className="text-[var(--text-secondary)] font-medium mb-8">
            <span className="font-black text-[var(--text-primary)]">{createdDrive.companyName}</span>{' '}
            {isSelfPlaced
              ? 'offer letter and placement details have been recorded successfully.'
              : 'placement drive is now live. Eligible students have been successfully enrolled and notified.'}
          </p>

          <div className="bg-[var(--bg-input)]/30 border border-[var(--border-light)] rounded-2xl p-6 text-left space-y-3 mb-8">
            {[
              { label: 'Company', value: createdDrive.companyName },
              { label: 'Campus Type', value: createdDrive.campusType ? createdDrive.campusType.toUpperCase() : 'N/A' },
              { label: 'Package', value: createdDrive.package || 'N/A' },
              { label: 'Batch', value: createdDrive.batch },
              ...(isSelfPlaced
                ? [
                    { label: 'Student', value: form.studentName || form.enrollmentNumber || 'Recorded' },
                    { label: 'Offer Letter', value: 'Attached & Verified' },
                  ]
                : [
                    { label: 'Deadline', value: new Date(createdDrive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                    { label: 'Rounds', value: `${createdDrive.rounds?.length || rounds.length} rounds configured` },
                  ]),
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border-light)] last:border-0">
                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{item.label}</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setCreatedDrive(null); setForm({ companyName: '', package: '', driveType: 'placement drive', campusType: 'on campus', jobDescription: '', deadline: '', batch: '2023-27', studentId: '', enrollmentNumber: '', studentName: '', studentDepartment: '', studentEmail: '' }); setIsCustomDriveType(false); setIsCustomCampusType(false); setTargetFile(null); setJdFile(null); setRounds([{ name: 'Aptitude', description: '' }, { name: 'Technical', description: '' }, { name: 'HR', description: '' }]); }}
              className="btn-outline-premium flex-1 py-3"
            >
              {isSelfPlaced ? 'Record Another Student' : 'Create Another Drive'}
            </button>
            <button onClick={() => navigate(isSelfPlaced ? '/faculty/placement?tab=self_placed' : '/faculty/placement')} className="btn-premium flex-1 py-3">
              {isSelfPlaced ? 'View Self Placed' : 'View Dashboard'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-bold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="glass-card p-8 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center shrink-0">
            <Briefcase className="text-[var(--primary)]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">Create Placement Drive</h1>
            <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">
              Set up a new company hiring drive by uploading the list of eligible students.
            </p>
          </div>
        </div>
      </motion.header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 space-y-6">
          <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-widest text-[11px] text-[var(--text-secondary)]">
            <Building2 size={14} /> Company Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Company Name *</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                placeholder="e.g., Centylitics, TCS, Infosys"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Package Offered</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                placeholder="e.g., 6.5 LPA, 8 LPA (optional)"
                value={form.package}
                onChange={(e) => setForm({ ...form, package: e.target.value })}
              />
            </div>
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-2">
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
                  <Plus size={12} />
                  {isCustomDriveType ? 'Choose from list' : '+ Add Custom'}
                </button>
              </div>

              {isCustomDriveType ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    className="w-full bg-[var(--bg-input)] border-2 border-[var(--primary)]/40 rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all placeholder:font-normal placeholder:text-slate-400"
                    placeholder="Enter custom drive type (e.g., Pool Campus Drive, Apprenticeship)..."
                    value={form.driveType}
                    onChange={(e) => setForm({ ...form, driveType: e.target.value })}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">✍️ Custom drive type active. Click "Choose from list" to revert.</p>
                </div>
              ) : (
                <select
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
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
                  <option value="placement drive">Placement Drive</option>
                  <option value="internship">Internship</option>
                  <option value="internship+ppo">Internship + PPO</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="__custom__">+ Add Custom Drive Type...</option>
                </select>
              )}
            </div>
            
            <div className="md:col-span-1">
              <div className="flex items-center justify-between mb-2">
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
                  <Plus size={12} />
                  {isCustomCampusType ? 'Choose from list' : '+ Add Custom'}
                </button>
              </div>

              {isCustomCampusType ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    className="w-full bg-[var(--bg-input)] border-2 border-[var(--primary)]/40 rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all placeholder:font-normal placeholder:text-slate-400"
                    placeholder="Enter custom campus type (e.g., Pool Campus, Virtual / Remote)..."
                    value={form.campusType}
                    onChange={(e) => setForm({ ...form, campusType: e.target.value })}
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">✍️ Custom campus type active. Click "Choose from list" to revert.</p>
                </div>
              ) : (
                <select
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
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
            
            <div className="md:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Batch *</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                placeholder="e.g., 2023-27, 2022-26"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                required
              />
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
                {isSelfPlaced ? 'Batch of the placed student.' : 'Only matching students from this batch will be added.'}
              </p>
            </div>
            {!isSelfPlaced && (
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Application Deadline *</label>
                <input
                  type="date"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  required={!isSelfPlaced}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Self Placed Student Information Card */}
        {isSelfPlaced && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 space-y-4 border-2 border-purple-500/20">
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-light)]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--text-primary)]">Self Placed Student Details</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Enter or lookup registered student details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Enrollment Number *</label>
                <input
                  type="text"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all uppercase"
                  placeholder="e.g. 0187CS231084"
                  value={form.enrollmentNumber}
                  onChange={(e) => handleEnrollmentLookup(e.target.value)}
                  required={isSelfPlaced}
                />
                {enrolledStudents.length > 0 && (
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">Typing enrollment number auto-fills registered details.</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Student Name *</label>
                <input
                  type="text"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  placeholder="Student Full Name"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  required={isSelfPlaced}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Department</label>
                <input
                  type="text"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  placeholder="e.g. CSE, IT, ME"
                  value={form.studentDepartment}
                  onChange={(e) => setForm({ ...form, studentDepartment: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Student Email (Optional)</label>
                <input
                  type="email"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                  placeholder="student@example.com"
                  value={form.studentEmail}
                  onChange={(e) => setForm({ ...form, studentEmail: e.target.value })}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Job Description (JD) — only for standard drives */}
        {!isSelfPlaced && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card p-8 space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Description (JD)</label>
            <textarea
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all min-h-[120px]"
              placeholder="Enter job roles, responsibilities, skills required, etc."
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
            />

            <div className="pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Or Upload JD File (Optional)</label>
              <div className="border border-dashed border-[var(--border-light)] rounded-xl p-4 text-center bg-[var(--bg-input)]/10 hover:bg-[var(--bg-input)]/30 transition-colors cursor-pointer" onClick={() => document.getElementById('jd-file-upload').click()}>
                <input type="file" id="jd-file-upload" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setJdFile(e.target.files[0])} />
                {jdFile ? (
                  <div className="flex flex-col items-center gap-2">
                     <CheckCircle className="text-emerald-500" size={24} />
                     <p className="text-sm font-bold text-[var(--text-primary)]">{jdFile.name}</p>
                     <p className="text-[10px] text-[var(--text-secondary)] uppercase">Click to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                     <Upload size={20} />
                     <p className="text-xs font-bold text-[var(--text-primary)]">Upload JD Document (.pdf, .doc)</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upload File: Offer Letter (for Self Placed) OR Eligible Students List (for regular drives) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-8 space-y-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isSelfPlaced ? 'Upload Offer Letter (PDF / Word / Image) *' : 'Eligible Students List (Excel/PDF) *'}
              </label>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                {isSelfPlaced
                  ? 'Attach official student offer letter or placement selection document'
                  : 'Upload student list eligible to appear for the drive'}
              </p>
            </div>
            {!isSelfPlaced && (
              <a
                href="/upload/Eligible%20Students.xlsx"
                download="Eligible_Students.xlsx"
                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary)]/20 transition-all text-[10px] font-bold whitespace-nowrap shrink-0 uppercase tracking-widest"
              >
                <FileSpreadsheet size={14} /> Download Template
              </a>
            )}
          </div>
          <div
            className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-10 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer"
            onClick={() => document.getElementById('target-excel-file').click()}
          >
            <input
              type="file"
              id="target-excel-file"
              accept={isSelfPlaced ? '.pdf, .jpg, .jpeg, .png, .webp, .doc, .docx' : '.xlsx, .xls, .pdf'}
              className="hidden"
              onChange={(e) => setTargetFile(e.target.files[0])}
              required
            />
            {targetFile ? (
              <div className="space-y-3">
                <FileSpreadsheet className="text-[var(--primary)] mx-auto animate-bounce" size={40} />
                <p className="text-base font-black text-[var(--text-primary)]">{targetFile.name}</p>
                <p className="text-xs text-[var(--text-secondary)] uppercase">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="text-slate-400 mx-auto" size={40} />
                <p className="text-base font-black text-[var(--text-primary)]">
                  {isSelfPlaced ? 'Select Offer Letter File' : 'Select student list file'}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isSelfPlaced
                    ? 'Only .pdf, .jpg, .jpeg, .png, or .doc files allowed'
                    : 'Only .xlsx, .xls, or .pdf files containing eligible students'}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rounds — only for standard drives */}
        {!isSelfPlaced && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                <Layers size={14} /> Hiring Rounds ({rounds.length})
              </p>
              <button
                type="button"
                onClick={handleAddRound}
                className="btn-outline-premium px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Round
              </button>
            </div>

            <div className="space-y-3">
              {rounds.map((round, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 bg-[var(--bg-input)]/20 border border-[var(--border-light)] rounded-2xl p-4"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 border border-[var(--border-light)] flex items-center justify-center text-[var(--primary)] font-black text-sm shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl py-2.5 px-3.5 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                      placeholder={`Round ${idx + 1} Name *`}
                      value={round.name}
                      onChange={(e) => handleRoundChange(idx, 'name', e.target.value)}
                      required={!isSelfPlaced}
                    />
                    <input
                      type="text"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-light)] rounded-xl py-2.5 px-3.5 text-[13px] font-medium text-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                      placeholder="Description (optional)"
                      value={round.description}
                      onChange={(e) => handleRoundChange(idx, 'description', e.target.value)}
                    />
                  </div>
                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRound(idx)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all mt-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Submit */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-premium w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isSelfPlaced ? 'Recording Student...' : 'Creating Drive...'}</>
            ) : (
              <>{isSelfPlaced ? <><CheckCircle size={20} /> Record Self Placed Student</> : <><Briefcase size={20} /> Create Placement Drive</>}</>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default CreateDrivePage;
