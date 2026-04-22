import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Period = string;
export interface MetricsResult {
    leadTime: MetricValue;
    bugRate: MetricValue;
    cycleTime: MetricValue;
    prThroughputTrend: number;
    deploymentFrequency: MetricValue;
    prThroughputStatus: MetricStatus;
    prThroughput: bigint;
}
export interface Recommendation {
    action: string;
    estimatedImpact: string;
    rationale: string;
    metricName: string;
    priority: Priority;
}
export interface InsightsResult {
    insights: Array<Insight>;
}
export interface MetricValue {
    status: MetricStatus;
    trend: number;
    value: number;
    unit: string;
}
export interface Insight {
    title: string;
    description: string;
    metricName: string;
    severity: Severity;
}
export interface RecommendationsResult {
    recommendations: Array<Recommendation>;
}
export enum MetricStatus {
    warning = "warning",
    good = "good",
    critical = "critical"
}
export enum Priority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum Severity {
    warning = "warning",
    info = "info",
    critical = "critical"
}
export interface backendInterface {
    getInsights(period: Period): Promise<InsightsResult>;
    getMetrics(period: Period): Promise<MetricsResult>;
    getRecommendations(period: Period): Promise<RecommendationsResult>;
    refreshData(): Promise<void>;
}
