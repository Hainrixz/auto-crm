// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "crm.db");

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("Seeding database...");

// Get pipeline stages
const stages = sqlite
  .prepare('SELECT id, name FROM pipeline_stages ORDER BY "order"')
  .all() as Array<{ id: string; name: string }>;

if (stages.length === 0) {
  console.error(
    "No pipeline stages found. Run the app first to create default stages."
  );
  process.exit(1);
}

const stageMap = new Map(stages.map((s) => [s.name, s.id]));
const now = Math.floor(Date.now() / 1000);
const day = 86400;

// Seed contacts
const contacts = [
  {
    id: crypto.randomUUID(),
    name: "Maria Garcia",
    email: "maria@techstartup.mx",
    phone: "+52 55 1234 5678",
    company: "TechStartup MX",
    source: "website",
    temperature: "hot",
    score: 85,
    notes: "Interesada en plan empresarial. Tiene equipo de 15 personas.",
    created_at: now - 5 * day,
    updated_at: now - 1 * day,
  },
  {
    id: crypto.randomUUID(),
    name: "Carlos Rodriguez",
    email: "carlos@inmobiliaria.com",
    phone: "+52 33 9876 5432",
    company: "Inmobiliaria Rodriguez",
    source: "referido",
    temperature: "warm",
    score: 60,
    notes: "Referido por Juan. Busca automatizar seguimiento de clientes.",
    created_at: now - 10 * day,
    updated_at: now - 3 * day,
  },
  {
    id: crypto.randomUUID(),
    name: "Ana Martinez",
    email: "ana@consultoria.mx",
    phone: "+52 81 5555 1234",
    company: "Martinez Consultores",
    source: "redes_sociales",
    temperature: "warm",
    score: 55,
    notes: "Nos contacto por LinkedIn. Consultoria de RRHH.",
    created_at: now - 7 * day,
    updated_at: now - 2 * day,
  },
  {
    id: crypto.randomUUID(),
    name: "Roberto Sanchez",
    email: "roberto@tienda.com",
    phone: "+52 55 7777 8888",
    company: "Tienda en Linea SA",
    source: "formulario",
    temperature: "cold",
    score: 25,
    notes: "Lleno formulario web. E-commerce de ropa.",
    created_at: now - 15 * day,
    updated_at: now - 15 * day,
  },
  {
    id: crypto.randomUUID(),
    name: "Laura Hernandez",
    email: "laura@agencia.mx",
    phone: "+52 33 4444 5555",
    company: "Agencia Creativa",
    source: "evento",
    temperature: "hot",
    score: 90,
    notes:
      "Conocida en evento de networking. Muy interesada, pidio demo inmediata.",
    created_at: now - 3 * day,
    updated_at: now,
  },
];

const insertContact = sqlite.prepare(
  `INSERT OR IGNORE INTO contacts (id, name, email, phone, company, source, temperature, score, notes, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const c of contacts) {
  insertContact.run(
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company,
    c.source,
    c.temperature,
    c.score,
    c.notes,
    c.created_at,
    c.updated_at
  );
}

console.log(`Created ${contacts.length} contacts`);

// Seed deals
const dealData = [
  {
    id: crypto.randomUUID(),
    title: "Plan Empresarial - TechStartup MX",
    value: 250000, // $2,500.00
    stage_id: stageMap.get("Propuesta") || stages[2].id,
    contact_id: contacts[0].id,
    expected_close: now + 15 * day,
    probability: 70,
    notes: "Enviamos propuesta. Esperando respuesta del director.",
    created_at: now - 4 * day,
    updated_at: now - 1 * day,
  },
  {
    id: crypto.randomUUID(),
    title: "CRM Personalizado - Inmobiliaria",
    value: 180000, // $1,800.00
    stage_id: stageMap.get("Contactado") || stages[1].id,
    contact_id: contacts[1].id,
    expected_close: now + 30 * day,
    probability: 40,
    notes: "Primera llamada realizada. Agendamos demo para la proxima semana.",
    created_at: now - 8 * day,
    updated_at: now - 3 * day,
  },
  {
    id: crypto.randomUUID(),
    title: "Servicio Premium - Agencia Creativa",
    value: 450000, // $4,500.00
    stage_id: stageMap.get("Negociacion") || stages[3].id,
    contact_id: contacts[4].id,
    expected_close: now + 7 * day,
    probability: 85,
    notes: "Negociando precio. Muy probable que cierre esta semana.",
    created_at: now - 2 * day,
    updated_at: now,
  },
];

const insertDeal = sqlite.prepare(
  `INSERT OR IGNORE INTO deals (id, title, value, stage_id, contact_id, expected_close, probability, notes, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const d of dealData) {
  insertDeal.run(
    d.id,
    d.title,
    d.value,
    d.stage_id,
    d.contact_id,
    d.expected_close,
    d.probability,
    d.notes,
    d.created_at,
    d.updated_at
  );
}

console.log(`Created ${dealData.length} deals`);

// Seed activities
const activityData = [
  {
    id: crypto.randomUUID(),
    type: "email",
    description:
      "Envio de propuesta comercial con pricing y features del plan empresarial.",
    contact_id: contacts[0].id,
    deal_id: dealData[0].id,
    scheduled_at: null,
    completed_at: now - 2 * day,
    created_at: now - 2 * day,
  },
  {
    id: crypto.randomUUID(),
    type: "call",
    description:
      "Llamada de introduccion. Carlos mostro interes en automatizar su proceso.",
    contact_id: contacts[1].id,
    deal_id: dealData[1].id,
    scheduled_at: null,
    completed_at: now - 5 * day,
    created_at: now - 5 * day,
  },
  {
    id: crypto.randomUUID(),
    type: "meeting",
    description:
      "Reunion presencial en evento de networking. Intercambiamos tarjetas.",
    contact_id: contacts[4].id,
    deal_id: dealData[2].id,
    scheduled_at: null,
    completed_at: now - 3 * day,
    created_at: now - 3 * day,
  },
  {
    id: crypto.randomUUID(),
    type: "follow_up",
    description:
      "Dar seguimiento a Maria sobre la propuesta enviada. Preguntar si tiene dudas.",
    contact_id: contacts[0].id,
    deal_id: dealData[0].id,
    scheduled_at: now + 1 * day,
    completed_at: null,
    created_at: now,
  },
  {
    id: crypto.randomUUID(),
    type: "follow_up",
    description: "Agendar demo con Carlos para mostrar el CRM personalizado.",
    contact_id: contacts[1].id,
    deal_id: dealData[1].id,
    scheduled_at: now + 3 * day,
    completed_at: null,
    created_at: now,
  },
  {
    id: crypto.randomUUID(),
    type: "note",
    description:
      "Roberto parece no estar listo para comprar. Agregar a newsletter y dar seguimiento en 30 dias.",
    contact_id: contacts[3].id,
    deal_id: null,
    scheduled_at: null,
    completed_at: now - 10 * day,
    created_at: now - 10 * day,
  },
];

const insertActivity = sqlite.prepare(
  `INSERT OR IGNORE INTO activities (id, type, description, contact_id, deal_id, scheduled_at, completed_at, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);

for (const a of activityData) {
  insertActivity.run(
    a.id,
    a.type,
    a.description,
    a.contact_id,
    a.deal_id,
    a.scheduled_at,
    a.completed_at,
    a.created_at
  );
}

console.log(`Created ${activityData.length} activities`);
console.log("Seed complete!");

sqlite.close();
