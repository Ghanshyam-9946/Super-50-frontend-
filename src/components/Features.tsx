import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import { Briefcase, Trophy, FolderKanban, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Briefcase,
    tag: "01 / Career Hub",
    title: "Placement Portal",
    desc: "End-to-end placement tracking with real-time company drives and interview schedules.",
    bullets: ["Company drives feed", "Interview calendar", "Live placement updates"],
    accent: "from-brand-indigo to-brand-purple",
    metric: { label: "Avg offer", value: "18 LPA" },
  },
  {
    icon: Trophy,
    tag: "02 / Elite Arena",
    title: "Super 50 Platform",
    desc: "Exclusive arena for the top 50. Upload certificates, track POD AI marks and battle on the live leaderboard.",
    bullets: ["Certificate vault", "POD AI marks", "Performance analytics", "Live ranking"],
    accent: "from-brand-purple to-brand-orange",
    metric: { label: "Top rank", value: "#1" },
  },
  {
    icon: FolderKanban,
    tag: "03 / Innovation",
    title: "Project Showcase",
    desc: "Submit minor and major projects, get mentor reviews and showcase your best work in a public gallery.",
    bullets: ["2 minor + 2 major", "Showcase gallery", "Mentor review", "Version history"],
    accent: "from-brand-orange to-brand-amber",
    metric: { label: "Submissions", value: "4 / 4" },
  },
];

function TiltCard({ feature, index }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 25 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 25 });

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      style={{ perspective: 1500 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group glass-strong relative h-full overflow-hidden rounded-[2.5rem] p-10 transition-all hover:shadow-card-hover border-white/60"
      >
        {/* Deep background glow */}
        <div className={`pointer-events-none absolute -inset-10 rounded-[3rem] bg-gradient-to-br ${feature.accent} opacity-0 blur-[80px] transition-opacity duration-700 group-hover:opacity-[0.08]`} />

        {/* Floating Stat Widget */}
        <motion.div
          style={{ transform: "translateZ(60px)" }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
          className="glass absolute right-8 top-8 rounded-2xl px-5 py-2.5 border-white shadow-xl shadow-black/5"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{feature.metric.label}</div>
          <div className="font-display text-lg font-black text-gradient-brand">{feature.metric.value}</div>
        </motion.div>

        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <div className="relative mb-10">
            <div className={`absolute inset-0 scale-150 blur-2xl rounded-full bg-gradient-to-br ${feature.accent} opacity-20`} />
            <div className={`relative inline-flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${feature.accent} shadow-xl shadow-brand-indigo/20`}>
              <Icon size={32} className="text-white" />
            </div>
          </div>

          <div className="mb-3 font-mono text-[12px] font-black uppercase tracking-[0.3em] text-brand-indigo/60">
            {feature.tag}
          </div>
          <h3 className="mb-5 font-display text-4xl font-[900] tracking-tight leading-none">{feature.title}</h3>
          <p className="mb-10 text-lg leading-relaxed text-muted-foreground font-medium">{feature.desc}</p>

          <div className="grid gap-4">
            {feature.bullets.map((b) => (
              <div key={b} className="flex items-center gap-4 text-sm font-bold text-muted-foreground">
                <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${feature.accent} shadow-sm`} />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center">
            <a href="#" className="group/btn flex items-center gap-3 text-sm font-black uppercase tracking-widest text-brand-indigo">
              Enter Portal 
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 transition-all group-hover/btn:bg-brand-indigo group-hover/btn:text-white group-hover/btn:translate-x-2">
                <ArrowUpRight size={16} />
              </div>
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative px-6 py-40">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 text-center"
        >
          <div className="mb-6 font-mono text-[11px] font-black uppercase tracking-[0.6em] text-brand-orange">
            The Student Command Center
          </div>
          <h2 className="font-display text-6xl font-[900] md:text-8xl tracking-tight text-foreground leading-[0.95]">
            The complete ecosystem.
            <br />
            <span className="text-gradient-brand">Tailored for success.</span>
          </h2>
        </motion.div>

        <div className="grid gap-10 md:grid-cols-3">
          {features.map((f, i) => (
            <TiltCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
