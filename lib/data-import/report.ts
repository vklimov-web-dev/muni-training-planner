import type { ImportResult, SourceName } from "./types";

const SOURCES: SourceName[] = [
  "employees",
  "catalog",
  "sessions",
  "completions",
];

export function createImportReport(result: ImportResult) {
  const accepted: Record<SourceName, number> = {
    employees: result.data.employees.length,
    catalog: result.data.trainings.length,
    sessions: result.data.sessions.length,
    completions: result.data.completions.length,
  };

  return {
    snapshotDate: "2026-10-01",
    sources: Object.fromEntries(
      SOURCES.map((source) => {
        const rejectedRows = new Set(
          result.issues
            .filter(
              (issue) =>
                issue.source === source && issue.severity === "rejected",
            )
            .map((issue) => issue.row),
        );

        return [
          source,
          {
            rows: result.sourceRowCounts[source],
            accepted: accepted[source],
            rejectedRows: rejectedRows.size,
            warnings: result.issues.filter(
              (issue) =>
                issue.source === source && issue.severity === "warning",
            ).length,
          },
        ];
      }),
    ),
    issuesByCode: Object.fromEntries(
      [...new Set(result.issues.map((issue) => issue.code))]
        .sort()
        .map((code) => [
          code,
          {
            rejected: result.issues.filter(
              (issue) => issue.code === code && issue.severity === "rejected",
            ).length,
            warnings: result.issues.filter(
              (issue) => issue.code === code && issue.severity === "warning",
            ).length,
          },
        ]),
    ),
  };
}
