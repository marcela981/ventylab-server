/*
 * Funcionalidad: Utilidades HTTP de proveedores de IA
 * Descripción: Envía peticiones JSON con fetch y AbortSignal, convierte respuestas HTTP no exitosas y fallos de red en AiProviderError clasificados y lee flujos Server-Sent Events línea por línea
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AiProviderError } from "@/features/ai/domain/ai.errors";
import { classifyAiError, classifyHttpStatus } from "@/features/ai/domain/services/ai-error-classification";

export interface SseEvent {
  readonly event?: string;
  readonly data: string;
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export async function postJson(
  providerId: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal: AbortSignal,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error: unknown) {
    if (signal.aborted) {
      throw signal.reason;
    }

    throw new AiProviderError(classifyAiError(error) === "CLIENT" ? "NETWORK" : classifyAiError(error), `${providerId} request failed`);
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);

    throw new AiProviderError(classifyHttpStatus(response.status), `${providerId} responded with HTTP ${response.status}`, response.status);
  }

  return response;
}

export async function readJson(providerId: string, response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AiProviderError("INVALID_RESPONSE", `${providerId} returned an invalid JSON body`);
  }
}

export async function* readSseEvents(body: ReadableStream<Uint8Array> | null): AsyncGenerator<SseEvent> {
  if (!body) {
    return;
  }

  const reader: ReadableStreamDefaultReader<Uint8Array> = body.getReader();
  const decoder: TextDecoder = new TextDecoder();
  let buffer: string = "";
  let eventName: string | undefined;
  let dataLines: string[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number = buffer.indexOf("\n");

      while (newlineIndex >= 0) {
        const line: string = buffer.slice(0, newlineIndex).replace(/\r$/, "");

        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf("\n");

        if (line === "") {
          if (dataLines.length > 0) {
            yield { event: eventName, data: dataLines.join("\n") };
          }

          eventName = undefined;
          dataLines = [];

          continue;
        }

        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).replace(/^ /, ""));
        }
      }
    }

    if (dataLines.length > 0) {
      yield { event: eventName, data: dataLines.join("\n") };
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseSseJson(providerId: string, data: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(data);

    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Falls through to the invalid response error below.
  }

  throw new AiProviderError("INVALID_RESPONSE", `${providerId} sent an invalid stream event`);
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
