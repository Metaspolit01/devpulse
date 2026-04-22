import Common "common";

module {
  // ── Metrics ─────────────────────────────────────────────────────────────────

  public type MetricValue = {
    value : Float;
    unit : Text;
    status : Common.MetricStatus;
    trend : Float;       // % change vs previous period (positive = increase)
  };

  public type MetricsResult = {
    leadTime : MetricValue;          // PR opened → production deployment (days)
    cycleTime : MetricValue;         // Issue inProgress → done (days)
    bugRate : MetricValue;           // production bugs / completed issues (%)
    deploymentFrequency : MetricValue; // deployments per month
    prThroughput : Nat;              // PRs merged in period (count)
    prThroughputStatus : Common.MetricStatus;
    prThroughputTrend : Float;
  };

  // ── Insights ─────────────────────────────────────────────────────────────────

  public type Insight = {
    metricName : Text;
    severity : Common.Severity;
    title : Text;
    description : Text;  // Root-cause explanation referencing thresholds
  };

  public type InsightsResult = {
    insights : [Insight];
  };

  // ── Recommendations ──────────────────────────────────────────────────────────

  public type Recommendation = {
    metricName : Text;
    priority : Common.Priority;
    action : Text;           // Short title
    rationale : Text;        // Why this matters
    estimatedImpact : Text;
  };

  public type RecommendationsResult = {
    recommendations : [Recommendation];
  };
};
