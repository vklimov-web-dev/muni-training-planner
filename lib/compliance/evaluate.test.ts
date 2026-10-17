import { evaluateCompliance } from "./evaluate";
import type {
  ComplianceEmployee,
  ComplianceTraining,
} from "./types";

const asOf = new Date(Date.UTC(2026, 9, 1));

function employee(
  overrides: Partial<ComplianceEmployee> = {},
): ComplianceEmployee {
  return {
    id: "E1",
    firstName: "Jana",
    lastName: "Nová",
    unit: "Laboratoře",
    unitKey: "laboratore",
    position: "Vedoucí",
    positionKey: "vedouci",
    startedAt: new Date(Date.UTC(2020, 0, 1)),
    endedAt: null,
    status: "ACTIVE",
    completions: [],
    ...overrides,
  };
}

function training(
  overrides: Partial<ComplianceTraining> = {},
): ComplianceTraining {
  return {
    code: "BOZP-Z",
    name: "BOZP",
    validityMonths: 24,
    requirements: [{ kind: "ALL", normalizedKey: null }],
    ...overrides,
  };
}

describe("evaluateCompliance", () => {
  it("evaluates only required training for employees active at the snapshot", () => {
    const result = evaluateCompliance({
      asOf,
      employees: [
        employee(),
        employee({ id: "E2", status: "PARENTAL_LEAVE" }),
        employee({
          id: "E3",
          startedAt: new Date(Date.UTC(2026, 9, 2)),
        }),
      ],
      trainings: [
        training(),
        training({
          code: "LAB-BEZ",
          name: "Laboratoř",
          requirements: [{ kind: "UNIT", normalizedKey: "laboratore" }],
        }),
        training({
          code: "RIDIC",
          name: "Řidiči",
          requirements: [{ kind: "POSITION", normalizedKey: "ridic" }],
        }),
        training({
          code: "ANGL",
          name: "Angličtina",
          validityMonths: null,
          requirements: [],
        }),
      ],
    });

    expect(result.items.map((item) => item.trainingCode)).toEqual([
      "BOZP-Z",
      "LAB-BEZ",
    ]);
    expect(result.summary).toMatchObject({
      employees: 1,
      employeesRequiringAction: 1,
      requirements: 2,
      byStatus: { MISSING: 2, EXPIRED: 0, EXPIRING: 0, VALID: 0 },
    });
  });

  it("uses the latest completion available at the snapshot", () => {
    const result = evaluateCompliance({
      asOf,
      trainings: [training()],
      employees: [
        employee({
          completions: [
            {
              trainingCode: "BOZP-Z",
              completedAt: new Date(Date.UTC(2024, 8, 1)),
              calculatedValidUntil: new Date(Date.UTC(2026, 8, 1)),
            },
            {
              trainingCode: "BOZP-Z",
              completedAt: new Date(Date.UTC(2026, 9, 2)),
              calculatedValidUntil: new Date(Date.UTC(2028, 9, 2)),
            },
          ],
        }),
      ],
    });

    expect(result.items[0]).toMatchObject({
      status: "EXPIRED",
      completedAt: new Date(Date.UTC(2024, 8, 1)),
      validUntil: new Date(Date.UTC(2026, 8, 1)),
      daysUntilExpiry: -30,
    });
  });

  it("treats validity end as inclusive and flags the next 90 days", () => {
    const result = evaluateCompliance({
      asOf,
      trainings: [training()],
      employees: [
        employee({
          completions: [
            {
              trainingCode: "BOZP-Z",
              completedAt: new Date(Date.UTC(2024, 9, 1)),
              calculatedValidUntil: asOf,
            },
          ],
        }),
      ],
    });

    expect(result.items[0]).toMatchObject({
      status: "EXPIRING",
      daysUntilExpiry: 0,
    });
  });

  it("keeps completed one-time training valid without an expiry", () => {
    const result = evaluateCompliance({
      asOf,
      trainings: [
        training({ code: "LEAD", validityMonths: 0 }),
      ],
      employees: [
        employee({
          completions: [
            {
              trainingCode: "LEAD",
              completedAt: new Date(Date.UTC(2020, 0, 1)),
              calculatedValidUntil: null,
            },
          ],
        }),
      ],
    });

    expect(result.items[0]).toMatchObject({
      status: "VALID",
      validUntil: null,
      daysUntilExpiry: null,
    });
  });
});
