// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals, contacts, pipelineStages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const results = db
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
      contactEmail: contacts.email,
      contactTemperature: contacts.temperature,
      stageName: pipelineStages.name,
      stageColor: pipelineStages.color,
      stageOrder: pipelineStages.order,
      stageIsWon: pipelineStages.isWon,
      stageIsLost: pipelineStages.isLost,
    })
    .from(deals)
    .leftJoin(contacts, eq(deals.contactId, contacts.id))
    .leftJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
    .orderBy(desc(deals.createdAt))
    .all();

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }
  const { title, value, stageId, contactId, expectedClose, probability, notes } = body;

  if (!title || !contactId) {
    return NextResponse.json(
      { error: "Titulo y contacto son requeridos" },
      { status: 400 }
    );
  }

  // Get first stage if none provided
  let finalStageId = stageId;
  if (!finalStageId) {
    const firstStage = db
      .select()
      .from(pipelineStages)
      .orderBy(pipelineStages.order)
      .limit(1)
      .get();
    finalStageId = firstStage?.id;
  }

  if (!finalStageId) {
    return NextResponse.json(
      { error: "No hay etapas de pipeline configuradas" },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const result = db
      .insert(deals)
      .values({
        title,
        value: value || 0,
        stageId: finalStageId,
        contactId,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        probability: Math.max(0, Math.min(100, Number(probability) || 0)),
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    if (msg.includes("FOREIGN KEY")) {
      return NextResponse.json(
        { error: "Contacto no encontrado" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Error al crear deal: ${msg}` },
      { status: 500 }
    );
  }
}
