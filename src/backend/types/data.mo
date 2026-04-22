module {
  // Raw mock data types — stored in actor state

  public type IssueStatus = { #todo; #inProgress; #done };

  public type Issue = {
    id : Nat;
    status : IssueStatus;
    startedAt : Int;     // Timestamp (ns) when moved to inProgress; 0 if not started
    completedAt : Int;   // Timestamp (ns) when moved to done; 0 if not completed
  };

  public type PR = {
    id : Nat;
    openedAt : Int;      // Timestamp (ns)
    mergedAt : Int;      // Timestamp (ns); 0 if not merged
    deployedAt : Int;    // Timestamp (ns) of production deployment; 0 if not deployed
  };

  public type DeploymentEnv = { #production; #staging };

  public type Deployment = {
    id : Nat;
    deployedAt : Int;    // Timestamp (ns)
    environment : DeploymentEnv;
  };

  public type BugSeverity = { #low; #medium; #high; #critical };

  public type Bug = {
    id : Nat;
    createdAt : Int;     // Timestamp (ns)
    severity : BugSeverity;
  };
};
