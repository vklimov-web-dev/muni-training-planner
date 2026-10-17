import { z } from "zod";

import { normalizeMatchKey } from "./normalizers";
import type {
  EmploymentStatus,
  ImportIssue,
  SourceName,
  TrainingSessionStatus,
} from "./types";

export const employeeSchema = z.object({
  id_zamestnance: z.string(),
  jmeno: z.string(),
  prijmeni: z.string(),
  email: z.string(),
  utvar: z.string(),
  pozice: z.string(),
  vedouci_email: z.string(),
  datum_nastupu: z.string(),
  datum_ukonceni: z.string(),
  stav: z.string(),
  rodne_cislo: z.string(),
  poznamka: z.string(),
});

export const trainingSchema = z.object({
  kod: z.string(),
  nazev: z.string(),
  platnost_mesicu: z.string(),
  povinne_pro: z.string(),
  poznamka: z.string(),
});

export const sessionSchema = z.object({
  id_terminu: z.string(),
  kod_skoleni: z.string(),
  datum: z.string(),
  cas: z.string(),
  misto: z.string(),
  kapacita: z.string(),
  obsazeno: z.string(),
  cena_na_osobu: z.string(),
  stav: z.string(),
});

export const completionSchema = z.object({
  id_zaznamu: z.string(),
  id_zamestnance: z.string(),
  zamestnanec: z.string(),
  kod_skoleni: z.string(),
  datum_absolvovani: z.string(),
  platnost_do: z.string(),
  poskytovatel: z.string(),
  cena_kc: z.string(),
  poznamka: z.string(),
});

export function addIssue(
  issues: ImportIssue[],
  issue: Omit<ImportIssue, "severity"> & {
    severity?: ImportIssue["severity"];
  },
): void {
  issues.push({ severity: "rejected", ...issue });
}

export function requiredValue(
  value: string,
  source: SourceName,
  row: number,
  field: string,
  issues: ImportIssue[],
): string | null {
  const normalized = value.trim();
  if (!normalized) {
    addIssue(issues, {
      source,
      row,
      code: "missing_required_value",
      field,
    });
    return null;
  }
  return normalized;
}

export function parseEmploymentStatus(
  value: string,
): EmploymentStatus | null {
  const statuses: Record<string, EmploymentStatus> = {
    aktivni: "ACTIVE",
    rodicovska: "PARENTAL_LEAVE",
    ukoncen: "ENDED",
  };
  return statuses[normalizeMatchKey(value)] ?? null;
}

export function parseSessionStatus(
  value: string,
): TrainingSessionStatus | null {
  const statuses: Record<string, TrainingSessionStatus> = {
    planovano: "PLANNED",
    zruseno: "CANCELLED",
  };
  return statuses[normalizeMatchKey(value)] ?? null;
}
