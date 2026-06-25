import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyProjects } from '../../features/project/projectSlice';
import { motion } from 'framer-motion';
import { Plus, Layout, CheckCircle2, Circle, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';

const ProjectDashboard = () => {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector((state) => state.project);

  useEffect(() => {
    dispatch(fetchMyProjects());
  }, [dispatch]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-purple-500/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
      <p className="text-[var(--text-secondary)] font-medium">Loading projects...</p>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tight text-[var(--text-primary)]">Project Management</h1>
          <p className="text-[var(--text-secondary)] font-medium mt-2">Track your team projects, tasks, and documentation.</p>
        </motion.div>
        <motion.button 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="btn-premium px-6 py-3 flex items-center gap-2"
        >
          <Plus size={18} /> New Project
        </motion.button>
      </header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {projects.map((project) => (
          <motion.div
            key={project._id}
            variants={itemVariants}
            className="glass-card p-8 flex flex-col h-full group hover:border-[var(--primary)] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3.5 rounded-[1rem] bg-[var(--bg-app)] border border-[var(--border-light)] group-hover:border-[var(--primary)] group-hover:shadow-sm transition-all duration-300">
                <Layout className="text-[var(--primary)]" size={24} />
              </div>
              <div className="flex -space-x-3">
                {project.teamMembers.slice(0, 3).map((member, i) => (
                  <img
                    key={i}
                    src={member.profileImage ? getImageUrl(member.profileImage) : `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5 relative z-10 hover:z-20 hover:scale-110 transition-transform"
                    alt={member.name}
                    title={member.name}
                  />
                ))}
                {project.teamMembers.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 relative z-10">
                    +{project.teamMembers.length - 3}
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-xl font-display font-black text-[var(--text-primary)] mb-2 group-hover:text-[var(--primary)] transition-colors">{project.title}</h3>
            <p className="text-[13px] text-[var(--text-secondary)] font-medium line-clamp-2 mb-8 leading-relaxed">{project.description}</p>

            {/* Progress Bar */}
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-[var(--text-secondary)] opacity-80">Progress</span>
                <span className="text-[var(--primary-dark)]">{project.progress}%</span>
              </div>
              <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)]"
                />
              </div>
            </div>

            {/* Task Preview */}
            <div className="space-y-3.5 mb-8 flex-1">
               {project.tasks.slice(0, 2).map((task, i) => (
                 <div key={i} className="flex items-start gap-3 text-[13px] text-[var(--text-secondary)] font-medium">
                   <div className="mt-0.5">
                    {task.completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-slate-300" />}
                   </div>
                   <span className={task.completed ? 'line-through opacity-60' : 'text-[var(--text-primary)]'}>{task.title}</span>
                 </div>
               ))}
               {project.tasks.length === 0 && (
                 <div className="text-[13px] text-[var(--text-secondary)] italic opacity-70">No tasks created yet.</div>
               )}
            </div>

            <div className="pt-6 border-t border-[var(--border-light)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] font-bold uppercase tracking-widest opacity-80">
                <Calendar size={14} />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <Link to={`/projects/${project._id}`} className="text-[var(--primary)] flex items-center gap-1.5 text-xs font-black uppercase tracking-widest hover:gap-2.5 transition-all group/link">
                View Details <ArrowUpRight size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ))}

        {!loading && projects.length === 0 && (
          <motion.div 
            variants={itemVariants}
            className="col-span-full glass-card p-16 text-center border-dashed"
          >
            <div className="w-20 h-20 bg-slate-50 border border-[var(--border-light)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Layout className="text-[#CBD5E1]" size={36} />
            </div>
            <h3 className="text-2xl font-display font-black text-[var(--text-primary)]">No Projects Found</h3>
            <p className="text-[var(--text-secondary)] font-medium mt-3 max-w-md mx-auto">Start a new project with your teammates to begin tracking your tasks.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProjectDashboard;
