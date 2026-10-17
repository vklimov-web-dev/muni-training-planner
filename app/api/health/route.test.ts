import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({ $queryRaw: mocks.queryRaw }),
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mocks.queryRaw.mockReset();
  });

  it("reports a reachable database without caching the response", async () => {
    mocks.queryRaw.mockResolvedValue([{ result: 1 }]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      database: "reachable",
    });
    expect(mocks.queryRaw).toHaveBeenCalledOnce();
  });

  it("returns 503 without exposing database error details", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.queryRaw.mockRejectedValue(
      new Error("password=secret host=private.example.test"),
    );

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toContain('"status":"degraded"');
    expect(body).toContain('"database":"unreachable"');
    expect(body).not.toContain("secret");
    expect(body).not.toContain("private.example.test");
    expect(consoleError).toHaveBeenCalledWith(
      "Database health check failed.",
    );
  });
});
