"use client";

import { useState } from "react";

interface OrgNameDialogProps {
  open: boolean;
  title: string;
  description?: string;
  initialName?: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

function OrgNameDialogBody({
  title,
  description,
  initialName,
  confirmLabel,
  onConfirm,
  onCancel,
}: Omit<OrgNameDialogProps, "open">) {
  const [name, setName] = useState(initialName ?? "");
  const trimmed = name.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 80;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      data-testid="org-name-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="org-name-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div>
          <h2 id="org-name-dialog-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Organization name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="org-name-input"
            placeholder="e.g. Pulse Creative Agency"
            maxLength={80}
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            data-testid="org-name-cancel"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(trimmed)}
            data-testid="org-name-confirm"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {confirmLabel ?? "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrgNameDialog({ open, initialName = "", ...props }: OrgNameDialogProps) {
  if (!open) return null;
  return <OrgNameDialogBody key={initialName} initialName={initialName} {...props} />;
}
