"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Home, Pencil, Plus, Trash2 } from "lucide-react";
import OrgNameDialog from "@/components/OrgNameDialog";
import { useCorpusStore } from "@/store/corpus";

interface TopBarProps {
  orgId: string;
}

export default function TopBar({ orgId }: TopBarProps) {
  const router = useRouter();
  const orgs = useCorpusStore((s) => s.orgs);
  const switchOrg = useCorpusStore((s) => s.switchOrg);
  const createOrg = useCorpusStore((s) => s.createOrg);
  const renameOrg = useCorpusStore((s) => s.renameOrg);
  const deleteOrg = useCorpusStore((s) => s.deleteOrg);
  const activeOrg = orgs[orgId];

  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const handleSwitch = (id: string) => {
    switchOrg(id);
    router.push(`/o/${id}/dashboard`);
  };

  const handleCreate = (name: string) => {
    const id = createOrg(name);
    setCreateOpen(false);
    router.push(`/o/${id}/dashboard`);
  };

  const handleRename = (name: string) => {
    renameOrg(orgId, name);
    setRenameOpen(false);
  };

  const handleDelete = () => {
    if (!activeOrg || activeOrg.isDemo) return;
    const confirmed = window.confirm(
      `Delete "${activeOrg.name}"? This removes all documents, entities, and gaps for this organization.`
    );
    if (!confirmed) return;

    const deleted = deleteOrg(orgId);
    if (!deleted) return;

    const remaining = Object.keys(useCorpusStore.getState().orgs);
    if (remaining.length > 0) {
      router.push(`/o/${remaining[0]}/dashboard`);
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            data-testid="home-btn"
            aria-label="Home"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Home className="h-4 w-4" aria-hidden />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {activeOrg?.name ?? "Organization"}
            </h1>
            <p className="text-xs text-muted-foreground">AI-ready knowledge workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <label htmlFor="org-switcher" className="sr-only">
              Switch organization
            </label>
            <select
              id="org-switcher"
              data-testid="org-switcher"
              value={orgId}
              onChange={(e) => handleSwitch(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-card pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {Object.values(orgs).map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {activeOrg && !activeOrg.isDemo && (
            <>
              <button
                type="button"
                data-testid="rename-org-btn"
                onClick={() => setRenameOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Rename
              </button>
              <button
                type="button"
                data-testid="delete-org-btn"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-card px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </button>
            </>
          )}

          <button
            type="button"
            data-testid="create-org-btn"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Org
          </button>
        </div>
      </header>

      <OrgNameDialog
        open={createOpen}
        title="Create organization"
        description="Choose a name for your isolated knowledge workspace."
        confirmLabel="Create"
        onConfirm={handleCreate}
        onCancel={() => setCreateOpen(false)}
      />

      <OrgNameDialog
        open={renameOpen}
        title="Rename organization"
        initialName={activeOrg?.name ?? ""}
        confirmLabel="Save"
        onConfirm={handleRename}
        onCancel={() => setRenameOpen(false)}
      />
    </>
  );
}
