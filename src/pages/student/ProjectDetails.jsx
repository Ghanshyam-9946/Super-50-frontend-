import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getImageUrl } from '../../utils/imageUrl';
import { fetchProjectById } from '../../features/project/projectSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Users, Calendar, Layout, Plus, 
  MoreVertical, CheckCircle2, Clock, AlertCircle,
  GripVertical, FileText, Send, TrendingUp
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading } = useSelector((state) => state.project);
  const [draggedTask, setDraggedTask] = useState(null);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  const onDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('taskId', task._id);
  };

  const onDrop = async (e, newStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    try {
      await api.patch(`/projects/${id}/tasks/${taskId}`, { status: newStatus });
      dispatch(fetchProjectById(id)); // Refresh
      toast.success(`Task moved to ${newStatus.replace('-', ' ')}`);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'bg-red-50 text-red-600 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'low': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  if (loading || !currentProject) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
      <p className="text-[var(--text-secondary)] font-medium">Loading project...</p>
    </div>
  );

  const columns = [
    { id: 'todo', title: 'To Do', icon: Clock, color: 'text-slate-400', bg: 'bg-[#F8FAFC]' },
    { id: 'in-progress', title: 'In Progress', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-[#F0F9FF]' },
    { id: 'done', title: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-[#ECFDF5]' },
  ];

  return (
    <div className="p-8 max-w-full space-y-8 h-[calc(100vh-2rem)] flex flex-col">
      <header className="space-y-4 shrink-0">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
          <ChevronLeft size={16} /> Back to Projects
        </Link>
        <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[1.2rem] bg-[var(--bg-app)] border border-[var(--border-light)] flex items-center justify-center shadow-sm shrink-0">
              <Layout className="text-[var(--primary)]" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">{currentProject.title}</h1>
              <p className="text-[var(--text-secondary)] mt-1.5 font-medium max-w-2xl">{currentProject.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex -space-x-3">
              {currentProject.teamMembers.map((m, i) => (
                <img 
                  key={i} 
                  src={m.profileImage ? getImageUrl(m.profileImage) : `https://ui-avatars.com/api/?name=${m.name}&background=random`}
                  className="w-10 h-10 rounded-full border-2 border-[var(--bg-card)] shadow-sm ring-1 ring-black/5 relative hover:z-10 hover:scale-110 transition-transform" 
                  title={m.name}
                  alt={m.name}
                />
              ))}
            </div>
            <button className="btn-premium px-6 py-2.5 flex items-center gap-2">
              <Plus size={18} /> Add Task
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0 pb-4">
        {/* Kanban Board (3 columns) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {columns.map(col => (
            <div 
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col.id)}
              className="flex flex-col h-full bg-[var(--bg-app)] border border-[var(--border-light)] rounded-[1.5rem] overflow-hidden shadow-soft"
            >
              <div className="p-5 border-b border-[var(--border-light)] flex items-center justify-between bg-[var(--bg-card)]">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${col.bg}`}>
                    <col.icon size={16} className={col.color} />
                  </div>
                  <h3 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-[11px]">{col.title}</h3>
                  <span className="bg-[#F1F5F9] text-[var(--text-secondary)] text-[10px] px-2 py-0.5 rounded-md font-bold ml-1 border border-slate-200">
                    {currentProject.tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                <AnimatePresence>
                  {currentProject.tasks.filter(t => t.status === col.id).map((task) => (
                    <motion.div
                      key={task._id}
                      layoutId={task._id}
                      draggable
                      onDragStart={(e) => onDragStart(e, task)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[var(--bg-card)] border border-[var(--border-light)] shadow-sm rounded-2xl p-4 group cursor-grab active:cursor-grabbing border-l-[4px] border-l-transparent hover:border-l-[var(--primary)] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <GripVertical size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-[14px] font-bold text-[var(--text-primary)] mb-4 line-clamp-2 leading-snug">{task.title}</h4>
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)]">
                        <div className="flex items-center gap-2">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${task.assignedTo?.name || 'U'}&background=random`} 
                            className="w-6 h-6 rounded-full border border-slate-200" 
                            alt={task.assignedTo?.name}
                          />
                          <span className="text-[11px] text-[var(--text-secondary)] font-bold">{task.assignedTo?.name.split(' ')[0]}</span>
                        </div>
                        {col.id === 'done' && <CheckCircle2 size={16} className="text-emerald-500" />}
                      </div>
                    </motion.div>
                  ))}
                  {currentProject.tasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="h-full min-h-[100px] border-2 border-dashed border-[var(--border-light)] rounded-2xl flex flex-col items-center justify-center text-[var(--text-secondary)] opacity-50">
                      <p className="text-[11px] font-bold uppercase tracking-widest">Drop Here</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed (1 column) */}
        <div className="glass-card p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl bg-purple-50 text-[var(--primary)] border border-purple-100">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-display font-black text-[var(--text-primary)] tracking-tight text-lg">Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {currentProject.activityLog?.slice().reverse().map((log, i) => (
              <div key={i} className="flex gap-4 relative">
                {i < currentProject.activityLog.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-[var(--border-light)]" />
                )}
                <div className="w-6 h-6 rounded-full bg-[var(--bg-app)] border border-[var(--primary-light)] flex items-center justify-center shrink-0 z-10 mt-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                </div>
                <div className="space-y-1 mt-0.5">
                  <p className="text-[13px] text-[var(--text-primary)] font-medium leading-relaxed">
                    {log.text}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.1em]">
                    {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {(!currentProject.activityLog || currentProject.activityLog.length === 0) && (
              <div className="text-center py-12 text-[var(--text-secondary)] text-[11px] font-bold uppercase tracking-widest">
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
