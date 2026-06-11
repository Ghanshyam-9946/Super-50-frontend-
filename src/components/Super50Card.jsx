import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Super50Card() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[var(--border-light)] bg-[var(--bg-card)] p-8 text-[var(--text-primary)] shadow-elevated hover:shadow-hover hover:border-[var(--primary)] transition-all duration-500 group flex flex-col justify-between h-full min-h-[300px]">
      {/* Decorative Premium Mesh Background (subtle) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-card)] to-[#F5F3FF] z-0" />
      
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-700 z-0" />
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-700 z-0" />

      <div className="relative z-10">
        <div className="w-14 h-14 bg-white border border-purple-100 shadow-[0_4px_15px_rgba(139,92,246,0.15)] rounded-2xl flex items-center justify-center text-[var(--primary)] mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
          <Star className="fill-purple-100" size={28} />
        </div>
        <h3 className="text-2xl font-display font-black tracking-tight mb-3">Super 50 Portal</h3>
        <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed max-w-[90%]">
          Unlock exclusive projects, log advanced activities, upload industry certifications, and qualify for high-impact placement opportunities.
        </p>
      </div>

      <Link
        to="/projects"
        className="relative z-10 mt-8 btn-premium w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
      >
        Enter Portal <ArrowRight size={16} />
      </Link>
    </div>
  );
}
