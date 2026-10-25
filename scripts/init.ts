#!/usr/bin/env npx tsx
// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2

/**
 * Auto-CRM initialization script.
 * Creates the database, seeds default pipeline stages,
 * and optionally seeds demo data.
 *
 * Usage:
 *   npx tsx scripts/init.ts          # Init only
 *   npx tsx scripts/init.ts --seed   # Init + demo data
 */

import crypto from "crypto";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "crm.db");
const shouldSeed = process.argv.includes("--seed");

// Ensure data directory
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log("Initializing Auto-CRM...");
console.log(`Database: ${DB_PATH}`);

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT NOT NULL DEFAULT 'otro',
    temperature TEXT NOT NULL DEFAULT 'cold',
    score INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pipeline_stages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    color TEXT NOT NULL DEFAULT '#64748b',
    is_won INTEGER NOT NULL DEFAULT 0,
    is_lost INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    value INTEGER NOT NULL DEFAULT 0,
    stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    expected_close INTEGER,
    probability INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_id TEXT NOT NULL REFERENCES contacts(id),
    deal_id TEXT REFERENCES deals(id),
    scheduled_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS crm_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

console.log("Tables created.");

// Seed default pipeline stages
const stageCount = sqlite
  .prepare("SELECT COUNT(*) as count FROM pipeline_stages")
  .get() as { count: number };

if (stageCount.count === 0) {
  const defaultStages = [
    { name: "Prospecto", order: 1, color: "#64748b", isWon: 0, isLost: 0 },
    { name: "Contactado", order: 2, color: "#2563eb", isWon: 0, isLost: 0 },
    { name: "Propuesta", order: 3, color: "#8b5cf6", isWon: 0, isLost: 0 },
    { name: "Negociacion", order: 4, color: "#ea580c", isWon: 0, isLost: 0 },
    { name: "Cerrado Ganado", order: 5, color: "#16a34a", isWon: 1, isLost: 0 },
    { name: "Cerrado Perdido", order: 6, color: "#dc2626", isWon: 0, isLost: 1 },
  ];

  const insert = sqlite.prepare(
    `INSERT INTO pipeline_stages (id, name, "order", color, is_won, is_lost) VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const stage of defaultStages) {
    insert.run(crypto.randomUUID(), stage.name, stage.order, stage.color, stage.isWon, stage.isLost);
  }
  console.log("Default pipeline stages created.");
} else {
  console.log("Pipeline stages already exist, skipping.");
}

// Copy default config if none exists
const configPath = path.join(process.cwd(), "crm-config.json");
const defaultConfigPath = path.join(process.cwd(), "public", "crm-config.json");
if (!fs.existsSync(configPath) && fs.existsSync(defaultConfigPath)) {
  fs.copyFileSync(defaultConfigPath, configPath);
  console.log("Default crm-config.json created.");
}

sqlite.close();

if (shouldSeed) {
  console.log("\nSeeding demo data...");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cp = require("child_process");
  cp.execSync("npx tsx src/db/seed.ts", { stdio: "inherit", cwd: process.cwd() });
}

console.log("\nAuto-CRM initialized successfully!");
console.log("Run 'npm run dev' to start the development server.");
console.log("Open http://localhost:3000 to access your CRM.");
