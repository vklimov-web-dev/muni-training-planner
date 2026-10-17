import { Dashboard, type DashboardViewModel } from "@/components/dashboard";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

export const dynamic = "force-dynamic";

function toIsoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export default async function HomePage() {
  const data = await getDashboardData();
  const viewModel: DashboardViewModel = {
    asOf: data.asOf.toISOString(),
    summary: data.compliance.summary,
    items: data.compliance.items.map((item) => ({
      ...item,
      completedAt: toIsoDate(item.completedAt),
      validUntil: toIsoDate(item.validUntil),
    })),
    sessions: data.planning.sessions.map((session) => ({
      ...session,
      date: session.date.toISOString(),
      recommendations: session.recommendations.map((recommendation) => ({
        ...recommendation,
        validUntil: toIsoDate(recommendation.validUntil),
      })),
    })),
    unscheduled: data.planning.unscheduled.map((item) => ({
      ...item,
      completedAt: toIsoDate(item.completedAt),
      validUntil: toIsoDate(item.validUntil),
    })),
  };

  return <Dashboard data={viewModel} />;
}
