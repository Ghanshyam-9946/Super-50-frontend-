import { motion, useScroll, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { scrollY } = useScroll();
  useEffect(() => scrollY.on("change", (v) => setShow(v > 600)), [scrollY]);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="glass-strong fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full text-neon-cyan transition-all hover:scale-110 hover:glow-cyan"
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
