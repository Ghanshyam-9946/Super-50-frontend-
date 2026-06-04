import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Super50Card() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 p-8 text-white shadow-xl hover:shadow-purple-500/5 hover:border-purple-500/30 transition-all duration-300 group flex flex-col justify-between h-full min-h-[300px]">
      {/* Decorative blurred background shapes */}
      <div className="absolute -right-10 -top-10 w-36 h-36 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-all duration-500" />
      <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-all duration-500" />

      <div>
        <div className="w-14 h-14 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300">
          <Star className="animate-pulse fill-purple-400/20" size={32} />
        </div>
        <h3 className="text-2xl font-black tracking-tight mb-2">Super 50 Portal</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Unlock exclusive projects, log advanced activities, upload industry certifications, and qualify for high-impact placement opportunities.
        </p>
      </div>

      <Link
        to="/projects"
        className="mt-8 btn-premium w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
      >
        Enter Portal <ArrowRight size={16} />
      </Link>
    </div>
  );
}
