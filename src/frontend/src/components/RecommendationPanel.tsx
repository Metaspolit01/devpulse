import { Skeleton } from "@/components/ui/skeleton";
import type { Priority, Recommendation } from "@/types";
import { ArrowRight, ChevronDown, ChevronUp, Gauge, Zap } from "lucide-react";
import { useState } from "react";

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  Priority,
  { badgeCls: string; label: string; order: number }
> = {
  high: { badgeCls: "status-badge-destructive", label: "High", order: 0 },
  medium: { badgeCls: "status-badge-warning", label: "Medium", order: 1 },
  low: { badgeCls: "status-badge-success", label: "Low", order: 2 },
};

const METRIC_LABELS: Record<string, string> = {
  leadTime: "Lead Time",
  cycleTime: "Cycle Time",
  bugRate: "Bug Rate",
  deploymentFrequency: "Deployment Frequency",
  prThroughput: "PR Throughput",
};

// ─── Single recommendation row ────────────────────────────────────────────────

function RecommendationRow({
  rec,
  index,
}: { rec: Recommendation; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { badgeCls, label } = PRIORITY_CONFIG[rec.priority];

  return (
    <div
      className="border border-border rounded-lg overflow-hidden transition-smooth"
      data-ocid={`recommendation.item.${index}`}
    >
      {/* Summary row */}
      <button
        type="button"
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        data-ocid={`recommendation.expand_button.${index}`}
      >
        <span className={`${badgeCls} shrink-0 mt-0.5`}>{label}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">
            {rec.action}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {METRIC_LABELS[rec.metricName] ?? rec.metricName}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="px-4 pb-4 border-t border-border bg-muted/20 flex flex-col gap-3"
          data-ocid={`recommendation.detail.${index}`}
        >
          <div className="pt-3 flex gap-2">
            <Zap
              className="w-4 h-4 text-primary shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Why this action works
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {rec.rationale}
              </p>
            </div>
          </div>
          <div className="flex gap-2 bg-card border border-border rounded-md px-3 py-2">
            <Gauge
              className="w-4 h-4 text-success shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Estimated impact
              </p>
              <p className="text-sm text-muted-foreground">
                {rec.estimatedImpact}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Priority group ───────────────────────────────────────────────────────────

function PriorityGroup({
  priority,
  recs,
  startIndex,
}: { priority: Priority; recs: Recommendation[]; startIndex: number }) {
  if (recs.length === 0) return null;
  const { label, badgeCls } = PRIORITY_CONFIG[priority];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`${badgeCls}`}>{label} Priority</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      {recs.map((rec, i) => (
        <RecommendationRow
          key={`${rec.metricName}-${startIndex + i}`}
          rec={rec}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface RecommendationPanelProps {
  recommendations: Recommendation[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecommendationPanel({
  recommendations,
}: RecommendationPanelProps) {
  const high = recommendations.filter((r) => r.priority === "high");
  const medium = recommendations.filter((r) => r.priority === "medium");
  const low = recommendations.filter((r) => r.priority === "low");

  return (
    <section
      className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5"
      data-ocid="recommendation.panel"
      aria-label="Recommendations panel"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground">
            What To Do Next
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prioritised actions to improve your metrics
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
          <ArrowRight className="w-3 h-3" />
          {recommendations.length} action
          {recommendations.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        <PriorityGroup priority="high" recs={high} startIndex={1} />
        <PriorityGroup
          priority="medium"
          recs={medium}
          startIndex={high.length + 1}
        />
        <PriorityGroup
          priority="low"
          recs={low}
          startIndex={high.length + medium.length + 1}
        />
      </div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function RecommendationPanelSkeleton() {
  return (
    <div
      className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4"
      data-ocid="recommendation.loading_state"
    >
      <Skeleton className="h-5 w-44" />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-border rounded-lg px-4 py-3 flex items-start gap-3"
        >
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
