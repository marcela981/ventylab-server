/*
 * Funcionalidad: Contexto del tutor de IA
 * Descripción: Estima tokens como caracteres entre cuatro, arma el contexto de referencia por secciones en orden de prioridad recortándolo al presupuesto de tokens y construye la ventana de historial (últimos N mensajes, empezando por un turno del usuario y uniendo roles repetidos) con el texto redactado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiMessage, type AiMessageRole } from "@/features/ai/domain/prompts/prompt-template";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";

export const CHARS_PER_TOKEN: number = 4;

const SECTION_SEPARATOR: string = "\n\n";

const MIN_TRUNCATED_SECTION_CHARS: number = 40;

export interface TutorContextSection {
  readonly label: string;
  readonly text: string;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function tokensToChars(tokens: number): number {
  return Math.max(0, Math.floor(tokens)) * CHARS_PER_TOKEN;
}

export function assembleTutorContext(sections: readonly TutorContextSection[], budgetTokens: number): string {
  let remaining: number = tokensToChars(budgetTokens);
  const blocks: string[] = [];

  for (const section of sections) {
    const text: string = section.text.trim();

    if (text.length === 0) {
      continue;
    }

    const separatorLength: number = blocks.length > 0 ? SECTION_SEPARATOR.length : 0;
    const block: string = `## ${section.label}\n${text}`;
    const available: number = remaining - separatorLength;

    if (block.length <= available) {
      blocks.push(block);
      remaining = available - block.length;

      continue;
    }

    if (available >= Math.min(MIN_TRUNCATED_SECTION_CHARS, block.length)) {
      blocks.push(`${block.slice(0, available - 1)}…`);
    }

    break;
  }

  return blocks.join(SECTION_SEPARATOR);
}

export function buildHistoryWindow(messages: readonly AiConversationMessage[], window: number, redact: (text: string) => string): AiMessage[] {
  const recent: readonly AiConversationMessage[] = window > 0 ? messages.slice(-window) : [];
  const history: AiMessage[] = [];

  for (const message of recent) {
    const role: AiMessageRole = message.role === "USER" ? "user" : "assistant";
    const content: string = redact(message.content).trim();

    if (content.length === 0 || (history.length === 0 && role === "assistant")) {
      continue;
    }

    const previous: AiMessage | undefined = history[history.length - 1];

    if (previous && previous.role === role) {
      history[history.length - 1] = { role, content: `${previous.content}${SECTION_SEPARATOR}${content}` };
    } else {
      history.push({ role, content });
    }
  }

  return history;
}
