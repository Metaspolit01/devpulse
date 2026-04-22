import { Skeleton } from "@/components/ui/skeleton";
import type { Insight, Severity } from "@/types";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

// ─── Severity config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<
  Severity,
  {
    Icon: typeof Info;
    borderCls: string;
    iconCls: string;
    bgCls: string;
    label: string;
  }
> = {
  critical: {
    Icon: AlertCircle,
    borderCls: "border-l-destructive",
    iconCls: "text-destructive",
    bgCls: "bg-destructive/5",
    label: "Critical",
  },
  warning: {
    Icon: AlertTriangle,
    borderCls: "border-l-warning",
    iconCls: "text-warning",
    bgCls: "bg-warning/5",
    label: "Warning",
  },
  info: {
    Icon: Info,
    borderCls: "border-l-primary",
    iconCls: "text-primary",
    bgCls: "bg-primary/5",
    label: "Info",
  },
};

const METRIC_LABELS: Record<string, string> = {
  leadTime: "Lead Time",
  cycleTime: "Cycle Time",
  bugRate: "Bug Rate",
  deploymentFrequency: "Deployment Frequency",
  prThroughput: "PR Throughput",
};

// ─── Single insight row ───────────────────────────────────────────────────────

function InsightRow({ insight, index }: { insight: Insight; index: number }) {
  const { Icon, borderCls, iconCls, bgCls } = SEVERITY_CONFIG[insight.severity];
  return (
    <div
      className={`flex gap-3 border-l-4 ${borderCls} ${bgCls} rounded-r-lg px-4 py-3`}
      data-ocid={`insight.item.${index}`}
    >
      <Icon
        className={`w-4 h-4 mt-0.5 shrink-0 ${iconCls}`}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground leading-snug">
            {insight.title}
          </span>
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {METRIC_LABELS[insight.metricName] ?? insight.metricName}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {insight.description}
        </p>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InsightPanelProps {
  insights: Insight[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InsightPanel({ insights }: InsightPanelProps) {
  // Sort: critical → warning → info
  const ORDER: Severity[] = ["critical", "warning", "info"];
  const sorted = [...insights].sort(
    (a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity),
  );

  return (
    <section
      className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4"
      data-ocid="insight.panel"
      aria-label="Insights panel"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">
            What These Mean
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Root-cause analysis for each metric
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
          {insights.length} insight{insights.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((insight, i) => (
          <InsightRow
            key={insight.metricName}
            insight={insight}
            index={i + 1}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function InsightPanelSkeleton() {
  return (
    <div
      className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4"
      data-ocid="insight.loading_state"
    >
      <Skeleton className="h-5 w-36" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 border-l-4 border-muted rounded-r-lg px-4 py-3 bg-muted/30"
        >
          <Skeleton className="w-4 h-4 mt-0.5 shrink-0 rounded" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
