/**
 * backend-client.ts
 *
 * Typed wrapper around the generated actor bindings.
 * Falls back to rich mock data when the actor interface has not yet
 * had its methods generated (empty _SERVICE), so the UI is always
 * functional during development.
 *
 * Mock data is mutable — refreshData() randomises it to simulate
 * real-time updates without a live backend.
 */

import type {
  InsightsResult,
  MetricsResult,
  Period,
  RecommendationsResult,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return a random number between min and max (inclusive), rounded to `dp` decimal places. */
function rand(min: number, max: number, dp = 1): number {
  const raw = Math.random() * (max - min) + min;
  const factor = 10 ** dp;
  return Math.round(raw * factor) / factor;
}

/** Return a random integer between min and max (inclusive). */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Clamp a value between lo and hi. */
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Simple mock datasets ─────────────────────────────────────────────────────
//
// Each dataset holds the raw records described in the requirements.
// refreshData() mutates these to simulate "work happening".

interface Issue {
  id: string;
  startedAt: Date;
  completedAt: Date;
}

interface PR {
  id: string;
  openedAt: Date;
  mergedAt: Date;
}

interface Deployment {
  id: string;
  deployedAt: Date;
}

interface Bug {
  id: string;
  createdAt: Date;
}

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

let issues: Issue[] = [
  { id: "ISS-1", startedAt: daysAgo(10), completedAt: daysAgo(7) },
  { id: "ISS-2", startedAt: daysAgo(8), completedAt: daysAgo(5) },
  { id: "ISS-3", startedAt: daysAgo(6), completedAt: daysAgo(3) },
  { id: "ISS-4", startedAt: daysAgo(4), completedAt: daysAgo(1) },
];

let prs: PR[] = [
  { id: "PR-101", openedAt: daysAgo(12), mergedAt: daysAgo(6) },
  { id: "PR-102", openedAt: daysAgo(9), mergedAt: daysAgo(4) },
  { id: "PR-103", openedAt: daysAgo(7), mergedAt: daysAgo(2) },
  { id: "PR-104", openedAt: daysAgo(5), mergedAt: daysAgo(1) },
];

let deployments: Deployment[] = [
  { id: "DEP-1", deployedAt: daysAgo(14) },
  { id: "DEP-2", deployedAt: daysAgo(8) },
  { id: "DEP-3", deployedAt: daysAgo(3) },
];

let bugs: Bug[] = [
  { id: "BUG-1", createdAt: daysAgo(5) },
  { id: "BUG-2", createdAt: daysAgo(2) },
];

// ─── Metric calculation ───────────────────────────────────────────────────────

function avgDaysBetween(pairs: { start: Date; end: Date }[]): number {
  if (!pairs.length) return 0;
  const total = pairs.reduce(
    (sum, { start, end }) =>
      sum + (end.getTime() - start.getTime()) / 86_400_000,
    0,
  );
  return Math.round((total / pairs.length) * 10) / 10;
}

function computeMetrics(): MetricsResult {
  // Lead Time: PR opened → merged (proxy for production)
  const leadTime = clamp(
    avgDaysBetween(prs.map((p) => ({ start: p.openedAt, end: p.mergedAt }))),
    0.5,
    20,
  );

  // Cycle Time: issue started → completed
  const cycleTime = clamp(
    avgDaysBetween(
      issues.map((i) => ({ start: i.startedAt, end: i.completedAt })),
    ),
    0.5,
    15,
  );

  // Bug Rate: bugs / completed issues (as a percentage)
  const bugRateRaw =
    issues.length > 0 ? Math.round((bugs.length / issues.length) * 100) : 0;

  // Deployment Frequency: deploys per month (~30 days)
  const deployFreq = deployments.length;

  // PR Throughput: merged PRs per month
  const prCount = prs.length;

  // Statuses
  const leadStatus: "good" | "warning" | "critical" =
    leadTime <= 4 ? "good" : leadTime <= 7 ? "warning" : "critical";
  const cycleStatus: "good" | "warning" | "critical" =
    cycleTime <= 3 ? "good" : cycleTime <= 5 ? "warning" : "critical";
  const bugStatus: "good" | "warning" | "critical" =
    bugRateRaw <= 10 ? "good" : bugRateRaw <= 25 ? "warning" : "critical";
  const deployStatus: "good" | "warning" | "critical" =
    deployFreq >= 8 ? "good" : deployFreq >= 4 ? "warning" : "critical";
  const prStatus: "good" | "warning" | "critical" =
    prCount >= 5 ? "good" : prCount >= 3 ? "warning" : "critical";

  // Trends: small random deltas to simulate change
  const t = () => randInt(-15, 20);

  return {
    leadTime: { value: leadTime, unit: "days", status: leadStatus, trend: t() },
    cycleTime: {
      value: cycleTime,
      unit: "days",
      status: cycleStatus,
      trend: t(),
    },
    bugRate: { value: bugRateRaw, unit: "%", status: bugStatus, trend: t() },
    deploymentFrequency: {
      value: deployFreq,
      unit: "deploys/mo",
      status: deployStatus,
      trend: t(),
    },
    prThroughput: prCount,
    prThroughputStatus: prStatus,
    prThroughputTrend: t(),
  };
}

function computeInsights(): InsightsResult {
  const m = computeMetrics();
  const insights: InsightsResult["insights"] = [];

  const lt = m.leadTime.value;
  const ct = m.cycleTime.value;
  const br = m.bugRate.value;
  const df = m.deploymentFrequency.value;
  const pt = m.prThroughput;

  if (lt > 4) {
    insights.push({
      metricName: "leadTime",
      severity: lt > 7 ? "critical" : "warning",
      title: "Slow delivery — PRs are taking too long to ship",
      description: `Your lead time is ${lt} days (target: ≤4 days). PRs are sitting in review before being merged. Consider scheduling dedicated review windows or reducing PR size.`,
    });
  } else {
    insights.push({
      metricName: "leadTime",
      severity: "info",
      title: "Lead time is healthy",
      description: `${lt}-day lead time is within the good range. PRs are being reviewed and merged quickly.`,
    });
  }

  if (ct > 3) {
    insights.push({
      metricName: "cycleTime",
      severity: ct > 5 ? "critical" : "warning",
      title: "Development delay detected",
      description: `Cycle time of ${ct} days exceeds the 3-day target. Issues are spending too long in-progress. Check for blockers or large scope items.`,
    });
  } else {
    insights.push({
      metricName: "cycleTime",
      severity: "info",
      title: "Cycle time is on track",
      description: `${ct}-day cycle time shows work items are moving efficiently through the board.`,
    });
  }

  if (br > 30) {
    insights.push({
      metricName: "bugRate",
      severity: "critical",
      title: "Quality issue — high bug rate",
      description: `${br}% of issues result in bugs (target: <10%). Large PRs and skipped reviews are likely contributing. Enforce size limits and pre-merge test gates.`,
    });
  } else if (br > 10) {
    insights.push({
      metricName: "bugRate",
      severity: "warning",
      title: "Bug rate needs attention",
      description: `${br}% bug rate is above the 10% target. Consider adding more automated tests before merging.`,
    });
  } else {
    insights.push({
      metricName: "bugRate",
      severity: "info",
      title: "Bug rate is under control",
      description: `${br}% bug rate is within the healthy range. Good test coverage is paying off.`,
    });
  }

  if (df < 2) {
    insights.push({
      metricName: "deploymentFrequency",
      severity: "critical",
      title: "Low release frequency",
      description: `Only ${df} deploy(s) this month (target: ≥4). Infrequent releases mean larger batches and higher risk. Automate staging checks to enable more frequent releases.`,
    });
  } else if (df < 4) {
    insights.push({
      metricName: "deploymentFrequency",
      severity: "warning",
      title: "Release cadence below target",
      description: `${df} deploys/month is below the high-performer baseline. Aim for at least 4 per month.`,
    });
  } else {
    insights.push({
      metricName: "deploymentFrequency",
      severity: "info",
      title: "Deployment frequency is healthy",
      description: `${df} deploys this month shows a healthy release cadence.`,
    });
  }

  if (pt < 3) {
    insights.push({
      metricName: "prThroughput",
      severity: "warning",
      title: "Low PR productivity",
      description: `Only ${pt} PRs merged this period (target: ≥5). This may indicate blocked work or large, slow-moving PRs.`,
    });
  } else {
    insights.push({
      metricName: "prThroughput",
      severity: "info",
      title: "PR throughput is strong",
      description: `${pt} PRs merged this period. Good momentum — keep PR sizes small to maintain this pace.`,
    });
  }

  return { insights };
}

function computeRecommendations(): RecommendationsResult {
  const m = computeMetrics();
  const recs: RecommendationsResult["recommendations"] = [];

  if (m.bugRate.value > 10) {
    recs.push({
      metricName: "bugRate",
      priority: "high",
      action:
        "Enforce a PR size limit of 300 lines and add a pre-merge test gate",
      rationale:
        "Large PRs are harder to review thoroughly. A 300-line limit forces smaller, focused changes and reduces review blind spots.",
      estimatedImpact: "Bug rate reduced to <10% within 2 sprints.",
    });
  }

  if (m.leadTime.value > 4) {
    recs.push({
      metricName: "leadTime",
      priority: m.leadTime.value > 7 ? "high" : "medium",
      action:
        "Schedule dedicated review windows twice per day (10 AM and 3 PM)",
      rationale:
        "Most lead time is lost waiting for reviewers. Structured windows create a predictable flow instead of random interruptions.",
      estimatedImpact: `Lead time reduced from ${m.leadTime.value} to ~3.5 days.`,
    });
  }

  if (m.deploymentFrequency.value < 4) {
    recs.push({
      metricName: "deploymentFrequency",
      priority: "medium",
      action: "Automate staging QA checks and shift to trunk-based deployment",
      rationale:
        "Manual QA sign-off is the gating factor on deployment frequency. Automating common regression suites removes the human bottleneck.",
      estimatedImpact: "Deploy frequency increases to 8–12× per month.",
    });
  }

  if (m.cycleTime.value > 3) {
    recs.push({
      metricName: "cycleTime",
      priority: "medium",
      action: "Break issues into sub-tasks smaller than 1 day of work",
      rationale:
        "Smaller work items clear the board faster and make blockers visible earlier.",
      estimatedImpact: "Cycle time drops below 3-day target.",
    });
  }

  if (m.prThroughput < 3) {
    recs.push({
      metricName: "prThroughput",
      priority: "low",
      action: "Identify stalled PRs daily and unblock them in stand-up",
      rationale:
        "Low throughput often means a few large PRs are clogging the pipeline. Surface them early.",
      estimatedImpact: "Throughput improves to 5+ PRs/month.",
    });
  }

  // Always include a "keep it up" item if things are mostly healthy
  if (recs.length === 0) {
    recs.push({
      metricName: "cycleTime",
      priority: "low",
      action: "Keep WIP limits at ≤3 items per developer per sprint",
      rationale:
        "All metrics are healthy. WIP limits are the primary lever to keep them that way.",
      estimatedImpact: "Maintains current performance under growing workload.",
    });
  }

  return { recommendations: recs };
}

// ─── refreshData — mutate the mock datasets ───────────────────────────────────

/** Shift a date by a random amount between -3 and +3 days. */
function jitterDate(d: Date): Date {
  const shift = randInt(-3, 3) * 86_400_000;
  return new Date(d.getTime() + shift);
}

function nextId(prefix: string, arr: { id: string }[]): string {
  const nums = arr
    .map((x) => Number.parseInt(x.id.replace(/[^0-9]/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${max + 1}`;
}

export async function refreshData(actor?: {
  refreshData?: () => Promise<void>;
}): Promise<void> {
  // If actor has refreshData, call it and return
  if (actor?.refreshData) {
    await actor.refreshData();
    return;
  }

  // ── Jitter existing dates ──────────────────────────────────────────────────
  issues = issues.map((i) => ({
    ...i,
    startedAt: jitterDate(i.startedAt),
    completedAt: jitterDate(i.completedAt),
  }));

  prs = prs.map((p) => ({
    ...p,
    openedAt: jitterDate(p.openedAt),
    mergedAt: jitterDate(p.mergedAt),
  }));

  deployments = deployments.map((d) => ({
    ...d,
    deployedAt: jitterDate(d.deployedAt),
  }));

  // ── Sometimes add a new PR ─────────────────────────────────────────────────
  if (Math.random() < 0.5 && prs.length < 7) {
    const opened = daysAgo(rand(2, 8));
    prs = [
      ...prs,
      {
        id: nextId("PR-", prs),
        openedAt: opened,
        mergedAt: new Date(opened.getTime() + rand(1, 5) * 86_400_000),
      },
    ];
  } else if (prs.length > 3 && Math.random() < 0.25) {
    prs = prs.slice(1); // drop oldest
  }

  // ── Sometimes add a new issue ──────────────────────────────────────────────
  if (Math.random() < 0.4 && issues.length < 6) {
    const started = daysAgo(rand(2, 6));
    issues = [
      ...issues,
      {
        id: nextId("ISS-", issues),
        startedAt: started,
        completedAt: new Date(started.getTime() + rand(1, 4) * 86_400_000),
      },
    ];
  }

  // ── Randomly add or remove a bug ──────────────────────────────────────────
  const bugRoll = Math.random();
  if (bugRoll < 0.35 && bugs.length < 4) {
    bugs = [
      ...bugs,
      { id: nextId("BUG-", bugs), createdAt: daysAgo(rand(0, 3)) },
    ];
  } else if (bugRoll > 0.7 && bugs.length > 0) {
    bugs = bugs.slice(1);
  }

  // ── Sometimes add a deployment ────────────────────────────────────────────
  if (Math.random() < 0.4 && deployments.length < 6) {
    deployments = [
      ...deployments,
      { id: nextId("DEP-", deployments), deployedAt: daysAgo(rand(0, 2)) },
    ];
  }
}

// ─── Typed actor interface (extends when backend methods are generated) ───────

type ActorLike = {
  getMetrics?: (period: string) => Promise<MetricsResult>;
  getInsights?: (period: string) => Promise<InsightsResult>;
  getRecommendations?: (period: string) => Promise<RecommendationsResult>;
  refreshData?: () => Promise<void>;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchMetrics(
  _period: Period,
  actor?: ActorLike,
): Promise<MetricsResult> {
  if (actor?.getMetrics) {
    return actor.getMetrics(_period);
  }
  return computeMetrics();
}

export async function fetchInsights(
  _period: Period,
  actor?: ActorLike,
): Promise<InsightsResult> {
  if (actor?.getInsights) {
    return actor.getInsights(_period);
  }
  return computeInsights();
}

export async function fetchRecommendations(
  _period: Period,
  actor?: ActorLike,
): Promise<RecommendationsResult> {
  if (actor?.getRecommendations) {
    return actor.getRecommendations(_period);
  }
  return computeRecommendations();
}
