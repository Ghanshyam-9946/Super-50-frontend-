import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyResume, updateLocalResume } from '../../features/resume/resumeSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Eye, FileText, Download, Layout, 
  Edit3, User, BookOpen, Briefcase, Award,
  Plus, Trash2, Mail, Phone, MapPin, Globe, MessageSquare
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResumeBuilder = () => {
  const dispatch = useDispatch();
  const { currentResume, loading } = useSelector((state) => state.resume);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPreview, setShowPreview] = useState(false);
  const resumeRef = useRef();

  useEffect(() => {
    dispatch(fetchMyResume());
  }, [dispatch]);

  const handleUpdate = (section, field, value, index = null) => {
    let updatedContent = { ...currentResume?.content };
    
    if (index !== null) {
      const newList = [...updatedContent[section]];
      newList[index] = { ...newList[index], [field]: value };
      updatedContent[section] = newList;
    } else if (field) {
      updatedContent[section] = { ...updatedContent[section], [field]: value };
    } else {
      updatedContent[section] = value;
    }
    
    dispatch(updateLocalResume({ content: updatedContent }));
  };

  const addItem = (section, defaultValue) => {
    const updatedContent = {
      ...currentResume?.content,
      [section]: [...(currentResume?.content[section] || []), defaultValue]
    };
    dispatch(updateLocalResume({ content: updatedContent }));
  };

  const removeItem = (section, index) => {
    const updatedContent = {
      ...currentResume?.content,
      [section]: currentResume?.content[section].filter((_, i) => i !== index)
    };
    dispatch(updateLocalResume({ content: updatedContent }));
  };

  const handleSave = async () => {
    try {
      await api.post('/resume', { 
        content: currentResume.content, 
        templateId: currentResume.templateId 
      });
      toast.success('Resume saved successfully');
    } catch (err) {
      toast.error('Failed to save resume');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await api.patch('/resume/review-status', { status: 'open-for-review' });
      toast.success('Resume submitted for faculty review');
      dispatch(fetchMyResume());
    } catch (err) {
      toast.error('Failed to submit for review');
    }
  };

  const handleExport = () => {
    const element = resumeRef.current;
    const opt = {
      margin: 0,
      filename: `${currentResume?.student?.name || 'Resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  if (loading) return <div className="p-8 text-center">Loading resume...</div>;

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col">
      <header className="p-4 glass-nav sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <FileText className="text-purple-500" />
          <h1 className="text-lg font-bold text-white tracking-tight">Resume Builder</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {[1, 2, 3].map(t => (
              <button 
                key={t}
                onClick={() => dispatch(updateLocalResume({ templateId: t }))}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${currentResume?.templateId === t ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
              >
                T{t}
              </button>
            ))}
          </div>
          {currentResume?.reviewStatus === 'draft' && (
             <button onClick={handleSubmitForReview} className="text-purple-400 text-xs font-bold hover:text-purple-300 transition-colors">
               Submit for Review
             </button>
          )}
          <div className="h-4 w-px bg-white/10"></div>
          <button onClick={() => setShowPreview(!showPreview)} className="text-gray-400 hover:text-white transition-colors">
            {showPreview ? <Edit3 size={18} /> : <Eye size={18} />}
          </button>
          <button onClick={handleExport} className="text-gray-400 hover:text-white transition-colors">
            <Download size={18} />
          </button>
          <button onClick={handleSave} className="btn-premium py-2 px-6 flex items-center gap-2">
            <Save size={18} /> Save
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-white/5 p-6 space-y-2 hidden md:block overflow-y-auto">
          {[
            { id: 'personal', label: 'Personal Info', icon: User },
            { id: 'education', label: 'Education', icon: BookOpen },
            { id: 'skills', label: 'Skills', icon: Award },
            { id: 'experience', label: 'Experience', icon: Briefcase },
            { id: 'projects', label: 'Projects', icon: Layout },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-purple-500/10 text-purple-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </aside>

        <div className={`flex-1 overflow-y-auto p-8 ${showPreview ? 'hidden md:block' : 'block'}`}>
          <div className="max-w-2xl mx-auto space-y-12">
            {/* Faculty Feedback Section */}
            {currentResume?.feedback?.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm uppercase tracking-widest">
                  <MessageSquare size={16} /> Faculty Feedback
                </div>
                <div className="space-y-3">
                  {currentResume.feedback.map((f, i) => (
                    <div key={i} className="text-gray-300 text-sm border-l-2 border-purple-500/30 pl-4 py-1">
                      <p className="italic">"{f.comment}"</p>
                      <p className="text-[10px] text-gray-500 mt-1">{new Date(f.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.section key="p" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Phone" value={currentResume?.content?.personalInfo?.phone} onChange={(v) => handleUpdate('personalInfo', 'phone', v)} />
                    <InputField label="Location" value={currentResume?.content?.personalInfo?.location} onChange={(v) => handleUpdate('personalInfo', 'location', v)} />
                    <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Professional Summary</label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 min-h-[120px]"
                        value={currentResume?.content?.personalInfo?.summary}
                        onChange={(e) => handleUpdate('personalInfo', 'summary', e.target.value)}
                        placeholder="Highlight your key achievements and career goals..."
                      />
                    </div>
                  </div>
                </motion.section>
              )}

              {activeTab === 'education' && (
                <motion.section key="e" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Education</h2>
                    <button onClick={() => addItem('education', { institution: '', degree: '', year: '', score: '' })} className="text-purple-400 flex items-center gap-2 text-sm font-bold">
                      <Plus size={16} /> Add More
                    </button>
                  </div>
                  {currentResume?.content?.education?.map((edu, i) => (
                    <div key={i} className="glass-card p-6 relative group">
                      <button onClick={() => removeItem('education', i)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Institution" value={edu.institution} onChange={(v) => handleUpdate('education', 'institution', v, i)} />
                        <InputField label="Degree" value={edu.degree} onChange={(v) => handleUpdate('education', 'degree', v, i)} />
                        <InputField label="Year" value={edu.year} onChange={(v) => handleUpdate('education', 'year', v, i)} />
                        <InputField label="Score / CGPA" value={edu.score} onChange={(v) => handleUpdate('education', 'score', v, i)} />
                      </div>
                    </div>
                  ))}
                </motion.section>
              )}

              {activeTab === 'skills' && (
                <motion.section key="s" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {currentResume?.content?.skills?.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white group">
                        <span className="text-sm">{skill}</span>
                        <button onClick={() => removeItem('skills', i)} className="text-gray-500 hover:text-red-500">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <input 
                      type="text"
                      className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg text-purple-300 text-sm focus:outline-none placeholder:text-purple-700"
                      placeholder="Add skill..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addItem('skills', e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </motion.section>
              )}

              {activeTab === 'experience' && (
                <motion.section key="ex" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Experience</h2>
                    <button onClick={() => addItem('experience', { company: '', role: '', duration: '', description: '' })} className="text-purple-400 flex items-center gap-2 text-sm font-bold">
                      <Plus size={16} /> Add Experience
                    </button>
                  </div>
                  {currentResume?.content?.experience?.map((exp, i) => (
                    <div key={i} className="glass-card p-6 relative group">
                      <button onClick={() => removeItem('experience', i)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Company" value={exp.company} onChange={(v) => handleUpdate('experience', 'company', v, i)} />
                        <InputField label="Role" value={exp.role} onChange={(v) => handleUpdate('experience', 'role', v, i)} />
                        <div className="col-span-2">
                          <InputField label="Duration (e.g. Jan 2023 - Present)" value={exp.duration} onChange={(v) => handleUpdate('experience', 'duration', v, i)} />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                          <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 min-h-[80px]"
                            value={exp.description}
                            onChange={(e) => handleUpdate('experience', 'description', e.target.value, i)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.section>
              )}

              {activeTab === 'projects' && (
                <motion.section key="pr" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Projects</h2>
                    <button onClick={() => addItem('projects', { title: '', description: '', link: '' })} className="text-purple-400 flex items-center gap-2 text-sm font-bold">
                      <Plus size={16} /> Add Project
                    </button>
                  </div>
                  {currentResume?.content?.projects?.map((proj, i) => (
                    <div key={i} className="glass-card p-6 relative group">
                      <button onClick={() => removeItem('projects', i)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Project Title" value={proj.title} onChange={(v) => handleUpdate('projects', 'title', v, i)} />
                        <InputField label="Project Link" value={proj.link} onChange={(v) => handleUpdate('projects', 'link', v, i)} />
                        <div className="col-span-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Description</label>
                          <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 min-h-[80px]"
                            value={proj.description}
                            onChange={(e) => handleUpdate('projects', 'description', e.target.value, i)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={`flex-1 bg-white/[0.02] border-l border-white/5 p-8 overflow-y-auto ${showPreview ? 'block' : 'hidden lg:block'}`}>
           <div ref={resumeRef} className="max-w-[210mm] mx-auto shadow-2xl overflow-hidden bg-white text-black min-h-[297mm]">
              {currentResume?.templateId === 1 && <TemplateOne data={currentResume} />}
              {currentResume?.templateId === 2 && <TemplateTwo data={currentResume} />}
              {currentResume?.templateId === 3 && <TemplateThree data={currentResume} />}
           </div>
        </div>
      </main>
    </div>
  );
};

const TemplateOne = ({ data }) => (
  <div className="p-12 h-full text-black">
    <div className="border-b-4 border-black pb-8">
      <h1 className="text-5xl font-black uppercase tracking-tighter">{data?.student?.name}</h1>
      <div className="flex gap-6 mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
        <span className="flex items-center gap-2"><Mail size={12}/> {data?.student?.email}</span>
        <span className="flex items-center gap-2"><Phone size={12}/> {data?.content?.personalInfo?.phone}</span>
        <span className="flex items-center gap-2"><MapPin size={12}/> {data?.content?.personalInfo?.location}</span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-12 mt-12">
      <div className="col-span-2 space-y-12">
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-gray-400">Professional Summary</h3>
          <p className="text-sm text-gray-800 leading-relaxed">{data?.content?.personalInfo?.summary}</p>
        </section>
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-gray-400">Education</h3>
          {data?.content?.education?.map((edu, i) => (
            <div key={i} className="mb-6">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm uppercase">{edu.institution}</h4>
                <span className="text-[10px] font-black bg-gray-100 px-2 py-1">{edu.year}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{edu.degree} • Score: {edu.score}</p>
            </div>
          ))}
        </section>
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-gray-400">Experience</h3>
          {data?.content?.experience?.map((exp, i) => (
            <div key={i} className="mb-6">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm uppercase">{exp.company}</h4>
                <span className="text-[10px] font-black bg-gray-100 px-2 py-1">{exp.duration}</span>
              </div>
              <p className="text-xs font-bold text-gray-500 italic mt-1">{exp.role}</p>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{exp.description}</p>
            </div>
          ))}
        </section>
      </div>
      <div className="space-y-12">
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-gray-400">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {data?.content?.skills?.map((s, i) => (
              <span key={i} className="border-2 border-black px-2 py-1 text-[9px] font-black uppercase">{s}</span>
            ))}
          </div>
        </section>
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-[4px] mb-6 text-gray-400">Projects</h3>
          {data?.content?.projects?.map((proj, i) => (
            <div key={i} className="mb-6">
              <h4 className="font-bold text-xs uppercase">{proj.title}</h4>
              <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">{proj.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  </div>
);

const TemplateTwo = ({ data }) => (
  <div className="flex h-full min-h-[297mm] text-black">
    <div className="w-1/3 bg-gray-900 text-white p-10 space-y-12">
       <div className="w-32 h-32 rounded-full border-4 border-purple-500 overflow-hidden mx-auto">
         <img src={data?.content?.personalInfo?.photo || `https://ui-avatars.com/api/?name=${data?.student?.name}&size=200`} className="w-full h-full object-cover" />
       </div>
       <section>
         <h3 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-6">Contact</h3>
         <div className="space-y-4 text-[10px] text-gray-400">
           <div className="flex items-center gap-3"><Mail size={12}/> {data?.student?.email}</div>
           <div className="flex items-center gap-3"><Phone size={12}/> {data?.content?.personalInfo?.phone}</div>
           <div className="flex items-center gap-3"><MapPin size={12}/> {data?.content?.personalInfo?.location}</div>
         </div>
       </section>
       <section>
         <h3 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-6">Expertise</h3>
         <div className="flex flex-wrap gap-2">
            {data?.content?.skills?.map((s, i) => (
              <span key={i} className="bg-white/10 px-2 py-1 text-[9px] font-bold uppercase rounded">{s}</span>
            ))}
          </div>
       </section>
    </div>
    <div className="flex-1 p-12 bg-white">
       <header className="mb-12">
         <h1 className="text-4xl font-light text-gray-900 tracking-tight">{data?.student?.name.split(' ')[0]} <span className="font-bold">{data?.student?.name.split(' ').slice(1).join(' ')}</span></h1>
         <p className="text-purple-600 font-bold mt-2 uppercase tracking-widest text-[10px]">Professional Candidate</p>
       </header>
       <div className="space-y-10">
         <section>
           <h3 className="text-xs font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <User size={14} className="text-purple-600"/> Profile
           </h3>
           <p className="text-xs text-gray-600 leading-relaxed">{data?.content?.personalInfo?.summary}</p>
         </section>
         <section>
           <h3 className="text-xs font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <Briefcase size={14} className="text-purple-600"/> Experience
           </h3>
           {data?.content?.experience?.map((exp, i) => (
              <div key={i} className="mb-4">
                 <div className="flex justify-between text-[11px] font-bold">
                   <span>{exp.company}</span>
                   <span className="text-purple-600">{exp.duration}</span>
                 </div>
                 <p className="text-[10px] text-gray-400 italic mb-1">{exp.role}</p>
                 <p className="text-[10px] text-gray-600 leading-relaxed">{exp.description}</p>
              </div>
           ))}
         </section>
         <section>
           <h3 className="text-xs font-bold border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
             <BookOpen size={14} className="text-purple-600"/> Academic History
           </h3>
           {data?.content?.education?.map((edu, i) => (
             <div key={i} className="mb-4">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>{edu.degree}</span>
                  <span className="text-purple-600">{edu.year}</span>
                </div>
                <p className="text-[10px] text-gray-500">{edu.institution}</p>
             </div>
           ))}
         </section>
       </div>
    </div>
  </div>
);

const TemplateThree = ({ data }) => (
  <div className="p-0 h-full flex flex-col text-black">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-12 text-white">
       <h1 className="text-5xl font-bold tracking-tighter">{data?.student?.name}</h1>
       <div className="flex gap-8 mt-6 text-xs font-medium opacity-80">
          <span className="flex items-center gap-2"><Mail size={14}/> {data?.student?.email}</span>
          <span className="flex items-center gap-2"><Phone size={14}/> {data?.content?.personalInfo?.phone}</span>
          <span className="flex items-center gap-2"><Globe size={14}/> {data?.student?.enrollmentNumber}</span>
       </div>
    </div>
    <div className="p-12 grid grid-cols-4 gap-12 bg-white flex-1">
       <div className="space-y-12">
          <section>
            <h3 className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-4">Core Skills</h3>
            <div className="space-y-2">
              {data?.content?.skills?.map((s, i) => (
                <div key={i} className="text-xs font-bold text-gray-700 border-l-2 border-blue-100 pl-3">{s}</div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-4">Projects</h3>
            <div className="space-y-4">
              {data?.content?.projects?.map((proj, i) => (
                <div key={i}>
                   <h4 className="text-xs font-bold text-gray-900">{proj.title}</h4>
                   <p className="text-[10px] text-gray-500 mt-1">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
       </div>
       <div className="col-span-3 space-y-12">
          <section>
             <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-50 pb-2 mb-6">About Me</h2>
             <p className="text-gray-600 leading-relaxed text-xs">{data?.content?.personalInfo?.summary}</p>
          </section>
          <section>
             <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-50 pb-2 mb-6">Work Experience</h2>
             {data?.content?.experience?.map((exp, i) => (
               <div key={i} className="mb-6 grid grid-cols-4">
                  <span className="text-xs font-bold text-blue-600">{exp.duration}</span>
                  <div className="col-span-3">
                     <h4 className="text-sm font-bold text-gray-900">{exp.role}</h4>
                     <p className="text-xs text-blue-500 font-medium mb-1">{exp.company}</p>
                     <p className="text-xs text-gray-500 leading-relaxed">{exp.description}</p>
                  </div>
               </div>
             ))}
          </section>
          <section>
             <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-50 pb-2 mb-6">Education Details</h2>
             {data?.content?.education?.map((edu, i) => (
               <div key={i} className="mb-6 grid grid-cols-4">
                  <span className="text-xs font-bold text-blue-600">{edu.year}</span>
                  <div className="col-span-3">
                     <h4 className="text-sm font-bold text-gray-900">{edu.degree}</h4>
                     <p className="text-xs text-gray-500">{edu.institution}</p>
                  </div>
               </div>
             ))}
          </section>
       </div>
    </div>
  </div>
);

const InputField = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">{label}</label>
    <input
      type="text"
      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default ResumeBuilder;
