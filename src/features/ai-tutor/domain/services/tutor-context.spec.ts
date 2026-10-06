/*
 * Funcionalidad: Pruebas del contexto del tutor
 * Descripción: Verifica la estimación de tokens, el recorte del contexto al presupuesto respetando la prioridad de las secciones, la ventana de historial, el título automático de la conversación y la extracción de texto plano de las secciones de una página
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiMessage } from "@/features/ai/domain/prompts/prompt-template";
import { type AiConversationMessage } from "@/features/ai-tutor/domain/read-models/ai-conversation-message.read-model";
import { buildConversationTitle, MAX_CONVERSATION_TITLE_LENGTH } from "@/features/ai-tutor/domain/services/conversation-title";
import { pageSectionsToPlainText } from "@/features/ai-tutor/domain/services/page-text";
import { assembleTutorContext, buildHistoryWindow, estimateTokens, tokensToChars } from "@/features/ai-tutor/domain/services/tutor-context";

function message(role: "USER" | "ASSISTANT", content: string): AiConversationMessage {
  return { id: content, conversationId: "c-1", role, content, isIncomplete: false, createdAt: new Date() };
}

describe("tutor context", () => {
  it("should estimate tokens as characters divided by four", () => {
    expect(estimateTokens("12345678")).toBe(2);
    expect(estimateTokens("123456789")).toBe(3);
    expect(tokensToChars(10)).toBe(40);
  });

  it("should keep the sections in priority order and cut the context at the budget", () => {
    const context: string = assembleTutorContext(
      [
        { label: "Página actual", text: "A".repeat(20) },
        { label: "Lección", text: "B".repeat(100) },
        { label: "Módulo", text: "C".repeat(20) },
      ],
      20,
    );

    expect(context.length).toBeLessThanOrEqual(80);
    expect(context.indexOf("A")).toBeLessThan(context.indexOf("B"));
    expect(context).not.toContain("C");
  });

  it("should skip empty sections", () => {
    const context: string = assembleTutorContext([{ label: "Vacía", text: "   " }, { label: "Módulo", text: "Resumen" }], 100);

    expect(context).toBe("## Módulo\nResumen");
  });

  it("should keep the last messages of the window, starting with a user turn and merging repeated roles", () => {
    const messages: AiConversationMessage[] = [
      message("USER", "u1"),
      message("ASSISTANT", "a1"),
      message("USER", "u2"),
      message("USER", "u3"),
      message("ASSISTANT", "a3"),
    ];

    const history: AiMessage[] = buildHistoryWindow(messages, 4, (text: string) => text.toUpperCase());

    expect(history).toEqual([
      { role: "user", content: "U2\n\nU3" },
      { role: "assistant", content: "A3" },
    ]);
  });

  it("should build the title from the first user message truncated to the limit", () => {
    const long: string = `  ${"palabra ".repeat(20)}`;

    const short: string = buildConversationTitle("¿Qué es la PEEP?");
    const truncated: string = buildConversationTitle(long);

    expect(short).toBe("¿Qué es la PEEP?");
    expect(truncated.length).toBeLessThanOrEqual(MAX_CONVERSATION_TITLE_LENGTH);
    expect(truncated.endsWith("…")).toBe(true);
    expect(buildConversationTitle("   ")).toBe("Nueva conversación");
  });

  it("should extract plain text from rich text, captions, equations and code sections", () => {
    const text: string = pageSectionsToPlainText([
      {
        title: "Definición",
        content: { doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "La PEEP es la presión positiva" }] }] } },
      },
      { content: { html: "<p>Valor <strong>típico</strong></p>" } },
      { content: { caption: "Curva presión-tiempo" } },
      { content: { latex: "C = V / P" } },
      { content: { code: "peep = 5" } },
      { content: null },
    ]);

    expect(text).toContain("Definición");
    expect(text).toContain("La PEEP es la presión positiva");
    expect(text).toContain("Valor típico");
    expect(text).toContain("Curva presión-tiempo");
    expect(text).toContain("C = V / P");
    expect(text).toContain("peep = 5");
    expect(text).not.toContain("<p>");
  });
});
