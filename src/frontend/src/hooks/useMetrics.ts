import {
  fetchInsights,
  fetchMetrics,
  fetchRecommendations,
  refreshData,
} from "@/lib/backend-client";
import type {
  InsightsResult,
  MetricsResult,
  Period,
  RecommendationsResult,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── useMetrics ───────────────────────────────────────────────────────────────

export function useMetrics(period: Period) {
  return useQuery<MetricsResult>({
    queryKey: ["metrics", period],
    queryFn: () => fetchMetrics(period),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── useInsights ──────────────────────────────────────────────────────────────

export function useInsights(period: Period) {
  return useQuery<InsightsResult>({
    queryKey: ["insights", period],
    queryFn: () => fetchInsights(period),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── useRecommendations ───────────────────────────────────────────────────────

export function useRecommendations(period: Period) {
  return useQuery<RecommendationsResult>({
    queryKey: ["recommendations", period],
    queryFn: () => fetchRecommendations(period),
    staleTime: 1000 * 60 * 5,
  });
}

// ─── useRefreshData ───────────────────────────────────────────────────────────
//
// Calls refreshData() to randomise the mock datasets, then invalidates all
// cached queries so every metric card, insight, and recommendation updates.
// A minimum 1-second delay ensures the loading state is always visible.

export function useRefreshData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await Promise.all([
        refreshData(),
        new Promise<void>((resolve) => setTimeout(resolve, 1000)),
      ]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["metrics"] });
      await queryClient.invalidateQueries({ queryKey: ["insights"] });
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
