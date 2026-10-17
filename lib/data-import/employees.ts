import { normalizeMatchKey, parseSourceDate } from "./normalizers";
import { SNAPSHOT_DATE, type ImportIssue, type ImportedEmployee } from "./types";
import {
  addIssue,
  employeeSchema,
  parseEmploymentStatus,
  requiredValue,
} from "./validation";

type EmployeeCandidate = Omit<ImportedEmployee, "managerId"> & {
  email: string;
  managerEmail: string;
  row: number;
};

export function parseEmployees(
  rawRows: Record<string, string>[],
  issues: ImportIssue[],
): ImportedEmployee[] {
  const candidates: EmployeeCandidate[] = [];
  const employeeIds = new Set<string>();

  rawRows.forEach((rawRow, index) => {
    const row = index + 2;
    const parsed = employeeSchema.safeParse(rawRow);
    if (!parsed.success) {
      addIssue(issues, {
        source: "employees",
        row,
        code: "missing_required_value",
      });
      return;
    }

    const raw = parsed.data;
    const id = requiredValue(
      raw.id_zamestnance,
      "employees",
      row,
      "id_zamestnance",
      issues,
    );
    const firstName = requiredValue(
      raw.jmeno,
      "employees",
      row,
      "jmeno",
      issues,
    );
    const lastName = requiredValue(
      raw.prijmeni,
      "employees",
      row,
      "prijmeni",
      issues,
    );
    const email = requiredValue(
      raw.email,
      "employees",
      row,
      "email",
      issues,
    );
    const position = requiredValue(
      raw.pozice,
      "employees",
      row,
      "pozice",
      issues,
    );
    const startedAt = parseSourceDate(raw.datum_nastupu);
    const endedAt = parseSourceDate(raw.datum_ukonceni);
    const status = parseEmploymentStatus(raw.stav);

    if (startedAt.kind !== "value") {
      addIssue(issues, {
        source: "employees",
        row,
        code: "invalid_date",
        field: "datum_nastupu",
      });
    }
    if (endedAt.kind === "invalid") {
      addIssue(issues, {
        source: "employees",
        row,
        code: "invalid_date",
        field: "datum_ukonceni",
      });
    }
    if (!status) {
      addIssue(issues, {
        source: "employees",
        row,
        code: "invalid_status",
        field: "stav",
      });
    }
    if (id && employeeIds.has(id)) {
      addIssue(issues, {
        source: "employees",
        row,
        code: "duplicate_id",
        field: "id_zamestnance",
      });
      return;
    }
    if (
      !id ||
      !firstName ||
      !lastName ||
      !email ||
      !position ||
      startedAt.kind !== "value" ||
      endedAt.kind === "invalid" ||
      !status
    ) {
      return;
    }

    if (
      endedAt.kind === "value" &&
      endedAt.value.getTime() < startedAt.value.getTime()
    ) {
      addIssue(issues, {
        source: "employees",
        row,
        code: "inconsistent_value",
        field: "datum_ukonceni",
      });
      return;
    }

    if (startedAt.value.getTime() > SNAPSHOT_DATE.getTime()) {
      addIssue(issues, {
        source: "employees",
        row,
        code: "future_record",
        field: "datum_nastupu",
        severity: "warning",
      });
    }

    if (
      (status === "ACTIVE" && endedAt.kind === "value") ||
      (status === "ENDED" && endedAt.kind === "blank")
    ) {
      addIssue(issues, {
        source: "employees",
        row,
        code: "inconsistent_value",
        field: "stav",
        severity: "warning",
      });
    }

    employeeIds.add(id);
    const unit = raw.utvar.trim() || null;
    candidates.push({
      id,
      firstName,
      lastName,
      email: email.toLocaleLowerCase("cs-CZ"),
      managerEmail: raw.vedouci_email.trim().toLocaleLowerCase("cs-CZ"),
      unit,
      unitKey: unit ? normalizeMatchKey(unit) : null,
      position,
      positionKey: normalizeMatchKey(position),
      startedAt: startedAt.value,
      endedAt: endedAt.kind === "value" ? endedAt.value : null,
      status,
      row,
    });
  });

  const idsByEmail = new Map<string, string[]>();
  for (const candidate of candidates) {
    const ids = idsByEmail.get(candidate.email) ?? [];
    ids.push(candidate.id);
    idsByEmail.set(candidate.email, ids);
  }

  for (const candidate of candidates) {
    if ((idsByEmail.get(candidate.email)?.length ?? 0) > 1) {
      addIssue(issues, {
        source: "employees",
        row: candidate.row,
        code: "duplicate_email",
        field: "email",
        severity: "warning",
      });
    }
  }

  return candidates.map((candidate) => {
    const possibleManagers = candidate.managerEmail
      ? idsByEmail.get(candidate.managerEmail)
      : undefined;
    const managerId = possibleManagers?.length === 1 ? possibleManagers[0] : null;

    if (candidate.managerEmail && !managerId) {
      addIssue(issues, {
        source: "employees",
        row: candidate.row,
        code: "unknown_reference",
        field: "vedouci_email",
        severity: "warning",
      });
    }

    return {
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      unit: candidate.unit,
      unitKey: candidate.unitKey,
      position: candidate.position,
      positionKey: candidate.positionKey,
      startedAt: candidate.startedAt,
      endedAt: candidate.endedAt,
      status: candidate.status,
      managerId,
    };
  });
}
