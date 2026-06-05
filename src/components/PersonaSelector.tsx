"use client";

import { ChevronDown } from "lucide-react";
import type { Persona } from "@/types";

const PERSONA_ICONS: Record<string, string> = {
  leadership: "📊",
  engineer: "⚙️",
  hr: "👥",
  compliance: "🔒",
  customer: "🤝",
  custom: "✏️",
};

interface PersonaSelectorProps {
  personas: Persona[];
  activePersonaId?: string;
  onSelect: (personaId: string) => void;
}

export default function PersonaSelector({
  personas,
  activePersonaId,
  onSelect,
}: PersonaSelectorProps) {
  if (!personas.length) return null;

  const active = personas.find((p) => p.id === activePersonaId) ?? personas[0];
  const icon = PERSONA_ICONS[active.type] ?? "✏️";

  return (
    <div className="flex items-center gap-2" data-testid="persona-selector-wrapper">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
        Respond as:
      </span>
      <div className="relative">
        <select
          value={activePersonaId ?? active.id}
          onChange={(e) => onSelect(e.target.value)}
          data-testid="persona-selector"
          className="appearance-none rounded-lg border border-border bg-background pl-3 pr-8 py-1.5 text-sm font-medium text-foreground hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {PERSONA_ICONS[p.type] ?? "✏️"} {p.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
          aria-hidden
        />
      </div>
      <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[220px]">
        {icon} {active.description}
      </span>
    </div>
  );
}
