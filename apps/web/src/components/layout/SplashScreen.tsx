"use client";

import { motion } from "framer-motion";

const SPOTLIGHTS = [
  { left: "12%", size: "42rem", delay: 0 },
  { left: "34%", size: "34rem", delay: 0.8 },
  { left: "56%", size: "44rem", delay: 0.4 },
  { left: "76%", size: "30rem", delay: 1.1 },
  { left: "88%", size: "26rem", delay: 0.2 },
  { left: "4%", size: "28rem", delay: 0.6 },
];

export function SplashScreen() {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="soraku-ca">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0"
              result="r"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 0.6 0"
              result="g"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 0.6 0"
              result="b"
            />
            <feOffset in="r" dx="-3" dy="0" result="r2" />
            <feOffset in="b" dx="3" dy="0" result="b2" />
            <feBlend in="r2" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="b2" mode="screen" />
          </filter>
        </defs>
      </svg>

      {SPOTLIGHTS.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl opacity-60"
          style={{
            left: s.left,
            top: "50%",
            width: s.size,
            height: s.size,
            transform: "translateY(-50%)",
            background:
              "conic-gradient(from 90deg at 50% 50%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60deg, rgba(255,255,255,0.12) 120deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.28) 240deg, rgba(255,255,255,0) 300deg)",
            opacity: 0,
            animation: `soraku-spotlight ${2.2 + i * 0.2}s ease ${s.delay}s infinite`,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 1, scale: 4.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
        style={{ filter: "url(#soraku-ca)" }}
      >
        <h1 className="text-6xl sm:text-7xl font-black tracking-[0.08em] text-foreground select-none">
          SORAKU
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-6 text-sm font-medium tracking-[0.35em] text-muted-foreground uppercase select-none"
      >
        Watch anime, free.
      </motion.p>
    </motion.div>
  );
}