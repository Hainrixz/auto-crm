// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pipelineStages, deals, contacts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
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

  const pipeline = stages.map((stage) => ({
    ...stage,
    deals: allDeals.filter((d) => d.stageId === stage.id),
  }));

  return NextResponse.json(pipeline);
}

export async function PUT(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  // Update a single deal's stage (drag and drop)
  if (body.dealId && body.stageId) {
    const existing = db.select().from(deals).where(eq(deals.id, body.dealId)).get();
    if (!existing) {
      return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 });
    }

    const result = db
      .update(deals)
      .set({ stageId: body.stageId, updatedAt: new Date() })
      .where(eq(deals.id, body.dealId))
      .returning()
      .get();

    return NextResponse.json(result);
  }

  // Bulk update stages (from /setup or /customize)
  if (body.stages && Array.isArray(body.stages)) {
    // Delete existing stages (only if no deals reference them)
    const existingDeals = db.select().from(deals).all();
    if (existingDeals.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se pueden reemplazar etapas cuando hay deals activos. Elimina los deals primero.",
        },
        { status: 400 }
      );
    }

    db.delete(pipelineStages).run();

    for (const stage of body.stages) {
      db.insert(pipelineStages)
        .values({
          name: stage.name,
          order: stage.order,
          color: stage.color || "#64748b",
          isWon: stage.isWon || false,
          isLost: stage.isLost || false,
        })
        .run();
    }

    const updated = db
      .select()
      .from(pipelineStages)
      .orderBy(asc(pipelineStages.order))
      .all();

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Request invalido" }, { status: 400 });
}
