import type { QueryResponse, ProcessPlan } from "@/types";
import type { ReactNode } from "react";

type Props =
  | { type: "query"; data: QueryResponse }
  | { type: "process"; data: ProcessPlan };

const confidenceColors: Record<QueryResponse["confidence"], string> = {
  high: "bg-emerald-500/15 text-emerald-400",
  medium: "bg-amber-500/15 text-amber-400",
  low: "bg-muted text-muted-foreground",
};

export default function ResponseCard(props: Props) {
  if (props.type === "query") {
    const { answer, sources, confidence } = props.data;
    return (
      <div
        className="rounded-xl border border-border bg-card p-5 space-y-3"
        data-testid="response-card"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Answer</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColors[confidence]}`}
          >
            {confidence} confidence
          </span>
        </div>
        <div className="text-sm text-foreground leading-relaxed space-y-3">{renderAnswer(answer)}</div>
        {sources.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Sources</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {sources.map((s, i) => (
                <li
                  key={i}
                  className="text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <p className="font-medium text-foreground">{s.title}</p>
                  <p className="text-muted-foreground mt-0.5">{s.filename}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const { title, steps, requiredInputs, dependencies, validationChecklist } = props.data;
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 space-y-4"
      data-testid="response-card"
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      <Section label="Steps" items={steps} ordered />
      <Section label="Required Inputs" items={requiredInputs} />
      <Section label="Dependencies" items={dependencies} />
      <Section label="Validation Checklist" items={validationChecklist} checkbox />
    </div>
  );
}

function renderAnswer(answer: string) {
  const lines = answer.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i] ?? "";
    const line = rawLine.trim();

    if (!line) {
      i += 1;
      continue;
    }

    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      blocks.push(
        <h4 key={`h-${i}`} className="text-sm font-semibold text-foreground">
          {headingMatch[1]}
        </h4>
      );
      i += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test((lines[i] ?? "").trim())) {
        items.push((lines[i] ?? "").trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraphLines: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const nextLine = (lines[i] ?? "").trim();
      if (!nextLine || /^#{1,3}\s+/.test(nextLine) || /^[-*]\s+/.test(nextLine) || /^\d+\.\s+/.test(nextLine)) {
        break;
      }
      paragraphLines.push(nextLine);
      i += 1;
    }

    blocks.push(
      <p key={`p-${i}`} className="text-foreground/95">
        {paragraphLines.join(" ")}
      </p>
    );
  }

  if (!blocks.length) {
    return <p className="text-foreground/95">{answer}</p>;
  }

  return blocks;
}

function Section({
  label,
  items,
  ordered,
  checkbox,
}: {
  label: string;
  items: string[];
  ordered?: boolean;
  checkbox?: boolean;
}) {
  if (!items?.length) return null;
  const Tag = ordered ? "ol" : "ul";
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
        {label}
      </p>
      <Tag
        className={`text-sm text-foreground flex flex-col gap-1 ${ordered ? "list-decimal list-inside" : ""}`}
      >
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            {checkbox && (
              <input type="checkbox" className="mt-0.5 accent-accent" readOnly />
            )}
            <span>{item}</span>
          </li>
        ))}
      </Tag>
    </div>
  );
}
