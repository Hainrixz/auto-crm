// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ActivityForm } from "@/components/activities/ActivityForm";
import {
  Phone,
  Mail,
  Users,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  Plus,
} from "lucide-react";
import { formatRelativeDate, formatDate } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/constants";
import type { ActivityType } from "@/types";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: FileText,
  follow_up: Clock,
};

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  contactName: string | null;
  contactId: string;
  scheduledAt: number | Date | null;
  completedAt: number | Date | null;
  createdAt: number | Date;
}

interface FollowUps {
  overdue: ActivityItem[];
  today: ActivityItem[];
  upcoming: ActivityItem[];
  unscheduled: ActivityItem[];
}

export default function ActivitiesPage() {
  const [allActivities, setActivities] = useState<ActivityItem[]>([]);
  const [followUps, setFollowUps] = useState<FollowUps | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/activities").then((r) => r.json()),
      fetch("/api/followups").then((r) => r.json()),
    ]).then(([acts, fups]) => {
      setActivities(acts);
      setFollowUps(fups);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">
            Historial de interacciones y seguimientos pendientes
        </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Registrar
        </Button>
      </div>

      <ActivityForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          loadData();
        }}
      />

      {/* Follow-ups section */}
      {followUps && (followUps.overdue.length > 0 || followUps.today.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {followUps.overdue.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Vencidos ({followUps.overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {followUps.overdue.map((f) => (
                  <div key={f.id} className="p-2 rounded bg-destructive/5 text-sm">
                    <p className="font-medium">{f.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.contactName} &middot; {formatDate(f.scheduledAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {followUps.today.length > 0 && (
            <Card className="border-warning/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: "var(--warning)" }}>
                  <Clock className="h-4 w-4" />
                  Hoy ({followUps.today.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {followUps.today.map((f) => (
                  <div key={f.id} className="p-2 rounded bg-orange-50 text-sm">
                    <p className="font-medium">{f.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.contactName}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* All activities timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas las Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          {allActivities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No hay actividades"
              description="Las actividades aparecen cuando registras llamadas, emails, reuniones o notas."
            />
          ) : (
            <div className="space-y-4">
              {allActivities.map((activity) => {
                const Icon = typeIcons[activity.type] || FileText;
                const config = ACTIVITY_TYPE_CONFIG[activity.type as ActivityType];
                return (
                  <div key={activity.id} className="flex gap-3 items-start">
                    <div className="rounded-full bg-muted p-2 shrink-0">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {config?.label || activity.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {activity.contactName}
                        </span>
                        {activity.completedAt ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        ) : activity.scheduledAt ? (
                          <Clock className="h-3.5 w-3.5 text-orange-600" />
                        ) : null}
                      </div>
                      <p className="text-sm mt-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
