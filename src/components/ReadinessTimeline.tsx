"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReadinessSnapshot } from "@/types";

interface ReadinessTimelineProps {
  history: ReadinessSnapshot[];
}

export default function ReadinessTimeline({ history }: ReadinessTimelineProps) {
  const data = history.map((h) => ({
    date: new Date(h.at).toLocaleDateString("en-US", { month: "short" }),
    score: h.overall,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 h-80" data-testid="readiness-timeline">
      <h3 className="text-sm font-medium text-foreground mb-4">Readiness Over Time</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--accent)"
            fill="url(#scoreGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <ul className="sr-only" data-testid="timeline-points">
        {history.map((h) => (
          <li key={h.at}>{h.overall}</li>
        ))}
      </ul>
    </div>
  );
}
