import {
  normalizeCourseCode,
  normalizeMatchKey,
  parseInteger,
  parseSourceDate,
} from "./normalizers";
import type { ImportIssue, ImportedSession } from "./types";
import {
  addIssue,
  parseSessionStatus,
  requiredValue,
  sessionSchema,
} from "./validation";

export function parseSessions(
  rawRows: Record<string, string>[],
  trainingCodes: Set<string>,
  issues: ImportIssue[],
): ImportedSession[] {
  const results: ImportedSession[] = [];
  const sessionIds = new Set<string>();
  const sessionSignatures = new Set<string>();

  rawRows.forEach((rawRow, index) => {
    const row = index + 2;
    const parsed = sessionSchema.safeParse(rawRow);
    if (!parsed.success) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "missing_required_value",
      });
      return;
    }

    const raw = parsed.data;
    const id = requiredValue(
      raw.id_terminu,
      "sessions",
      row,
      "id_terminu",
      issues,
    );
    const sourceCode = requiredValue(
      raw.kod_skoleni,
      "sessions",
      row,
      "kod_skoleni",
      issues,
    );
    const timeRange = requiredValue(
      raw.cas,
      "sessions",
      row,
      "cas",
      issues,
    );
    const location = requiredValue(
      raw.misto,
      "sessions",
      row,
      "misto",
      issues,
    );
    const parsedDate = parseSourceDate(raw.datum);
    const capacity = parseInteger(raw.kapacita);
    const occupied = parseInteger(raw.obsazeno);
    const status = parseSessionStatus(raw.stav);

    if (parsedDate.kind !== "value") {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "invalid_date",
        field: "datum",
      });
    }
    if (capacity === null || capacity < 0) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "invalid_number",
        field: "kapacita",
      });
    }
    if (occupied === null || occupied < 0) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "invalid_number",
        field: "obsazeno",
      });
    }
    if (!status) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "invalid_status",
        field: "stav",
      });
    }
    if (id && sessionIds.has(id)) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "duplicate_id",
        field: "id_terminu",
      });
      return;
    }

    const trainingCode = sourceCode ? normalizeCourseCode(sourceCode) : null;
    if (trainingCode && !trainingCodes.has(trainingCode)) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "unknown_reference",
        field: "kod_skoleni",
      });
    }
    if (
      !id ||
      !trainingCode ||
      !trainingCodes.has(trainingCode) ||
      !timeRange ||
      !location ||
      parsedDate.kind !== "value" ||
      capacity === null ||
      capacity < 0 ||
      occupied === null ||
      occupied < 0 ||
      !status
    ) {
      return;
    }

    const signature = [
      trainingCode,
      parsedDate.value.toISOString(),
      normalizeMatchKey(timeRange),
      normalizeMatchKey(location),
    ].join("|");
    if (sessionSignatures.has(signature)) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "duplicate_session",
      });
      return;
    }

    if (capacity === 0) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "zero_capacity",
        field: "kapacita",
        severity: "warning",
      });
    }
    if (occupied > capacity) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "over_capacity",
        field: "obsazeno",
        severity: "warning",
      });
    }
    if (sourceCode !== trainingCode) {
      addIssue(issues, {
        source: "sessions",
        row,
        code: "normalized_value",
        field: "kod_skoleni",
        severity: "warning",
      });
    }

    sessionIds.add(id);
    sessionSignatures.add(signature);
    results.push({
      id,
      trainingCode,
      date: parsedDate.value,
      timeRange,
      location,
      capacity,
      occupied,
      status,
    });
  });

  return results;
}
