import { motion } from "framer-motion";
import { Briefcase, Trophy, FolderKanban, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Briefcase,
    tag: "Placement Engine",
    title: "Real-time Drives & Placements",
    desc: "Seamless company drive feeds, interview schedules, and instant application tracking.",
    accent: "from-indigo-500 to-purple-500",
    metric: "18 LPA Max",
    link: "/login"
  },
  {
    icon: Trophy,
    tag: "Super 50 Cohort",
    title: "Leaderboard & Skill Tracking",
    desc: "Track POD AI scores, submit verified certificates, and rise through live campus rankings.",
    accent: "from-purple-500 to-amber-500",
    metric: "Top 50 Rank",
    link: "/login"
  },
  {
    icon: FolderKanban,
    tag: "Innovation Hub",
    title: "Project Vault & Showcase",
    desc: "Submit major and minor projects, receive guide feedback, and publish to the campus gallery.",
    accent: "from-amber-500 to-rose-500",
    metric: "100+ Projects",
    link: "/login"
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-6 py-28 bg-[#09090b]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Platform Capabilities
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Designed for impact and efficiency.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
                      <Icon size={22} />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
                      {f.metric}
                    </span>
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {f.tag}
                  </span>
                  <h3 className="mt-2 text-2xl font-bold text-white tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <Link to={f.link} className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                    Explore Details
                    <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
