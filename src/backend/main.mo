import List "mo:core/List";
import DataTypes "types/data";
import SeedLib "lib/seed";
import MetricsApi "mixins/metrics-api";

actor {
  let issues = List.empty<DataTypes.Issue>();
  let prs = List.empty<DataTypes.PR>();
  let deployments = List.empty<DataTypes.Deployment>();
  let bugs = List.empty<DataTypes.Bug>();

  // Populate mock data on first deployment
  SeedLib.seed(issues, prs, deployments, bugs);

  include MetricsApi(issues, prs, deployments, bugs);
};
