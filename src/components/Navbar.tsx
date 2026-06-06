import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const links = [
  { label: "Features", href: "#features" },
  { label: "Leaderboard", href: "#leaderboard" },
  { label: "Workflow", href: "#workflow" },
  { label: "Stats", href: "#stats" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);

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
    <motion.header
      style={{ width, maxWidth, top }}
      className={`fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-500`}
    >
      <motion.nav
        style={{ paddingTop: padding, paddingBottom: padding, borderRadius }}
        className={`bg-white/80 glass-strong shadow-floating border-white/60 flex items-center justify-between px-8 transition-all duration-500`}
      >
        <div onClick={() => navigate('/')} className="flex items-center gap-3 group cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center">
            <img src="/upload/SISTec_Logo.png" alt="SCOPE Logo" className="h-10 w-10" />
          </div>
          <span className="font-display text-2xl font-black tracking-tight text-foreground">
            SCOPE<span className="text-brand-orange">.</span>
          </span>
        </div>

        <ul className="hidden items-center gap-2 md:flex">
          {links.map((l) => (
            <li key={l.href} onMouseEnter={() => setHoveredLink(l.label)} onMouseLeave={() => setHoveredLink(null)}>
              <a
                href={l.href}
                className="relative px-4 py-2 text-sm font-bold text-foreground transition-colors hover:text-brand-indigo"
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
          <button 
            onClick={() => navigate('/login')} 
            className="text-sm font-bold text-foreground transition-colors hover:text-brand-indigo cursor-pointer bg-transparent border-none"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-premium h-11 px-8 text-sm group cursor-pointer flex items-center"
          >
            Get Access <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
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
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-lg font-black text-black dark:text-white hover:text-brand-indigo transition-colors">
                {l.label}
              </a>
            ))}
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-4">
              <button onClick={() => { navigate('/login'); setOpen(false); }} className="text-center font-bold text-black dark:text-white bg-transparent border-none">Sign in</button>
              <button onClick={() => { navigate('/login'); setOpen(false); }} className="btn-premium h-14 w-full text-base">
                Get Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
