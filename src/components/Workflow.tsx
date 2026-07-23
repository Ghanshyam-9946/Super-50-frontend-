import { motion } from "framer-motion";
import { UserPlus, Award, Briefcase, FolderKanban, Trophy } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register Account", desc: "Create your verified student profile." },
  { icon: Award, title: "Upload Achievements", desc: "Add certificates and view verified scores." },
  { icon: Briefcase, title: "Track Placement Drives", desc: "Access company drives and interview schedules." },
  { icon: FolderKanban, title: "Project Portfolio", desc: "Submit major and minor technical projects." },
  { icon: Trophy, title: "Leaderboard Ranking", desc: "Earn points and climb campus rankings." },
];

export function Workflow() {
  return (
    <section id="workflow" className="relative px-6 py-28 bg-[#09090b]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-20 text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Student Journey
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Simple 5-step roadmap
          </h2>
        </div>

        <div className="relative">
          <div className="grid gap-4 md:grid-cols-5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                      0{i + 1}
                    </span>
                    <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-indigo-400">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-white tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

