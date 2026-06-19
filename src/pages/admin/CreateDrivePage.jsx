import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Plus, Trash2, CheckCircle, Building2,
  Calendar, DollarSign, Users, ArrowLeft, Layers, Upload, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CreateDrivePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdDrive, setCreatedDrive] = useState(null);
  const [targetFile, setTargetFile] = useState(null);

  const [form, setForm] = useState({
    companyName: '',
    package: '',
    deadline: '',
    batch: '2023-27',
  });

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
    if (rounds.some(r => !r.name.trim())) return toast.error('All rounds must have a name');
    if (rounds.length === 0) return toast.error('Add at least one round');
    if (!targetFile) return toast.error('Please upload an eligible students list file (Excel/PDF)');

    setLoading(true);
    const toastId = toast.loading('Creating placement drive...');
    try {
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('package', form.package);
      formData.append('deadline', form.deadline);
      formData.append('batch', form.batch);
      formData.append('rounds', JSON.stringify(rounds));
      formData.append('file', targetFile);

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
          <h2 className="text-3xl font-display font-black text-[var(--text-primary)] mb-2">Drive Created!</h2>
          <p className="text-[var(--text-secondary)] font-medium mb-8">
            <span className="font-black text-[var(--text-primary)]">{createdDrive.companyName}</span> placement drive is now live. Eligible students have been successfully enrolled and notified.
          </p>

          <div className="bg-[var(--bg-input)]/30 border border-[var(--border-light)] rounded-2xl p-6 text-left space-y-3 mb-8">
            {[
              { label: 'Company', value: createdDrive.companyName },
              { label: 'Package', value: createdDrive.package },
              { label: 'Batch', value: createdDrive.batch },
              { label: 'Deadline', value: new Date(createdDrive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Rounds', value: `${createdDrive.rounds?.length || rounds.length} rounds configured` },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--border-light)] last:border-0">
                <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{item.label}</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSubmitted(false); setCreatedDrive(null); setForm({ companyName: '', package: '', deadline: '', batch: '2023-27' }); setTargetFile(null); setRounds([{ name: 'Aptitude', description: '' }, { name: 'Technical', description: '' }, { name: 'HR', description: '' }]); }}
              className="btn-outline-premium flex-1 py-3"
            >
              Create Another Drive
            </button>
            <button onClick={() => navigate('/faculty/placement')} className="btn-premium flex-1 py-3">
              View Dashboard
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Package Offered *</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                placeholder="e.g., 6.5 LPA, 8 LPA"
                value={form.package}
                onChange={(e) => setForm({ ...form, package: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Batch *</label>
              <input
                type="text"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                placeholder="e.g., 2023-27, 2022-26"
                value={form.batch}
                onChange={(e) => setForm({ ...form, batch: e.target.value })}
                required
              />
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">Only matching students from this batch will be added to the drive.</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Application Deadline *</label>
              <input
                type="date"
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[14px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Target Enrollment File (Required) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-8 space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Eligible Students List (Excel/PDF) *</label>
          <div
            className="border-2 border-dashed border-[var(--border-light)] rounded-2xl p-10 text-center bg-[var(--bg-input)]/20 hover:bg-[var(--bg-input)]/40 transition-colors cursor-pointer"
            onClick={() => document.getElementById('target-excel-file').click()}
          >
            <input
              type="file"
              id="target-excel-file"
              accept=".xlsx, .xls, .pdf"
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
                <p className="text-base font-black text-[var(--text-primary)]">Select student list file</p>
                <p className="text-xs text-[var(--text-secondary)]">Only .xlsx, .xls, or .pdf files containing eligible students</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rounds */}
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
                    required
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

        {/* Submit */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-premium w-full py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Drive...</>
            ) : (
              <><Briefcase size={20} /> Create Placement Drive</>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default CreateDrivePage;
