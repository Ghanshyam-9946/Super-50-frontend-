import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function Loader() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
        >
          {/* Ambient background glow */}
          <div className="absolute h-[600px] w-[600px] rounded-full bg-brand-indigo/5 blur-[120px] animate-pulse" />
          
          <div className="relative flex flex-col items-center gap-10">
            <div className="relative h-28 w-28">
              <motion.div
                className="absolute inset-0 rounded-[2.5rem] border-[3px] border-slate-100 border-t-brand-indigo shadow-xl shadow-brand-indigo/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-4 rounded-[1.8rem] border-[3px] border-slate-100 border-b-brand-orange shadow-lg shadow-brand-orange/10"
                animate={{ rotate: -360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="font-display text-4xl font-[900] text-gradient-brand"
                >
                  X
                </motion.span>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="font-mono text-[11px] font-black tracking-[0.8em] text-brand-indigo uppercase pl-[0.8em]"
              >
                CampusX Nexus
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="text-[10px] font-bold text-slate-300 uppercase tracking-widest"
              >
                Syncing innovation node...
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
