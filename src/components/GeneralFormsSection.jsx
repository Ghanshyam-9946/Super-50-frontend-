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
      
      setSelectedForm(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit form', { id: toastId });
    }
  };

  if (loading) return null;

  return (
    <section id="forms" className="py-24 relative overflow-hidden border-t border-slate-100">
      {/* Background Glow */}
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] bg-purple-500/10 rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-600 text-[11px] font-black uppercase tracking-widest mb-3"
          >
            <Layers size={12} />
            <span>Active Registrations</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-display font-black tracking-tight text-[#151b2b]"
          >
            Register now to reserve your spot and begin your learning journey
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 mt-4 font-medium"
          >
            Register for current events, assessments, or activities across the ecosystem.
          </motion.p>
        </div>

        {/* Forms Grid */}
        {activeForms.length === 0 ? (
          <div className="text-center text-slate-500 font-medium bg-white/40 py-10 rounded-2xl border border-slate-100 shadow-sm backdrop-blur-md">
            There are currently no active registrations available. Please check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeForms.map((form, idx) => {
              return (
                <motion.div
                  key={form._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white p-8 flex flex-col justify-between hover:border-purple-500/30 transition-all duration-300 group relative shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-600 shrink-0">
                        <FileText size={22} />
                      </div>
                    </div>

                    <h3 className="text-xl font-display font-black text-slate-900 mt-6 leading-tight group-hover:text-purple-600 transition-colors">
                      {form.purpose}
                    </h3>
                    
                    {form.description && (
                      <p className="text-sm text-slate-500 mt-3 leading-relaxed line-clamp-3">
                        {form.description}
                      </p>
                    )}

                    {form.endDate && (
                      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-bold">
                        <Clock size={14} className="text-amber-500" />
                        <span>Closes: {new Date(form.endDate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                      <button
                        onClick={() => handleOpenForm(form)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-md shadow-purple-500/20 transition-all py-3.5 rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Fill Form
                      </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl w-full max-w-xl p-8 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedForm(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100/50 p-2 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl font-display font-black text-slate-900 mb-1">
                Register
              </h2>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Registering for: <strong className="text-slate-900">{selectedForm.purpose}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <User size={12} /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <Hash size={12} /> Enrollment Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0827CS231001"
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                    className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                    <Mail size={12} /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@sistec.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
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
                          className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                        />
                      )}

                      {field.type === 'paragraph' && (
                        <textarea
                          required={isRequired}
                          value={responses[field.label] || ''}
                          onChange={(e) => handleResponseChange(field.label, e.target.value)}
                          placeholder="Long answer text"
                          rows="3"
                          className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
                        />
                      )}

                      {field.type === 'dropdown' && (
                        <select
                          required={isRequired}
                          value={responses[field.label] || ''}
                          onChange={(e) => handleResponseChange(field.label, e.target.value)}
                          className="w-full bg-white/50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors cursor-pointer"
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
                            <label key={opt} className="flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                              <input
                                type="radio"
                                name={fieldId}
                                required={isRequired}
                                checked={responses[field.label] === opt}
                                onChange={() => handleResponseChange(field.label, opt)}
                                className="text-purple-600 focus:ring-purple-500 border-slate-300"
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
                              <label key={opt} className="flex items-center gap-2 text-sm font-bold text-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleCheckboxChange(field.label, opt, e.target.checked)}
                                  className="text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
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
