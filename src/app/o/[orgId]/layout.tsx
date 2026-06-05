"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useCorpusStore } from "@/store/corpus";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orgId = params.orgId as string;
  const init = useCorpusStore((s) => s.init);
  const switchOrg = useCorpusStore((s) => s.switchOrg);
  const orgs = useCorpusStore((s) => s.orgs);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (orgId && orgs[orgId]) {
      switchOrg(orgId);
    }
  }, [orgId, orgs, switchOrg]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar orgId={orgId} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar orgId={orgId} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
