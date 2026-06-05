import { NextResponse } from "next/server";
import { seedDemoOrgToAzure } from "@/lib/seedDemoAzure";

/**
 * Idempotently indexes the Acme demo corpus into Azure AI Search.
 * Called on client init so live Ask works for the demo org.
 */
export async function POST() {
  try {
    const result = await seedDemoOrgToAzure();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[demo-corpus/seed]", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
