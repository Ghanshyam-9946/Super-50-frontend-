import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyProjects } from '../../features/project/projectSlice';
import { motion } from 'framer-motion';
import { Plus, Layout, CheckCircle2, Circle, Users, Calendar, ArrowUpRight } from 'lucide-react';

const ProjectDashboard = () => {
  const dispatch = useDispatch();
  const { projects, loading } = useSelector((state) => state.project);

  useEffect(() => {
    dispatch(fetchMyProjects());
  }, [dispatch]);

  if (loading) return <div className="p-8 text-center">Loading projects...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Management</h1>
          <p className="text-gray-400 mt-1">Track your team projects, tasks, and documentation.</p>
        </div>
        <button className="btn-premium px-6 py-2 flex items-center gap-2">
          <Plus size={18} /> New Project
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <motion.div
            key={project._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex flex-col h-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Layout className="text-purple-400" size={24} />
              </div>
              <div className="flex -space-x-2">
                {project.teamMembers.slice(0, 3).map((member, i) => (
                  <img
                    key={i}
                    src={member.profileImage || `https://ui-avatars.com/api/?name=${member.name}&background=random`}
                    className="w-8 h-8 rounded-full border-2 border-[#030303]"
                    alt={member.name}
                  />
                ))}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-2 mb-6">{project.description}</p>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-gray-500">Progress</span>
                <span className="text-purple-400">{project.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              </div>
            </div>

            {/* Task Preview */}
            <div className="space-y-3 mb-6 flex-1">
               {project.tasks.slice(0, 2).map((task, i) => (
                 <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                   {task.completed ? <CheckCircle2 size={16} className="text-green-500" /> : <Circle size={16} className="text-gray-600" />}
                   <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.title}</span>
                 </div>
               ))}
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase">
                <Calendar size={14} />
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <Link to={`/projects/${project._id}`} className="text-purple-400 flex items-center gap-1 text-sm font-bold hover:gap-2 transition-all">
                View Details <ArrowUpRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full glass-card p-12 text-center">
            <Layout className="mx-auto text-gray-600 mb-4" size={48} />
            <h3 className="text-xl font-bold text-white">No Projects Found</h3>
            <p className="text-gray-400 mt-2">Start a new project with your teammates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDashboard;
