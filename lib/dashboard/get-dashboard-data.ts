import "server-only";

import { buildSessionPlan } from "@/lib/compliance/recommend";
import { evaluateCompliance } from "@/lib/compliance/evaluate";
import { SNAPSHOT_DATE } from "@/lib/data-import/types";
import { getPrismaClient } from "@/lib/prisma";

export async function getDashboardData() {
  const prisma = getPrismaClient();
  const [employees, trainings, sessions] = await Promise.all([
    prisma.employee.findMany({
      where: {
        status: "ACTIVE",
        startedAt: { lte: SNAPSHOT_DATE },
        OR: [
          { endedAt: null },
          { endedAt: { gte: SNAPSHOT_DATE } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        unit: true,
        unitKey: true,
        position: true,
        positionKey: true,
        startedAt: true,
        endedAt: true,
        status: true,
        completions: {
          where: { completedAt: { lte: SNAPSHOT_DATE } },
          select: {
            trainingCode: true,
            completedAt: true,
            calculatedValidUntil: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
    }),
    prisma.training.findMany({
      where: { requirements: { some: {} } },
      select: {
        code: true,
        name: true,
        validityMonths: true,
        requirements: {
          select: { kind: true, normalizedKey: true },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.trainingSession.findMany({
      where: {
        status: "PLANNED",
        date: { gte: SNAPSHOT_DATE },
      },
      select: {
        id: true,
        trainingCode: true,
        date: true,
        timeRange: true,
        location: true,
        capacity: true,
        occupied: true,
        status: true,
        training: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
  ]);
  const compliance = evaluateCompliance({
    employees,
    trainings,
    asOf: SNAPSHOT_DATE,
  });
  const planning = buildSessionPlan({
    complianceItems: compliance.items,
    sessions: sessions.map(({ training, ...session }) => ({
      ...session,
      trainingName: training.name,
    })),
    asOf: SNAPSHOT_DATE,
  });

  return {
    asOf: SNAPSHOT_DATE,
    compliance,
    planning,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
