import {
  normalizeCourseCode,
  normalizeMatchKey,
  parseInteger,
} from "./normalizers";
import type {
  ImportIssue,
  ImportedRequirement,
  ImportedTraining,
  RequirementKind,
} from "./types";
import { addIssue, requiredValue, trainingSchema } from "./validation";

export type TrainingWithRequirements = {
  training: ImportedTraining;
  requirements: ImportedRequirement[];
};

function parseValidityMonths(
  rawValue: string,
  row: number,
  issues: ImportIssue[],
): number | null | undefined {
  const raw = rawValue.trim();
  if (!raw) {
    return null;
  }

  const numeric = parseInteger(raw);
  if (numeric !== null && numeric >= 0) {
    return numeric;
  }

  const years = /^(\d+)\s*(?:rok|roky|let)$/i.exec(raw);
  if (years) {
    addIssue(issues, {
      source: "catalog",
      row,
      code: "normalized_value",
      field: "platnost_mesicu",
      severity: "warning",
    });
    return Number(years[1]) * 12;
  }

  addIssue(issues, {
    source: "catalog",
    row,
    code: "invalid_number",
    field: "platnost_mesicu",
  });
  return undefined;
}

function parseRequirements(
  rawValue: string,
  trainingCode: string,
  row: number,
  issues: ImportIssue[],
): ImportedRequirement[] | null {
  const raw = rawValue.trim();
  if (raw === "VSICHNI") {
    return [
      {
        trainingCode,
        kind: "ALL",
        value: null,
        normalizedKey: null,
      },
    ];
  }
  if (raw === "NEPOVINNE") {
    return [];
  }

  const separatorIndex = raw.indexOf(":");
  const prefix = raw.slice(0, separatorIndex);
  const values = raw
    .slice(separatorIndex + 1)
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  const kinds: Record<string, RequirementKind> = {
    UTVAR: "UNIT",
    POZICE: "POSITION",
  };
  const kind = kinds[prefix];

  if (separatorIndex < 0 || !kind || values.length === 0) {
    addIssue(issues, {
      source: "catalog",
      row,
      code: "invalid_requirement",
      field: "povinne_pro",
    });
    return null;
  }

  return values.map((value) => ({
    trainingCode,
    kind,
    value,
    normalizedKey: normalizeMatchKey(value),
  }));
}

export function parseTrainings(
  rawRows: Record<string, string>[],
  issues: ImportIssue[],
): TrainingWithRequirements[] {
  const results: TrainingWithRequirements[] = [];
  const trainingCodes = new Set<string>();

  rawRows.forEach((rawRow, index) => {
    const row = index + 2;
    const parsed = trainingSchema.safeParse(rawRow);
    if (!parsed.success) {
      addIssue(issues, {
        source: "catalog",
        row,
        code: "missing_required_value",
      });
      return;
    }

    const raw = parsed.data;
    const sourceCode = requiredValue(
      raw.kod,
      "catalog",
      row,
      "kod",
      issues,
    );
    const name = requiredValue(
      raw.nazev,
      "catalog",
      row,
      "nazev",
      issues,
    );
    const requirementValue = requiredValue(
      raw.povinne_pro,
      "catalog",
      row,
      "povinne_pro",
      issues,
    );
    if (!sourceCode || !name || !requirementValue) {
      return;
    }

    const code = normalizeCourseCode(sourceCode);
    const validityMonths = parseValidityMonths(
      raw.platnost_mesicu,
      row,
      issues,
    );
    const requirements = parseRequirements(
      requirementValue,
      code,
      row,
      issues,
    );

    if (validityMonths === undefined || !requirements) {
      return;
    }
    if (trainingCodes.has(code)) {
      addIssue(issues, {
        source: "catalog",
        row,
        code: "duplicate_id",
        field: "kod",
      });
      return;
    }
    if (requirements.length > 0 && validityMonths === null) {
      addIssue(issues, {
        source: "catalog",
        row,
        code: "missing_required_value",
        field: "platnost_mesicu",
      });
      return;
    }

    trainingCodes.add(code);
    results.push({
      training: { code, name, validityMonths },
      requirements,
    });
  });

  return results;
}
