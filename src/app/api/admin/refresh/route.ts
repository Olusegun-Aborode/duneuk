import { NextRequest, NextResponse } from "next/server";
import { executeDuneQuery } from "@/lib/dune";
import { QUERY_IDS, EURO_QUERY_IDS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // up to 5 min for Vercel serverless (Pro plan)

// Token-protected admin route to re-execute Dune queries.
// Hit by Vercel cron and on demand (`?token=...` or `Authorization: Bearer ...`).
function authorised(req: NextRequest): boolean {
  const expected = process.env.ADMIN_REFRESH_TOKEN;
  if (!expected) return false;
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("token");
  const fromHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cronHeader = req.headers.get("x-vercel-cron");
  return !!cronHeader || fromQuery === expected || fromHeader === expected;
}

async function refreshOne(label: string, queryId: number) {
  const t0 = Date.now();
  try {
    const result = await executeDuneQuery(queryId);
    return {
      label,
      queryId,
      ok: true,
      ms: Date.now() - t0,
      rows: result.data.length,
      lastUpdated: result.lastUpdated,
    };
  } catch (err) {
    return {
      label,
      queryId,
      ok: false,
      ms: Date.now() - t0,
      error: (err as Error).message,
    };
  }
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const url = new URL(req.url);
  const only = url.searchParams.get("only"); // "gbp" | "eur"
  const queries: { label: string; queryId: number }[] = [];
  if (only !== "eur") {
    for (const [label, qid] of Object.entries(QUERY_IDS)) {
      queries.push({ label: `gbp.${label}`, queryId: qid });
    }
  }
  if (only !== "gbp") {
    for (const [label, qid] of Object.entries(EURO_QUERY_IDS)) {
      queries.push({ label: `eur.${label}`, queryId: qid });
    }
  }

  // Run sequentially — Dune plans cap concurrent executions at 1 on most tiers
  // and running in parallel triggers "Too many requests". executeQuery already
  // polls until completion, so the next iteration only starts when Dune is free.
  const results: Awaited<ReturnType<typeof refreshOne>>[] = [];
  for (const { label, queryId } of queries) {
    results.push(await refreshOne(label, queryId));
  }

  const succeeded = results.filter((r) => r.ok).length;
  return NextResponse.json({
    succeeded,
    failed: results.length - succeeded,
    total: results.length,
    results,
  });
}
