#!/usr/bin/env npx tsx
// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2

/**
 * Auto-CRM MCP Server
 *
 * Exposes CRM data as MCP tools so Claude (Desktop, Web, or Code)
 * can read and write CRM data directly — no API key needed.
 *
 * Add to your Claude Desktop config (claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "auto-crm": {
 *       "command": "npx",
 *       "args": ["tsx", "/path/to/auto-crm/mcp/crm-server.ts"],
 *       "env": {
 *         "CRM_DB_PATH": "/path/to/auto-crm/data/crm.db"
 *       }
 *     }
 *   }
 * }
 */

import crypto from "crypto";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.CRM_DB_PATH || path.join(process.cwd(), "data", "crm.db");

if (!fs.existsSync(DB_PATH)) {
  process.stderr.write(`Database not found at ${DB_PATH}. Run 'npm run init' first.\n`);
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: false, timeout: 5000 });
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// MCP Protocol implementation over stdio
interface MCPMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

const tools = [
  {
    name: "crm_list_contacts",
    description:
      "Lista todos los contactos del CRM. Puedes filtrar por temperatura (cold/warm/hot) o buscar por nombre.",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: { type: "string", description: "Buscar por nombre, email o empresa" },
        temperature: {
          type: "string",
          enum: ["cold", "warm", "hot"],
          description: "Filtrar por temperatura del lead",
        },
        limit: { type: "number", description: "Limite de resultados (default 50)" },
      },
    },
  },
  {
    name: "crm_get_contact",
    description: "Obtiene los detalles de un contacto especifico, incluyendo sus deals y actividades.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "ID del contacto" },
      },
      required: ["id"],
    },
  },
  {
    name: "crm_create_contact",
    description: "Crea un nuevo contacto/lead en el CRM.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Nombre completo" },
        email: { type: "string", description: "Email" },
        phone: { type: "string", description: "Telefono" },
        company: { type: "string", description: "Empresa" },
        source: {
          type: "string",
          enum: ["website", "whatsapp", "referido", "redes_sociales", "llamada_fria", "email", "formulario", "evento", "import", "webhook", "otro"],
          description: "Fuente del lead",
        },
        temperature: { type: "string", enum: ["cold", "warm", "hot"], description: "Temperatura" },
        notes: { type: "string", description: "Notas" },
      },
      required: ["name"],
    },
  },
  {
    name: "crm_list_deals",
    description: "Lista todos los deals/oportunidades del pipeline, con informacion del contacto y etapa.",
    inputSchema: {
      type: "object" as const,
      properties: {
        stageId: { type: "string", description: "Filtrar por ID de etapa" },
      },
    },
  },
  {
    name: "crm_create_deal",
    description: "Crea un nuevo deal/oportunidad de venta.",
    inputSchema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Titulo del deal" },
        value: { type: "number", description: "Valor en centavos (ej: 150000 = $1,500)" },
        contactId: { type: "string", description: "ID del contacto" },
        stageId: { type: "string", description: "ID de la etapa (si no se provee, usa la primera)" },
        probability: { type: "number", description: "Probabilidad de cierre 0-100" },
        notes: { type: "string", description: "Notas" },
      },
      required: ["title", "contactId"],
    },
  },
  {
    name: "crm_move_deal",
    description: "Mueve un deal a otra etapa del pipeline.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dealId: { type: "string", description: "ID del deal" },
        stageId: { type: "string", description: "ID de la nueva etapa" },
      },
      required: ["dealId", "stageId"],
    },
  },
  {
    name: "crm_log_activity",
    description: "Registra una actividad (llamada, email, reunion, nota, seguimiento) para un contacto.",
    inputSchema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: ["call", "email", "meeting", "note", "follow_up"],
          description: "Tipo de actividad",
        },
        description: { type: "string", description: "Descripcion de la actividad" },
        contactId: { type: "string", description: "ID del contacto" },
        dealId: { type: "string", description: "ID del deal (opcional)" },
        scheduledAt: { type: "string", description: "Fecha programada ISO 8601 (para follow-ups)" },
      },
      required: ["type", "description", "contactId"],
    },
  },
  {
    name: "crm_get_pipeline",
    description:
      "Obtiene el estado completo del pipeline: todas las etapas con sus deals. Ideal para analisis.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "crm_get_followups",
    description: "Obtiene todos los seguimientos pendientes, organizados por: vencidos, hoy, proximos.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "crm_get_stats",
    description:
      "Obtiene estadisticas del CRM: total contactos, deals activos, valor en pipeline, leads calientes, tasa de conversion.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// Tool handlers
function handleTool(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case "crm_list_contacts": {
      let sql = "SELECT * FROM contacts";
      const params: unknown[] = [];
      const conditions: string[] = [];

      if (args.search) {
        conditions.push("(name LIKE ? OR email LIKE ? OR company LIKE ?)");
        const search = `%${args.search}%`;
        params.push(search, search, search);
      }
      if (args.temperature) {
        conditions.push("temperature = ?");
        params.push(args.temperature);
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      sql += " ORDER BY created_at DESC";
      sql += ` LIMIT ${Number(args.limit) || 50}`;

      return db.prepare(sql).all(...params);
    }

    case "crm_get_contact": {
      const contact = db.prepare("SELECT * FROM contacts WHERE id = ?").get(args.id);
      if (!contact) return { error: "Contacto no encontrado" };

      const deals = db
        .prepare(
          `SELECT d.*, ps.name as stage_name, ps.color as stage_color
           FROM deals d LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
           WHERE d.contact_id = ?`
        )
        .all(args.id);

      const activities = db
        .prepare("SELECT * FROM activities WHERE contact_id = ? ORDER BY created_at DESC")
        .all(args.id);

      return { ...(contact as object), deals, activities };
    }

    case "crm_create_contact": {
      const now = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();

      db.prepare(
        `INSERT INTO contacts (id, name, email, phone, company, source, temperature, score, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
      ).run(
        id,
        args.name,
        args.email || null,
        args.phone || null,
        args.company || null,
        args.source || "otro",
        args.temperature || "cold",
        args.notes || null,
        now,
        now
      );

      return { id, message: `Contacto "${args.name}" creado exitosamente` };
    }

    case "crm_list_deals": {
      let sql = `
        SELECT d.*, c.name as contact_name, c.temperature as contact_temperature,
               ps.name as stage_name, ps.color as stage_color, ps."order" as stage_order
        FROM deals d
        LEFT JOIN contacts c ON d.contact_id = c.id
        LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      `;
      const params: unknown[] = [];

      if (args.stageId) {
        sql += " WHERE d.stage_id = ?";
        params.push(args.stageId);
      }
      sql += ' ORDER BY ps."order", d.created_at DESC';

      return db.prepare(sql).all(...params);
    }

    case "crm_create_deal": {
      const now = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();

      let stageId = args.stageId as string;
      if (!stageId) {
        const firstStage = db
          .prepare('SELECT id FROM pipeline_stages ORDER BY "order" LIMIT 1')
          .get() as { id: string } | undefined;
        if (!firstStage) return { error: "No hay etapas de pipeline" };
        stageId = firstStage.id;
      }

      db.prepare(
        `INSERT INTO deals (id, title, value, stage_id, contact_id, probability, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        args.title,
        Number(args.value) || 0,
        stageId,
        args.contactId,
        Number(args.probability) || 0,
        args.notes || null,
        now,
        now
      );

      return { id, message: `Deal "${args.title}" creado exitosamente` };
    }

    case "crm_move_deal": {
      const now = Math.floor(Date.now() / 1000);
      db.prepare("UPDATE deals SET stage_id = ?, updated_at = ? WHERE id = ?").run(
        args.stageId,
        now,
        args.dealId
      );
      return { message: "Deal movido exitosamente" };
    }

    case "crm_log_activity": {
      const now = Math.floor(Date.now() / 1000);
      const id = crypto.randomUUID();
      const scheduledAt = args.scheduledAt
        ? Math.floor(new Date(args.scheduledAt as string).getTime() / 1000)
        : null;

      db.prepare(
        `INSERT INTO activities (id, type, description, contact_id, deal_id, scheduled_at, completed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`
      ).run(id, args.type, args.description, args.contactId, args.dealId || null, scheduledAt, now);

      return { id, message: "Actividad registrada exitosamente" };
    }

    case "crm_get_pipeline": {
      const stages = db
        .prepare('SELECT * FROM pipeline_stages ORDER BY "order"')
        .all() as Array<Record<string, unknown>>;

      const deals = db
        .prepare(
          `SELECT d.*, c.name as contact_name, c.temperature as contact_temperature
           FROM deals d LEFT JOIN contacts c ON d.contact_id = c.id`
        )
        .all() as Array<Record<string, unknown>>;

      return stages.map((stage) => ({
        ...stage,
        deals: deals.filter((d) => d.stage_id === stage.id),
      }));
    }

    case "crm_get_followups": {
      const pending = db
        .prepare(
          `SELECT a.*, c.name as contact_name, c.company as contact_company
           FROM activities a
           LEFT JOIN contacts c ON a.contact_id = c.id
           WHERE a.completed_at IS NULL
           ORDER BY a.scheduled_at ASC`
        )
        .all() as Array<Record<string, unknown>>;

      const now = Math.floor(Date.now() / 1000);
      const startOfDay = Math.floor(now / 86400) * 86400;
      const endOfDay = startOfDay + 86400;

      return {
        overdue: pending.filter((f) => f.scheduled_at && (f.scheduled_at as number) < startOfDay),
        today: pending.filter(
          (f) => f.scheduled_at && (f.scheduled_at as number) >= startOfDay && (f.scheduled_at as number) < endOfDay
        ),
        upcoming: pending.filter((f) => f.scheduled_at && (f.scheduled_at as number) >= endOfDay),
        unscheduled: pending.filter((f) => !f.scheduled_at),
      };
    }

    case "crm_get_stats": {
      const totalContacts = (
        db.prepare("SELECT COUNT(*) as count FROM contacts").get() as { count: number }
      ).count;

      const stages = db.prepare("SELECT * FROM pipeline_stages").all() as Array<
        Record<string, unknown>
      >;
      const wonStageIds = stages.filter((s) => s.is_won).map((s) => s.id);
      const lostStageIds = stages.filter((s) => s.is_lost).map((s) => s.id);
      const closedIds = [...wonStageIds, ...lostStageIds];

      const allDeals = db.prepare("SELECT * FROM deals").all() as Array<Record<string, unknown>>;
      const activeDeals = allDeals.filter((d) => !closedIds.includes(d.stage_id as string));
      const wonDeals = allDeals.filter((d) => wonStageIds.includes(d.stage_id as string));

      const hotLeads = (
        db
          .prepare("SELECT COUNT(*) as count FROM contacts WHERE temperature = 'hot'")
          .get() as { count: number }
      ).count;

      return {
        totalContacts,
        activeDeals: activeDeals.length,
        totalPipelineValue: activeDeals.reduce((sum, d) => sum + (d.value as number), 0),
        wonDealsValue: wonDeals.reduce((sum, d) => sum + (d.value as number), 0),
        wonDealsCount: wonDeals.length,
        totalDeals: allDeals.length,
        conversionRate: allDeals.length > 0 ? Math.round((wonDeals.length / allDeals.length) * 100) : 0,
        hotLeads,
      };
    }

    default:
      return { error: `Tool ${name} not found` };
  }
}

// MCP stdio transport
let buffer = "";

process.stdin.setEncoding("utf-8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;

  // Process complete messages (newline-delimited JSON)
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg: MCPMessage = JSON.parse(line);
      const response = handleMessage(msg);
      if (response) {
        process.stdout.write(JSON.stringify(response) + "\n");
      }
    } catch (e) {
      process.stderr.write(`Error parsing message: ${e}\n`);
    }
  }
});

function handleMessage(msg: MCPMessage): MCPMessage | null {
  if (!msg.method) return null;

  switch (msg.method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: msg.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "auto-crm",
            version: "1.0.0",
          },
        },
      };

    case "notifications/initialized":
      return null;

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id: msg.id,
        result: { tools },
      };

    case "tools/call": {
      const params = msg.params as { name: string; arguments?: Record<string, unknown> };
      try {
        const result = handleTool(params.name, params.arguments || {});
        return {
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (e) {
        return {
          jsonrpc: "2.0",
          id: msg.id,
          result: {
            content: [
              {
                type: "text",
                text: `Error: ${e instanceof Error ? e.message : String(e)}`,
              },
            ],
            isError: true,
          },
        };
      }
    }

    default:
      return {
        jsonrpc: "2.0",
        id: msg.id,
        error: { code: -32601, message: `Method not found: ${msg.method}` },
      };
  }
}

process.stderr.write("Auto-CRM MCP Server running\n");
