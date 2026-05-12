import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code, Trophy, Shield, Activity, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      title: 'Leaderboard',
      description: 'Compete with peers and climb the ranks to become the top engineer in Super 50.',
    },
    {
      icon: <Code className="w-8 h-8 text-blue-500" />,
      title: 'Activity Tracking',
      description: 'Log your daily coding activities, projects, and learning milestones.',
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-500" />,
      title: 'Verified Certificates',
      description: 'Upload and verify your achievements with authentic digital certificates.',
    },
    {
      icon: <Activity className="w-8 h-8 text-green-500" />,
      title: 'Performance Analytics',
      description: 'Track your growth over time with detailed performance insights.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/30">
                S
              </div>
              <span className="font-bold text-2xl tracking-tight">Super <span className="gradient-text">50</span></span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button 
                onClick={() => navigate('/login')}
                className="btn-primary px-8 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-purple-500/20"
              >
                Login to Portal
              </button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                Empowering the Next <br className="hidden md:block" />
                Generation of <span className="gradient-text animate-pulse">Engineers</span>
              </h1>
              
              <p className="mt-4 max-w-2xl text-lg md:text-xl text-[var(--text-secondary)] mx-auto mb-10">
                A comprehensive portal to track activities, manage certificates, and compete on the leaderboard. Join the elite Super 50 squad today.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-primary text-lg px-8 py-4 rounded-full w-full sm:w-auto"
                >
                  Get Started Now
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-secondary text-lg px-8 py-4 rounded-full w-full sm:w-auto"
                >
                  Explore Features
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 bg-[var(--bg-secondary)] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold"
              >
                Everything you need to <span className="gradient-text">succeed</span>
              </motion.h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-primary)] flex items-center justify-center mb-6 border border-[var(--border)] shadow-inner">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-12 bg-[var(--bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-bold text-lg">Super 50</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            © {new Date().getFullYear()} Super 50 Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
