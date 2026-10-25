// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, deals, activities, pipelineStages } from "@/db/schema";
import { eq, asc, isNull } from "drizzle-orm";
import { formatCurrency } from "@/lib/constants";

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  const email = process.env.DIGEST_EMAIL;

  if (!apiKey || !email) {
    return NextResponse.json(
      {
        error: "Email digest no configurado",
        instructions: [
          "1. Registrate en https://resend.com (gratis)",
          "2. Crea un API key en el dashboard",
          "3. Agrega a .env.local:",
          "   RESEND_API_KEY=re_...",
          "   DIGEST_EMAIL=tu@email.com",
          "4. Reinicia el servidor dev",
        ],
      },
      { status: 400 }
    );
  }

  // Gather data
  const allContacts = db.select().from(contacts).all();
  const allDeals = db.select().from(deals).all();
  const stages = db
    .select()
    .from(pipelineStages)
    .orderBy(asc(pipelineStages.order))
    .all();

  const pendingActivities = db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      scheduledAt: activities.scheduledAt,
      contactName: contacts.name,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .where(isNull(activities.completedAt))
    .all();

  const now = Math.floor(Date.now() / 1000);
  const overdue = pendingActivities.filter(
    (a) => a.scheduledAt && (typeof a.scheduledAt === "number" ? a.scheduledAt : Math.floor(a.scheduledAt.getTime() / 1000)) < now
  );

  const hotLeads = allContacts.filter((c) => c.temperature === "hot");
  const activeDeals = allDeals.filter((d) => {
    const stage = stages.find((s) => s.id === d.stageId);
    return stage && !stage.isWon && !stage.isLost;
  });
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  // Build HTML email
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1e293b; font-size: 24px; margin-bottom: 4px;">Auto-CRM</h1>
      <p style="color: #64748b; margin-top: 0;">Resumen diario — ${new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />

      ${overdue.length > 0 ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h2 style="color: #dc2626; font-size: 16px; margin: 0 0 8px;">Seguimientos vencidos (${overdue.length})</h2>
          <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
            ${overdue.map((a) => `<li>${a.description} — ${a.contactName || "Sin contacto"}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${allContacts.length}</div>
          <div style="font-size: 12px; color: #64748b;">Contactos</div>
        </div>
        <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${activeDeals.length}</div>
          <div style="font-size: 12px; color: #64748b;">Deals activos</div>
        </div>
        <div style="flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${formatCurrency(pipelineValue)}</div>
          <div style="font-size: 12px; color: #64748b;">En pipeline</div>
        </div>
      </div>

      ${hotLeads.length > 0 ? `
        <h3 style="color: #1e293b; font-size: 14px;">Leads calientes (${hotLeads.length})</h3>
        <ul style="color: #334155; font-size: 14px; padding-left: 20px;">
          ${hotLeads.map((c) => `<li>${c.name}${c.company ? ` — ${c.company}` : ""}</li>`).join("")}
        </ul>
      ` : ""}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Auto-CRM — Tu CRM local con IA
      </p>
    </div>
  `;

  // Send via Resend
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.DIGEST_FROM || "Auto-CRM <onboarding@resend.dev>",
        to: [email],
        subject: `CRM Digest: ${overdue.length > 0 ? `${overdue.length} vencidos` : `${activeDeals.length} deals activos`}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Error de Resend: ${err}` },
        { status: 500 }
      );
    }

    const result = await res.json();
    return NextResponse.json({
      success: true,
      emailId: result.id,
      sentTo: email,
      summary: {
        overdue: overdue.length,
        hotLeads: hotLeads.length,
        activeDeals: activeDeals.length,
        pipelineValue,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Error enviando email: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
