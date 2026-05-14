import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Code, 
  Trophy, 
  ShieldCheck, 
  LineChart, 
  ArrowRight, 
  Terminal, 
  Users, 
  Sparkles 
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  const features = [
    {
      icon: <Trophy className="w-6 h-6 text-[#fbbf24]" />,
      title: 'Competitive Leaderboard',
      desc: 'Rank among the top 50 engineers. Real-time stats, weekly challenges, and global standings.',
      glow: 'group-hover:shadow-[#fbbf24]/20'
    },
    {
      icon: <Terminal className="w-6 h-6 text-[#3b82f6]" />,
      title: 'Activity Tracking',
      desc: 'Log daily commits, DSA problems, and project milestones with intelligent insights.',
      glow: 'group-hover:shadow-[#3b82f6]/20'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#10b981]" />,
      title: 'Verified Certificates',
      desc: 'Immutable, blockchain-inspired certificate validation for all your achievements.',
      glow: 'group-hover:shadow-[#10b981]/20'
    },
    {
      icon: <LineChart className="w-6 h-6 text-[#8b5cf6]" />,
      title: 'Growth Analytics',
      desc: 'Visual graphs and heatmaps tracking your consistency and skill progression.',
      glow: 'group-hover:shadow-[#8b5cf6]/20'
    }
  ];

  return (
    <div className="min-h-screen bg-[#05050f] text-white selection:bg-purple-500/30 overflow-hidden font-['Inter']">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Floating Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center mt-6 px-4"
      >
        <div className="w-full max-w-5xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30">
              <Sparkles className="h-5 w-5 text-white absolute" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Super <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">50</span>
            </span>
          </div>

          <button 
            onClick={() => navigate('/login')}
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 border border-white/5"
          >
            <span>Access Portal</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-48 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              The Elite Engineering Squad
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={itemVariants} className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Elevate Your <br className="hidden md:block" />
              <span className="relative whitespace-nowrap">
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Engineering Career
                </span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p variants={itemVariants} className="max-w-2xl text-lg md:text-xl text-gray-400 mb-10 leading-relaxed font-light">
              An exclusive ecosystem for the top 50 tier. Track your progress, verify your skills, and dominate the leaderboard in real-time.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
              <button 
                onClick={() => navigate('/login')}
                className="group relative inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] w-full sm:w-auto overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                <span className="relative">Start Your Journey</span>
                <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button 
                onClick={() => {
                  document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' });
                }}
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-8 text-base font-semibold text-white transition-all duration-300 hover:bg-white/10 w-full sm:w-auto backdrop-blur-sm"
              >
                View Features
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-10 border-t border-white/5">
              {[
                { label: 'Active Students', value: '50+' },
                { label: 'Projects Built', value: '200+' },
                { label: 'Certifications', value: '100%' },
                { label: 'Placements', value: 'Top Tier' },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</span>
                  <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features Showcase */}
      <section id="features-section" className="relative z-10 py-32 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              A Platform Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Excellence</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Everything you need to showcase your talent, completely reimagined with a world-class developer experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${feature.glow}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-12 md:p-20 text-center backdrop-blur-xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Ready to Claim Your Spot?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Join the most elite engineering community. Track, prove, and elevate your skills alongside the best.
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-white text-black px-10 text-base font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)]"
            >
              Sign In to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 px-4 mt-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-white tracking-tight">Super 50</span>
          </div>
          <p className="text-gray-500 text-sm">
            Crafted for excellence. © {new Date().getFullYear()} Super 50 Squad.
          </p>
        </div>
      </footer>
    </div>
  );
}
