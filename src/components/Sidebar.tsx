"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Network,
  Plug,
  ScrollText,
  Share2,
  Upload,
} from "lucide-react";

const NAV_ITEMS = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { segment: "graph", label: "Knowledge Graph", icon: Network },
  { segment: "gaps", label: "Gaps", icon: AlertTriangle },
  { segment: "documents", label: "Documents", icon: FileText },
  { segment: "ask", label: "Ask", icon: MessageSquare },
  { segment: "upload", label: "Upload", icon: Upload },
  { segment: "instructions", label: "Instructions", icon: ScrollText },
  { segment: "integrations", label: "Integrations", icon: Plug },
  { segment: "export", label: "Export", icon: Share2 },
] as const;

interface SidebarProps {
  orgId: string;
}

export default function Sidebar({ orgId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col min-h-screen">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm">
            D
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">DOC-EYE</p>
            <p className="text-xs text-muted-foreground">Knowledge Intelligence</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 p-3" data-testid="sidebar-nav">
        {NAV_ITEMS.map(({ segment, label, icon: Icon }) => {
          const href = `/o/${orgId}/${segment}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={segment}
              href={href}
              data-testid={`nav-${segment}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent/15 text-accent border border-accent/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { NAV_ITEMS };
