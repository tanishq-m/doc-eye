"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  suffix?: string;
  testId?: string;
}

export default function StatCard({ label, value, icon: Icon, suffix = "", testId }: StatCardProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const from = display;
    const to = value;
    if (from === to) return;

    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + (to - from) * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-accent" aria-hidden />
      </div>
      <p className="text-3xl font-semibold tabular-nums text-foreground" data-testid={testId ? `${testId}-value` : undefined}>
        {display.toLocaleString()}
        {suffix}
      </p>
    </motion.div>
  );
}
