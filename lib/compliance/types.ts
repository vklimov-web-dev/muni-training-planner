export const EXPIRING_SOON_DAYS = 90;

export type ComplianceStatus =
  | "MISSING"
  | "EXPIRED"
  | "EXPIRING"
  | "VALID";

export type ComplianceCompletion = {
  completedAt: Date;
  calculatedValidUntil: Date | null;
};

export type ComplianceEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  unit: string | null;
  unitKey: string | null;
  position: string;
  positionKey: string;
  startedAt: Date;
  endedAt: Date | null;
  status: "ACTIVE" | "PARENTAL_LEAVE" | "ENDED";
  completions: Array<
    ComplianceCompletion & {
      trainingCode: string;
    }
  >;
};

export type ComplianceTraining = {
  code: string;
  name: string;
  validityMonths: number | null;
  requirements: Array<{
    kind: "ALL" | "UNIT" | "POSITION";
    normalizedKey: string | null;
  }>;
};

export type ComplianceItem = {
  employeeId: string;
  firstName: string;
  lastName: string;
  unit: string | null;
  position: string;
  trainingCode: string;
  trainingName: string;
  status: ComplianceStatus;
  completedAt: Date | null;
  validUntil: Date | null;
  daysUntilExpiry: number | null;
};

export type ComplianceSummary = {
  employees: number;
  employeesRequiringAction: number;
  requirements: number;
  byStatus: Record<ComplianceStatus, number>;
};

export type ComplianceResult = {
  items: ComplianceItem[];
  summary: ComplianceSummary;
};

export type PlanningSession = {
  id: string;
  trainingCode: string;
  trainingName: string;
  date: Date;
  timeRange: string;
  location: string;
  capacity: number;
  occupied: number;
  status: "PLANNED" | "CANCELLED";
};

export type SessionRecommendation = Pick<
  ComplianceItem,
  | "employeeId"
  | "firstName"
  | "lastName"
  | "unit"
  | "position"
  | "status"
  | "validUntil"
> & {
  expiresBeforeSession: boolean;
};

export type SessionPlan = PlanningSession & {
  availableSeats: number;
  recommendations: SessionRecommendation[];
};

export type UnscheduledRecommendation = ComplianceItem & {
  reason: "NO_FUTURE_SESSION" | "NO_CAPACITY";
};

export type PlanningResult = {
  sessions: SessionPlan[];
  unscheduled: UnscheduledRecommendation[];
};
