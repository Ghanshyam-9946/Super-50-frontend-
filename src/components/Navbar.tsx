import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const links: { label: string; href: string }[] = [];

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

  return (
    <header className="fixed top-6 left-1/2 z-50 w-full max-w-[1100px] px-4 -translate-x-1/2">
      <nav className="flex items-center justify-between rounded-full bg-black/90 px-8 py-4 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10">
        <div onClick={() => navigate('/')} className="flex items-center gap-3 group cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center">
            <img src="/upload/SISTec_Logo.png" alt="SCOPE Logo" className="h-10 w-10" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl font-black tracking-tight text-white leading-none">
              SCOPE<span className="text-brand-orange">.</span>
            </span>
            <span className="text-xs font-bold tracking-wider text-blue-500 uppercase mt-1">
              SISTec CSE Operations & Progress Engine
            </span>
          </div>
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
            className="btn-premium h-11 px-8 text-sm group cursor-pointer flex items-center"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-premium h-11 px-8 text-sm group cursor-pointer flex items-center"
          >
            Registration
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

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
              <button onClick={() => { navigate('/login'); setOpen(false); }} className="btn-premium h-14 w-full text-base">Sign in</button>
              <button onClick={() => { navigate('/register'); setOpen(false); }} className="btn-premium h-14 w-full text-base">
                Registration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
