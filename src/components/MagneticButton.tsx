import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, ReactNode, MouseEvent } from "react";

interface Props {
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  href?: string;
}

export function MagneticButton({ children, variant = "primary", className = "", href = "#" }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });

  const handleMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;
    x.set((e.clientX - centerX) * 0.4);
    y.set((e.clientY - centerY) * 0.4);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const styleClass = variant === "primary" ? "btn-premium" : "btn-ghost";

  return (
    <motion.a
      ref={ref}
      href={href}
      data-magnetic
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.95 }}
      className={`group relative inline-flex items-center justify-center gap-3 px-10 py-4 shadow-elevated ${styleClass} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-3 leading-none">{children}</span>
    </motion.a>
  );
}

