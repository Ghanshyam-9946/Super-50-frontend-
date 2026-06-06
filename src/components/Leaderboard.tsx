import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface Rank {
  rank: number;
  name: string;
  college: string;
  score: number;
  avatar: string;
  trend: string;
}



function Counter({ to }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);

  return <span ref={ref}>{v}</span>;
}

export function Leaderboard() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  useEffect(() => {
    const fetchRanks = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Network response was not ok');
        const data: Rank[] = await res.json();
        setRanks(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };
    // Initial load
    fetchRanks();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRanks, 30000);
    return () => clearInterval(interval);
  }, []);

  // Determine the max score for the progress bars (fallback to 1 to avoid division by zero)
  const max = ranks.length ? Math.max(...ranks.map((r) => r.score)) : 1;

  // max is now computed above
  return (
    <section id="leaderboard" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <div className="mb-4 font-mono text-[11px] font-black uppercase tracking-[0.5em] text-brand-purple">
            Ecosystem Rankings
          </div>
          <h2 className="font-display text-5xl font-black md:text-7xl tracking-tight text-foreground">
            The leaderboard <span className="text-gradient-brand">never sleeps.</span>
          </h2>
        </motion.div>

        <div className="glass-strong relative overflow-hidden rounded-[2rem] shadow-lg border-white/60">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="font-mono text-[10px] font-black uppercase tracking-widest text-black dark:text-slate-400">
              Elite Performers
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-brand-orange">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />
              REAL-TIME
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {ranks.map((r, i) => (
              <div
                key={r.rank}
                className="group relative flex items-center gap-6 px-6 py-5 transition-colors hover:bg-white/60 cursor-pointer"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-black ${
                  r.rank === 1 ? "bg-gradient-to-br from-brand-indigo to-brand-purple text-white shadow-md"
                  : r.rank === 2 ? "bg-slate-800 text-white"
                  : r.rank === 3 ? "bg-slate-100 text-black dark:text-slate-300"
                  : "bg-transparent text-black dark:text-slate-400"
                }`}>
                  {r.rank}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-black text-foreground">{r.name}</div>
                  <div className="text-[10px] font-bold text-black dark:text-slate-400 uppercase tracking-tighter">{r.college}</div>
                </div>

                <div className="hidden flex-1 sm:block px-8">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-50">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(r.score / max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-purple"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display text-xl font-black text-foreground">
                    <Counter to={r.score} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
