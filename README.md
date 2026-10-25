<div align="center">

# Auto-CRM

### Tu CRM Local con Inteligencia Artificial | Your Local AI-Powered CRM

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Local-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Ready-DA7756)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Un CRM completo que corre 100% en tu maquina. Sin Salesforce. Sin HubSpot. Sin suscripciones.**

**A complete CRM that runs 100% on your machine. No Salesforce. No HubSpot. No subscriptions.**

[Espanol](#espanol) | [English](#english)

</div>

---

# Espanol

## Que es Auto-CRM?

Auto-CRM es un CRM open-source que se personaliza automaticamente a tu negocio. Abrelo con Claude Code, ejecuta `/setup`, y el CRM se adapta a tu industria, tu pipeline, y tu forma de trabajar. Todo corre en tu computadora — tus datos nunca salen de tu maquina.

## Por que Auto-CRM?

- **100% local** — Base de datos SQLite en tu computadora. Cero servicios externos. Tus datos son tuyos.
- **Se personaliza solo** — Ejecuta `/setup` y Claude adapta el pipeline, fuentes de leads, idioma y tema a tu negocio.
- **IA incluida** — Clasifica leads, analiza tu pipeline, sugiere proximos pasos. Sin necesidad de API key.
- **Gratis para siempre** — Open source. Sin suscripciones. Sin limites de contactos o deals.
- **Listo en 3 comandos** — Clona, instala, ejecuta. Tu CRM funcionando en menos de 2 minutos.

## Inicio Rapido

```bash
git clone https://github.com/Hainrixz/auto-crm.git
cd auto-crm && npm install
npm run dev
```

Abre **http://localhost:3000** — tu CRM esta listo.

```bash
# Opcional: cargar datos demo para explorar
npm run init:seed
```

## Personalizar con Claude Code

Abre el proyecto con Claude Code y escribe:

```
/setup
```

El asistente te pregunta:
1. Tipo de negocio e industria
2. Etapas de tu pipeline de ventas
3. De donde vienen tus leads
4. Idioma y tema visual

Y personaliza todo automaticamente.

## Funcionalidades

### Dashboard
Panel principal con KPIs en tiempo real: contactos totales, deals activos, valor en pipeline, leads calientes. Graficos de pipeline y actividad reciente.

### Pipeline Kanban
Tablero visual drag & drop. Arrastra deals entre etapas. Cada tarjeta muestra valor, contacto y temperatura del lead.

### Gestion de Contactos
Tabla con busqueda, filtros por temperatura (frio/tibio/caliente) y fuente. Score de cada lead. Click para ver detalle completo con historial.

### Acciones Rapidas
Botones de WhatsApp, llamada, y copiar directamente en cada contacto. Un click para abrir chat de WhatsApp o iniciar llamada.

### Seguimiento de Actividades
Timeline de todas las interacciones: llamadas, emails, reuniones, notas. Sistema de follow-ups con alertas para seguimientos vencidos.

### Clasificacion de Leads
Dos modos: reglas automaticas (sin API key) o IA con Claude (opcional). Score de 0-100 y temperatura automatica.

### Webhook
Recibe leads automaticamente desde formularios web (Typeform, Tally, Google Forms, Zapier). Soporta campos en espanol e ingles.

### Exportacion CSV
Descarga tus contactos y deals como CSV con un click. Compatible con Excel.

### Notificaciones
Banner en el dashboard para seguimientos vencidos. Notificaciones del navegador opcionales cada 5 minutos.

### Email Digest
Resumen diario por correo con seguimientos pendientes, leads calientes y metricas. Requiere Resend (gratis).

## Comandos de Claude Code

| Comando | Que hace |
|---------|----------|
| `/setup` | Personalizar CRM para tu negocio |
| `/add-lead` | Agregar un lead de forma conversacional |
| `/analyze-pipeline` | Analisis del pipeline con recomendaciones |
| `/daily-briefing` | Resumen ejecutivo del dia |
| `/import-contacts` | Importar contactos desde CSV |
| `/customize` | Cambiar configuracion |
| `/connect` | Conectar con Gmail, Calendar, Sheets, WhatsApp |
| `/digest` | Enviar resumen por email |

## Integraciones

### Webhook — Recibir leads automaticamente

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan","email":"juan@ejemplo.com","phone":"555-1234","company":"Mi Empresa"}'
```

Soporta campos en espanol (`nombre`, `correo`, `telefono`, `empresa`) y formato Typeform anidado.

### Exportar datos

```bash
# Descargar contactos como CSV
curl http://localhost:3000/api/export?type=contacts -o contactos.csv

# Descargar deals como CSV
curl http://localhost:3000/api/export?type=deals -o deals.csv
```

### MCP — Claude Desktop / Claude.ai

Conecta tu CRM directamente a Claude Desktop:

```json
{
  "mcpServers": {
    "auto-crm": {
      "command": "npx",
      "args": ["tsx", "/ruta/a/auto-crm/mcp/crm-server.ts"]
    }
  }
}
```

Ahora puedes decirle a Claude: *"Muestrame mis leads calientes"* o *"Agrega un contacto nuevo"* desde cualquier chat.

## Stack Tecnico

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Base de datos | SQLite + Drizzle ORM |
| Drag & Drop | @dnd-kit |
| Graficos | Recharts |
| IA | Claude API (opcional) |
| MCP | Servidor integrado |
| Contenedor | Docker |

## Despliegue

### Opcion 1 — Desarrollo local
```bash
npm run dev
```

### Opcion 2 — Produccion local
```bash
npm run local
```

### Opcion 3 — Docker
```bash
docker compose up -d
```

### Opcion 4 — MCP (Claude Desktop)
Agrega la configuracion MCP mostrada arriba a tu `claude_desktop_config.json`.

## Estructura del Proyecto

```
auto-crm/
├── CLAUDE.md                # Instrucciones para Claude Code
├── .claude/commands/        # 8 comandos interactivos
├── mcp/crm-server.ts        # Servidor MCP (10 herramientas)
├── scripts/init.ts          # Inicializacion de base de datos
├── src/
│   ├── app/                 # Paginas y 13 API routes
│   ├── components/          # 28 componentes React + 21 shadcn/ui
│   ├── db/                  # Schema SQLite + Drizzle ORM
│   ├── lib/                 # Utilidades (scoring, AI, constants)
│   └── types/               # TypeScript types
├── data/crm.db              # Base de datos (auto-generada)
├── Dockerfile               # Contenedor Docker
└── docker-compose.yml       # Docker Compose
```

## Variables de Entorno

Todas son **opcionales**. El CRM funciona completamente sin ninguna.

| Variable | Descripcion |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Clasificacion de leads con IA en la web |
| `RESEND_API_KEY` | Email digest diario (resend.com, gratis) |
| `DIGEST_EMAIL` | Email donde recibir el digest |
| `DIGEST_FROM` | Email remitente del digest |

## Modos de IA

| Modo | Requiere API Key | Como funciona |
|------|-----------------|---------------|
| **Terminal** | No | Comandos en Claude Code (`/add-lead`, `/analyze-pipeline`) |
| **MCP** | No | Claude Desktop/Web habla directo con tu CRM |
| **Web** | Si (opcional) | La interfaz web clasifica leads automaticamente |

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run local      # Build + produccion en un comando
npm run init       # Inicializar base de datos
npm run init:seed  # Inicializar + datos demo
npm run seed       # Solo datos demo
npm run mcp        # Servidor MCP para Claude Desktop
npm run build      # Build de produccion
npm start          # Servidor de produccion
npm run lint       # Verificar codigo
```

## Contribuir

1. Fork el repositorio
2. Crea tu branch (`git checkout -b feature/mi-feature`)
3. Haz commit de tus cambios (`git commit -m 'Agregar feature'`)
4. Push a tu branch (`git push origin feature/mi-feature`)
5. Abre un Pull Request

---

# English

## What is Auto-CRM?

Auto-CRM is an open-source CRM that automatically customizes itself to your business. Open it with Claude Code, run `/setup`, and the CRM adapts to your industry, pipeline, and workflow. Everything runs on your computer — your data never leaves your machine.

## Why Auto-CRM?

- **100% local** — SQLite database on your computer. Zero external services. Your data stays yours.
- **Self-customizing** — Run `/setup` and Claude adapts the pipeline, lead sources, language, and theme to your business.
- **AI included** — Classifies leads, analyzes your pipeline, suggests next steps. No API key required.
- **Free forever** — Open source. No subscriptions. No limits on contacts or deals.
- **Ready in 3 commands** — Clone, install, run. Your CRM working in under 2 minutes.

## Quick Start

```bash
git clone https://github.com/Hainrixz/auto-crm.git
cd auto-crm && npm install
npm run dev
```

Open **http://localhost:3000** — your CRM is ready.

```bash
# Optional: load demo data to explore
npm run init:seed
```

## Customize with Claude Code

Open the project with Claude Code and type:

```
/setup
```

The assistant asks about:
1. Business type and industry
2. Sales pipeline stages
3. Where your leads come from
4. Language and visual theme

And customizes everything automatically.

## Features

### Dashboard
Main panel with real-time KPIs: total contacts, active deals, pipeline value, hot leads. Pipeline charts and recent activity.

### Kanban Pipeline
Visual drag & drop board. Drag deals between stages. Each card shows value, contact, and lead temperature.

### Contact Management
Table with search, temperature filters (cold/warm/hot), and source filters. Lead score for each contact. Click for full detail with history.

### Quick Actions
WhatsApp, call, and copy buttons directly on each contact. One click to open WhatsApp chat or start a call.

### Activity Tracking
Timeline of all interactions: calls, emails, meetings, notes. Follow-up system with alerts for overdue items.

### Lead Classification
Two modes: automatic rules (no API key) or AI with Claude (optional). Score from 0-100 and automatic temperature.

### Webhook
Receive leads automatically from web forms (Typeform, Tally, Google Forms, Zapier). Supports fields in Spanish and English.

### CSV Export
Download your contacts and deals as CSV with one click. Excel compatible.

### Notifications
Dashboard banner for overdue follow-ups. Optional browser notifications every 5 minutes.

### Email Digest
Daily email summary with pending follow-ups, hot leads, and metrics. Requires Resend (free tier).

## Claude Code Commands

| Command | What it does |
|---------|-------------|
| `/setup` | Customize CRM for your business |
| `/add-lead` | Add a lead conversationally |
| `/analyze-pipeline` | Pipeline analysis with recommendations |
| `/daily-briefing` | Executive summary of the day |
| `/import-contacts` | Import contacts from CSV |
| `/customize` | Change configuration |
| `/connect` | Connect with Gmail, Calendar, Sheets, WhatsApp |
| `/digest` | Send summary via email |

## Integrations

### Webhook — Receive leads automatically

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","phone":"555-1234","company":"Acme Inc"}'
```

Supports Spanish field names (`nombre`, `correo`, `telefono`, `empresa`) and nested Typeform format.

### Export data

```bash
# Download contacts as CSV
curl http://localhost:3000/api/export?type=contacts -o contacts.csv

# Download deals as CSV
curl http://localhost:3000/api/export?type=deals -o deals.csv
```

### MCP — Claude Desktop / Claude.ai

Connect your CRM directly to Claude Desktop:

```json
{
  "mcpServers": {
    "auto-crm": {
      "command": "npx",
      "args": ["tsx", "/path/to/auto-crm/mcp/crm-server.ts"]
    }
  }
}
```

Now you can tell Claude: *"Show me my hot leads"* or *"Add a new contact"* from any chat.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite + Drizzle ORM |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| AI | Claude API (optional) |
| MCP | Built-in server |
| Container | Docker |

## Deployment

### Option 1 — Local development
```bash
npm run dev
```

### Option 2 — Local production
```bash
npm run local
```

### Option 3 — Docker
```bash
docker compose up -d
```

### Option 4 — MCP (Claude Desktop)
Add the MCP config shown above to your `claude_desktop_config.json`.

## Project Structure

```
auto-crm/
├── CLAUDE.md                # Instructions for Claude Code
├── .claude/commands/        # 8 interactive commands
├── mcp/crm-server.ts        # MCP server (10 tools)
├── scripts/init.ts          # Database initialization
├── src/
│   ├── app/                 # Pages and 13 API routes
│   ├── components/          # 28 React components + 21 shadcn/ui
│   ├── db/                  # SQLite schema + Drizzle ORM
│   ├── lib/                 # Utilities (scoring, AI, constants)
│   └── types/               # TypeScript types
├── data/crm.db              # Database (auto-generated)
├── Dockerfile               # Docker container
└── docker-compose.yml       # Docker Compose
```

## Environment Variables

All are **optional**. The CRM works completely without any of them.

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | AI lead classification in the web UI |
| `RESEND_API_KEY` | Daily email digest (resend.com, free) |
| `DIGEST_EMAIL` | Email address to receive digest |
| `DIGEST_FROM` | Sender email for digest |

## AI Modes

| Mode | Requires API Key | How it works |
|------|-----------------|--------------|
| **Terminal** | No | Commands in Claude Code (`/add-lead`, `/analyze-pipeline`) |
| **MCP** | No | Claude Desktop/Web talks directly to your CRM |
| **Web** | Yes (optional) | Web UI classifies leads automatically |

## Scripts

```bash
npm run dev        # Development server
npm run local      # Build + production in one command
npm run init       # Initialize database
npm run init:seed  # Initialize + demo data
npm run seed       # Demo data only
npm run mcp        # MCP server for Claude Desktop
npm run build      # Production build
npm start          # Production server
npm run lint       # Check code
```

## Contributing

1. Fork the repository
2. Create your branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to your branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

<div align="center">

**Auto-CRM** — Built with Claude Code for the community.

Your data. Your machine. Your CRM.

Tus datos. Tu maquina. Tu CRM.

</div>

<!-- marca-agua:inicio -->

---

<sub>Hecho por **Enrique Rocha (@soyenriquerocha)** · [tododeia.com](https://www.tododeia.com)⁠​‌‌​​‌​‌​‌‌‌​​‌​​​‌​‌‌​‌​​‌‌​​‌​​‌‌​​​​‌​‌‌​​‌‌​​‌‌​​​‌‌​‌‌​​‌​‌​​‌‌‌​​‌​‌‌​​‌​​​​‌‌​​‌​⁠</sub>
<!-- marca-agua:fin -->
