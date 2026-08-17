import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sistecLogo from "../assets/SISTec_Logo.png";

const links = [
  { label: "Features", href: "#features" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Forms", href: "#forms" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [campusModal, setCampusModal] = useState<'login' | 'register' | null>(null);

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  const padding = useTransform(scrollY, [0, 100], ["1.5rem", "0.75rem"]);
  const width = useTransform(scrollY, [0, 100], ["100%", "90%"]);
  const maxWidth = useTransform(scrollY, [0, 100], ["1280px", "1000px"]);
  const borderRadius = useTransform(scrollY, [0, 100], ["0px", "2rem"]);
  const top = useTransform(scrollY, [0, 100], ["0px", "20px"]);

  return (
    <>
      <motion.header
        style={{ width, maxWidth, top }}
        className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-500`}
      >
      <motion.nav
        style={{ paddingTop: padding, paddingBottom: padding, borderRadius }}
        className={`${isScrolled ? "glass-strong shadow-floating border-white/60" : "bg-transparent"} relative flex items-center justify-between px-8 transition-all duration-500`}
      >
        <div onClick={() => navigate('/')} className="flex items-center gap-3 group cursor-pointer">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-md group-hover:scale-110 transition-transform duration-300 overflow-hidden">
            <img src={sistecLogo} alt="SISTec Logo" className="h-full w-full object-contain p-1" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black tracking-tight text-foreground leading-none">
              MILE<span className="text-brand-orange">.</span>
            </span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mt-1">
              Every Milestone Matters
            </span>
          </div>
        </div>

        <ul className="hidden items-center gap-2 md:flex">
          {links.map((l) => (
            <li key={l.href} onMouseEnter={() => setHoveredLink(l.label)} onMouseLeave={() => setHoveredLink(null)}>
              <a
                href={l.href}
                className="relative px-4 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="relative z-10">{l.label}</span>
                {hoveredLink === l.label && (
                  <motion.span
                    layoutId="nav-hover"
                    className="absolute inset-0 z-0 rounded-full bg-slate-100/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-6 md:flex">
          <button onClick={() => setCampusModal('login')} className="text-sm font-bold text-muted-foreground transition-colors hover:text-brand-indigo cursor-pointer">
            Sign in
          </button>
          <button
            onClick={() => setCampusModal('register')}
            className="btn-premium h-11 px-8 text-sm group flex items-center justify-center cursor-pointer"
          >
            Registration <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="glass-strong absolute inset-x-0 top-full mt-4 flex flex-col gap-5 rounded-[2rem] p-8 md:hidden shadow-floating border-white/60"
          >
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-lg font-black text-slate-600 hover:text-brand-indigo transition-colors">
                {l.label}
              </a>
            ))}
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-4">
              <button onClick={() => { setCampusModal('login'); setOpen(false); }} className="text-center font-bold text-slate-400 cursor-pointer">Sign in</button>
              <button onClick={() => { setCampusModal('register'); setOpen(false); }} className="btn-premium h-14 w-full text-base flex items-center justify-center cursor-pointer">
                Registration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.header>

      <AnimatePresence>
        {campusModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl relative"
              style={{ background: '#0f172a', zIndex: 101 }}
            >
              <button 
                onClick={() => setCampusModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Select Campus</h2>
              <p className="text-slate-400 text-center mb-8">Choose your campus to continue</p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    navigate(campusModal === 'login' ? '/login' : '/register');
                    setCampusModal(null);
                  }}
                  className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all group cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building size={24} className="text-purple-400" />
                  </div>
                  <span className="font-bold text-white">SISTec GN</span>
                </button>

                <button
                  onClick={() => {
                    window.location.href = campusModal === 'login' 
                      ? 'https://milerb.sistec.ac.in/login' 
                      : 'https://milerb.sistec.ac.in/register';
                  }}
                  className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 transition-all group cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building size={24} className="text-cyan-400" />
                  </div>
                  <span className="font-bold text-white">SISTec RB</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
