import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Sparkles, LogIn, Briefcase, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const phrases = ["Placements.", "Super 50.", "Projects.", "Everything."];

function Typewriter() {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
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
  }, [text, del, i]);

  return (
    <span className="text-gradient-brand drop-shadow-[0_0_20px_var(--brand-indigo)/20]">
      {text}
      <span className="ml-0.5 inline-block h-[0.9em] w-[4px] -mb-1 animate-pulse bg-brand-indigo rounded-full" />
    </span>
  );
}

export function Hero() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 5]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const titleWords = "One platform for".split(" ");

  return (
    <section ref={containerRef} className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24 pb-16">
      {/* Modern Grid and Vibrant Glow Background */}
      <div className="absolute inset-0 z-0 bg-white dark:bg-[#0a0a0a]">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Clean Glowing Orbs */}
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] animate-blob" />
        <div className="absolute top-1/4 right-1/4 h-[600px] w-[600px] translate-x-1/2 rounded-full bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] animate-blob" style={{ animationDelay: "-4s" }} />
        <div className="absolute -bottom-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-pink-500/20 dark:bg-pink-600/20 blur-[120px] animate-blob" style={{ animationDelay: "-8s" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full glass px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground shadow-lg border-white/40"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-orange opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-orange shadow-[0_0_10px_var(--brand-orange)]" />
          </span>
          v2.0 — The Student Innovation Ecosystem
        </motion.div>

        <h1 className="font-display text-6xl font-[900] leading-[1] tracking-tight text-foreground md:text-8xl lg:text-9xl mb-6">
          <div className="flex flex-wrap justify-center gap-x-[0.2em]">
            {titleWords.map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.21, 0.45, 0.32, 0.9] }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <Typewriter />
          </motion.div>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground/80 md:text-2xl font-medium leading-relaxed"
        >
          Empowering the next generation of innovators. Track placements, compete in the
          <span className="text-foreground"> Super 50</span>, and showcase your professional portfolio — all in one unified workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 flex items-center justify-center"
        >
          <a href="#features" className="btn-premium h-14 px-10 text-base group shadow-[0_0_20px_var(--brand-indigo)/20]">
            <Sparkles size={18} className="mr-2 transition-transform group-hover:rotate-12" />
            Explore Ecosystem
            <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>

        {/* Enhanced Layered Dashboard Preview */}
        <motion.div
          style={{ y: y1, rotateX: rotate, opacity }}
          className="relative mx-auto mt-24 max-w-6xl"
        >
          <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-r from-brand-indigo/20 via-brand-purple/20 to-brand-orange/20 blur-[100px] opacity-50" />

          <div className="glass-strong relative rounded-[2.5rem] p-3 shadow-[0_50px_100px_-20px_oklch(0_0_0/0.15)] border border-white/60 overflow-hidden group">
            <div className="rounded-[2rem] bg-white/60 backdrop-blur-xl p-8 transition-colors group-hover:bg-white/80">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                    <span className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                    <span className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { title: "Placement Power", val: "94.2%", color: "brand-indigo" },
                  { title: "Elite Ranking", val: "#07", color: "brand-purple" },
                  { title: "Innovation", val: "12", color: "brand-orange" }
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 6 + idx, repeat: Infinity, ease: "easeInOut", delay: idx * 0.7 }}
                    className="rounded-[2rem] bg-white/80 p-7 shadow-xl shadow-slate-200/50 border border-white text-left group/card hover:bg-white transition-all hover:scale-[1.02]"
                  >
                    <div className="text-[12px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-6">{item.title}</div>
                    <div className={`font-display text-4xl font-[900] text-${item.color} tracking-tight`}>
                      {item.val}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Parallax Floating UI Elements */}
          <motion.div
            style={{ y: y2 }}
            className="absolute -left-16 top-1/3 hidden md:block z-20"
          >
            <div className="glass rounded-[1.5rem] p-5 shadow-floating border-white/60 animate-float">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-purple flex items-center justify-center shadow-xl shadow-brand-indigo/20">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Global Status</div>
                  <div className="font-display text-base font-black text-foreground">Top 1% Worldwide</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{ y: y2 }}
            className="absolute -right-12 bottom-1/4 hidden md:block z-20"
          >
            <div className="glass rounded-[1.5rem] p-5 shadow-floating border-white/60 animate-float" style={{ animationDelay: "-3s" }}>
              <div className="flex items-center gap-4 text-left">
                <div className="h-12 w-12 rounded-full border-2 border-brand-orange/30 p-1">
                  <div className="h-full w-full rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <ArrowRight size={22} className="text-brand-orange" />
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Recent Milestone</div>
                  <div className="font-display text-base font-black text-brand-orange">Dream Offer Locked</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
