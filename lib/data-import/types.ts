export const SNAPSHOT_DATE = new Date(Date.UTC(2026, 9, 1));

export type SourceName =
  | "employees"
  | "catalog"
  | "sessions"
  | "completions";

export type ImportIssue = {
  source: SourceName;
  row: number;
  severity: "warning" | "rejected";
  code:
    | "duplicate_id"
    | "duplicate_session"
    | "duplicate_email"
    | "expiry_mismatch"
    | "future_record"
    | "inconsistent_value"
    | "invalid_date"
    | "invalid_number"
    | "invalid_requirement"
    | "invalid_status"
    | "missing_expiry"
    | "missing_required_value"
    | "normalized_value"
    | "over_capacity"
    | "repeated_header"
    | "unknown_reference"
    | "zero_capacity";
  field?: string;
};

export type EmploymentStatus = "ACTIVE" | "PARENTAL_LEAVE" | "ENDED";
export type RequirementKind = "ALL" | "UNIT" | "POSITION";
export type TrainingSessionStatus = "PLANNED" | "CANCELLED";

export type ImportedEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  unit: string | null;
  unitKey: string | null;
  position: string;
  positionKey: string;
  startedAt: Date;
  endedAt: Date | null;
  status: EmploymentStatus;
  managerId: string | null;
};

export type ImportedTraining = {
  code: string;
  name: string;
  validityMonths: number | null;
};

export type ImportedRequirement = {
  trainingCode: string;
  kind: RequirementKind;
  value: string | null;
  normalizedKey: string | null;
};

export type ImportedSession = {
  id: string;
  trainingCode: string;
  date: Date;
  timeRange: string;
  location: string;
  capacity: number;
  occupied: number;
  status: TrainingSessionStatus;
};

export type ImportedCompletion = {
  sourceId: string;
  employeeId: string;
  trainingCode: string;
  completedAt: Date;
  recordedValidUntil: Date | null;
  calculatedValidUntil: Date | null;
};

export type ImportedData = {
  employees: ImportedEmployee[];
  trainings: ImportedTraining[];
  requirements: ImportedRequirement[];
  sessions: ImportedSession[];
  completions: ImportedCompletion[];
};

export type ImportResult = {
  data: ImportedData;
  issues: ImportIssue[];
  sourceRowCounts: Record<SourceName, number>;
};

export type RawSources = Record<SourceName, Record<string, string>[]>;
