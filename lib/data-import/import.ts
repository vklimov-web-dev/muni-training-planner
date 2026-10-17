import { parseCompletions } from "./completions";
import { parseEmployees } from "./employees";
import { parseSessions } from "./sessions";
import { parseTrainings } from "./trainings";
import type { ImportIssue, ImportResult, RawSources } from "./types";

export function importSources(rawSources: RawSources): ImportResult {
  const issues: ImportIssue[] = [];
  const employees = parseEmployees(rawSources.employees, issues);
  const trainingResults = parseTrainings(rawSources.catalog, issues);
  const trainings = trainingResults.map((result) => result.training);
  const requirements = trainingResults.flatMap((result) => result.requirements);
  const trainingMap = new Map(
    trainings.map((training) => [training.code, training]),
  );
  const employeeIds = new Set(employees.map((employee) => employee.id));
  const trainingCodes = new Set(trainings.map((training) => training.code));
  const sessions = parseSessions(rawSources.sessions, trainingCodes, issues);
  const completions = parseCompletions(
    rawSources.completions,
    employeeIds,
    trainingMap,
    issues,
  );

  return {
    data: { employees, trainings, requirements, sessions, completions },
    issues,
    sourceRowCounts: {
      employees: rawSources.employees.length,
      catalog: rawSources.catalog.length,
      sessions: rawSources.sessions.length,
      completions: rawSources.completions.length,
    },
  };
}
