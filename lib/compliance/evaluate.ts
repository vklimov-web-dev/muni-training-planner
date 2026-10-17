import {
  EXPIRING_SOON_DAYS,
  type ComplianceCompletion,
  type ComplianceEmployee,
  type ComplianceItem,
  type ComplianceResult,
  type ComplianceStatus,
  type ComplianceTraining,
} from "./types";

const MILLISECONDS_PER_DAY = 86_400_000;

type EvaluateComplianceOptions = {
  employees: ComplianceEmployee[];
  trainings: ComplianceTraining[];
  asOf: Date;
  expiringWithinDays?: number;
};

function isEmployeeInScope(
  employee: ComplianceEmployee,
  asOf: Date,
): boolean {
  return (
    employee.status === "ACTIVE" &&
    employee.startedAt.getTime() <= asOf.getTime() &&
    (employee.endedAt === null || employee.endedAt.getTime() >= asOf.getTime())
  );
}

function isRequiredFor(
  training: ComplianceTraining,
  employee: ComplianceEmployee,
): boolean {
  return training.requirements.some((requirement) => {
    if (requirement.kind === "ALL") {
      return true;
    }
    if (requirement.kind === "UNIT") {
      return (
        requirement.normalizedKey !== null &&
        requirement.normalizedKey === employee.unitKey
      );
    }

    return (
      requirement.normalizedKey !== null &&
      requirement.normalizedKey === employee.positionKey
    );
  });
}

function latestCompletion(
  employee: ComplianceEmployee,
  trainingCode: string,
  asOf: Date,
): ComplianceCompletion | null {
  return (
    employee.completions
      .filter(
        (completion) =>
          completion.trainingCode === trainingCode &&
          completion.completedAt.getTime() <= asOf.getTime(),
      )
      .sort(
        (left, right) =>
          right.completedAt.getTime() - left.completedAt.getTime(),
      )[0] ?? null
  );
}

function classifyCompletion(
  completion: ComplianceCompletion | null,
  training: ComplianceTraining,
  asOf: Date,
  expiringWithinDays: number,
): Pick<
  ComplianceItem,
  "status" | "completedAt" | "validUntil" | "daysUntilExpiry"
> {
  if (!completion) {
    return {
      status: "MISSING",
      completedAt: null,
      validUntil: null,
      daysUntilExpiry: null,
    };
  }

  if (training.validityMonths === 0) {
    return {
      status: "VALID",
      completedAt: completion.completedAt,
      validUntil: null,
      daysUntilExpiry: null,
    };
  }

  const validUntil = completion.calculatedValidUntil;
  if (!validUntil) {
    return {
      status: "MISSING",
      completedAt: completion.completedAt,
      validUntil: null,
      daysUntilExpiry: null,
    };
  }

  const daysUntilExpiry = Math.ceil(
    (validUntil.getTime() - asOf.getTime()) / MILLISECONDS_PER_DAY,
  );
  let status: ComplianceStatus = "VALID";

  if (daysUntilExpiry < 0) {
    status = "EXPIRED";
  } else if (daysUntilExpiry <= expiringWithinDays) {
    status = "EXPIRING";
  }

  return {
    status,
    completedAt: completion.completedAt,
    validUntil,
    daysUntilExpiry,
  };
}

export function evaluateCompliance({
  employees,
  trainings,
  asOf,
  expiringWithinDays = EXPIRING_SOON_DAYS,
}: EvaluateComplianceOptions): ComplianceResult {
  const employeesInScope = employees.filter((employee) =>
    isEmployeeInScope(employee, asOf),
  );
  const items = employeesInScope.flatMap((employee) =>
    trainings
      .filter((training) => isRequiredFor(training, employee))
      .map((training): ComplianceItem => {
        const completion = latestCompletion(employee, training.code, asOf);

        return {
          employeeId: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          unit: employee.unit,
          position: employee.position,
          trainingCode: training.code,
          trainingName: training.name,
          ...classifyCompletion(
            completion,
            training,
            asOf,
            expiringWithinDays,
          ),
        };
      }),
  );
  const byStatus: ComplianceResult["summary"]["byStatus"] = {
    MISSING: 0,
    EXPIRED: 0,
    EXPIRING: 0,
    VALID: 0,
  };

  for (const item of items) {
    byStatus[item.status] += 1;
  }

  return {
    items,
    summary: {
      employees: employeesInScope.length,
      employeesRequiringAction: new Set(
        items
          .filter((item) => item.status !== "VALID")
          .map((item) => item.employeeId),
      ).size,
      requirements: items.length,
      byStatus,
    },
  };
}
