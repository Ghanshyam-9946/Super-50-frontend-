import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Building, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sistecLogo from "../assets/SISTec_Logo.png";
import ParentLoginModal from "./ParentLoginModal";

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
  const [parentModalOpen, setParentModalOpen] = useState(false);

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

        <div className="hidden items-center gap-4 md:flex">
          <button
            onClick={() => setParentModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-700 hover:text-amber-800 transition-all cursor-pointer shadow-sm"
          >
            <Users size={14} className="text-amber-600" />
            <span>Parent Portal</span>
          </button>
          <button onClick={() => navigate('/login')} className="text-sm font-bold text-muted-foreground transition-colors hover:text-brand-indigo cursor-pointer">
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
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
            className="glass-strong absolute inset-x-0 top-full mt-4 flex flex-col gap-4 rounded-[2rem] p-6 md:hidden shadow-floating border-white/60"
          >
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-base font-black text-slate-600 hover:text-brand-indigo transition-colors">
                {l.label}
              </a>
            ))}
            <hr className="border-slate-100" />
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setParentModalOpen(true); setOpen(false); }}
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 py-3 text-sm font-bold text-amber-800 cursor-pointer"
              >
                <Users size={16} className="text-amber-600" />
                <span>Parent Login</span>
              </button>
              <button onClick={() => { navigate('/login'); setOpen(false); }} className="text-center font-bold text-slate-500 py-2 cursor-pointer">
                Sign in (Student / Faculty)
              </button>
              <button onClick={() => { navigate('/register'); setOpen(false); }} className="btn-premium h-12 w-full text-sm flex items-center justify-center cursor-pointer">
                Registration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.header>

      {/* Parent Login Modal */}
      <ParentLoginModal isOpen={parentModalOpen} onClose={() => setParentModalOpen(false)} />
    </>
  );
}
