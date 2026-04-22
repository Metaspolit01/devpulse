import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import DataTypes "../types/data";
import MetricsTypes "../types/metrics";
import CommonTypes "../types/common";
import MetricsLib "../lib/metrics";
import SeedLib "../lib/seed";

mixin (
  issues : List.List<DataTypes.Issue>,
  prs : List.List<DataTypes.PR>,
  deployments : List.List<DataTypes.Deployment>,
  bugs : List.List<DataTypes.Bug>,
) {
  /// Returns computed developer productivity metrics for the given period.
  /// period: "30d" | "90d" | "12m"
  public query func getMetrics(period : CommonTypes.Period) : async MetricsTypes.MetricsResult {
    MetricsLib.buildMetrics(issues, prs, deployments, bugs, period)
  };

  /// Returns one insight per metric explaining root causes.
  public query func getInsights(period : CommonTypes.Period) : async MetricsTypes.InsightsResult {
    let metrics = MetricsLib.buildMetrics(issues, prs, deployments, bugs, period);
    MetricsLib.buildInsights(metrics)
  };

  /// Returns one actionable recommendation per metric.
  public query func getRecommendations(period : CommonTypes.Period) : async MetricsTypes.RecommendationsResult {
    let metrics = MetricsLib.buildMetrics(issues, prs, deployments, bugs, period);
    let insights = MetricsLib.buildInsights(metrics);
    MetricsLib.buildRecommendations(metrics, insights)
  };

  /// Simulates new work arriving: randomly shifts timestamps and adds/removes items.
  /// Call from the frontend "Refresh Data" button — this is an update call (mutates state).
  public func refreshData() : async () {
    // Use current time nanoseconds as a pseudo-random seed
    let now : Int = Time.now();
    // Derive a small variation: 1, 2, or 3 days expressed in nanoseconds
    let variation : Int = (Int.rem(now, 3) + 1) * MetricsLib.DAY_NS;
    // Direction: even ns → shift forward (subtract from daysAgo), odd → shift back
    let forward : Bool = Int.rem(now, 2) == 0;

    // ── Shift issue timestamps ────────────────────────────────────────────────
    issues.mapInPlace(func(i : DataTypes.Issue) : DataTypes.Issue {
      let delta = if (forward) { -variation } else { variation };
      let newStarted = if (i.startedAt > 0) { i.startedAt + delta } else { 0 };
      let newCompleted = if (i.completedAt > 0) { i.completedAt + delta } else { 0 };
      { i with startedAt = newStarted; completedAt = newCompleted }
    });

    // ── Shift PR timestamps ───────────────────────────────────────────────────
    prs.mapInPlace(func(p : DataTypes.PR) : DataTypes.PR {
      let delta = if (forward) { -variation } else { variation };
      let newMerged = if (p.mergedAt > 0) { p.mergedAt + delta } else { 0 };
      let newDeployed = if (p.deployedAt > 0) { p.deployedAt + delta } else { 0 };
      { p with openedAt = p.openedAt + delta; mergedAt = newMerged; deployedAt = newDeployed }
    });

    // ── Shift deployment timestamps ───────────────────────────────────────────
    deployments.mapInPlace(func(d : DataTypes.Deployment) : DataTypes.Deployment {
      let delta = if (forward) { -variation } else { variation };
      { d with deployedAt = d.deployedAt + delta }
    });

    // ── Shift bug timestamps ──────────────────────────────────────────────────
    bugs.mapInPlace(func(b : DataTypes.Bug) : DataTypes.Bug {
      let delta = if (forward) { -variation } else { variation };
      { b with createdAt = b.createdAt + delta }
    });

    // ── Maybe add a new issue or PR (50% chance each, independently) ──────────
    let addIssue : Bool = Int.rem(now, 2) == 0;
    let addPr : Bool = Int.rem(now, 4) < 2;

    if (addIssue) {
      let newId = issues.size() + 1;
      issues.add({
        id = newId;
        status = #done;
        startedAt = SeedLib.BASE - 5 * MetricsLib.DAY_NS;
        completedAt = SeedLib.BASE - 2 * MetricsLib.DAY_NS;
      })
    };

    if (addPr) {
      let newId = prs.size() + 1;
      prs.add({
        id = newId;
        openedAt = SeedLib.BASE - 6 * MetricsLib.DAY_NS;
        mergedAt = SeedLib.BASE - 4 * MetricsLib.DAY_NS;
        deployedAt = SeedLib.BASE - 2 * MetricsLib.DAY_NS;
      })
    };

    // ── Maybe add or remove a bug (33% add, 33% remove, 33% keep) ────────────
    let bugRoll = Int.rem(now, 3);
    if (bugRoll == 0) {
      // Add a bug
      let newId = bugs.size() + 1;
      bugs.add({
        id = newId;
        createdAt = SeedLib.BASE - 1 * MetricsLib.DAY_NS;
        severity = #low;
      })
    } else if (bugRoll == 1) {
      // Remove the last bug (if any exist)
      ignore bugs.removeLast()
    }
    // bugRoll == 2 → keep as-is
  };
};
