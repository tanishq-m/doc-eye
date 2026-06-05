"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { ReadinessScore } from "@/types";

interface AIReadinessRadarProps {
  score: ReadinessScore;
}

const AXES = [
  { key: "completeness", label: "Completeness" },
  { key: "quality", label: "Quality" },
  { key: "connectivity", label: "Connectivity" },
  { key: "metadata", label: "Metadata" },
  { key: "overall", label: "AI Readiness" },
] as const;

export default function AIReadinessRadar({ score }: AIReadinessRadarProps) {
  const data = AXES.map(({ key, label }) => ({
    axis: label,
    value: score[key],
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 h-80" data-testid="readiness-radar">
      <h3 className="text-sm font-medium text-foreground mb-4">AI Readiness Dimensions</h3>
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="var(--accent)"
            fill="var(--accent)"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
      <ul className="sr-only" data-testid="radar-axes">
        {AXES.map((a) => (
          <li key={a.key}>{a.label}</li>
        ))}
      </ul>
    </div>
  );
}
