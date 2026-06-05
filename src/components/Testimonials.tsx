import { motion } from "framer-motion";

const items = [
  { name: "Aarav K.", role: "Placed at Microsoft", quote: "SCOPE turned my placement prep into a structured journey. The interview calendar alone is worth it." },
  { name: "Diya S.", role: "Super 50 · Rank #3", quote: "Watching my rank climb in real time is addictive. It pushed me harder than any class ever did." },
  { name: "Kabir N.", role: "CSE · Final Year", quote: "Mentor reviews on my major project landed me a research collab. Game changing." },
  { name: "Meera R.", role: "Placed at Atlassian", quote: "One link to share with recruiters. My projects, certificates, rank — everything in one beautiful page." },
  { name: "Vikram T.", role: "Super 50 · Rank #1", quote: "The leaderboard is the most honest mirror I've ever had. It tells me exactly where I stand." },
  { name: "Ishita P.", role: "ECE · 3rd Year", quote: "I uploaded my POD AI marks once and forgot. Analytics did the rest. So clean." },
];

function Card({ t }: { t: typeof items[number] }) {
  return (
    <div className="glass-strong mx-6 w-[420px] shrink-0 rounded-[2.5rem] p-10 border-white/60 shadow-floating transition-all hover:scale-[1.02] hover:bg-white/80">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange/10 font-display text-4xl font-black text-brand-orange">
        "
      </div>
      <p className="text-lg leading-relaxed text-slate-500 font-medium italic">
        {t.quote}
      </p>
      <div className="mt-10 flex items-center gap-5">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-purple p-0.5 shadow-xl shadow-brand-indigo/20">
          <div className="h-full w-full rounded-[0.9rem] bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black">
            {t.name[0]}
          </div>
        </div>
        <div>
          <div className="text-lg font-[900] text-foreground leading-tight">{t.name}</div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const doubled = [...items, ...items, ...items];
  return (
    <section className="relative overflow-hidden py-40">
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-24 max-w-4xl text-center"
        >
          <div className="mb-6 font-mono text-[11px] font-[900] uppercase tracking-[0.6em] text-brand-purple">
            Voice of the Ecosystem
          </div>
          <h2 className="font-display text-6xl font-black md:text-8xl tracking-tight text-foreground leading-none">
            Loved by <span className="text-gradient-brand">12,000+ students.</span>
          </h2>
        </motion.div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-64 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-64 bg-gradient-to-l from-background via-background/80 to-transparent" />
        
        <div className="flex w-max animate-scroll-x hover:[animation-play-state:paused] py-12">
          {doubled.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}


