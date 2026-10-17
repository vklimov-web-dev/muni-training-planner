"use client";

import { useMemo, useState } from "react";

import type {
  ComplianceStatus,
  ComplianceSummary,
} from "@/lib/compliance/types";

type DashboardItem = {
  employeeId: string;
  firstName: string;
  lastName: string;
  unit: string | null;
  position: string;
  trainingCode: string;
  trainingName: string;
  status: ComplianceStatus;
  completedAt: string | null;
  validUntil: string | null;
  daysUntilExpiry: number | null;
};

type DashboardRecommendation = {
  employeeId: string;
  firstName: string;
  lastName: string;
  unit: string | null;
  position: string;
  status: ComplianceStatus;
  validUntil: string | null;
  expiresBeforeSession: boolean;
};

type DashboardSession = {
  id: string;
  trainingCode: string;
  trainingName: string;
  date: string;
  timeRange: string;
  location: string;
  capacity: number;
  occupied: number;
  availableSeats: number;
  recommendations: DashboardRecommendation[];
};

type DashboardUnscheduled = DashboardItem & {
  reason: "NO_FUTURE_SESSION" | "NO_CAPACITY";
};

export type DashboardViewModel = {
  asOf: string;
  summary: ComplianceSummary;
  items: DashboardItem[];
  sessions: DashboardSession[];
  unscheduled: DashboardUnscheduled[];
};

type StatusFilter = "ACTION" | "ALL" | ComplianceStatus;
type SessionFilter =
  | "ALL"
  | "RECOMMENDED"
  | "LATE"
  | "AVAILABLE"
  | "FULL"
  | "OVER_CAPACITY";

const STATUS_LABELS: Record<ComplianceStatus, string> = {
  MISSING: "Chybí",
  EXPIRED: "Propadlé",
  EXPIRING: "Končí brzy",
  VALID: "Platné",
};

