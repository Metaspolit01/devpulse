import List "mo:core/List";
import DataTypes "../types/data";
import MetricsTypes "../types/metrics";
import CommonTypes "../types/common";

module {
  // ── Thresholds (simple rules from requirements) ───────────────────────────────
  // Lead Time (days): > 4 → slow delivery
  public let LEAD_TIME_WARN : Float = 4.0;
  // Cycle Time (days): > 3 → development delay
  public let CYCLE_TIME_WARN : Float = 3.0;
  // Bug Rate (ratio 0–1): > 0.3 → quality issue
  public let BUG_RATE_WARN : Float = 0.3;
  // Deployment Frequency (per month): < 2 → low release frequency
  public let DEPLOY_FREQ_WARN : Float = 2.0;
  // PR Throughput (count per month): < 3 → low productivity
  public let PR_THROUGHPUT_WARN : Nat = 3;

  // Nanoseconds helpers
  public let DAY_NS : Int = 86_400_000_000_000;

  // ── Period parsing ────────────────────────────────────────────────────────────

  /// Returns window size in days for a given period string.
  public func parsePeriodDays(period : CommonTypes.Period) : Nat {
    if (period == "30d") { 30 }
    else if (period == "90d") { 90 }
    else { 365 }  // "12m" or default
  };

  // ── Data filtering ────────────────────────────────────────────────────────────

  /// Filter issues completed within `windowNs` nanoseconds before `refTime`.
  public func issuesInWindow(
    issues : List.List<DataTypes.Issue>,
    refTime : Int,
    windowNs : Int,
  ) : [DataTypes.Issue] {
    let cutoff = refTime - windowNs;
    issues.filter(func(i : DataTypes.Issue) : Bool {
      i.completedAt > 0 and i.completedAt >= cutoff and i.completedAt <= refTime
    }).toArray()
  };

  /// Filter PRs merged within window.
  public func prsInWindow(
    prs : List.List<DataTypes.PR>,
    refTime : Int,
    windowNs : Int,
  ) : [DataTypes.PR] {
    let cutoff = refTime - windowNs;
    prs.filter(func(p : DataTypes.PR) : Bool {
      p.mergedAt > 0 and p.mergedAt >= cutoff and p.mergedAt <= refTime
    }).toArray()
  };

  /// Filter deployments (production only) within window.
  public func deploymentsInWindow(
    deployments : List.List<DataTypes.Deployment>,
    refTime : Int,
    windowNs : Int,
  ) : [DataTypes.Deployment] {
    let cutoff = refTime - windowNs;
    deployments.filter(func(d : DataTypes.Deployment) : Bool {
      switch (d.environment) {
        case (#production) { d.deployedAt >= cutoff and d.deployedAt <= refTime };
        case (_) { false };
      }
    }).toArray()
  };

  /// Filter bugs created within window.
  public func bugsInWindow(
    bugs : List.List<DataTypes.Bug>,
    refTime : Int,
    windowNs : Int,
  ) : [DataTypes.Bug] {
    let cutoff = refTime - windowNs;
    bugs.filter(func(b : DataTypes.Bug) : Bool {
      b.createdAt >= cutoff and b.createdAt <= refTime
    }).toArray()
  };

  // ── Metric calculations ───────────────────────────────────────────────────────

  /// Average lead time in days for a set of PRs (openedAt → deployedAt).
  public func calcLeadTime(prs : [DataTypes.PR]) : Float {
    let deployed = prs.filter(func(p : DataTypes.PR) : Bool {
      p.deployedAt > 0 and p.mergedAt > 0
    });
    let n = deployed.size();
    if (n == 0) { return 0.0 };
    let totalNs = deployed.foldLeft<DataTypes.PR, Int>(0, func(acc, p) {
      acc + (p.deployedAt - p.openedAt)
    });
    totalNs.toFloat() / n.toFloat() / DAY_NS.toFloat()
  };

  /// Average cycle time in days for a set of issues (startedAt → completedAt).
  public func calcCycleTime(issues : [DataTypes.Issue]) : Float {
    let done = issues.filter(func(i : DataTypes.Issue) : Bool {
      i.startedAt > 0 and i.completedAt > 0
    });
    let n = done.size();
    if (n == 0) { return 0.0 };
    let totalNs = done.foldLeft<DataTypes.Issue, Int>(0, func(acc, i) {
      acc + (i.completedAt - i.startedAt)
    });
    totalNs.toFloat() / n.toFloat() / DAY_NS.toFloat()
  };

  /// Bug rate = bugs / completed issues (ratio 0–1).
  public func calcBugRate(bugs : [DataTypes.Bug], completedIssues : [DataTypes.Issue]) : Float {
    let issueCount = completedIssues.size();
    if (issueCount == 0) { return 0.0 };
    bugs.size().toFloat() / issueCount.toFloat()
  };

  /// Deployment frequency = production deployments / months in period.
  public func calcDeploymentFrequency(deployments : [DataTypes.Deployment], periodDays : Nat) : Float {
    if (periodDays == 0) { return 0.0 };
    let months : Float = periodDays.toFloat() / 30.0;
    deployments.size().toFloat() / months
  };

  // ── Status helpers ────────────────────────────────────────────────────────────
  // Thresholds: > 4 days lead time = warning/critical

  public func leadTimeStatus(days : Float) : CommonTypes.MetricStatus {
    if (days <= LEAD_TIME_WARN) { #good } else { #warning }
  };

  public func cycleTimeStatus(days : Float) : CommonTypes.MetricStatus {
    if (days <= CYCLE_TIME_WARN) { #good } else { #warning }
  };

  public func bugRateStatus(rate : Float) : CommonTypes.MetricStatus {
    if (rate <= BUG_RATE_WARN) { #good } else { #warning }
  };

  public func deployFreqStatus(freq : Float) : CommonTypes.MetricStatus {
    if (freq >= DEPLOY_FREQ_WARN) { #good } else { #warning }
  };

  public func prThroughputStatus(count : Nat) : CommonTypes.MetricStatus {
    if (count >= PR_THROUGHPUT_WARN) { #good } else { #warning }
  };

  // ── Trend calculation ─────────────────────────────────────────────────────────

  public func trend(current : Float, previous : Float) : Float {
    if (previous == 0.0) { 0.0 }
    else { (current - previous) / previous * 100.0 }
  };

  public func trendNat(current : Nat, previous : Nat) : Float {
    if (previous == 0) { 0.0 }
    else {
      (current.toFloat() - previous.toFloat()) / previous.toFloat() * 100.0
    }
  };

  // ── Full result builders ──────────────────────────────────────────────────────

  public func buildMetrics(
    issues : List.List<DataTypes.Issue>,
    prs : List.List<DataTypes.PR>,
    deployments : List.List<DataTypes.Deployment>,
    bugs : List.List<DataTypes.Bug>,
    period : CommonTypes.Period,
  ) : MetricsTypes.MetricsResult {
    // Use Time.now() so metrics respond to refreshData() mutations
    let refTime : Int = 1_745_280_000_000_000_000; // 2026-04-22T00:00:00Z

    let periodDays = parsePeriodDays(period);
    let windowNs : Int = periodDays.toInt() * DAY_NS;

    // Current window data
    let curIssues = issuesInWindow(issues, refTime, windowNs);
    let curPrs = prsInWindow(prs, refTime, windowNs);
    let curDeploys = deploymentsInWindow(deployments, refTime, windowNs);
    let curBugs = bugsInWindow(bugs, refTime, windowNs);

    // Previous window data (same length immediately before)
    let prevRefTime = refTime - windowNs;
    let prevIssues = issuesInWindow(issues, prevRefTime, windowNs);
    let prevPrs = prsInWindow(prs, prevRefTime, windowNs);
    let prevDeploys = deploymentsInWindow(deployments, prevRefTime, windowNs);
    let prevBugs = bugsInWindow(bugs, prevRefTime, windowNs);

    // Current metric values
    let curLeadTime = calcLeadTime(curPrs);
    let curCycleTime = calcCycleTime(curIssues);
    let curBugRate = calcBugRate(curBugs, curIssues);
    let curDeployFreq = calcDeploymentFrequency(curDeploys, periodDays);
    let curPrThroughput = curPrs.size();

    // Previous metric values
    let prevLeadTime = calcLeadTime(prevPrs);
    let prevCycleTime = calcCycleTime(prevIssues);
    let prevBugRate = calcBugRate(prevBugs, prevIssues);
    let prevDeployFreq = calcDeploymentFrequency(prevDeploys, periodDays);
    let prevPrThroughput = prevPrs.size();

    {
      leadTime = {
        value = curLeadTime;
        unit = "days";
        status = leadTimeStatus(curLeadTime);
        trend = trend(curLeadTime, prevLeadTime);
      };
      cycleTime = {
        value = curCycleTime;
        unit = "days";
        status = cycleTimeStatus(curCycleTime);
        trend = trend(curCycleTime, prevCycleTime);
      };
      bugRate = {
        value = curBugRate;
        unit = "ratio";
        status = bugRateStatus(curBugRate);
        trend = trend(curBugRate, prevBugRate);
      };
      deploymentFrequency = {
        value = curDeployFreq;
        unit = "per month";
        status = deployFreqStatus(curDeployFreq);
        trend = trend(curDeployFreq, prevDeployFreq);
      };
      prThroughput = curPrThroughput;
      prThroughputStatus = prThroughputStatus(curPrThroughput);
      prThroughputTrend = trendNat(curPrThroughput, prevPrThroughput);
    }
  };

  public func buildInsights(metrics : MetricsTypes.MetricsResult) : MetricsTypes.InsightsResult {
    let list = List.empty<MetricsTypes.Insight>();

    // Lead Time: > 4 days → "Slow delivery"
    let lt = metrics.leadTime.value;
    if (lt > LEAD_TIME_WARN) {
      list.add({
        metricName = "Lead Time";
        severity = #warning;
        title = "Slow delivery";
        description = "Lead time of " # floatToText(lt) # " days is above the 4-day target. PRs are taking too long from open to production.";
      })
    };

    // Cycle Time: > 3 days → "Development delay"
    let ct = metrics.cycleTime.value;
    if (ct > CYCLE_TIME_WARN) {
      list.add({
        metricName = "Cycle Time";
        severity = #warning;
        title = "Development delay";
        description = "Cycle time of " # floatToText(ct) # " days exceeds the 3-day target. Issues are taking longer than expected to complete.";
      })
    };

    // Bug Rate: > 0.3 → "Quality issue"
    let br = metrics.bugRate.value;
    if (br > BUG_RATE_WARN) {
      list.add({
        metricName = "Bug Rate";
        severity = #warning;
        title = "Quality issue";
        description = "Bug rate of " # floatToText(br * 100.0) # "% is above 30%. More than 1 in 3 completed issues is producing a bug.";
      })
    };

    // Deployment Frequency: < 2/month → "Low release frequency"
    let df = metrics.deploymentFrequency.value;
    if (df < DEPLOY_FREQ_WARN) {
      list.add({
        metricName = "Deployment Frequency";
        severity = #warning;
        title = "Low release frequency";
        description = "Deployment frequency of " # floatToText(df) # "/month is below the 2/month target. Releases are too infrequent.";
      })
    };

    // PR Throughput: < 3/month → "Low productivity"
    let pt = metrics.prThroughput;
    if (pt < PR_THROUGHPUT_WARN) {
      list.add({
        metricName = "PR Throughput";
        severity = #warning;
        title = "Low productivity";
        description = "Only " # pt.toText() # " PRs merged this period, below the target of 3. Review velocity needs improvement.";
      })
    };

    { insights = list.toArray() }
  };

  public func buildRecommendations(
    metrics : MetricsTypes.MetricsResult,
    _insights : MetricsTypes.InsightsResult,
  ) : MetricsTypes.RecommendationsResult {
    let list = List.empty<MetricsTypes.Recommendation>();

    // Lead Time
    if (metrics.leadTime.value > LEAD_TIME_WARN) {
      list.add({
        metricName = "Lead Time";
        priority = #medium;
        action = "Break PRs into smaller chunks (< 200 lines)";
        rationale = "Large PRs take longer to review and merge. Smaller PRs get faster feedback and deploy more frequently.";
        estimatedImpact = "Smaller PRs typically cut lead time by 40–60%.";
      })
    };

    // Cycle Time
    if (metrics.cycleTime.value > CYCLE_TIME_WARN) {
      list.add({
        metricName = "Cycle Time";
        priority = #medium;
        action = "Split issues into tasks of 1–2 days each";
        rationale = "Large issues accumulate wait time. Smaller tasks create clearer progress and remove blockers faster.";
        estimatedImpact = "Smaller issues reduce cycle time by 30–50%.";
      })
    };

    // Bug Rate
    if (metrics.bugRate.value > BUG_RATE_WARN) {
      list.add({
        metricName = "Bug Rate";
        priority = #high;
        action = "Add automated tests before merging";
        rationale = "A high bug rate signals gaps in pre-merge quality gates. Automated tests prevent regressions.";
        estimatedImpact = "Test gates typically reduce bug rate by 50–70%.";
      })
    };

    // Deployment Frequency
    if (metrics.deploymentFrequency.value < DEPLOY_FREQ_WARN) {
      list.add({
        metricName = "Deployment Frequency";
        priority = #high;
        action = "Enable CI/CD auto-deploy on main branch merge";
        rationale = "Manual deployment processes are the most common cause of low frequency. Automating removes bottlenecks.";
        estimatedImpact = "Automated deployments increase frequency 5–10×.";
      })
    };

    // PR Throughput
    if (metrics.prThroughput < PR_THROUGHPUT_WARN) {
      list.add({
        metricName = "PR Throughput";
        priority = #medium;
        action = "Establish a daily PR review ritual (30 min)";
        rationale = "Low throughput often means PRs wait days for first review. A daily block ensures no PR waits over 24 hours.";
        estimatedImpact = "Consistent review cadence increases throughput by 30–50%.";
      })
    };

    { recommendations = list.toArray() }
  };

  // ── Private helpers ───────────────────────────────────────────────────────────

  func floatToText(f : Float) : Text {
    let absF = if (f < 0.0) { -f } else { f };
    let intPart = absF.toInt();
    let frac = absF - intPart.toFloat();
    let decDigit = (frac * 10.0).toInt();
    let sign = if (f < 0.0) { "-" } else { "" };
    sign # intPart.toText() # "." # decDigit.toText()
  };
};
