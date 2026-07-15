import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Award, Briefcase, FolderKanban, Trophy } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register", desc: "Create your MILE identity in 30 seconds." },
  { icon: Award, title: "Upload Achievements", desc: "Certificates, POD AI marks, badges — all verified." },
  { icon: Briefcase, title: "Track Placement", desc: "Live company drives and offer pipeline." },
  { icon: FolderKanban, title: "Submit Projects", desc: "Minor + major showcase with mentor review." },
  { icon: Trophy, title: "Get Ranked", desc: "Climb the live Super 50 leaderboard." },
];

export function Workflow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.15, 0.85], ["0%", "100%"]);

  return (
    <section id="workflow" className="relative px-6 py-40">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-32 text-center"
        >
          <div className="mb-6 font-mono text-[11px] font-[900] uppercase tracking-[0.6em] text-brand-indigo">
            The Roadmap to Excellence
          </div>
          <h2 className="font-display text-5xl font-black md:text-7xl tracking-tight text-foreground leading-[0.95]">
            Five steps to <br />
            <span className="text-gradient-brand">stand out from the crowd.</span>
          </h2>
        </motion.div>

        <div ref={ref} className="relative pl-12 md:pl-0">
          {/* Main vertical spine */}
          <div className="absolute bottom-0 left-6 top-0 w-1 bg-slate-100/60 md:left-1/2 md:-translate-x-1/2 rounded-full" />
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-6 top-0 w-1 bg-gradient-to-b from-brand-indigo via-brand-purple to-brand-orange md:left-1/2 md:-translate-x-1/2 rounded-full shadow-[0_0_15px_var(--brand-indigo)]"
          />

          <div className="space-y-32">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-150px" }}
                  transition={{ duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] }}
                  className={`relative flex items-center gap-12 ${isLeft ? "" : "md:flex-row-reverse"}`}
                >
                  {/* Milestone Hub Icon */}
                  <div className="absolute -left-12 z-20 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white p-1 shadow-floating md:left-1/2 md:-translate-x-1/2">
                    <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-purple shadow-xl shadow-brand-indigo/20">
                      <Icon size={24} className="text-white" />
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`glass-strong group relative w-full rounded-[2.5rem] p-10 md:w-[calc(50%-4rem)] shadow-floating border-white/60 transition-all hover:scale-[1.02] ${isLeft ? "md:mr-auto" : "md:ml-auto"}`}>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-mono text-[11px] font-[900] uppercase tracking-[0.3em] text-brand-orange">
                        Milestone {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="h-2 w-2 rounded-full bg-brand-orange animate-pulse" />
                    </div>
                    <h3 className="font-display text-3xl font-[900] tracking-tight text-foreground leading-tight">{s.title}</h3>
                    <p className="mt-5 text-lg text-muted-foreground font-medium leading-relaxed">{s.desc}</p>
                    
                    {/* Hover detail indicator */}
                    <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo">View Requirements</span>
                    </div>
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

