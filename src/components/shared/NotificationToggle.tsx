// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

function getInitialState() {
  if (typeof window === "undefined") return { supported: false, enabled: false };
  if (!("Notification" in window)) return { supported: false, enabled: false };
  return {
    supported: true,
    enabled: localStorage.getItem("crm-notifications") === "true",
  };
}

export function NotificationToggle() {
  const initial = getInitialState();
  const [enabled, setEnabled] = useState(initial.enabled);
  const supported = initial.supported;

  const toggle = async () => {
    if (!supported) {
      toast.error("Tu navegador no soporta notificaciones");
      return;
    }

    if (!enabled) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        localStorage.setItem("crm-notifications", "true");
        setEnabled(true);
        toast.success("Notificaciones activadas");

        // Show test notification
        new Notification("Auto-CRM", {
          body: "Las notificaciones estan activas. Te avisaremos de seguimientos pendientes.",
        });
      } else {
        toast.error("Permiso de notificaciones denegado");
      }
    } else {
      localStorage.setItem("crm-notifications", "false");
      setEnabled(false);
      toast.success("Notificaciones desactivadas");
    }
  };

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium">
            Notificaciones del navegador
          </p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? "Recibiras alertas de seguimientos vencidos"
              : "Activa para recibir alertas de seguimientos"}
          </p>
        </div>
      </div>
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={toggle}
        className="cursor-pointer"
      >
        {enabled ? "Desactivar" : "Activar"}
      </Button>
    </div>
  );
}
