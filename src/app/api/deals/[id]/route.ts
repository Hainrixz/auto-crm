// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const deal = db.select().from(deals).where(eq(deals.id, id)).get();

  if (!deal) {
    return NextResponse.json(
      { error: "Deal no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(deal);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  const existing = db.select().from(deals).where(eq(deals.id, id)).get();

  if (!existing) {
    return NextResponse.json(
      { error: "Deal no encontrado" },
      { status: 404 }
    );
  }

  // Only allow updating specific fields
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updateData.title = body.title;
  if (body.value !== undefined) updateData.value = body.value;
  if (body.stageId !== undefined) updateData.stageId = body.stageId;
  if (body.contactId !== undefined) updateData.contactId = body.contactId;
  if (body.expectedClose !== undefined) {
    updateData.expectedClose = body.expectedClose ? new Date(body.expectedClose) : null;
  }
  if (body.probability !== undefined) {
    updateData.probability = Math.max(0, Math.min(100, Number(body.probability)));
  }
  if (body.notes !== undefined) updateData.notes = body.notes;

  const result = db
    .update(deals)
    .set(updateData)
    .where(eq(deals.id, id))
    .returning()
    .get();

  return NextResponse.json(result);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = db.select().from(deals).where(eq(deals.id, id)).get();

  if (!existing) {
    return NextResponse.json(
      { error: "Deal no encontrado" },
      { status: 404 }
    );
  }

  db.delete(deals).where(eq(deals.id, id)).run();
  return NextResponse.json({ success: true });
}
