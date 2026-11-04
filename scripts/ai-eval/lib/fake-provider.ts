/*
 * Funcionalidad: Proveedor falso para la corrida en seco de la evaluación de IA
 * Descripción: Proveedor en proceso, sin red y determinista, con la misma forma de streaming que ILlmProvider: emite fragmentos con una pequeña espera para que se puedan medir TTFT y latencia total, responde JSON con 'overall' y 'perQuestion' (con los ID que encuentra en el prompt) cuando se pide formato JSON y texto plano en otro caso, y estima tokens como caracteres/4. Sirve para probar el ejecutor, nunca para producir resultados de la tesis
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import type { EvalChunk, EvalMessage, EvalProvider, EvalRequest } from "./types.ts";

export const FAKE_PROVIDER_ID: string = "fake";
export const FAKE_MODEL: string = "fake-dry-run";

const CHUNK_SIZE: number = 40;
const CHUNK_DELAY_MS: number = 2;
const CHARS_PER_TOKEN: number = 4;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve: () => void, reject: (reason: unknown) => void) => {
    if (signal.aborted) {
      reject(signal.reason);

      return;
    }

    const timer: ReturnType<typeof setTimeout> = setTimeout(resolve, ms);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function fakeResponse(request: EvalRequest): string {
  const userText: string = request.messages.map((message: EvalMessage) => message.content).join("\n");

  if (request.responseFormat === "json") {
    const ids: string[] = [...userText.matchAll(/^ID: (.+)$/gm)].map((match: RegExpMatchArray) => match[1].trim());

    return JSON.stringify({
      overall: "[dry-run] Retroalimentación simulada sin modelo de lenguaje.",
      perQuestion: ids.map((questionId: string) => ({ questionId, feedback: "[dry-run] Comentario simulado." })),
    });
  }

  return "[dry-run] Respuesta simulada sin modelo de lenguaje: no evalúa contenido clínico.";
}

export function createFakeProvider(): EvalProvider {
  return {
    id: FAKE_PROVIDER_ID,
    async *stream(request: EvalRequest, signal: AbortSignal): AsyncIterable<EvalChunk> {
      const text: string = fakeResponse(request);
      const inputChars: number = request.system.length + request.messages.reduce((sum: number, message: EvalMessage) => sum + message.content.length, 0);

      for (let index: number = 0; index < text.length; index += CHUNK_SIZE) {
        await sleep(CHUNK_DELAY_MS, signal);
        yield { type: "delta", text: text.slice(index, index + CHUNK_SIZE) };
      }

      yield {
        type: "final",
        completion: {
          text,
          model: request.model,
          inputTokens: Math.ceil(inputChars / CHARS_PER_TOKEN),
          outputTokens: Math.ceil(text.length / CHARS_PER_TOKEN),
          finishReason: "stop",
        },
      };
    },
  };
}
