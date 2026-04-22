import { InsightPanel, InsightPanelSkeleton } from "@/components/InsightPanel";
import { MetricCard, MetricCardSkeleton } from "@/components/MetricCard";
import {
  RecommendationPanel,
  RecommendationPanelSkeleton,
} from "@/components/RecommendationPanel";
import {
  useInsights,
  useMetrics,
  useRecommendations,
  useRefreshData,
} from "@/hooks/useMetrics";
import type { Insight, Period, Recommendation } from "@/types";
import { RefreshCw } from "lucide-react";

// ─── Metric definitions ───────────────────────────────────────────────────────

const METRIC_DEFS: Record<string, { label: string; definition: string }> = {
  leadTime: {
    label: "Lead Time",
    definition: "Time from opening a PR to deploying it to production.",
  },
  cycleTime: {
    label: "Cycle Time",
    definition: "Time from starting work on an issue to marking it done.",
  },
  bugRate: {
    label: "Bug Rate",
    definition:
      "Percentage of completed issues that resulted in production bugs.",
  },
  deploymentFrequency: {
    label: "Deployment Frequency",
    definition: "How many times per month code is deployed to production.",
  },
  prThroughput: {
    label: "PR Throughput",
    definition: "Number of pull requests merged per month.",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DashboardProps {
  period: Period;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Dashboard({ period }: DashboardProps) {
  const metricsQuery = useMetrics(period);
  const insightsQuery = useInsights(period);
  const recommendationsQuery = useRecommendations(period);
  const refreshMutation = useRefreshData();

  const metrics = metricsQuery.data;
  const insights = insightsQuery.data?.insights ?? [];
  const recommendations = recommendationsQuery.data?.recommendations ?? [];

  // Helper: find insight/recommendation for a given metric key
  function insightFor(key: string): Insight | undefined {
    return insights.find((i) => i.metricName === key);
  }
  function recFor(key: string): Recommendation | undefined {
    return recommendations.find((r) => r.metricName === key);
  }

  // Build ordered list of metric cards
  type MetricEntry = {
    key: string;
    label: string;
    definition: string;
    metricValue: {
      value: number;
      unit: string;
      status: "good" | "warning" | "critical";
      trend: number;
    };
  };

  const metricEntries: MetricEntry[] = metrics
    ? [
        {
          key: "leadTime",
          ...METRIC_DEFS.leadTime,
          metricValue: metrics.leadTime,
        },
        {
          key: "cycleTime",
          ...METRIC_DEFS.cycleTime,
          metricValue: metrics.cycleTime,
        },
        {
          key: "bugRate",
          ...METRIC_DEFS.bugRate,
          metricValue: metrics.bugRate,
        },
        {
          key: "deploymentFrequency",
          ...METRIC_DEFS.deploymentFrequency,
          metricValue: metrics.deploymentFrequency,
        },
        {
          key: "prThroughput",
          ...METRIC_DEFS.prThroughput,
          metricValue: {
            value: metrics.prThroughput,
            unit: "PRs/mo",
            status: metrics.prThroughputStatus,
            trend: metrics.prThroughputTrend,
          },
        },
      ]
    : [];

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
      data-ocid="dashboard.page"
    >
      {/* ── Section: Your Metrics ─────────────────────────────────────── */}
      <section
        aria-labelledby="metrics-heading"
        data-ocid="dashboard.metrics.section"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              id="metrics-heading"
              className="text-xl font-display font-bold text-foreground"
            >
              Your Metrics
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Click any card to see the insight and recommended action for that
              metric.
            </p>
          </div>

          {/* Refresh Data button */}
          <button
            type="button"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            data-ocid="dashboard.refresh.button"
            aria-label="Refresh dashboard data"
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:bg-primary/80",
              "transition-colors duration-200",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <RefreshCw
              className={[
                "w-4 h-4",
                refreshMutation.isPending ? "animate-spin" : "",
              ].join(" ")}
              aria-hidden="true"
            />
            {refreshMutation.isPending ? "Refreshing…" : "Refresh Data"}
          </button>
        </div>

        {/* 5-card grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="dashboard.metrics.list"
        >
          {metricsQuery.isLoading
            ? Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((k) => (
                <MetricCardSkeleton key={k} />
              ))
            : metricEntries.map((entry, i) => (
                <MetricCard
                  key={entry.key}
                  label={entry.label}
                  definition={entry.definition}
                  metric={entry.metricValue}
                  insight={insightFor(entry.key)}
                  recommendation={recFor(entry.key)}
                  index={i + 1}
                />
              ))}
        </div>

        {metricsQuery.isError && (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mt-4"
            data-ocid="dashboard.metrics.error_state"
          >
            Failed to load metrics. Please refresh the page.
          </div>
        )}
      </section>

      {/* ── Section: Insights ─────────────────────────────────────────── */}
      <section
        aria-labelledby="insights-heading"
        data-ocid="dashboard.insights.section"
      >
        <h2 id="insights-heading" className="sr-only">
          Insights
        </h2>
        {insightsQuery.isLoading ? (
          <InsightPanelSkeleton />
        ) : insights.length > 0 ? (
          <InsightPanel insights={insights} />
        ) : insightsQuery.isError ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            data-ocid="dashboard.insights.error_state"
          >
            Failed to load insights.
          </div>
        ) : null}
      </section>

      {/* ── Section: Recommendations ──────────────────────────────────── */}
      <section
        aria-labelledby="recommendations-heading"
        data-ocid="dashboard.recommendations.section"
      >
        <h2 id="recommendations-heading" className="sr-only">
          Recommendations
        </h2>
        {recommendationsQuery.isLoading ? (
          <RecommendationPanelSkeleton />
        ) : recommendations.length > 0 ? (
          <RecommendationPanel recommendations={recommendations} />
        ) : recommendationsQuery.isError ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            data-ocid="dashboard.recommendations.error_state"
          >
            Failed to load recommendations.
          </div>
        ) : null}
      </section>
    </div>
  );
}
