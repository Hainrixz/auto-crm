// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";

interface FollowUpData {
  overdue: unknown[];
  today: unknown[];
  upcoming: unknown[];
  unscheduled: unknown[];
}

export function NotificationBanner() {
  const [data, setData] = useState<FollowUpData | null>(null);

  useEffect(() => {
    fetch("/api/followups")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  const overdueCount = data.overdue.length;
  const todayCount = data.today.length;

  if (overdueCount === 0 && todayCount === 0) return null;

  return (
    <div className="space-y-2">
      {overdueCount > 0 && (
        <Link href="/activities" className="block">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {overdueCount} seguimiento{overdueCount > 1 ? "s" : ""} vencido{overdueCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600">
                Requieren atencion inmediata
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-red-400" />
          </div>
        </Link>
      )}

      {todayCount > 0 && (
        <Link href="/activities" className="block">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
            <Clock className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                {todayCount} seguimiento{todayCount > 1 ? "s" : ""} para hoy
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-orange-400" />
          </div>
        </Link>
      )}
    </div>
  );
}
