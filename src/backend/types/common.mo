module {
  // Timestamp in nanoseconds (from Time.now())
  public type Timestamp = Int;

  // Period accepted by API: "30d", "90d", "12m"
  public type Period = Text;

  // Metric status classification
  public type MetricStatus = { #good; #warning; #critical };

  // Insight / recommendation severity
  public type Severity = { #info; #warning; #critical };

  // Recommendation priority
  public type Priority = { #high; #medium; #low };
};
