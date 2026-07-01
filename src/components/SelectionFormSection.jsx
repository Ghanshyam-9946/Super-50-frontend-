import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Hash, 
  Phone, 
  BookOpen, 
  Layers, 
  Award, 
  Github, 
  Code, 
  CheckCircle, 
  AlertCircle, 
  Lock,
  X,
  FileText,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical Engineering (EE)',
  'Mechanical Engineering (ME)',
  'Civil Engineering (CE)',
  'Other'
];

export default function SelectionFormSection() {
  const { user } = useSelector((state) => state.auth);

  // States
  const [formSettings, setFormSettings] = useState({
    formEnabled: true,
    startDate: '',
    endDate: ''
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [userSubmission, setUserSubmission] = useState(null);

  // Photo modal state
  const [viewingImage, setViewingImage] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Form Field States
  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNumber: '',
    email: '',
    mobileNumber: '',
    section: '',
    certifications: '',
    githubProfile: '',
    hackathonParticipation: 'No',
    hackathonDetails: '',
    skills: '',
    certificateImage: '',
    projectLiveLink: '',
    projectDescription: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Load configuration settings
  const fetchSettingsAndSubmissionStatus = async () => {
    try {
      const settingsRes = await api.get('/selection-form/settings');
      setFormSettings(settingsRes.data.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettingsAndSubmissionStatus();

    // Check if THIS browser/user has already registered, and fetch latest DB status
    const localRegistration = localStorage.getItem('super50_local_registration');
    if (localRegistration) {
      const reg = JSON.parse(localRegistration);
      api.get(`/selection-form/registration/${reg._id || reg.id}`)
        .then((res) => {
          setUserSubmission(res.data.data);
          setHasSubmitted(true);
          localStorage.setItem('super50_local_registration', JSON.stringify(res.data.data));
        })
        .catch(() => {
          // Fallback to local copy on check failure
          setUserSubmission(reg);
          setHasSubmitted(true);
        });
    }
  }, []);

  // Sync / refresh current status handler
  const handleRefreshStatus = async () => {
    if (!userSubmission) return;
    const toastId = toast.loading('Checking latest status...');
    try {
      const res = await api.get(`/selection-form/registration/${userSubmission._id || userSubmission.id}`);
      setUserSubmission(res.data.data);
      localStorage.setItem('super50_local_registration', JSON.stringify(res.data.data));
      toast.success('Status synced with ecosystem server!', { id: toastId });
    } catch (err) {
      toast.error('Failed to sync status. Please try again.', { id: toastId });
    }
  };

  // Helper to parse date safely, defaulting to IST (+05:30) if no timezone offset is specified
  const parseDateSafe = (dateStr) => {
    if (!dateStr) return null;
    const hasTimezone = /Z|([+-]\d{2}:\d{2})$/.test(dateStr);
    if (!hasTimezone && dateStr.includes('T')) {
      return new Date(`${dateStr}+05:30`);
    }
    return new Date(dateStr);
  };

  // Helper to determine if registration is open
  const isFormOpen = () => {
    if (!formSettings.formEnabled) return false;
    const now = new Date();
    const startDate = parseDateSafe(formSettings.startDate);
    const endDate = parseDateSafe(formSettings.endDate);
    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;
    return true;
  };

  // Handle Certificate Image File selection & convert to base64 string
  const handleCertificatePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('File size too large. Please upload a certificate photo smaller than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, certificateImage: reader.result }));
        toast.success('Certificate photo successfully attached!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.enrollmentNumber.trim()) errors.enrollmentNumber = 'Enrolment Number is required';
    
    // Email Validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email';
    }
    
    // Mobile Validation (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile Number is required';
    } else if (!mobileRegex.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.section.trim()) errors.section = 'Section is required';

    // GitHub URL validation if provided
    if (formData.githubProfile.trim() && !formData.githubProfile.includes('github.com')) {
      errors.githubProfile = 'Please enter a valid GitHub profile URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors.');
      return;
    }

    const toastId = toast.loading('Submitting registration details...');
    try {
      const res = await api.post('/selection-form/register', formData);
      
      toast.success('Registration submitted successfully! 🎉', { id: toastId });

      // Clear the form to allow another response immediately
      setFormData({
        fullName: '',
        enrollmentNumber: '',
        email: '',
        mobileNumber: '',
        section: '',
        certifications: '',
        githubProfile: '',
        hackathonParticipation: 'No',
        hackathonDetails: '',
        skills: '',
        certificateImage: '',
        projectLiveLink: '',
        projectDescription: ''
      });
      setFormErrors({});
      
      // Clear any stored registration so receipt doesn't show
      localStorage.removeItem('super50_local_registration');
      setHasSubmitted(false);
      setUserSubmission(null);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed', { id: toastId });
    }
  };

  const openForm = isFormOpen();

  const getSubmitButtonProps = () => {
    if (!formSettings.formEnabled) {
      return { disabled: true, text: 'Registrations Disabled' };
    }
    const now = new Date();
    if (formSettings.startDate && new Date(formSettings.startDate) > now) {
      return { 
        disabled: true, 
        text: `Opens on ${new Date(formSettings.startDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}` 
      };
    }
    if (formSettings.endDate && new Date(formSettings.endDate) < now) {
      return { disabled: true, text: 'Registrations Closed' };
    }
    return { disabled: false, text: 'Submit Registration' };
  };

  const submitBtn = getSubmitButtonProps();

  return (
    <section id="selection-form" className="py-24 relative overflow-hidden bg-black/30 border-t border-[var(--border-light)]">
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[var(--border-light)] pb-6">
          <div>
            <h2 className="text-3xl font-display font-black text-[var(--text-primary)]">
              Super 50 Selection Form
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-4">Fill out the details carefully to apply for the elite Super 50 cohort.</p>
            
            {(formSettings.startDate || formSettings.endDate) && (
              <div className="flex flex-wrap items-center gap-4 font-bold mt-2">
                {formSettings.startDate && (
                  <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl flex items-baseline gap-2 shadow-lg shadow-emerald-500/30">
                    <Clock size={16} className="relative top-0.5 opacity-90" />
                    <span className="uppercase tracking-widest opacity-90 text-[10px] mr-1">Starts</span>
                    <span className="text-[15px] tracking-wide font-black">{new Date(formSettings.startDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                )}
                {formSettings.endDate && (
                  <div className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl flex items-baseline gap-2 shadow-lg shadow-rose-500/30">
                    <Clock size={16} className="relative top-0.5 opacity-90" />
                    <span className="uppercase tracking-widest opacity-90 text-[10px] mr-1">Ends</span>
                    <span className="text-[15px] tracking-wide font-black">{new Date(formSettings.endDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Router */}
        <AnimatePresence mode="wait">
          <motion.div
            key="student-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto w-full"
          >
            {hasSubmitted ? (
              // SUCCESS REGISTRATION RECEIPT
              <div className="glass-card p-8 border-[var(--border-light)] text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                  <CheckCircle size={28} />
                </div>

                <div>
                  <h3 className="text-xl font-display font-black text-[var(--text-primary)]">Registration Confirmed</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
                    Your details for the **Super 50 Selection** have been successfully saved.
                  </p>
                </div>

                {/* Dynamic Selection Status Alert Banner */}
                <div className="mt-4">
                  {userSubmission?.status === 'approved' ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-500 justify-center">
                      <CheckCircle size={16} />
                      <p className="text-xs font-bold">Approved! Welcome to the elite Super 50 cohort.</p>
                    </div>
                  ) : userSubmission?.status === 'rejected' ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 justify-center">
                      <AlertCircle size={16} />
                      <p className="text-xs font-bold">Declined. Your selection request was not approved.</p>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-amber-500 justify-center">
                      <Clock size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
                      <p className="text-xs font-bold">Your selection request is pending review by the admin.</p>
                    </div>
                  )}
                </div>

                {/* Submission Details */}
                <div className="text-left bg-black/20 p-6 rounded-2xl border border-[var(--border-light)] space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] border-b border-[var(--border-light)] pb-2">Submitted Profile</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Full Name</span>
                      <span className="text-sm font-bold mt-0.5 block text-[var(--text-primary)]">{userSubmission?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Enrolment Number</span>
                      <span className="text-sm font-bold mt-0.5 block text-[var(--text-primary)]">{userSubmission?.enrollmentNumber}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Email Address</span>
                      <span className="text-sm font-bold mt-0.5 block text-[var(--text-primary)]">{userSubmission?.email}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Mobile Number</span>
                      <span className="text-sm font-bold mt-0.5 block text-[var(--text-primary)]">{userSubmission?.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Section</span>
                      <span className="text-sm font-bold mt-0.5 block text-[var(--text-primary)]">Sec {userSubmission?.section}</span>
                    </div>
                    {userSubmission?.githubProfile && (
                      <div className="col-span-full">
                        <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">GitHub Link</span>
                        <a href={userSubmission.githubProfile} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-purple-400 hover:underline mt-0.5 block">{userSubmission.githubProfile}</a>
                      </div>
                    )}
                    
                    <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[var(--border-light)] pt-3">
                      {userSubmission?.certificateImage && (
                        <div>
                          <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Certificate Photo</span>
                          <button
                            type="button"
                            onClick={() => {
                              setViewingImage(userSubmission.certificateImage);
                              setIsImageModalOpen(true);
                            }}
                            className="text-xs text-purple-400 font-bold hover:underline mt-1 flex items-center gap-1"
                          >
                            <FileText size={12} /> View Certificate Photo
                          </button>
                        </div>
                      )}
                    </div>

                    {userSubmission?.skills && (
                      <div className="col-span-full border-t border-[var(--border-light)] pt-3">
                        <span className="text-[var(--text-secondary)] uppercase block tracking-wider text-[8px] font-black">Skills</span>
                        <span className="text-xs font-medium mt-0.5 block text-[var(--text-secondary)]">{userSubmission.skills}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleRefreshStatus}
                    className="btn-premium text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Clock size={13} /> Refresh Status
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Would you like to register another student? This will clear your receipt session.')) {
                        localStorage.removeItem('super50_local_registration');
                        setHasSubmitted(false);
                        setUserSubmission(null);
                      }
                    }}
                    className="btn-outline-premium text-xs px-5 py-2.5 rounded-xl"
                  >
                    Register Another Student
                  </button>
                </div>
              </div>
            ) : (
              // FORM CARD
              <div className="glass p-8 sm:p-12 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] space-y-8 relative overflow-hidden backdrop-blur-2xl bg-[#0a0a0f]/80">
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70"></div>
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <fieldset disabled={submitBtn.disabled} className="space-y-6 group/fieldset border-0 p-0 m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 pb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Mandatory Info</h4>
                      <div className="h-px bg-gradient-to-r from-purple-500/30 to-transparent flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Name"
                            className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border ${formErrors.fullName ? 'border-red-500' : 'border-[var(--border-light)]'} rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all`}
                          />
                        </div>
                        {formErrors.fullName && <p className="text-[10px] text-red-500 font-bold">{formErrors.fullName}</p>}
                      </div>

                      {/* Enrolment */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Enrolment Number *</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="text"
                            value={formData.enrollmentNumber}
                            onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                            placeholder="Enrollment ID"
                            className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border ${formErrors.enrollmentNumber ? 'border-red-500' : 'border-[var(--border-light)]'} rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all uppercase`}
                          />
                        </div>
                        {formErrors.enrollmentNumber && <p className="text-[10px] text-red-500 font-bold">{formErrors.enrollmentNumber}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Email Address"
                            className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border ${formErrors.email ? 'border-red-500' : 'border-[var(--border-light)]'} rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all`}
                          />
                        </div>
                        {formErrors.email && <p className="text-[10px] text-red-500 font-bold">{formErrors.email}</p>}
                      </div>

                      {/* Mobile */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="tel"
                            value={formData.mobileNumber}
                            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                            placeholder="Mobile"
                            className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border ${formErrors.mobileNumber ? 'border-red-500' : 'border-[var(--border-light)]'} rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all`}
                          />
                        </div>
                        {formErrors.mobileNumber && <p className="text-[10px] text-red-500 font-bold">{formErrors.mobileNumber}</p>}
                      </div>

                      {/* Section */}
                      <div className="space-y-1.5 col-span-full">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Section *</label>
                        <div className="relative">
                          <Layers className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="text"
                            value={formData.section}
                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            placeholder="Section (e.g. A)"
                            className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border ${formErrors.section ? 'border-red-500' : 'border-[var(--border-light)]'} rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all uppercase`}
                          />
                        </div>
                        {formErrors.section && <p className="text-[10px] text-red-500 font-bold">{formErrors.section}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4 pb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Optional Info</h4>
                      <div className="h-px bg-gradient-to-r from-purple-500/30 to-transparent flex-1"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* GitHub Profile */}
                      <div className="space-y-1.5 col-span-full">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">GitHub URL</label>
                        <div className="relative">
                          <Github className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="url"
                            value={formData.githubProfile}
                            onChange={(e) => setFormData({ ...formData, githubProfile: e.target.value })}
                            placeholder="GitHub profile Link"
                            className={`w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border ${formErrors.githubProfile ? 'border-red-500' : 'border-[var(--border-light)]'} rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all`}
                          />
                        </div>
                        {formErrors.githubProfile && <p className="text-[10px] text-red-500 font-bold">{formErrors.githubProfile}</p>}
                      </div>

                      {/* Certificate Photo File Upload */}
                      <div className="space-y-1.5 col-span-full">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Certificate Image (Max 1MB)</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCertificatePhotoChange}
                            className="hidden"
                            id="cert-photo-upload"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('cert-photo-upload').click()}
                            className="btn-outline-premium text-xs px-5 py-3 rounded-xl flex items-center gap-2 bg-white/[0.03] hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/50 transition-all text-purple-100 shadow-inner"
                          >
                            <Award size={14} /> Upload Photo
                          </button>
                          {formData.certificateImage && (
                            <div className="relative w-12 h-12 rounded-lg border border-[var(--border-light)] overflow-hidden shrink-0 group">
                              <img src={formData.certificateImage} alt="Preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, certificateImage: '' })}
                                className="absolute inset-0 bg-red-600/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Technical Skills */}
                      <div className="space-y-1.5 col-span-full">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Skills / Programming Languages</label>
                        <div className="relative">
                          <Code className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="text"
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            placeholder="Languages/Skills"
                            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border border-[var(--border-light)] rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                          />
                        </div>
                      </div>

                      {/* Hackathon Radio Option */}
                      <div className="col-span-full bg-white/[0.02] p-5 rounded-2xl border border-white/10 flex items-center justify-between shadow-inner">
                        <div>
                          <h5 className="text-xs font-bold text-[var(--text-primary)]">Hackathon Participation</h5>
                          <p className="text-[9px] text-[var(--text-secondary)] mt-0.5">Participated in a hackathon before?</p>
                        </div>
                        
                        <div className="flex bg-[var(--bg-hover)] p-1 rounded-lg border border-[var(--border-light)]">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, hackathonParticipation: 'Yes' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              formData.hackathonParticipation === 'Yes'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, hackathonParticipation: 'No' })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                              formData.hackathonParticipation === 'No'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-[var(--text-secondary)]'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      {/* Details */}
                      {formData.hackathonParticipation === 'Yes' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="col-span-full space-y-1.5"
                        >
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Hackathon Details</label>
                          <textarea
                            value={formData.hackathonDetails}
                            onChange={(e) => setFormData({ ...formData, hackathonDetails: e.target.value })}
                            placeholder="Mention name and achievements..."
                            rows={3}
                            className="w-full bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border border-[var(--border-light)] rounded-xl p-4 text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
                          />
                        </motion.div>
                      )}

                      {/* Project Live Link */}
                      <div className="space-y-1.5 col-span-full">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Project Live Link</label>
                        <div className="relative">
                          <Code className="absolute left-4 top-3.5 text-[var(--text-secondary)]" size={14} />
                          <input
                            type="url"
                            value={formData.projectLiveLink}
                            onChange={(e) => setFormData({ ...formData, projectLiveLink: e.target.value })}
                            placeholder="Link to your live project (e.g., Vercel, Netlify)"
                            className="w-full pl-10 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border border-[var(--border-light)] rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                          />
                        </div>
                      </div>

                      {/* Project Description */}
                      <div className="col-span-full space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Project Description</label>
                        <textarea
                          value={formData.projectDescription}
                          onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                          placeholder="Briefly describe what your project does..."
                          rows={3}
                          className="w-full bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-primary)] border border-[var(--border-light)] rounded-xl p-4 text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitBtn.disabled}
                    className={`w-full py-4 mt-4 rounded-xl text-sm font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 relative overflow-hidden group ${submitBtn.disabled ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-[1.01] active:scale-[0.99]'}`}
                  >
                    {!submitBtn.disabled && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
                    <span className="relative z-10">{submitBtn.text}</span>
                  </button>
                  </fieldset>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Certificate Image Popup Modal */}
      <AnimatePresence>
        {isImageModalOpen && viewingImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsImageModalOpen(false);
                setViewingImage('');
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-[#111116] border border-[var(--border-light)] rounded-2xl overflow-hidden z-10 flex flex-col p-4 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2 text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                <span>Certificate Photo Preview</span>
                <button
                  onClick={() => {
                    setIsImageModalOpen(false);
                    setViewingImage('');
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <X size={14} /> Close
                </button>
              </div>
              <div className="flex justify-center items-center max-h-[70vh] overflow-hidden rounded-xl bg-black">
                <img src={viewingImage} alt="Uploaded Certificate" className="max-w-full max-h-[70vh] object-contain" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
