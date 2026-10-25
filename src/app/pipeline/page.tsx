// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { db } from "@/db";
import { pipelineStages, deals, contacts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import type { PipelineColumn } from "@/types";

export const dynamic = "force-dynamic";

export default function PipelinePage() {
  const stages = db
    .select()
    .from(pipelineStages)
    .orderBy(asc(pipelineStages.order))
    .all();

  const allDeals = db
    .select({
      id: deals.id,
      title: deals.title,
      value: deals.value,
      stageId: deals.stageId,
      contactId: deals.contactId,
      expectedClose: deals.expectedClose,
      probability: deals.probability,
      notes: deals.notes,
      createdAt: deals.createdAt,
      updatedAt: deals.updatedAt,
      contactName: contacts.name,
      contactTemperature: contacts.temperature,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .all();

  const columns: PipelineColumn[] = stages.map((stage) => ({
    ...stage,
    deals: allDeals
      .filter((d) => d.stageId === stage.id)
      .map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        stageId: d.stageId,
        contactId: d.contactId,
        expectedClose: d.expectedClose,
        probability: d.probability,
        notes: d.notes,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        contactName: d.contactName,
        contactTemperature: d.contactTemperature,
      })) as PipelineColumn["deals"],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Arrastra y suelta deals entre etapas
        </p>
      </div>

      <KanbanBoard initialColumns={columns} />
    </div>
  );
}
