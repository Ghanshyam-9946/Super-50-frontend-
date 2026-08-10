import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

const images = [
  "/slider-images/1.png",
  "/slider-images/2.png",
  "/slider-images/3.png",
  "/slider-images/4.png"
];

// Duplicate for seamless infinite loop
const duplicatedImages = [...images, ...images];

export function DiscoverSpaces() {
  const controls = useAnimationControls();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered) {
      controls.start({
        x: ["0%", "-50%"],
        transition: {
          ease: "linear",
          duration: 35,
          repeat: Infinity,
        },
      });
    } else {
      controls.stop();
    }
  }, [controls, isHovered]);

  return (
    <section className="relative py-24 overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent dark:from-blue-900/10" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-5xl md:text-6xl font-[900] tracking-tight text-black dark:text-white mb-6">
            Journey of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Excellence</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400 font-medium">
            Glimpses of our top-performing students, intensive learning sessions, and placement drives. Witness the making of future tech leaders.
          </p>
        </motion.div>
      </div>

      {/* Slider Container */}
      <div className="relative flex overflow-hidden group">
        {/* Fading Edges */}
        <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-white dark:from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-white dark:from-[#0a0a0a] to-transparent z-20 pointer-events-none" />

        <motion.div
          animate={controls}
          className="flex gap-6 px-6"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {duplicatedImages.map((src, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03, rotate: 1 }}
              className="relative shrink-0 w-[300px] h-[400px] sm:w-[400px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing border-4 border-white/40 dark:border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img
                src={src}
                alt={`Premium space ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
