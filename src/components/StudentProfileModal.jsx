import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, CheckCircle, XCircle, Clock, Loader2, ArrowRight, Award, Activity, User, ClipboardList, Camera } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../features/auth/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function StudentProfileModal({ isOpen, onClose, studentId }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('menu');
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      setActiveTab(user?.role === 'student' ? 'profile' : 'menu');
      fetchStudentData();
    }
  }, [isOpen, studentId, user]);

  const fetchAttendanceLogs = async () => {
    setLoadingAttendance(true);
    try {
      const res = await api.get(`/attendance/super50/student/${studentId}`);
      setAttendanceLogs(res.data.data);
    } catch (err) {
      toast.error('Failed to load attendance logs');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' && studentId) {
      fetchAttendanceLogs();
    }
  }, [activeTab, studentId]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [studentRes, historyRes] = await Promise.all([
        api.get(`/students/${studentId}`),
        api.get(`/placement/admin/student-history/${studentId}`).catch(() => ({ data: { data: [] } }))
      ]);
      setData(studentRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const fd = new FormData();
    fd.append('image', file);

    const loadToast = toast.loading('Uploading profile image...');
    try {
      const res = await api.post('/students/profile-image', fd);
      toast.success('Profile image updated!', { id: loadToast });

      // Update local data state
      setData(prev => ({
        ...prev,
        student: {
          ...prev.student,
          profileImage: res.data.data.profileImage
        }
      }));

      // Update Redux state
      dispatch(updateUser({ profileImage: res.data.data.profileImage }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload profile image', { id: loadToast });
    }
  };

  if (!isOpen || !studentId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              {user?.role !== 'student' && (
                <button 
                  onClick={() => {
                    if (activeTab === 'menu') {
                      onClose();
                    } else {
                      setActiveTab('menu');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 hover:text-indigo-600 transition-all hover:shadow-sm"
                >
                  ← Back
                </button>
              )}
              {data?.student && (
                <>
                  <div className="relative group">
                    <img
                      src={data.student.profileImage || `https://ui-avatars.com/api/?name=${data.student.name}&background=random`}
                      alt={data.student.name}
                      className="w-12 h-12 rounded-full border-2 border-slate-200 object-cover"
                    />
                    {user?._id === data.student._id && (
                      <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={16} className="text-white" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{data.student.name}</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest mt-1">
                      <span>{data.student.enrollmentNumber}</span>
                      <span>•</span>
                      <span>{data.student.department}</span>
                      {data.student.isSuper50 && (
                        <>
                          <span>•</span>
                          <span className="text-brand-purple">Super 50</span>
                        </>
                      )}
                    </div>
                    {data.student.mentor && (
                      <div className="text-xs font-bold text-indigo-600 mt-1">
                        Mentor: {data.student.mentor?.name}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          {(activeTab !== 'menu' || user?.role === 'student') && (
            <div className="flex px-6 bg-slate-50 border-b border-slate-200 gap-6 overflow-x-auto scrollbar-none">
              {[
                { id: 'profile', icon: User, label: 'Overview' },
                { id: 'activities', icon: Activity, label: 'Activities' },
                { id: 'certificates', icon: Award, label: 'Certificates' },
                { id: 'placements', icon: Building2, label: 'Placements' },
                { id: 'mst', icon: ClipboardList, label: 'MST Marks' },
                { id: 'amcat', icon: Award, label: 'AMCAT Marks' },
                { id: 'rgpv', icon: Award, label: 'RGPV Marks' },
                ...(data?.super50Registration ? [{ id: 'super50_reg', icon: User, label: 'Super 50 Application' }] : []),
                ...(user?.role !== 'student' ? [{ id: 'remarks', icon: ClipboardList, label: 'Remarks' }] : []),
                { id: 'attendance', icon: ClipboardList, label: 'Attendance' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 font-bold text-sm transition-colors whitespace-nowrap shrink-0 ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600 space-y-4">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="font-bold text-sm tracking-widest uppercase">Loading Profile...</p>
              </div>
            ) : !data ? (
              <div className="text-center text-slate-500 py-10">Profile not found.</div>
            ) : (
              <div className="space-y-6">
                {activeTab !== 'menu' && user?.role !== 'student' && (
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                  >
                    ← Back to Options Menu
                  </button>
                )}

                {/* Options Menu Grid */}
                {activeTab === 'menu' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-4">
                    {[
                      { id: 'profile', icon: User, label: 'Overview', desc: 'Basic info, contact details and CGPA', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                      { id: 'mst', icon: ClipboardList, label: 'MST Marks', desc: 'Subject-wise mid semester exam scores', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
                      { id: 'amcat', icon: Award, label: 'AMCAT Marks', desc: 'Sectional scores from AMCAT exams', color: 'text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20' },
                      { id: 'rgpv', icon: Award, label: 'RGPV Marks', desc: 'Semester-wise SGPA, CGPA and subject grades', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
                      ...(data?.super50Registration ? [{ id: 'super50_reg', icon: Award, label: 'Super 50 Application', desc: 'Detailed application submitted for Super 50', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }] : []),
                      { id: 'placements', icon: Building2, label: 'Placements', desc: 'Campus drive statuses and interview rounds', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                      { id: 'activities', icon: Activity, label: 'Activities', desc: 'Co-curricular platforms and project submissions', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
                      { id: 'certificates', icon: Award, label: 'Certificates', desc: 'Verified and pending student certifications', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
                      { id: 'remarks', icon: ClipboardList, label: 'Remarks', desc: 'Internal reviews, notes and faculty remarks', color: 'text-slate-600 bg-slate-500/10 border-slate-500/20' },
                      { id: 'attendance', icon: ClipboardList, label: 'Attendance', desc: 'Lecture-wise attendance logs and percentage', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className="glass-card p-6 border border-slate-200 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl"
                        >
                          <div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color} shrink-0`}>
                              <Icon size={20} />
                            </div>
                            <h4 className="font-display font-black text-slate-900 text-base mt-5 group-hover:text-indigo-600 transition-colors">
                              {item.label}
                            </h4>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 group-hover:translate-x-1.5 transition-transform flex items-center gap-1.5 mt-6 self-start">
                            View Details →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Profile Overview Tab */}
                {activeTab === 'profile' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Student Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="font-bold">{data.student.email}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Batch:</span><span className="font-bold">{data.student.batch}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">CGPA:</span><span className="font-bold">{data.student.cgpa || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Score:</span><span className="font-bold text-indigo-600">{data.student.performanceScore}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Attendance:</span><span className="font-bold text-emerald-600">{Math.round(data.student.attendancePercentage || 0)}%</span></div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Contact Info</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="font-bold">{data.student.phone || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">10th %:</span><span className="font-bold">{data.student.tenthPercentage || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">12th %:</span><span className="font-bold">{data.student.twelfthPercentage || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities Tab */}
                {activeTab === 'activities' && (
                  <div className="space-y-4">
                    {data.activities.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">No activities uploaded.</div>
                    ) : (
                      data.activities.map(act => (
                        <div key={act._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-900">{act.title}</h4>
                            <div className="flex gap-3 text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">
                              <span>{act.type}</span>
                              {act.platform && <span>• {act.platform}</span>}
                            </div>
                            {act.link && <a href={act.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-2 block">View Link</a>}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${act.verified === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              act.verified === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                            {act.verified}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                  <div className="grid grid-cols-2 gap-4">
                    {data.certificates.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 col-span-2">No certificates uploaded.</div>
                    ) : (
                      data.certificates.map(cert => (
                        <div key={cert._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                            <Award size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{cert.title}</h4>
                            <p className="text-xs text-slate-500 truncate">{cert.issuedBy}</p>
                            <a href={cert.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline mt-1 block">View File</a>
                          </div>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${cert.verified === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              cert.verified === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                            {cert.verified}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Placements Tab */}
                {activeTab === 'placements' && (
                  <div className="space-y-6">
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-slate-500">No placement history found.</div>
                    ) : (
                      history.map((app) => (
                        <div key={app._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 group">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <Building2 size={24} />
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {app.drive?.companyName || 'Unknown Company'}
                                </h4>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                                  <span>Package: {app.drive?.package || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${app.status === 'selected' ? 'bg-emerald-100 text-emerald-700' :
                                  app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                    app.status === 'eligible' ? 'bg-indigo-100 text-indigo-700' :
                                      app.status === 'not-eligible' ? 'bg-slate-200 text-slate-700' :
                                        'bg-blue-100 text-blue-700'
                                }`}>
                                {app.status === 'selected' ? <CheckCircle size={14} /> :
                                  app.status === 'rejected' ? <XCircle size={14} /> :
                                    app.status === 'not-eligible' ? <X size={14} /> : <Clock size={14} />}
                                {app.status.replace('-', ' ')}
                              </span>
                            </div>
                          </div>
                          {app.roundsProgress && app.roundsProgress.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-100 relative">
                              <div className="absolute top-6 bottom-0 left-[21px] w-0.5 bg-slate-100" />
                              <div className="space-y-4">
                                {app.roundsProgress.map((round, idx) => (
                                  <div key={idx} className="flex items-center gap-4 relative z-10">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-4 border-white ${round.status === 'cleared' ? 'bg-emerald-500 text-white' :
                                        round.status === 'eliminated' ? 'bg-rose-500 text-white' :
                                          'bg-slate-200 text-slate-600'
                                      }`}>
                                      {round.status === 'cleared' ? <CheckCircle size={18} /> :
                                        round.status === 'eliminated' ? <XCircle size={18} /> :
                                          <Clock size={18} />}
                                    </div>
                                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-bold text-slate-900">{round.roundName}</div>
                                        <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${round.status === 'cleared' ? 'text-emerald-600' :
                                            round.status === 'eliminated' ? 'text-rose-600' :
                                              'text-slate-500'
                                          }`}>
                                          {round.status === 'cleared' ? 'Shortlisted' :
                                            round.status === 'eliminated' ? 'Not Shortlisted' : 'Pending'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Remarks Tab */}
                {activeTab === 'remarks' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-900 mb-4">Add Remark</h4>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const text = e.target.remark.value;
                        if (!text.trim()) return;

                        try {
                          const res = await api.post(`/admin/students/${studentId}/remarks`, { text });
                          setData(prev => ({
                            ...prev,
                            student: {
                              ...prev.student,
                              remarks: res.data.data.remarks
                            }
                          }));
                          e.target.reset();
                          toast.success('Remark added successfully');
                        } catch (err) {
                          toast.error('Failed to add remark');
                        }
                      }}>
                        <textarea
                          name="remark"
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-light)] rounded-xl py-3 px-4 text-[13px] font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all shadow-sm resize-none mb-3"
                          rows="3"
                          placeholder="Type your remark here..."
                        />
                        <div className="flex justify-end">
                          <button type="submit" className="btn-premium px-6 py-2 text-xs font-bold rounded-xl shadow-sm">
                            Add Remark
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900">Previous Remarks</h4>
                      {(!data.student.remarks || data.student.remarks.length === 0) ? (
                        <div className="text-center py-10 text-slate-500">No remarks found.</div>
                      ) : (
                        data.student.remarks.slice().reverse().map(remark => (
                          <div key={remark._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-sm font-medium text-slate-800 mb-3 whitespace-pre-wrap">{remark.text}</p>
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-100 pt-3">
                              <span>By: {remark.addedBy?.name || 'Unknown'}</span>
                              <span>{new Date(remark.addedAt).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Super 50 Attendance Tab */}
                {activeTab === 'attendance' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div>
                        <h4 className="font-bold text-slate-900">Cohort Class Attendance</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Logs of individual Super 50 class sessions.</p>
                      </div>
                      <div className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3.5 py-2 rounded-xl border border-indigo-100 shadow-sm">
                        Overall Attendance: <span className="font-black text-sm">{Math.round(data?.student?.attendancePercentage || 0)}%</span>
                      </div>
                    </div>

                    {loadingAttendance ? (
                      <div className="flex flex-col justify-center items-center py-20 gap-3 text-slate-500">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Loading history...</span>
                      </div>
                    ) : attendanceLogs.length === 0 ? (
                      <div className="text-center py-16 bg-white border rounded-2xl border-slate-200">
                        <ClipboardList size={36} className="text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-500 text-sm">No class attendance logs recorded for this student.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs font-medium">
                            <thead className="text-[9px] uppercase bg-slate-50 text-slate-500 font-black tracking-widest border-b border-slate-200">
                              <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Class Topic</th>
                                <th className="p-4">Recorded By</th>
                                <th className="p-4 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {attendanceLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4 font-bold text-slate-900">
                                    {new Date(log.classDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                  <td className="p-4 font-bold text-slate-900 text-sm">{log.className}</td>
                                  <td className="p-4 text-slate-500">{log.uploadedBy}</td>
                                  <td className="p-4 text-right">
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${log.status === 'present'
                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                      }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MST Results Tab */}
                {activeTab === 'mst' && (
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="font-display font-black text-slate-950 text-lg">Mid-Semester Test Scores</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Subject-wise marks obtained in MST evaluations.</p>
                    </div>
                    {(!data.mstResults || data.mstResults.length === 0) ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">No MST results uploaded yet.</div>
                    ) : (
                      data.mstResults.map((mst, mIdx) => (
                        <div key={mIdx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b pb-3">
                            <div>
                              <h4 className="font-bold text-slate-900">{mst.testName}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Semester {mst.semester} • Evaluated on {new Date(mst.testDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(mst.scores || {}).map(([subject, score], sIdx) => {
                              const testNameLower = (mst.testName || '').toLowerCase();
                              let maxMarks = 100;
                              if (testNameLower.includes('mst-1') || testNameLower.includes('mst 1') || testNameLower.includes('mst1')) {
                                maxMarks = 28;
                              } else if (testNameLower.includes('mst-2') || testNameLower.includes('mst 2') || testNameLower.includes('mst2')) {
                                maxMarks = 42;
                              }
                              const isIdKey = subject.toLowerCase().includes('id') || subject.toLowerCase().includes('enrollment') || subject.toLowerCase().includes('roll');
                              return (
                                <div key={sIdx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <span className="text-xs font-bold text-slate-700 capitalize truncate mr-2">{subject}</span>
                                  <span className="text-xs font-black text-slate-950 shrink-0 bg-white px-2 py-1 rounded border border-slate-100">
                                    {score} {!isIdKey && `/ ${maxMarks}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* AMCAT Results Tab */}
                {activeTab === 'amcat' && (
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="font-display font-black text-slate-950 text-lg">AMCAT Assessment Scores</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Sectional scores from AMCAT exams.</p>
                    </div>
                    {(!data.amcatResults || data.amcatResults.length === 0) ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">No AMCAT results uploaded yet.</div>
                    ) : (
                      data.amcatResults.map((amcat, aIdx) => (
                        <div key={aIdx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b pb-3">
                            <div>
                              <h4 className="font-bold text-slate-900">{amcat.testName}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Semester {amcat.semester} • Evaluated on {new Date(amcat.testDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(amcat.scores || {}).map(([subject, score], sIdx) => {
                              const isIdKey = subject.toLowerCase().includes('id') || subject.toLowerCase().includes('enrollment') || subject.toLowerCase().includes('roll');
                              return (
                                <div key={sIdx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                  <span className="text-xs font-bold text-slate-700 capitalize truncate mr-2">{subject}</span>
                                  <span className="text-xs font-black text-slate-950 shrink-0 bg-white px-2 py-1 rounded border border-slate-100">
                                    {score} {!isIdKey && '/ 100'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* RGPV Results Tab */}
                {activeTab === 'rgpv' && (
                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="font-display font-black text-slate-950 text-lg">RGPV University Results</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Semester-wise SGPA, CGPA, and subject grade records.</p>
                    </div>
                    {(!data.rgpvResults || data.rgpvResults.length === 0) ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500">No RGPV results uploaded yet.</div>
                    ) : (
                      data.rgpvResults.map((rgpv, rIdx) => (
                        <div key={rIdx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b pb-3">
                            <div>
                              <h4 className="font-bold text-slate-900">Semester {rgpv.semester}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">Result Decision: <span className="font-black text-slate-700">{rgpv.resultDecision}</span></p>
                            </div>
                            <div className="flex gap-4 text-xs font-bold">
                              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">SGPA</span>
                                <span className="text-slate-900 font-black">{rgpv.sgpa?.toFixed(2) || '0.00'}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-center">
                                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">CGPA</span>
                                <span className="text-slate-900 font-black">{rgpv.cgpa?.toFixed(2) || '0.00'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {Object.entries(rgpv.grades || {}).map(([subject, grade], sIdx) => (
                              <div key={sIdx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-500 truncate mr-2" title={subject}>{subject}</span>
                                <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${
                                  ['A+', 'A', 'B+', 'B'].includes(grade) ? 'text-emerald-600 bg-emerald-100/40' :
                                  ['C+', 'C'].includes(grade) ? 'text-blue-600 bg-blue-100/40' :
                                  'text-rose-600 bg-rose-100/40'
                                }`}>{grade}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Super 50 Application Tab */}
                {activeTab === 'super50_reg' && data.super50Registration && (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="font-display font-black text-slate-950 text-lg">Super 50 Selection Application Details</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Complete registration details submitted by student.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
                        <span className="font-bold text-slate-900 mt-1 block">{data.super50Registration.fullName}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Enrollment Number</span>
                        <span className="font-bold text-slate-900 mt-1 block uppercase">{data.super50Registration.enrollmentNumber}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                        <span className="font-bold text-slate-900 mt-1 block">{data.super50Registration.email}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Mobile Number</span>
                        <span className="font-bold text-slate-900 mt-1 block">{data.super50Registration.mobileNumber}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Branch & Section</span>
                        <span className="font-bold text-slate-900 mt-1 block">{data.super50Registration.branch || 'N/A'} (Sec {data.super50Registration.section})</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">GitHub Profile</span>
                        {data.super50Registration.githubProfile ? (
                          <a href={data.super50Registration.githubProfile} target="_blank" rel="noreferrer" className="text-indigo-500 font-bold hover:underline mt-1 block truncate">
                            {data.super50Registration.githubProfile}
                          </a>
                        ) : (
                          <span className="text-slate-400 mt-1 block">N/A</span>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Certifications</span>
                        <p className="font-bold text-slate-900 mt-1">{data.super50Registration.certifications || 'None'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Hackathon Participation</span>
                        <span className="font-bold text-slate-900 mt-1 block">{data.super50Registration.hackathonParticipation}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Hackathon Details</span>
                        <p className="font-bold text-slate-900 mt-1">{data.super50Registration.hackathonDetails || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Skills</span>
                        <p className="font-bold text-slate-900 mt-1">{data.super50Registration.skills || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2 border-t pt-4">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Project Live Link</span>
                        {data.super50Registration.projectLiveLink ? (
                          <a href={data.super50Registration.projectLiveLink} target="_blank" rel="noreferrer" className="text-indigo-500 font-bold hover:underline mt-1 block truncate">
                            {data.super50Registration.projectLiveLink}
                          </a>
                        ) : (
                          <span className="text-slate-400 mt-1 block">N/A</span>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Project Description</span>
                        <p className="font-bold text-slate-900 mt-1">{data.super50Registration.projectDescription || 'N/A'}</p>
                      </div>

                      {data.super50Registration.certificateImages && data.super50Registration.certificateImages.length > 0 && (
                        <div className="sm:col-span-2 border-t pt-4 space-y-3">
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Uploaded Application Certificates ({data.super50Registration.certificateImages.length})</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {data.super50Registration.certificateImages.map((imgUrl, imgIdx) => (
                              <div key={imgIdx} className="relative group border border-slate-200 rounded-xl overflow-hidden shadow-sm h-28 bg-slate-50 cursor-pointer" onClick={() => window.open(imgUrl, '_blank')}>
                                <img src={imgUrl} alt={`Certificate ${imgIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
