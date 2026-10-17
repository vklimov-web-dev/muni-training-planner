import type {
  ComplianceItem,
  PlanningResult,
  PlanningSession,
  SessionPlan,
  SessionRecommendation,
} from "./types";

type BuildSessionPlanOptions = {
  complianceItems: ComplianceItem[];
  sessions: PlanningSession[];
  asOf: Date;
};

const STATUS_PRIORITY: Record<ComplianceItem["status"], number> = {
  MISSING: 0,
  EXPIRED: 1,
  EXPIRING: 2,
  VALID: 3,
};

function compareCandidates(left: ComplianceItem, right: ComplianceItem): number {
  const priority = STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
  if (priority !== 0) {
    return priority;
  }

  const leftDeadline = left.validUntil?.getTime() ?? Number.NEGATIVE_INFINITY;
  const rightDeadline = right.validUntil?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (leftDeadline !== rightDeadline) {
    return leftDeadline - rightDeadline;
  }

  return (
    left.lastName.localeCompare(right.lastName, "cs") ||
    left.firstName.localeCompare(right.firstName, "cs") ||
    left.employeeId.localeCompare(right.employeeId)
  );
}

function toRecommendation(
  item: ComplianceItem,
  sessionDate: Date,
): SessionRecommendation {
  return {
    employeeId: item.employeeId,
    firstName: item.firstName,
    lastName: item.lastName,
    unit: item.unit,
    position: item.position,
    status: item.status,
    validUntil: item.validUntil,
    expiresBeforeSession:
      item.validUntil !== null &&
      item.validUntil.getTime() < sessionDate.getTime(),
  };
}

export function buildSessionPlan({
  complianceItems,
  sessions,
  asOf,
}: BuildSessionPlanOptions): PlanningResult {
  const plans: SessionPlan[] = sessions
    .filter(
      (session) =>
        session.status === "PLANNED" &&
        session.date.getTime() >= asOf.getTime(),
    )
    .sort(
      (left, right) =>
        left.date.getTime() - right.date.getTime() ||
        left.id.localeCompare(right.id),
    )
    .map((session) => ({
      ...session,
      availableSeats: Math.max(0, session.capacity - session.occupied),
      recommendations: [],
    }));
  const actionableItems = complianceItems
    .filter((item) => item.status !== "VALID")
    .sort(compareCandidates);
  const trainingCodes = new Set([
    ...plans.map((session) => session.trainingCode),
    ...actionableItems.map((item) => item.trainingCode),
  ]);
  const unscheduled: PlanningResult["unscheduled"] = [];

  for (const trainingCode of [...trainingCodes].sort()) {
    const trainingPlans = plans.filter(
      (session) => session.trainingCode === trainingCode,
    );
    const candidates = actionableItems.filter(
      (item) => item.trainingCode === trainingCode,
    );
    const assigned = new Set<ComplianceItem>();
    const hasSeat = (session: SessionPlan) =>
      session.recommendations.length < session.availableSeats;
    const assign = (candidate: ComplianceItem, session: SessionPlan) => {
      session.recommendations.push(toRecommendation(candidate, session.date));
      assigned.add(candidate);
    };

    // Reserve the latest suitable seat for training that can still be renewed
    // on time. This preserves earlier seats for employees already non-compliant.
    for (const candidate of candidates.filter(
      (item) => item.status === "EXPIRING",
    )) {
      let session: SessionPlan | undefined;
      for (let index = trainingPlans.length - 1; index >= 0; index -= 1) {
        const plan = trainingPlans[index];
        if (
          hasSeat(plan) &&
          candidate.validUntil !== null &&
          plan.date.getTime() <= candidate.validUntil.getTime()
        ) {
          session = plan;
          break;
        }
      }
      if (session) {
        assign(candidate, session);
      }
    }

    // Use remaining seats chronologically for current gaps and any renewal
    // whose deadline cannot be met with the available schedule.
    for (const candidate of candidates.filter((item) => !assigned.has(item))) {
      const session = trainingPlans.find(hasSeat);
      if (session) {
        assign(candidate, session);
      }
    }

    const reason =
      trainingPlans.length === 0 ? "NO_FUTURE_SESSION" : "NO_CAPACITY";
    for (const candidate of candidates.filter((item) => !assigned.has(item))) {
      unscheduled.push({ ...candidate, reason });
    }
  }

  return { sessions: plans, unscheduled };
}
