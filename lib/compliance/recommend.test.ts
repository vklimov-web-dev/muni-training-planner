import { buildSessionPlan } from "./recommend";
import type { ComplianceItem, PlanningSession } from "./types";

const asOf = new Date(Date.UTC(2026, 9, 1));

function item(
  employeeId: string,
  status: ComplianceItem["status"],
  overrides: Partial<ComplianceItem> = {},
): ComplianceItem {
  return {
    employeeId,
    firstName: `Jméno ${employeeId}`,
    lastName: `Příjmení ${employeeId}`,
    unit: "IT",
    position: "Specialista",
    trainingCode: "KYBER",
    trainingName: "Kybernetická bezpečnost",
    status,
    completedAt: null,
    validUntil: null,
    daysUntilExpiry: null,
    ...overrides,
  };
}

function session(
  id: string,
  overrides: Partial<PlanningSession> = {},
): PlanningSession {
  return {
    id,
    trainingCode: "KYBER",
    trainingName: "Kybernetická bezpečnost",
    date: new Date(Date.UTC(2026, 9, 14)),
    timeRange: "09:00-12:00",
    location: "Aula",
    capacity: 2,
    occupied: 0,
    status: "PLANNED",
    ...overrides,
  };
}

describe("buildSessionPlan", () => {
  it("fills future capacity deterministically by urgency", () => {
    const result = buildSessionPlan({
      asOf,
      complianceItems: [
        item("E3", "EXPIRING", {
          validUntil: new Date(Date.UTC(2026, 10, 1)),
        }),
        item("E2", "EXPIRED", {
          validUntil: new Date(Date.UTC(2026, 8, 1)),
        }),
        item("E1", "MISSING"),
        item("E4", "VALID"),
      ],
      sessions: [
        session("T2", {
          date: new Date(Date.UTC(2026, 9, 28)),
          capacity: 1,
        }),
        session("T1", { capacity: 2 }),
      ],
    });

    expect(
      result.sessions.flatMap((plannedSession) =>
        plannedSession.recommendations.map(
          (recommendation) => recommendation.employeeId,
        ),
      ),
    ).toEqual(["E1", "E2", "E3"]);
    expect(result.sessions[0].recommendations[1]).toMatchObject({
      employeeId: "E2",
      expiresBeforeSession: true,
    });
    expect(result.sessions[1].recommendations[0]).toMatchObject({
      employeeId: "E3",
      expiresBeforeSession: false,
    });
    expect(result.unscheduled).toEqual([]);
  });

  it("ignores past and cancelled sessions and never exceeds free seats", () => {
    const result = buildSessionPlan({
      asOf,
      complianceItems: [item("E1", "MISSING"), item("E2", "EXPIRED")],
      sessions: [
        session("PAST", { date: new Date(Date.UTC(2026, 8, 30)) }),
        session("CANCELLED", { status: "CANCELLED" }),
        session("FULL", { capacity: 5, occupied: 5 }),
      ],
    });

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]).toMatchObject({
      id: "FULL",
      availableSeats: 0,
      recommendations: [],
    });
    expect(result.unscheduled).toEqual([
      expect.objectContaining({ employeeId: "E1", reason: "NO_CAPACITY" }),
      expect.objectContaining({ employeeId: "E2", reason: "NO_CAPACITY" }),
    ]);
  });

  it("distinguishes missing terms from exhausted capacity", () => {
    const result = buildSessionPlan({
      asOf,
      complianceItems: [
        item("E1", "MISSING", {
          trainingCode: "BOZP-Z",
          trainingName: "BOZP",
        }),
      ],
      sessions: [],
    });

    expect(result.unscheduled).toEqual([
      expect.objectContaining({
        employeeId: "E1",
        reason: "NO_FUTURE_SESSION",
      }),
    ]);
  });
});
