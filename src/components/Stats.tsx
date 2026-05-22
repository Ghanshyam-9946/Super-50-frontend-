import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 12480, label: "Total Students", suffix: "+" },
  { value: 3214, label: "Projects Uploaded", suffix: "" },
  { value: 94, label: "Placement Success", suffix: "%" },
  { value: 50, label: "Active Super 50", suffix: "" },
];

function Counter({ to, suffix }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1500;
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to]);
  return (
    <div ref={ref} className="font-display text-4xl font-black text-gradient-brand md:text-6xl tracking-tighter">
      {v.toLocaleString()}{suffix}
    </div>
  );
}

export function Stats() {
  return (
    <section id="stats" className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="glass-strong relative flex flex-col items-center justify-center rounded-[2rem] p-10 text-center border-white/60 shadow-lg transition-transform hover:scale-[1.02]"
            >
              <div className="relative z-10">
                <Counter to={s.value} suffix={s.suffix} />
                <div className="mt-2 font-mono text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
