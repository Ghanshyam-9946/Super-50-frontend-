import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectById } from '../../features/project/projectSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Users, Calendar, Layout, Plus, 
  MoreVertical, CheckCircle2, Clock, AlertCircle,
  GripVertical, FileText, Send
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
      toast.success(`Task moved to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-slate-600 border-gray-500/20';
    }
  };

  if (loading || !currentProject) return <div className="p-12 text-center text-slate-600">Loading project...</div>;

  const columns = [
    { id: 'todo', title: 'To Do', icon: Clock, color: 'text-slate-500' },
    { id: 'in-progress', title: 'In Progress', icon: AlertCircle, color: 'text-blue-400' },
    { id: 'done', title: 'Completed', icon: CheckCircle2, color: 'text-green-400' },
  ];

  return (
    <div className="p-6 max-w-full space-y-8">
      <header className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
          <ChevronLeft size={16} /> Back to Projects
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Layout className="text-purple-500" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{currentProject.title}</h1>
              <p className="text-slate-600 mt-1">{currentProject.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {currentProject.teamMembers.map((m, i) => (
                <img 
                  key={i} 
                  src={m.profileImage || `https://ui-avatars.com/api/?name=${m.name}&background=random`}
                  className="w-10 h-10 rounded-full border-4 border-[#030303] ring-1 ring-white/10" 
                  title={m.name}
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Kanban Board (3 columns) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(col => (
            <div 
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col.id)}
              className="flex flex-col h-[70vh] bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <col.icon size={18} className={col.color} />
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{col.title}</h3>
                  <span className="bg-slate-50 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {currentProject.tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
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
                      className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 group cursor-grab active:cursor-grabbing border-l-4 border-l-transparent hover:border-l-purple-500"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <GripVertical size={14} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-4 line-clamp-2">{task.title}</h4>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${task.assignedTo?.name || 'U'}&background=random`} 
                            className="w-5 h-5 rounded-full" 
                          />
                          <span className="text-[10px] text-slate-600 font-bold">{task.assignedTo?.name.split(' ')[0]}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed (1 column) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 h-[70vh] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-purple-500" />
            <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Activity Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
            {currentProject.activityLog?.slice().reverse().map((log, i) => (
              <div key={i} className="flex gap-4 relative">
                {i < currentProject.activityLog.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-slate-50" />
                )}
                <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">
                    {log.text}
                  </p>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {(!currentProject.activityLog || currentProject.activityLog.length === 0) && (
              <div className="text-center py-12 text-gray-700 text-xs font-bold uppercase tracking-widest">
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
