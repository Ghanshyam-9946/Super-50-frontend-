import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Sparkles, LogIn, Briefcase, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ParentLoginModal from "./ParentLoginModal";

const phrases = ["Monitoring Individual\nLearning\u00A0and\u00A0Excellence"];

function Typewriter() {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 2400); // Wait for loader animation (1.8s + 0.8s)
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    const current = phrases[i];
    const speed = del ? 50 : 110;
    const t = setTimeout(() => {
      if (!del && text === current) {
        setTimeout(() => setDel(true), 1400);
        return;
      }
      if (del && text === "") {
        setDel(false);
        setI((i + 1) % phrases.length);
        return;
      }
      setText(del ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [text, del, i, started]);

  return (
    <span className="text-gradient-brand drop-shadow-[0_0_20px_var(--brand-indigo)/20] whitespace-pre-line">
      {text}
      <span className="ml-0.5 inline-block h-[0.9em] w-[4px] -mb-1 animate-pulse bg-brand-indigo rounded-full" />
    </span>
  );
}

export function Hero() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24 pb-16">
      {/* Background Mesh and Blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-brand-indigo/15 blur-[120px] animate-blob" />
        <div className="absolute bottom-0 right-1/4 h-[900px] w-[900px] translate-x-1/2 rounded-full bg-brand-purple/15 blur-[140px] animate-blob" style={{ animationDelay: "-7s" }} />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-orange/15 blur-[120px] animate-blob" style={{ animationDelay: "-14s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.85)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl text-center">


        <h1 className="font-display font-[800] leading-[1.15] tracking-tight mb-8 mt-12 md:mt-16 max-w-5xl mx-auto flex flex-col gap-2 md:gap-4 px-1">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7.5rem] text-[#111827]"
          >
            Platform for
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="text-[1.65rem] sm:text-4xl md:text-[4rem] lg:text-[5rem] xl:text-[5.5rem] whitespace-nowrap min-h-[120px] sm:min-h-0"
          >
            <Typewriter />
          </motion.div>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-4 sm:mt-6 max-w-4xl text-lg sm:text-xl text-slate-500 md:text-2xl font-medium leading-relaxed px-4 sm:px-0"
        >
          Empowering the next generation of innovators. Track placements, compete in the <span className="text-slate-800 font-semibold">Super 50</span>, and showcase your professional portfolio
          <br className="hidden md:block" />
          — all in one unified workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-[320px] sm:max-w-none mx-auto"
        >
          <div data-magnetic className="w-full sm:w-auto">
            <button
              onClick={() => setParentModalOpen(true)}
              className="flex w-full sm:w-auto h-14 px-8 sm:px-10 text-base shadow-md items-center justify-center rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-bold transition-all cursor-pointer shadow-orange-500/20 active:scale-95"
            >
              <Users size={18} className="mr-2 text-white" /> Parent Login
            </button>
          </div>

          <div data-magnetic className="w-full sm:w-auto">
            <button onClick={() => navigate('/login')} className="flex w-full sm:w-auto h-14 px-8 sm:px-10 text-base shadow-sm items-center justify-center rounded-full bg-[#f1eff5]/80 hover:bg-[#e9e6ef] text-slate-700 font-semibold transition-colors border border-transparent hover:border-slate-200 cursor-pointer">
              <LogIn size={18} className="mr-2 text-slate-500" /> Student Login
            </button>
          </div>
        </motion.div>

        {/* Parent Login Modal */}
        <ParentLoginModal isOpen={parentModalOpen} onClose={() => setParentModalOpen(false)} />

        {/* Simplified Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative mx-auto mt-24 max-w-5xl px-4 md:px-8"
        >
          <div className="absolute -inset-4 md:-inset-10 rounded-[3rem] bg-gradient-to-r from-brand-indigo/10 via-brand-purple/10 to-brand-orange/10 blur-[80px] opacity-60" />

          <div className="relative rounded-[2rem] bg-white/40 p-3 shadow-2xl shadow-slate-200/50 border border-white overflow-visible">
            <div className="rounded-[1.5rem] bg-[#fcfbfa]/80 backdrop-blur-xl p-6 md:p-10">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {[
                  { title: "Placement Power", val: "94.2%", color: "brand-indigo" },
                  { title: "Elite Ranking", val: "#07", color: "brand-purple" },
                  { title: "Innovation", val: "12", color: "brand-orange" }
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    whileHover={{ y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="rounded-2xl bg-[#fffdfc] p-8 shadow-sm border border-slate-100 text-left hover:shadow-xl hover:shadow-slate-200/40 transition-shadow"
                  >
                    <div className="text-[11px] font-[800] uppercase tracking-[0.15em] text-slate-700 mb-6">{item.title}</div>
                    <div className={`font-display text-5xl md:text-6xl font-[900] text-${item.color} tracking-tight`}>
                      {item.val}
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>

          {/* Floating UI Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.5 }}
            viewport={{ once: true }}
            className="absolute -left-2 top-0 md:-left-8 md:-top-6 z-20"
          >
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-indigo to-brand-purple flex items-center justify-center shadow-inner">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <div className="text-[9px] font-[900] text-slate-500 uppercase tracking-widest mb-0.5">Global Status</div>
                <div className="font-display text-[15px] font-[900] text-slate-800 tracking-tight">Top 1% Worldwide</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 30 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.7 }}
            viewport={{ once: true }}
            className="absolute right-0 -top-16 md:-right-8 md:-top-10 z-20"
          >
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform cursor-default">
              <div className="h-10 w-10 rounded-full border border-brand-orange/30 p-0.5">
                <div className="h-full w-full rounded-full bg-brand-orange/5 flex items-center justify-center">
                  <ArrowRight size={16} className="text-brand-orange" />
                </div>
              </div>
              <div className="text-left">
                <div className="text-[9px] font-[900] text-slate-500 uppercase tracking-widest mb-0.5">Recent Milestone</div>
                <div className="font-display text-[15px] font-[900] text-brand-orange tracking-tight">Dream Offer Locked</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
