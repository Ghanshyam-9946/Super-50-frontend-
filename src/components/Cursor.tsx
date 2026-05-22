import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 400, damping: 30 });
  const sy = useSpring(y, { stiffness: 400, damping: 30 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const t = e.target as HTMLElement;
      setHover(!!t.closest("a, button, [data-magnetic]"));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <>
      <motion.div
        style={{ translateX: sx, translateY: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[100] -ml-1.5 -mt-1.5 hidden md:block"
      >
        <div
          className={`rounded-full transition-all duration-500 ease-out ${hover ? "bg-brand-orange" : "bg-brand-indigo"}`}
          style={{
            width: hover ? 12 : 8,
            height: hover ? 12 : 8,
            boxShadow: hover ? "0 0 20px var(--brand-orange)" : "0 0 15px var(--brand-indigo)",
          }}
        />
      </motion.div>
      <motion.div
        style={{ translateX: x, translateY: y }}
        className="pointer-events-none fixed left-0 top-0 z-[99] -ml-8 -mt-8 hidden md:block"
      >
        <motion.div
          animate={{
            scale: hover ? 2.5 : 1,
            borderColor: hover ? "rgba(249, 115, 22, 0.3)" : "rgba(99, 102, 241, 0.15)",
            backgroundColor: hover ? "rgba(249, 115, 22, 0.05)" : "transparent",
          }}
          transition={{ duration: 0.5, ease: [0.21, 0.45, 0.32, 0.9] }}
          className="h-16 w-16 rounded-full border border-brand-indigo/10 backdrop-blur-[1px]"
        />
      </motion.div>
    </>
  );
}

