import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Link, Phone, Mail, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ApplyForDriveModal = ({ isOpen, onClose, drive, onRefresh }) => {
  const [formData, setFormData] = useState({
    resumeLink: '',
    enrollmentNumber: '',
    mobile: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !drive) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.resumeLink || !formData.enrollmentNumber || !formData.mobile || !formData.email) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    const toastId = toast.loading('Submitting application...');
    try {
      const response = await api.post(`/placement/drives/${drive._id}/apply`, formData);
      toast.success(response.data.message || 'Applied successfully!', { id: toastId });
      onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--bg-modal)] border border-[var(--border-light)] shadow-xl rounded-3xl relative" style={{ width: '90%', maxWidth: 500, padding: 32 }}>
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-1">Apply for {drive.companyName}</h2>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium mb-6">Complete your registration to participate in the placement drive.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Link size={12}/> Resume Drive Link *</label>
            <input 
              type="url" 
              name="resumeLink"
              value={formData.resumeLink}
              onChange={handleChange}
              placeholder="Google Drive link to your resume" 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              required 
            />
            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Make sure the link view access is set to public.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Hash size={12}/> Enrollment Number *</label>
              <input 
                type="text" 
                name="enrollmentNumber"
                value={formData.enrollmentNumber}
                onChange={handleChange}
                placeholder="e.g. 0827" 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors uppercase"
                required 
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Phone size={12}/> Mobile Number *</label>
              <input 
                type="tel" 
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Your contact number" 
                className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                required 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5"><Mail size={12}/> Email Address *</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your email address" 
              className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              required 
            />
          </div>

          <button type="submit" disabled={loading} className="btn-premium w-full py-3.5 mt-4 flex items-center justify-center gap-2">
            {loading ? 'Submitting...' : <><Send size={16}/> Submit Application</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ApplyForDriveModal;
