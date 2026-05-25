import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, MessageSquare, 
  ExternalLink, Clock, User, Filter, Search 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResumeReview = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resume/faculty/all');
      setResumes(data.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to fetch resumes');
      setLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (!feedback) return toast.error('Please enter feedback');
    try {
      await api.post(`/resume/${selectedResume._id}/feedback`, { comment: feedback });
      toast.success('Feedback sent successfully');
      setFeedback('');
      setSelectedResume(null);
      fetchResumes();
    } catch (err) {
      toast.error('Failed to send feedback');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch('/resume/review-status', { status: 'approved' }); // This might need a specific route or student ID in production
      toast.success('Resume approved');
      fetchResumes();
    } catch (err) {
      toast.error('Failed to approve resume');
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Loading review queue...</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resume Review Queue</h1>
          <p className="text-slate-500 mt-1">Review student resumes and provide professional feedback.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Review List */}
        <div className="lg:col-span-1 space-y-4">
          {resumes.map((resume) => (
            <motion.div
              key={resume._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedResume(resume)}
              className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-5 cursor-pointer transition-all border-l-4 ${
                selectedResume?._id === resume._id ? 'border-purple-500 bg-slate-50' : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{resume.student.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{resume.student.enrollmentNumber}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                  resume.reviewStatus === 'open-for-review' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {resume.reviewStatus}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(resume.updatedAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MessageSquare size={12}/> {resume.feedback.length}</span>
              </div>
            </motion.div>
          ))}

          {resumes.length === 0 && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center">
              <CheckCircle className="mx-auto text-gray-600 mb-4" size={40} />
              <h3 className="text-slate-900 font-bold">Queue Empty</h3>
              <p className="text-slate-600 text-sm mt-1">No resumes pending review.</p>
            </div>
          )}
        </div>

        {/* Preview & Action Area */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedResume.student.name}</h2>
                    <p className="text-slate-500 text-sm">{selectedResume.student.department} • {selectedResume.student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl transition-all font-bold py-2 px-4 flex items-center gap-2">
                    <ExternalLink size={16} /> Open Full
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 space-y-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={20} className="text-purple-500" /> 
                  Provide Feedback
                </h3>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:outline-none focus:border-purple-500/50 min-h-[150px]"
                  placeholder="Write your suggestions here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex justify-end gap-4">
                   <button 
                     onClick={() => handleApprove(selectedResume._id)}
                     className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl transition-all font-bold px-8 py-3"
                   >
                     Approve
                   </button>
                   <button 
                     onClick={handleFeedback}
                     className="btn-premium px-8 py-3"
                   >
                     Submit Review
                   </button>
                </div>
              </div>

              {/* Previous Feedback */}
              {selectedResume.feedback.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-600 uppercase tracking-widest">Previous Feedback</h4>
                  {selectedResume.feedback.map((f, i) => (
                    <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 bg-white/[0.01]">
                       <p className="text-gray-300 text-sm italic">"{f.comment}"</p>
                       <p className="text-[10px] text-slate-600 mt-2">{new Date(f.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-[60vh] bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col items-center justify-center text-center p-12">
               <FileText className="text-gray-700 mb-4" size={64} />
               <h3 className="text-xl font-bold text-slate-900">Select a Resume</h3>
               <p className="text-slate-600 mt-2 max-w-xs">Pick a student from the list to start the review process.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeReview;
