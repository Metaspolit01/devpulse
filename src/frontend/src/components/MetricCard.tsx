import { Skeleton } from "@/components/ui/skeleton";
import type { Insight, MetricValue, Recommendation } from "@/types";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

// ─── Sparkline mock trend data ────────────────────────────────────────────────

function makeTrend(
  seed: number,
  length = 14,
): { day: number; value: number }[] {
  return Array.from({ length }, (_, i) => ({
    day: i + 1,
    value: Math.max(
      0,
      seed +
        Math.sin(i * 0.7 + seed) * seed * 0.35 +
        (Math.random() - 0.5) * seed * 0.2,
    ),
  }));
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "good" | "warning" | "critical" }) {
  const map = {
    good: { cls: "status-badge-success", label: "Healthy" },
    warning: { cls: "status-badge-warning", label: "Needs attention" },
    critical: { cls: "status-badge-destructive", label: "Critical" },
  };
  const { cls, label } = map[status];
  return <span className={cls}>{label}</span>;
}

// ─── Trend chip ───────────────────────────────────────────────────────────────

function TrendChip({ trend }: { trend: number }) {
  if (trend === 0)
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  const positive = trend > 0;
  return (
    <span
      className={`text-xs font-medium flex items-center gap-0.5 ${positive ? "text-success" : "text-destructive"}`}
    >
      {positive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {positive ? "+" : ""}
      {trend}%
    </span>
  );
}

// ─── Definition tooltip ───────────────────────────────────────────────────────

function DefinitionTooltip({ definition }: { definition: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Metric definition"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div
          role="tooltip"
          className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs text-foreground leading-relaxed"
        >
          {definition}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  definition: string;
  metric: MetricValue;
  insight?: Insight;
  recommendation?: Recommendation;
  index: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MetricCard({
  label,
  definition,
  metric,
  insight,
  recommendation,
  index,
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);
  const trendData = makeTrend(metric.value, 14);

  const sparkColor =
    metric.status === "good"
      ? "#16a34a"
      : metric.status === "warning"
        ? "#d97706"
        : "#dc2626";

  return (
    <div
      className="metric-card-base flex flex-col gap-3"
      data-ocid={`metric.item.${index}`}
    >
      {/* Header row — clickable for expand */}
      <button
        type="button"
        className="flex items-start justify-between gap-2 w-full text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        data-ocid={`metric.expand_button.${index}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {label}
          </span>
          <span
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DefinitionTooltip definition={definition} />
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Value row */}
      <div className="flex items-end gap-2">
        <span className="text-3xl font-display font-bold text-foreground tabular-nums leading-none">
          {metric.value}
        </span>
        <span className="text-sm text-muted-foreground mb-0.5">
          {metric.unit}
        </span>
        <div className="ml-auto">
          <TrendChip trend={metric.trend} />
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={sparkColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="bg-card border border-border rounded px-2 py-1 text-xs text-foreground shadow-sm">
                    {payload[0].value !== undefined
                      ? Number(payload[0].value).toFixed(1)
                      : "—"}{" "}
                    {metric.unit}
                  </div>
                ) : null
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status badge */}
      <StatusBadge status={metric.status} />

      {/* Expanded: insight + recommendation */}
      {expanded && (
        <div
          className="mt-1 border-t border-border pt-3 flex flex-col gap-3"
          data-ocid={`metric.detail.${index}`}
        >
          {insight && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Why this matters
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>
          )}
          {recommendation && (
            <div className="bg-muted/40 rounded-md p-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                Recommended action
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {recommendation.action}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Impact: {recommendation.estimatedImpact}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function MetricCardSkeleton() {
  return (
    <div
      className="metric-card-base flex flex-col gap-3"
      data-ocid="metric.loading_state"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-20" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}
