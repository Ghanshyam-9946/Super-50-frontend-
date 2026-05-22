import { useEffect, useState } from "react";

export function MouseGlow() {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity"
      style={{
        background: `radial-gradient(800px circle at ${pos.x}px ${pos.y}px, oklch(0.55 0.2 270 / 0.06), transparent 70%)`,
      }}
    />
  );
}
