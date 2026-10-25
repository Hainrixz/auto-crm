// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  try {
    const existing = db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.completedAt !== undefined) {
      if (body.completedAt === null || body.completedAt === true) {
        updateData.completedAt = new Date();
      } else if (typeof body.completedAt === "string") {
        const parsed = new Date(body.completedAt);
        if (isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: "completedAt debe ser una fecha valida" },
            { status: 400 }
          );
        }
        updateData.completedAt = parsed;
      }
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string" || !body.description.trim()) {
        return NextResponse.json(
          { error: "description debe ser un texto no vacio" },
          { status: 400 }
        );
      }
      updateData.description = body.description;
    }

    if (body.scheduledAt !== undefined) {
      if (body.scheduledAt === null) {
        updateData.scheduledAt = null;
      } else if (typeof body.scheduledAt === "string") {
        const parsed = new Date(body.scheduledAt);
        if (isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: "scheduledAt debe ser una fecha valida" },
            { status: 400 }
          );
        }
        updateData.scheduledAt = parsed;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay campos para actualizar" },
        { status: 400 }
      );
    }

    const result = db
      .update(activities)
      .set(updateData)
      .where(eq(activities.id, id))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: `Error al actualizar: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = db
      .select()
      .from(activities)
      .where(eq(activities.id, id))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: "Actividad no encontrada" },
        { status: 404 }
      );
    }

    db.delete(activities).where(eq(activities.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Error al eliminar: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
