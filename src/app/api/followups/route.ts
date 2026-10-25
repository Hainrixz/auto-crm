// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import { NextResponse } from "next/server";
import { db } from "@/db";
import { activities, contacts } from "@/db/schema";
import { eq, isNull, asc } from "drizzle-orm";

export async function GET() {
  const pendingFollowups = db
    .select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      contactId: activities.contactId,
      dealId: activities.dealId,
      scheduledAt: activities.scheduledAt,
      completedAt: activities.completedAt,
      createdAt: activities.createdAt,
      contactName: contacts.name,
      contactCompany: contacts.company,
    })
    .from(activities)
    .leftJoin(contacts, eq(activities.contactId, contacts.id))
    .where(isNull(activities.completedAt))
    .orderBy(asc(activities.scheduledAt))
    .all();

  const now = Date.now() / 1000;

  const categorized = {
    overdue: pendingFollowups.filter((f) => {
      if (!f.scheduledAt) return false;
      const ts =
        typeof f.scheduledAt === "number"
          ? f.scheduledAt
          : f.scheduledAt.getTime() / 1000;
      return ts < now;
    }),
    today: pendingFollowups.filter((f) => {
      if (!f.scheduledAt) return false;
      const ts =
        typeof f.scheduledAt === "number"
          ? f.scheduledAt
          : f.scheduledAt.getTime() / 1000;
      const startOfDay = Math.floor(now / 86400) * 86400;
      const endOfDay = startOfDay + 86400;
      return ts >= startOfDay && ts < endOfDay;
    }),
    upcoming: pendingFollowups.filter((f) => {
      if (!f.scheduledAt) return false;
      const ts =
        typeof f.scheduledAt === "number"
          ? f.scheduledAt
          : f.scheduledAt.getTime() / 1000;
      const endOfDay = (Math.floor(now / 86400) + 1) * 86400;
      return ts >= endOfDay;
    }),
    unscheduled: pendingFollowups.filter((f) => !f.scheduledAt),
  };

  return NextResponse.json(categorized);
}
