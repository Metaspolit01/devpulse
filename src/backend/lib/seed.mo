import List "mo:core/List";
import DataTypes "../types/data";

/// Seed function that populates the lists with simple, easy-to-understand mock data.
/// Call once during actor initialization.
/// Reference time: 2026-04-22T00:00:00Z = 1_745_280_000_000_000_000 ns
module {
  // 1 day in nanoseconds
  public let DAY : Int = 86_400_000_000_000;

  // Base time: 2026-04-22T00:00:00Z
  public let BASE : Int = 1_745_280_000_000_000_000;

  // Helper: days before BASE → nanosecond timestamp
  public func daysAgo(d : Int) : Int {
    BASE - d * DAY
  };

  public func seed(
    issues : List.List<DataTypes.Issue>,
    prs : List.List<DataTypes.PR>,
    deployments : List.List<DataTypes.Deployment>,
    bugs : List.List<DataTypes.Bug>,
  ) {
    // ── Issues (5 items, last 30 days) ──────────────────────────────────────
    // (id, startedAt daysAgo, completedAt daysAgo)  0 = not completed yet
    issues.add({ id = 1; status = #done;       startedAt = daysAgo(28); completedAt = daysAgo(25) });
    issues.add({ id = 2; status = #done;       startedAt = daysAgo(20); completedAt = daysAgo(17) });
    issues.add({ id = 3; status = #done;       startedAt = daysAgo(14); completedAt = daysAgo(11) });
    issues.add({ id = 4; status = #done;       startedAt = daysAgo(8);  completedAt = daysAgo(5)  });
    issues.add({ id = 5; status = #inProgress; startedAt = daysAgo(3);  completedAt = 0           });

    // ── PRs (4 items, last 30 days) ─────────────────────────────────────────
    // (id, openedAt daysAgo, mergedAt daysAgo, deployedAt daysAgo)  0 = not yet
    prs.add({ id = 1; openedAt = daysAgo(26); mergedAt = daysAgo(23); deployedAt = daysAgo(21) });
    prs.add({ id = 2; openedAt = daysAgo(18); mergedAt = daysAgo(15); deployedAt = daysAgo(13) });
    prs.add({ id = 3; openedAt = daysAgo(10); mergedAt = daysAgo(7);  deployedAt = daysAgo(5)  });
    prs.add({ id = 4; openedAt = daysAgo(4);  mergedAt = daysAgo(2);  deployedAt = 0           });

    // ── Deployments (3 items, last 30 days, production only) ────────────────
    deployments.add({ id = 1; deployedAt = daysAgo(21); environment = #production });
    deployments.add({ id = 2; deployedAt = daysAgo(13); environment = #production });
    deployments.add({ id = 3; deployedAt = daysAgo(5);  environment = #production });

    // ── Bugs (2 items, last 30 days) ────────────────────────────────────────
    bugs.add({ id = 1; createdAt = daysAgo(15); severity = #medium });
    bugs.add({ id = 2; createdAt = daysAgo(6);  severity = #low    });
  };
};
