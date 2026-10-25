// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  Kanban,
  Terminal,
  Zap,
  Webhook,
  Bell,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationToggle } from "@/components/shared/NotificationToggle";
import type { CrmConfig } from "@/types";

export default function SettingsPage() {
  const [config, setConfig] = useState<CrmConfig | null>(null);
  const [stages, setStages] = useState<
    Array<{ id: string; name: string; color: string; order: number }>
  >([]);

  useEffect(() => {
    fetch("/crm-config.json")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => {});

    fetch("/api/pipeline")
      .then((r) => r.json())
      .then(setStages);
  }, []);

  const commands = [
    {
      name: "/setup",
      description: "Configurar CRM para tu negocio",
    },
    {
      name: "/add-lead",
      description: "Agregar un lead de forma conversacional",
    },
    {
      name: "/analyze-pipeline",
      description: "Analizar pipeline y obtener recomendaciones",
    },
    {
      name: "/daily-briefing",
      description: "Resumen diario de ventas",
    },
    {
      name: "/import-contacts",
      description: "Importar contactos desde CSV",
    },
    {
      name: "/customize",
      description: "Re-personalizar tu CRM",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Configuracion del CRM y comandos disponibles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business config */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {config ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="capitalize">{config.business.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Industria</span>
                  <span className="capitalize">{config.business.industry}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equipo</span>
                  <span>{config.business.teamSize}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Idioma</span>
                  <span>
                    {config.preferences.language === "es" ? "Espanol" : "Ingles"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tema</span>
                  <span className="capitalize">{config.preferences.theme}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Ejecuta <code>/setup</code> en Claude Code para configurar tu
                negocio.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pipeline stages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Etapas del Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-sm flex-1">{stage.name}</span>
                  <Badge variant="outline" className="text-xs">
                    #{stage.order}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Usa <code>/customize</code> en Claude Code para modificar las
              etapas.
            </p>
          </CardContent>
        </Card>

        {/* Webhook config */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recibe leads automaticamente desde formularios, landing pages, o cualquier herramienta que soporte webhooks.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted p-2 rounded font-mono truncate">
                  POST {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/api/webhook`
                    );
                    toast.success("URL copiada");
                  }}
                  className="p-2 rounded hover:bg-muted cursor-pointer"
                  title="Copiar URL"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-xs font-mono">
                <p className="text-muted-foreground mb-1">Ejemplo:</p>
                <p>curl -X POST {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/webhook \</p>
                <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
                <p className="pl-4">-d &apos;{`{"name":"Juan","email":"j@test.com","phone":"555-1234"}`}&apos;</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Soporta campos en espanol e ingles: name/nombre, email/correo, phone/telefono, company/empresa, notes/notas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <NotificationToggle />
            <p className="text-xs text-muted-foreground">
              Las notificaciones te avisan cuando tienes seguimientos vencidos. Se verifican cada 5 minutos mientras el CRM esta abierto.
            </p>
          </CardContent>
        </Card>

        {/* Claude Code commands */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Comandos de Claude Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Estos comandos estan disponibles cuando abres el proyecto en Claude
              Code. Escribe el comando directamente en el terminal de Claude
              Code.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <code className="text-sm font-semibold">{cmd.name}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cmd.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
