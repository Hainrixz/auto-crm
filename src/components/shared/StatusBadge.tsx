// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
"use client";

import { Badge } from "@/components/ui/badge";
import type { Temperature } from "@/types";
import { TEMPERATURE_CONFIG } from "@/lib/constants";

interface StatusBadgeProps {
  temperature: Temperature;
  size?: "sm" | "md";
}

export function StatusBadge({ temperature, size = "md" }: StatusBadgeProps) {
  const config = TEMPERATURE_CONFIG[temperature];

  return (
    <Badge
      variant="outline"
      className={size === "sm" ? "text-xs px-1.5 py-0" : ""}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.color,
      }}
    >
      {config.label}
    </Badge>
  );
}
