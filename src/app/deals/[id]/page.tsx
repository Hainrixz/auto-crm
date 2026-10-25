// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { db } from "@/db";
import { deals, contacts, activities, pipelineStages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, DollarSign, Percent, FileText } from "lucide-react";
import { formatCurrency, formatDate, formatRelativeDate } from "@/lib/constants";
import { ACTIVITY_TYPE_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = db.select().from(deals).where(eq(deals.id, id)).get();
  if (!deal) notFound();

  const contact = db
    .select()
    .from(contacts)
    .where(eq(contacts.id, deal.contactId))
    .get();

  const stage = db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.id, deal.stageId))
    .get();

  const dealActivities = db
    .select()
    .from(activities)
    .where(eq(activities.dealId, id))
    .orderBy(desc(activities.createdAt))
    .all();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/deals">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deal.title}</h1>
            {stage && (
              <Badge
                variant="outline"
                style={{ borderColor: stage.color, color: stage.color }}
              >
                {stage.name}
              </Badge>
            )}
          </div>
          {contact && (
            <Link
              href={`/contacts/${contact.id}`}
              className="text-muted-foreground hover:text-primary text-sm"
            >
              {contact.name}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Valor
            </div>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(deal.value)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              Probabilidad
            </div>
            <p className="text-xl font-bold">{deal.probability}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Cierre estimado
            </div>
            <p className="text-xl font-bold">
              {formatDate(deal.expectedClose)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Valor ponderado
            </div>
            <p className="text-xl font-bold">
              {formatCurrency(Math.round(deal.value * (deal.probability / 100)))}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {deal.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{deal.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Actividades ({dealActivities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dealActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay actividades registradas para este deal
              </p>
            ) : (
              <div className="space-y-3">
                {dealActivities.map((activity) => {
                  const config =
                    ACTIVITY_TYPE_CONFIG[
                      activity.type as keyof typeof ACTIVITY_TYPE_CONFIG
                    ];
                  return (
                    <div key={activity.id} className="flex gap-3 items-start">
                      <div className="rounded-full bg-muted p-2 shrink-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {config?.label || activity.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeDate(activity.createdAt as number | Date)}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{activity.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
