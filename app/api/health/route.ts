import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: "ok", database: "reachable" },
      { headers: NO_STORE_HEADERS },
    );
  } catch {
    console.error("Database health check failed.");

    return NextResponse.json(
      { status: "degraded", database: "unreachable" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
