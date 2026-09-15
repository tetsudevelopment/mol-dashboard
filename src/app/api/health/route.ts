import { NextResponse } from "next/server";

/**
 * Container liveness probe.
 *
 * Deliberately self-contained: it reports whether THIS Next.js server is
 * serving traffic, and never calls the MOLTECH backend. A dashboard whose
 * backend is down is degraded, not dead — failing this probe would make the
 * orchestrator restart a perfectly healthy container.
 *
 * Backend reachability is surfaced to humans on the Overview page instead.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "moltech-dashboard",
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
