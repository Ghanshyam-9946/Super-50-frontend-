import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sparkles, Shield, Award, Users, TrendingUp, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={containerRef} className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pt-32 pb-20">
      {/* Background Mesh Grid & Ambient Glows */}
      <div className="absolute inset-0 z-0 bg-[#09090b] selection:bg-brand-indigo selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_10%,#000_70%,transparent_100%)]" />
        <div className="absolute top-12 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-pink-500/10 blur-[130px] pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Subtle pill tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide">SISTec Official Student & Placement Engine</span>
        </motion.div>

        {/* Crisp, human header - avoided AI word salad */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl leading-[1.08]"
        >
          Empowering student excellence with <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">clarity.</span>
        </motion.h1>

        {/* Minimal human tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg md:text-xl font-normal text-slate-400 leading-relaxed"
        >
          One intuitive ecosystem for tracking campus placements, projects, certifications, and real-time student performance rankings.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/login')}
            className="group relative flex h-13 items-center gap-2 rounded-full bg-white px-8 text-sm font-bold text-black transition-all hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5"
          >
            Get Started
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
          <a
            href="#features"
            className="flex h-13 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 text-sm font-semibold text-slate-300 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
          >
            Explore Platform
          </a>
        </motion.div>

        {/* Sleek Modern Preview Card (Web3 / Fintech Inspired Minimal Card) */}
        <motion.div
          style={{ y: y1, opacity }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-amber-500/10 blur-2xl opacity-60" />
          
          <div className="relative rounded-[2rem] border border-white/10 bg-[#121318]/90 p-4 backdrop-blur-2xl shadow-2xl">
            {/* Window header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-500">mile.sistec.ac.in/dashboard</span>
              <div className="w-12" />
            </div>

            {/* Dashboard Content Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Top Rankers</span>
                  <Trophy size={16} className="text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">#01 Super 50</div>
                <span className="text-[11px] text-emerald-400 font-medium">+12 pts this week</span>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Placement Rate</span>
                  <TrendingUp size={16} className="text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white">94.8%</div>
                <span className="text-[11px] text-slate-400 font-medium">Verified drives</span>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Projects Vault</span>
                  <Award size={16} className="text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">100+ Live</div>
                <span className="text-[11px] text-purple-400 font-medium">Faculty approved</span>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Certifications</span>
                  <Shield size={16} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">Verified</div>
                <span className="text-[11px] text-emerald-400 font-medium">Instant audit</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
