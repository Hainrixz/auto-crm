// Copyright (c) 2026 Enrique Rocha (@soyenriquerocha)
// SPDX-License-Identifier: MIT
// id: er-2afce9d2
import Anthropic from "@anthropic-ai/sdk";
import type { Temperature, ActivityType } from "@/types";

const apiKey = process.env.ANTHROPIC_API_KEY;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!apiKey) return null;
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function isAIEnabled(): boolean {
  return !!apiKey;
}

interface ClassifyResult {
  temperature: Temperature;
  score: number;
  nextAction: string;
  reasoning: string;
}

export async function classifyLead(
  contactInfo: {
    name: string;
    company?: string;
    source?: string;
    notes?: string;
  },
  interactionHistory: Array<{
    type: ActivityType;
    description: string;
    date: string;
  }>
): Promise<ClassifyResult> {
  const anthropic = getClient();
  if (!anthropic) {
    return {
      temperature: "cold",
      score: 25,
      nextAction: "Enviar email de introduccion",
      reasoning: "Clasificacion por defecto (sin API key configurada)",
    };
  }

  const historyText = interactionHistory
    .map((i) => `- ${i.date}: [${i.type}] ${i.description}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: `Analiza este lead y clasifica su temperatura. Responde SOLO con JSON valido.

Contacto:
- Nombre: ${contactInfo.name}
- Empresa: ${contactInfo.company || "No especificada"}
- Fuente: ${contactInfo.source || "No especificada"}
- Notas: ${contactInfo.notes || "Sin notas"}

Historial de interacciones:
${historyText || "Sin interacciones registradas"}

Responde con este formato JSON exacto:
{
  "temperature": "cold" | "warm" | "hot",
  "score": <numero 0-100>,
  "nextAction": "<siguiente accion recomendada en espanol>",
  "reasoning": "<razon de la clasificacion en espanol>"
}`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ClassifyResult;
    }
  } catch {
    // Fall through to default
  }

  return {
    temperature: "cold",
    score: 25,
    nextAction: "Revisar manualmente",
    reasoning: "No se pudo analizar la respuesta de la IA",
  };
}
