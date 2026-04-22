// ─── Status / Severity / Priority ────────────────────────────────────────────

export type MetricStatus = "good" | "warning" | "critical";
export type Severity = "info" | "warning" | "critical";
export type Priority = "high" | "medium" | "low";
export type Period = "30d" | "90d" | "12m";

// ─── Metric primitives ───────────────────────────────────────────────────────

export interface MetricValue {
  /** Numeric quantity (e.g. 4.2) */
  value: number;
  /** Display unit (e.g. "days", "%", "deploys/mo") */
  unit: string;
  /** Health status for colour-coded badge */
  status: MetricStatus;
  /** Percentage change vs previous period (positive = improvement) */
  trend: number;
}

// ─── Metrics result (mirrors backend MetricsResult) ─────────────────────────

export interface MetricsResult {
  leadTime: MetricValue;
  cycleTime: MetricValue;
  bugRate: MetricValue;
  deploymentFrequency: MetricValue;
  prThroughput: number;
  prThroughputStatus: MetricStatus;
  prThroughputTrend: number;
}

// ─── Insight (mirrors backend Insight) ──────────────────────────────────────

export interface Insight {
  /** Which metric this insight relates to */
  metricName: string;
  /** Severity drives icon and accent colour */
  severity: Severity;
  /** Short headline (≤ 60 chars) */
  title: string;
  /** Detailed explanation — the "why" */
  description: string;
}

export interface InsightsResult {
  insights: Insight[];
}

// ─── Recommendation (mirrors backend Recommendation) ────────────────────────

export interface Recommendation {
  /** Which metric this recommendation targets */
  metricName: string;
  /** Drives sort order in the UI */
  priority: Priority;
  /** Verb-first action statement */
  action: string;
  /** Why this action addresses the root cause */
  rationale: string;
  /** Expected outcome if action is taken */
  estimatedImpact: string;
}

export interface RecommendationsResult {
  recommendations: Recommendation[];
}
