import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "AI Grievance Routing Engine",
    category: "NLP & Automation",
    desc: "Automated municipal complaint routing system built for real-time priority evaluation.",
    tags: ["React", "FastAPI", "Python"],
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop" 
  },
  {
    id: 2,
    title: "Campus EcoTrack Workspace",
    category: "Analytics & SaaS",
    desc: "Unified analytics dashboard for measuring student sustainability metrics and campus carbon footprint.",
    tags: ["Next.js", "Tailwind", "Supabase"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "MILE Talent Leaderboard",
    category: "Real-time Systems",
    desc: "High-performance student ranking engine with animated performance score breakdown.",
    tags: ["TypeScript", "Node.js", "Redis"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
  }
];

export function ProjectShowcase() {
  return (
    <section id="projects" className="relative px-6 py-28 bg-[#09090b]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Student Innovation
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Featured Projects
            </h2>
          </div>
          <p className="max-w-md text-sm text-slate-400">
            A curated collection of verified major & minor technical projects created by SISTec students.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl transition-all duration-300 hover:border-white/20"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent opacity-80" />
              </div>

              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                    {p.category}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-white tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex gap-2">
                    {p.tags.map(t => (
                      <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                        {t}
                      </span>
                    ))}
                  </div>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-black">
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
