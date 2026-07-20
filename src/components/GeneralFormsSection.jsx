import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Hash, 
  Mail, 
  Layers, 
  CheckCircle, 
  Lock,
  X,
  FileText,
  Clock,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function GeneralFormsSection() {
  const [activeForms, setActiveForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNumber: '',
    email: ''
  });
  const [responses, setResponses] = useState({});
  const [submittedForms, setSubmittedForms] = useState({});

  const fetchActiveForms = async () => {
    try {
      const res = await api.get('/general-forms/active');
      setActiveForms(res.data.data);
    } catch (err) {
      console.error('Failed to load active forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveForms();

    // Check localStorage for already submitted forms
    const stored = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('general_form_sub_')) {
        const formId = key.replace('general_form_sub_', '');
        try {
          stored[formId] = JSON.parse(localStorage.getItem(key));
        } catch (e) {}
      }
    }
    setSubmittedForms(stored);
  }, []);

  const handleOpenForm = (form) => {
    setSelectedForm(form);
    setFormData({
      fullName: '',
      enrollmentNumber: '',
      email: ''
    });
    setResponses({});
  };

  const handleResponseChange = (fieldLabel, value) => {
    setResponses(prev => ({ ...prev, [fieldLabel]: value }));
  };

  const handleCheckboxChange = (fieldLabel, option, checked) => {
    setResponses(prev => {
      const currentList = prev[fieldLabel] || [];
      const newList = checked 
        ? [...currentList, option] 
        : currentList.filter(o => o !== option);
      return { ...prev, [fieldLabel]: newList };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.enrollmentNumber.trim() || !formData.email.trim()) {
      return toast.error('All fields are required');
    }

    // Validate required custom fields
    if (selectedForm.fields) {
      for (const field of selectedForm.fields) {
        if (field.required) {
          const val = responses[field.label];
          if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
            return toast.error(`Question "${field.label}" is required`);
          }
        }
      }
    }

    const toastId = toast.loading('Submitting registration...');
    try {
      const res = await api.post(`/general-forms/${selectedForm._id}/submit`, {
        ...formData,
        responses
      });
      toast.success(res.data.message || 'Form submitted successfully!', { id: toastId });
      
      // Save submission status in localStorage
      localStorage.setItem(`general_form_sub_${selectedForm._id}`, JSON.stringify(res.data.data));
      setSubmittedForms(prev => ({ ...prev, [selectedForm._id]: res.data.data }));
      
      setSelectedForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit form', { id: toastId });
    }
  };

  if (loading) return null;
  if (activeForms.length === 0) return null;

  return (
    <section className="py-24 relative overflow-hidden bg-black/20 border-t border-[var(--border-light)]">
      {/* Background Glow */}
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] bg-purple-500/10 rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[var(--primary)] text-[11px] font-black uppercase tracking-widest mb-3"
          >
            <Layers size={12} />
            <span>Active Registrations</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-black tracking-tight text-[var(--text-primary)]"
          >
            Register now to reserve your spot and begin your learning journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[var(--text-secondary)] mt-4 font-medium"
          >
            Register for current events, assessments, or activities across the ecosystem.
          </motion.p>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeForms.map((form, idx) => {
            const hasSubmitted = !!submittedForms[form._id];
            return (
              <motion.div
                key={form._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-8 flex flex-col justify-between hover:border-[var(--primary)]/50 transition-all duration-300 group relative hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 text-[var(--primary)] shrink-0">
                      <FileText size={22} />
                    </div>
                    {hasSubmitted && (
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] px-2.5 py-1 rounded-lg uppercase font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                        <CheckCircle size={12} /> Submitted
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-display font-black text-[var(--text-primary)] mt-6 leading-tight group-hover:text-[var(--primary)] transition-colors">
                    {form.purpose}
                  </h3>
                  
                  {form.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed line-clamp-3">
                      {form.description}
                    </p>
                  )}

                  {form.endDate && (
                    <div className="mt-6 flex items-center gap-2 text-xs text-[var(--text-secondary)] font-bold">
                      <Clock size={14} className="text-amber-500" />
                      <span>Closes: {new Date(form.endDate).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  {hasSubmitted ? (
                    <div className="w-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-center py-3.5 rounded-xl text-xs font-black uppercase tracking-wider">
                      Response Recorded
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenForm(form)}
                      className="w-full btn-premium py-3.5 rounded-xl text-xs font-black uppercase tracking-wider"
                    >
                      Fill Form
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-modal)] border border-[var(--border-light)] rounded-3xl shadow-xl w-full max-w-xl p-8 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedForm(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl font-display font-black text-[var(--text-primary)] mb-1">
                Register
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-6">
                Registering for: <strong className="text-[var(--text-primary)]">{selectedForm.purpose}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <User size={12} /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <Hash size={12} /> Enrollment Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0827CS231001"
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <Mail size={12} /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@sistec.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                {/* Custom Fields (Google Forms Style) */}
                {selectedForm.fields && selectedForm.fields.map((field) => {
                  const fieldId = `field-${field._id}`;
                  const isRequired = field.required;
                  return (
                    <div key={field._id} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1.5">
                        {field.label} {isRequired && '*'}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          required={isRequired}
                          value={responses[field.label] || ''}
                          onChange={(e) => handleResponseChange(field.label, e.target.value)}
                          placeholder="Short answer text"
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                        />
                      )}

                      {field.type === 'paragraph' && (
                        <textarea
                          required={isRequired}
                          value={responses[field.label] || ''}
                          onChange={(e) => handleResponseChange(field.label, e.target.value)}
                          placeholder="Long answer text"
                          rows="3"
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
                        />
                      )}

                      {field.type === 'dropdown' && (
                        <select
                          required={isRequired}
                          value={responses[field.label] || ''}
                          onChange={(e) => handleResponseChange(field.label, e.target.value)}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                        >
                          <option value="">Choose</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'radio' && (
                        <div className="space-y-2 pt-1">
                          {field.options.map(opt => (
                            <label key={opt} className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                              <input
                                type="radio"
                                name={fieldId}
                                required={isRequired}
                                checked={responses[field.label] === opt}
                                onChange={() => handleResponseChange(field.label, opt)}
                                className="text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <div className="space-y-2 pt-1">
                          {field.options.map(opt => {
                            const isChecked = (responses[field.label] || []).includes(opt);
                            return (
                              <label key={opt} className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleCheckboxChange(field.label, opt, e.target.checked)}
                                  className="text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button type="submit" className="btn-premium w-full py-3.5 mt-6 flex items-center justify-center gap-2">
                  <Send size={14} /> Submit Application
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