const STATUS_STYLES: Record<ComplianceStatus, string> = {
  MISSING: "border-violet-200 bg-violet-50 text-violet-800",
  EXPIRED: "border-red-200 bg-red-50 text-red-800",
  EXPIRING: "border-amber-200 bg-amber-50 text-amber-900",
  VALID: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const STATUS_PRIORITY: Record<ComplianceStatus, number> = {
  MISSING: 0,
  EXPIRED: 1,
  EXPIRING: 2,
  VALID: 3,
};

const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function formatAvailableSeats(count: number): string {
  if (count === 1) {
    return "1 volné";
  }

  if (count >= 2 && count <= 4) {
    return `${count} volná`;
  }

  return `${count} volných`;
}

function normalizeText(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .replace(/\s+/g, " ");
}

function StatusBadge({ status }: { status: ComplianceStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "neutral" | "danger" | "warning";
}) {
  const toneStyles = {
    neutral: "border-slate-200 bg-white",
    danger: "border-red-200 bg-red-50/60",
    warning: "border-amber-200 bg-amber-50/70",
  };

  return (
    <div className={`rounded-2xl border p-5 ${toneStyles[tone]}`}>
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value.toLocaleString("cs-CZ")}
      </dd>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function matchesSearch(item: DashboardItem, normalizedSearch: string): boolean {
  if (!normalizedSearch) {
    return true;
  }

  const searchableText = normalizeText(
    [
      item.firstName,
      item.lastName,
      item.employeeId,
      item.unit ?? "",
      item.position,
      item.trainingCode,
      item.trainingName,
    ].join(" "),
  );

  return searchableText.includes(normalizedSearch);
}

export function Dashboard({ data }: { data: DashboardViewModel }) {
  const [status, setStatus] = useState<StatusFilter>("ACTION");
  const [training, setTraining] = useState("ALL");
  const [unit, setUnit] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sessionTraining, setSessionTraining] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>("ALL");
  const [sessionSearch, setSessionSearch] = useState("");
  const trainingOptions = useMemo(
    () =>
      [
        ...new Map(
          data.items.map((item) => [
            item.trainingCode,
            { code: item.trainingCode, name: item.trainingName },
          ]),
        ).values(),
      ].sort((left, right) => left.name.localeCompare(right.name, "cs")),
    [data.items],
  );
  const unitOptions = useMemo(() => {
    const variantsByKey = new Map<string, Map<string, number>>();

    for (const item of data.items) {
      if (!item.unit) {
        continue;
      }

      const key = normalizeText(item.unit);
      const variants = variantsByKey.get(key) ?? new Map<string, number>();
      variants.set(item.unit, (variants.get(item.unit) ?? 0) + 1);
      variantsByKey.set(key, variants);
    }

    return [...variantsByKey.entries()]
      .map(([value, variants]) => ({
        value,
        label: [...variants.entries()].sort(
          ([leftLabel, leftCount], [rightLabel, rightCount]) =>
            rightCount - leftCount || leftLabel.localeCompare(rightLabel, "cs"),
        )[0][0],
      }))
      .sort((left, right) => left.label.localeCompare(right.label, "cs"));
  }, [data.items]);
  const sessionTrainingOptions = useMemo(
    () =>
      [
        ...new Map(
          data.sessions.map((session) => [
            session.trainingCode,
            { code: session.trainingCode, name: session.trainingName },
          ]),
        ).values(),
      ].sort((left, right) => left.name.localeCompare(right.name, "cs")),
    [data.sessions],
  );
  const visibleItems = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return data.items
      .filter((item) => {
        const matchesStatus =
          status === "ALL" ||
          (status === "ACTION"
            ? item.status !== "VALID"
            : item.status === status);
        const matchesTraining =
          training === "ALL" || item.trainingCode === training;
        const matchesUnit =
          unit === "ALL" ||
          (unit === "NONE"
            ? item.unit === null
            : normalizeText(item.unit ?? "") === unit);

        return (
          matchesStatus &&
          matchesTraining &&
          matchesUnit &&
          matchesSearch(item, normalizedSearch)
        );
      })
      .sort(
        (left, right) =>
          STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status] ||
          (left.validUntil ?? "").localeCompare(right.validUntil ?? "") ||
          left.lastName.localeCompare(right.lastName, "cs") ||
          left.firstName.localeCompare(right.firstName, "cs"),
      );
  }, [data.items, search, status, training, unit]);
  const visibleSessions = useMemo(() => {
    const normalizedSearch = normalizeText(sessionSearch);

    return data.sessions.filter((session) => {
      const overCapacity = session.occupied > session.capacity;
      const hasRecommendations = session.recommendations.length > 0;
      const hasLateRecommendations = session.recommendations.some(
        (recommendation) => recommendation.expiresBeforeSession,
      );
      const matchesFilter =
        sessionFilter === "ALL" ||
        (sessionFilter === "RECOMMENDED" && hasRecommendations) ||
        (sessionFilter === "LATE" && hasLateRecommendations) ||
        (sessionFilter === "AVAILABLE" && session.availableSeats > 0) ||
        (sessionFilter === "FULL" && session.occupied >= session.capacity) ||
        (sessionFilter === "OVER_CAPACITY" && overCapacity);
      const searchableText = normalizeText(
        [
          session.trainingCode,
          session.trainingName,
          session.location,
          session.timeRange,
          formatDate(session.date),
        ].join(" "),
      );

      return (
        (sessionTraining === "ALL" ||
          session.trainingCode === sessionTraining) &&
        matchesFilter &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [data.sessions, sessionFilter, sessionSearch, sessionTraining]);
  const expiringAfterDeadline = data.sessions.reduce(
    (count, session) =>
      count +
      session.recommendations.filter(
        (recommendation) =>
          recommendation.status === "EXPIRING" &&
          recommendation.expiresBeforeSession,
      ).length,
    0,
  );
  const hasFilters =
    status !== "ACTION" ||
    training !== "ALL" ||
    unit !== "ALL" ||
    search.length > 0;
  const hasSessionFilters =
    sessionTraining !== "ALL" ||
    sessionFilter !== "ALL" ||
    sessionSearch.length > 0;

  function resetFilters() {
    setStatus("ACTION");
    setTraining("ALL");
    setUnit("ALL");
    setSearch("");
  }

  function resetSessionFilters() {
    setSessionTraining("ALL");
    setSessionFilter("ALL");
    setSessionSearch("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="border-b border-slate-200 pb-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">
                Vzorová instituce
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Přehled povinných školení
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Co je potřeba řešit, komu končí platnost a koho přihlásit na
                dostupné termíny.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <span className="text-slate-500">Stav dat k </span>
              <strong>{formatDate(data.asOf)}</strong>
            </div>
          </div>
        </header>

        <section aria-labelledby="summary-heading" className="mt-8">
          <h2 id="summary-heading" className="sr-only">
            Souhrn
          </h2>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              label="Aktivní zaměstnanci"
              value={data.summary.employees}
              detail="zahrnutí do vyhodnocení"
            />
            <SummaryCard
              label="Vyžaduje řešení"
              value={data.summary.employeesRequiringAction}
              detail="unikátní zaměstnanci"
              tone="danger"
            />
            <SummaryCard
              label="Chybějící"
              value={data.summary.byStatus.MISSING}
              detail="povinné školení bez záznamu"
              tone="danger"
            />
            <SummaryCard
              label="Propadlé"
              value={data.summary.byStatus.EXPIRED}
              detail="platnost skončila"
              tone="danger"
            />
            <SummaryCard
              label="Končí do 90 dnů"
              value={data.summary.byStatus.EXPIRING}
              detail={`${data.summary.byStatus.VALID.toLocaleString("cs-CZ")} dalších je platných`}
              tone="warning"
            />
          </dl>
        </section>

        {expiringAfterDeadline > 0 && (
          <aside className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <strong>{expiringAfterDeadline} případů nelze stihnout včas.</strong>{" "}
            Nejbližší dostupné místo je až po konci platnosti; tyto případy je
            potřeba řešit individuálně nebo navýšit kapacitu.
          </aside>
        )}

        <section aria-labelledby="actions-heading" className="mt-12">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 id="actions-heading" className="text-2xl font-semibold tracking-tight">
                Případy k řešení
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Zobrazeno {visibleItems.length.toLocaleString("cs-CZ")} z{" "}
                {data.summary.requirements.toLocaleString("cs-CZ")} povinných
                kombinací zaměstnance a školení.
              </p>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:self-auto"
              >
                Zrušit filtry
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Stav
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ACTION">Vyžaduje řešení</option>
                <option value="MISSING">Chybí</option>
                <option value="EXPIRED">Propadlé</option>
                <option value="EXPIRING">Končí brzy</option>
                <option value="VALID">Platné</option>
                <option value="ALL">Všechny stavy</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Školení
              <select
                value={training}
                onChange={(event) => setTraining(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Všechna školení</option>
                {trainingOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Útvar
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Všechny útvary</option>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="NONE">Bez útvaru</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Hledat
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Jméno, ID, školení…"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[42rem] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <caption className="sr-only">
                  Stav povinných školení jednotlivých zaměstnanců
                </caption>
                <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Zaměstnanec
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Útvar a pozice
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Školení
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Stav
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Poslední / platnost do
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleItems.map((item) => (
                    <tr
                      key={`${item.employeeId}-${item.trainingCode}`}
                      className="align-top hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {item.firstName} {item.lastName}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.employeeId}
                        </div>
                      </td>
                      <td className="min-w-48 px-4 py-3.5">
                        <div>{item.unit ?? "Bez útvaru"}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.position}
                        </div>
                      </td>
                      <td className="min-w-52 px-4 py-3.5">
                        <div className="font-medium">{item.trainingName}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {item.trainingCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                        <div>{formatDate(item.completedAt)}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          do {formatDate(item.validUntil)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleItems.length === 0 && (
              <div className="border-t border-slate-200 px-6 py-12 text-center text-sm text-slate-600">
                Pro zvolené filtry nejsou žádné výsledky.
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="sessions-heading" className="mt-14">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 id="sessions-heading" className="text-2xl font-semibold tracking-tight">
                Doporučení na termíny
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Místa před koncem platnosti jsou rezervována jako první. Zbývající
                kapacita řeší chybějící a propadlá školení.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Zobrazeno {visibleSessions.length.toLocaleString("cs-CZ")} z{" "}
                {data.sessions.length.toLocaleString("cs-CZ")} termínů.
              </p>
            </div>
            {hasSessionFilters && (
              <button
                type="button"
                onClick={resetSessionFilters}
                className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:self-auto"
              >
                Zrušit filtry termínů
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Školení termínu
              <select
                value={sessionTraining}
                onChange={(event) => setSessionTraining(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Všechna školení</option>
                {sessionTrainingOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Stav termínu
              <select
                value={sessionFilter}
                onChange={(event) =>
                  setSessionFilter(event.target.value as SessionFilter)
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="ALL">Všechny termíny</option>
                <option value="RECOMMENDED">S doporučenými osobami</option>
                <option value="LATE">S doporučením po platnosti</option>
                <option value="AVAILABLE">S volnými místy</option>
                <option value="FULL">Bez volných míst</option>
                <option value="OVER_CAPACITY">Překročená kapacita</option>
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-1">
              Hledat termín
              <input
                type="search"
                value={sessionSearch}
                onChange={(event) => setSessionSearch(event.target.value)}
                placeholder="Místo, kód, školení…"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {visibleSessions.map((session) => {
              const overCapacity = Math.max(
                0,
                session.occupied - session.capacity,
              );
              const isFull = session.availableSeats === 0;
              const assignedAfterExpiry = session.recommendations.filter(
                (recommendation) => recommendation.expiresBeforeSession,
              ).length;

              return (
                <article
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                        {session.trainingCode} · {formatDate(session.date)}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {session.trainingName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {session.timeRange} · {session.location}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        overCapacity > 0
                          ? "bg-red-50 text-red-800"
                          : isFull
                          ? "bg-slate-200 text-slate-700"
                          : "bg-blue-50 text-blue-800"
                      }`}
                    >
                      {overCapacity > 0
                        ? `Překročeno o ${overCapacity}`
                        : isFull
                        ? "Bez volných míst"
                        : formatAvailableSeats(session.availableSeats)}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Obsazeno</dt>
                      <dd className="mt-0.5 font-semibold">
                        {session.occupied}/{session.capacity}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Doporučeno</dt>
                      <dd className="mt-0.5 font-semibold">
                        {session.recommendations.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Po platnosti</dt>
                      <dd className="mt-0.5 font-semibold">{assignedAfterExpiry}</dd>
                    </div>
                  </dl>

                  {session.recommendations.length > 0 ? (
                    <details className="group mt-4">
                      <summary className="cursor-pointer list-none rounded-lg text-sm font-semibold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                        <span className="group-open:hidden">
                          Zobrazit doporučené osoby
                        </span>
                        <span className="hidden group-open:inline">
                          Skrýt doporučené osoby
                        </span>
                      </summary>
                      <ul className="mt-3 max-h-72 divide-y divide-slate-100 overflow-auto border-t border-slate-100">
                        {session.recommendations.map((recommendation) => (
                          <li
                            key={recommendation.employeeId}
                            className="flex items-start justify-between gap-3 py-3 text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                {recommendation.firstName}{" "}
                                {recommendation.lastName}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {recommendation.unit ?? "Bez útvaru"} ·{" "}
                                {recommendation.position}
                              </p>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={recommendation.status} />
                              {recommendation.expiresBeforeSession && (
                                <p className="mt-1 text-xs font-medium text-red-700">
                                  Platnost končí před termínem
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Na tento termín není podle zvolených pravidel koho doplnit.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {visibleSessions.length === 0 && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
              Pro zvolené filtry není žádný plánovaný termín.
            </div>
          )}

          {data.unscheduled.length > 0 && (
            <aside className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <h3 className="font-semibold text-red-950">
                Bez dostupného termínu: {data.unscheduled.length}
              </h3>
              <p className="mt-1 text-sm text-red-800">
                Je potřeba přidat termín nebo kapacitu. Podrobnosti jsou
                zachované v plánovacím výstupu.
              </p>
            </aside>
          )}
        </section>

        <footer className="mt-14 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
          Doporučení pracuje se zbývající kapacitou exportovaných termínů.
          Export neobsahuje jmenný seznam již přihlášených osob, proto je před
          registrací nutná kontrola v rezervačním systému.
        </footer>
      </div>
    </main>
  );
}
