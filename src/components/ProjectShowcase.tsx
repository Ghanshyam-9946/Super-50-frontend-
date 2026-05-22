import { motion } from "framer-motion";
import { useState } from "react";
import { ExternalLink, Github as GithubIcon, Folder, Star, Users } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "AI Grievance System",
    category: "Full Stack · AI",
    desc: "A municipal complaint management system using NLP for automated ward routing and priority detection.",
    tags: ["React", "FastAPI", "Python", "PostgreSQL"],
    stats: { stars: 124, contributors: 8 },
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop" 
  },
  {
    id: 2,
    title: "EcoTrack Workspace",
    category: "SaaS · Innovation",
    desc: "Unified ecosystem for tracking student sustainability projects and campus-wide carbon footprint metrics.",
    tags: ["Next.js", "Tailwind", "Supabase", "Framer"],
    stats: { stars: 89, contributors: 5 },
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Nexus Leaderboard",
    category: "Real-time · Elite",
    desc: "High-performance ranking engine with live socket updates and animated talent score visualization.",
    tags: ["TypeScript", "Node.js", "Redis", "Canvas"],
    stats: { stars: 215, contributors: 12 },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
  }
];

export function ProjectShowcase() {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="projects" className="relative px-6 py-32 bg-slate-50/30">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row"
        >
          <div className="max-w-2xl text-left">
            <div className="mb-4 font-mono text-[11px] font-black uppercase tracking-[0.4em] text-brand-indigo">
              Innovation Gallery
            </div>
            <h2 className="font-display text-5xl font-black md:text-7xl tracking-tight text-foreground">
              Showcasing the <span className="text-gradient-brand">future.</span>
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative flex flex-col h-[550px] overflow-hidden rounded-[2rem] bg-white shadow-md border border-slate-100"
            >
              <div className="relative h-1/2 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between p-8">
                <div>
                  <div className="mb-2 font-mono text-[10px] font-black uppercase tracking-wider text-brand-purple">
                    {p.category}
                  </div>
                  <h3 className="mb-3 font-display text-2xl font-black">{p.title}</h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400">{p.stats.stars}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-100 hover:bg-slate-50">
                      <GithubIcon size={16} className="text-slate-600" />
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-indigo text-white">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
