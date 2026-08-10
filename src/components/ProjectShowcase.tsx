import { motion } from "framer-motion";
import { Briefcase, Trophy, FolderKanban, ArrowUpRight } from "lucide-react";

const capabilities = [
  {
    id: 1,
    icon: Briefcase,
    badge: "18 LPA Max",
    subtitle: "PLACEMENT ENGINE",
    title: "Real-time Drives & Placements",
    desc: "Seamless company drive feeds, interview schedules, and instant application tracking.",
  },
  {
    id: 2,
    icon: Trophy,
    badge: "Top 50 Rank",
    subtitle: "SUPER 50 COHORT",
    title: "Leaderboard & Skill Tracking",
    desc: "Track POD AI scores, submit verified certificates, and rise through live campus rankings.",
  },
  {
    id: 3,
    icon: FolderKanban,
    badge: "100+ Projects",
    subtitle: "INNOVATION HUB",
    title: "Project Vault & Showcase",
    desc: "Submit major and minor projects, receive guide feedback, and publish to the campus gallery.",
  }
];

export function ProjectShowcase() {
  return (
    <section id="capabilities" className="relative px-6 py-32 bg-[#09090b] text-white overflow-hidden">
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-20 text-center">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
            Platform Capabilities
          </div>
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
            Designed for impact and<br />efficiency.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {capabilities.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative flex flex-col justify-between rounded-[1.5rem] border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors"
              >
                <div>
                  <div className="mb-12 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                      <Icon size={20} className="text-white/80" />
                    </div>
                    <div className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/70 border border-white/10">
                      {cap.badge}
                    </div>
                  </div>
                  
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                    {cap.subtitle}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold tracking-tight text-white/90">{cap.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-white/50">
                    {cap.desc}
                  </p>
                </div>

                <div className="mt-12 flex items-center text-xs font-bold text-white transition-colors group-hover:text-indigo-400 cursor-pointer">
                  Explore Details <ArrowUpRight size={14} className="ml-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
