"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const PARTICLE_LAYOUT = [
  { x: 24, y: 28, drift: 36 },
  { x: 42, y: 34, drift: 48 },
  { x: 58, y: 22, drift: 40 },
  { x: 71, y: 38, drift: 52 },
  { x: 33, y: 48, drift: 44 },
  { x: 54, y: 54, drift: 38 },
  { x: 66, y: 46, drift: 50 },
  { x: 48, y: 30, drift: 42 },
] as const;

export function PublishSuccessParticles({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(
    () =>
      PARTICLE_LAYOUT.map((particle, index) => ({
        ...particle,
        id: index,
        color: index % 2 === 0 ? "#21D4FD" : "#7A42F4",
      })),
    [],
  );

  if (!active || reduceMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      data-testid="publish-success-particles"
    >
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute size-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: particle.color,
          }}
          initial={{ opacity: 1, scale: 1, y: 0 }}
          animate={{ opacity: 0, scale: 0, y: -particle.drift }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
