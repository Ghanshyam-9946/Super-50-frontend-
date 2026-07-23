import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

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
    <div ref={ref} className="font-display text-4xl font-extrabold text-white md:text-5xl tracking-tight">
      {v.toLocaleString()}{suffix}
    </div>
  );
}

export function Stats() {
  const [data, setData] = useState({
    totalStudents: 12480,
    projectsUploaded: 3214,
    placementSuccess: 94,
    activeSuper50: 50,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/students/public-stats');
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch public stats:', err);
      }
    };
    fetchStats();
  }, []);

  const statsList = [
    { value: data.totalStudents, label: "Total Registered Students", suffix: "+" },
    { value: data.projectsUploaded, label: "Projects Completed", suffix: "" },
    { value: data.placementSuccess, label: "Placement Success Rate", suffix: "%" },
    { value: data.activeSuper50, label: "Active Super 50 Cohort", suffix: "" },
  ];

  return (
    <section id="stats" className="relative px-6 py-20 bg-[#09090b]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsList.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-xl"
            >
              <Counter to={s.value} suffix={s.suffix} />
              <div className="mt-2 text-xs font-semibold text-slate-400">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
