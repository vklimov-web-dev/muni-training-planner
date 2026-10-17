const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CZECH_DATE = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/;
const EXCEL_SERIAL_DATE = /^\d{5}$/;

export type ParsedDate =
  | { kind: "blank" }
  | { kind: "invalid" }
  | { kind: "value"; value: Date };

function createUtcDate(year: number, month: number, day: number): Date | null {
  const value = new Date(Date.UTC(year, month - 1, day));

  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }

  return value;
}

export function parseSourceDate(rawValue: string): ParsedDate {
  const raw = rawValue.trim();

  if (!raw) {
    return { kind: "blank" };
  }

  const isoMatch = ISO_DATE.exec(raw);
  if (isoMatch) {
    const value = createUtcDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    );
    return value ? { kind: "value", value } : { kind: "invalid" };
  }

  const czechMatch = CZECH_DATE.exec(raw);
  if (czechMatch) {
    const value = createUtcDate(
      Number(czechMatch[3]),
      Number(czechMatch[2]),
      Number(czechMatch[1]),
    );
    return value ? { kind: "value", value } : { kind: "invalid" };
  }

  if (EXCEL_SERIAL_DATE.test(raw)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return {
      kind: "value",
      value: new Date(excelEpoch + Number(raw) * 86_400_000),
    };
  }

  return { kind: "invalid" };
}

export function addUtcMonths(value: Date, months: number): Date {
  const year = value.getUTCFullYear();
  const month = value.getUTCMonth();
  const day = value.getUTCDate();
  const targetMonth = month + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDay)),
  );
}

export function normalizeCourseCode(value: string): string {
  return value.trim().toUpperCase().replace(/[\s_-]+/g, "-");
}

export function normalizeMatchKey(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("cs-CZ");
}

export function parseInteger(value: string): number | null {
  const normalized = value.trim();
  return /^-?\d+$/.test(normalized) ? Number(normalized) : null;
}

export function isSameUtcDate(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime();
}
