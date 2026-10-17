import {
  addUtcMonths,
  isSameUtcDate,
  normalizeCourseCode,
  parseSourceDate,
} from "./normalizers";
import {
  SNAPSHOT_DATE,
  type ImportIssue,
  type ImportedCompletion,
  type ImportedTraining,
} from "./types";
import { addIssue, completionSchema, requiredValue } from "./validation";

export function parseCompletions(
  rawRows: Record<string, string>[],
  employeeIds: Set<string>,
  trainings: Map<string, ImportedTraining>,
  issues: ImportIssue[],
): ImportedCompletion[] {
  const results: ImportedCompletion[] = [];
  const sourceIds = new Set<string>();

  rawRows.forEach((rawRow, index) => {
    const row = index + 2;
    const parsed = completionSchema.safeParse(rawRow);
    if (!parsed.success) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "missing_required_value",
      });
      return;
    }

    const raw = parsed.data;
    if (raw.id_zaznamu.trim() === "id_zaznamu") {
      addIssue(issues, {
        source: "completions",
        row,
        code: "repeated_header",
      });
      return;
    }

    const sourceId = requiredValue(
      raw.id_zaznamu,
      "completions",
      row,
      "id_zaznamu",
      issues,
    );
    const employeeId = requiredValue(
      raw.id_zamestnance,
      "completions",
      row,
      "id_zamestnance",
      issues,
    );
    const sourceCode = requiredValue(
      raw.kod_skoleni,
      "completions",
      row,
      "kod_skoleni",
      issues,
    );
    const completedAt = parseSourceDate(raw.datum_absolvovani);
    const recordedValidUntil = parseSourceDate(raw.platnost_do);

    if (completedAt.kind !== "value") {
      addIssue(issues, {
        source: "completions",
        row,
        code: "invalid_date",
        field: "datum_absolvovani",
      });
    }
    if (recordedValidUntil.kind === "invalid") {
      addIssue(issues, {
        source: "completions",
        row,
        code: "invalid_date",
        field: "platnost_do",
      });
    }

    const trainingCode = sourceCode ? normalizeCourseCode(sourceCode) : null;
    if (employeeId && !employeeIds.has(employeeId)) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "unknown_reference",
        field: "id_zamestnance",
      });
    }
    if (trainingCode && !trainings.has(trainingCode)) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "unknown_reference",
        field: "kod_skoleni",
      });
    }
    if (
      !sourceId ||
      !employeeId ||
      !employeeIds.has(employeeId) ||
      !trainingCode ||
      !trainings.has(trainingCode) ||
      completedAt.kind !== "value" ||
      recordedValidUntil.kind === "invalid"
    ) {
      return;
    }

    if (
      recordedValidUntil.kind === "value" &&
      recordedValidUntil.value.getTime() < completedAt.value.getTime()
    ) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "invalid_date",
        field: "platnost_do",
      });
      return;
    }

    if (sourceIds.has(sourceId)) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "duplicate_id",
        field: "id_zaznamu",
        severity: "warning",
      });
    }
    sourceIds.add(sourceId);

    if (sourceCode !== trainingCode) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "normalized_value",
        field: "kod_skoleni",
        severity: "warning",
      });
    }
    if (completedAt.value.getTime() > SNAPSHOT_DATE.getTime()) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "future_record",
        field: "datum_absolvovani",
        severity: "warning",
      });
    }

    const training = trainings.get(trainingCode);
    const calculatedValidUntil =
      training?.validityMonths && training.validityMonths > 0
        ? addUtcMonths(completedAt.value, training.validityMonths)
        : null;
    const recordedDate =
      recordedValidUntil.kind === "value" ? recordedValidUntil.value : null;

    if (calculatedValidUntil && !recordedDate) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "missing_expiry",
        field: "platnost_do",
        severity: "warning",
      });
    }
    if (
      (calculatedValidUntil &&
        recordedDate &&
        !isSameUtcDate(calculatedValidUntil, recordedDate)) ||
      (!calculatedValidUntil && recordedDate)
    ) {
      addIssue(issues, {
        source: "completions",
        row,
        code: "expiry_mismatch",
        field: "platnost_do",
        severity: "warning",
      });
    }

    results.push({
      sourceId,
      employeeId,
      trainingCode,
      completedAt: completedAt.value,
      recordedValidUntil: recordedDate,
      calculatedValidUntil,
    });
  });

  return results;
}
