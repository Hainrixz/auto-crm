// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, activities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { classifyLead, isAIEnabled } from "@/lib/claude";
import { calculateLeadScore, suggestTemperature } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }
  const { contactId } = body;

  if (!contactId) {
    return NextResponse.json(
      { error: "contactId es requerido" },
      { status: 400 }
    );
  }

  const contact = db
    .select()
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .get();

  if (!contact) {
    return NextResponse.json(
      { error: "Contacto no encontrado" },
      { status: 404 }
    );
  }

  const contactActivities = db
    .select()
    .from(activities)
    .where(eq(activities.contactId, contactId))
    .all();

  if (isAIEnabled()) {
    try {
      const result = await classifyLead(
        {
          name: contact.name,
          company: contact.company || undefined,
          source: contact.source,
          notes: contact.notes || undefined,
        },
        contactActivities.map((a) => ({
          type: a.type as "call" | "email" | "meeting" | "note" | "follow_up",
          description: a.description,
          date: a.createdAt
            ? new Date(
                typeof a.createdAt === "number"
                  ? a.createdAt * 1000
                  : a.createdAt
              ).toISOString()
            : "unknown",
        }))
      );

      // Update contact with AI classification
      db.update(contacts)
        .set({
          temperature: result.temperature,
          score: result.score,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, contactId))
      .run();

      return NextResponse.json({
        ...result,
        mode: "ai",
      });
    } catch {
      // AI failed — fall through to rule-based scoring below
    }
  }

  // Rule-based fallback
  const lastActivity = contactActivities.sort((a, b) => {
    const aTime =
      typeof a.createdAt === "number"
        ? a.createdAt
        : a.createdAt?.getTime() || 0;
    const bTime =
      typeof b.createdAt === "number"
        ? b.createdAt
        : b.createdAt?.getTime() || 0;
    return bTime - aTime;
  })[0];

  const daysSinceLastActivity = lastActivity
    ? Math.floor(
        (Date.now() -
          (typeof lastActivity.createdAt === "number"
            ? lastActivity.createdAt * 1000
            : lastActivity.createdAt?.getTime() || Date.now())) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  const score = calculateLeadScore({
    temperature: contact.temperature as "cold" | "warm" | "hot",
    hasEmail: !!contact.email,
    hasPhone: !!contact.phone,
    hasCompany: !!contact.company,
    activityCount: contactActivities.length,
    daysSinceLastActivity,
    hasDeals: false,
    dealValue: 0,
  });

  const temperature = suggestTemperature(score);

  db.update(contacts)
    .set({ temperature, score, updatedAt: new Date() })
    .where(eq(contacts.id, contactId))
    .run();

  return NextResponse.json({
    temperature,
    score,
    nextAction: "Revisar manualmente y dar seguimiento",
    reasoning: "Clasificacion basada en reglas (sin API key)",
    mode: "rules",
  });
}
