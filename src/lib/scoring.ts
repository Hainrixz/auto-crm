// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import type { Temperature } from "@/types";

interface ScoringInput {
  temperature: Temperature;
  hasEmail: boolean;
  hasPhone: boolean;
  hasCompany: boolean;
  activityCount: number;
  daysSinceLastActivity: number;
  hasDeals: boolean;
  dealValue: number;
}

export function calculateLeadScore(input: ScoringInput): number {
  let score = 0;

  // Temperature base score
  switch (input.temperature) {
    case "hot":
      score += 40;
      break;
    case "warm":
      score += 25;
      break;
    case "cold":
      score += 10;
      break;
  }

  // Contact completeness
  if (input.hasEmail) score += 10;
  if (input.hasPhone) score += 10;
  if (input.hasCompany) score += 5;

  // Engagement
  score += Math.min(input.activityCount * 5, 20);

  // Recency penalty
  if (input.daysSinceLastActivity > 30) score -= 15;
  else if (input.daysSinceLastActivity > 14) score -= 10;
  else if (input.daysSinceLastActivity > 7) score -= 5;

  // Deal value bonus
  if (input.hasDeals) score += 10;
  if (input.dealValue > 100000) score += 5; // >$1,000
  if (input.dealValue > 500000) score += 5; // >$5,000

  return Math.max(0, Math.min(100, score));
}

export function suggestTemperature(score: number): Temperature {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}
