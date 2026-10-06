/*
 * Funcionalidad: Pruebas del transporte SSE del tutor
 * Descripción: Verifica que un error antes del primer evento se propague sin abrir el stream (para que responda el sobre JSON de errores), el formato de los eventos delta, done y error, el cierre de la respuesta y la cancelación del AbortController cuando el cliente se desconecta antes de terminar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EventEmitter } from "events";

import { type Response } from "express";

import { AiProvidersUnavailableError, AiStreamInterruptedError } from "@/features/ai/domain/ai.errors";
import { type TutorStreamEvent } from "@/features/ai-tutor/application/results/tutor-stream.result";
import { abortOnClientDisconnect, pipeTutorStreamToSse, type SseErrorPayload } from "@/features/ai-tutor/presentation/sse/tutor-sse";

class FakeResponse extends EventEmitter {
  public readonly headers: Record<string, string> = {};
  public readonly chunks: string[] = [];
  public statusCode: number = 0;
  public headersFlushed: boolean = false;
  public writableEnded: boolean = false;
  public destroyed: boolean = false;

  public status(code: number): this {
    this.statusCode = code;

    return this;
  }

  public setHeader(name: string, value: string): this {
    this.headers[name.toLowerCase()] = value;

    return this;
  }

  public flushHeaders(): void {
    this.headersFlushed = true;
  }

  public write(chunk: string): boolean {
    this.chunks.push(chunk);

    return true;
  }

  public end(): this {
    this.writableEnded = true;
    this.emit("close");

    return this;
  }
}

function asResponse(fake: FakeResponse): Response {
  return fake as unknown as Response;
}

async function* events(items: TutorStreamEvent[], failWith?: Error): AsyncGenerator<TutorStreamEvent> {
  for (const item of items) {
    yield await Promise.resolve(item);
  }

  if (failWith) {
    throw failWith;
  }
}

async function* failing(error: Error): AsyncGenerator<TutorStreamEvent> {
  yield* [];

  await Promise.resolve();

  throw error;
}

const translate = (error: unknown): Promise<SseErrorPayload> =>
  Promise.resolve({ code: error instanceof AiStreamInterruptedError ? "ai.stream_interrupted" : "ai-tutor.stream_failed", message: "translated" });

describe("tutor SSE transport", () => {
  it("should propagate an error raised before the first event without opening the stream", async () => {
    const response: FakeResponse = new FakeResponse();

    const piping: Promise<void> = pipeTutorStreamToSse(asResponse(response), failing(new AiProvidersUnavailableError()), translate);

    await expect(piping).rejects.toBeInstanceOf(AiProvidersUnavailableError);
    expect(response.headersFlushed).toBe(false);
    expect(response.chunks).toEqual([]);
  });

  it("should write delta and done events as server-sent events and end the response", async () => {
    const response: FakeResponse = new FakeResponse();

    await pipeTutorStreamToSse(
      asResponse(response),
      events([
        { type: "delta", text: "Hola\nmundo" },
        { type: "done", aiCallId: "call-1", messageId: "msg-1", conversationId: "conv-1" },
      ]),
      translate,
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/event-stream; charset=utf-8");
    expect(response.headers["cache-control"]).toBe("no-cache, no-transform");
    expect(response.headers["x-accel-buffering"]).toBe("no");
    expect(response.headersFlushed).toBe(true);
    expect(response.chunks).toEqual([
      "event: delta\ndata: {\"text\":\"Hola\\nmundo\"}\n\n",
      "event: done\ndata: {\"aiCallId\":\"call-1\",\"messageId\":\"msg-1\",\"conversationId\":\"conv-1\"}\n\n",
    ]);
    expect(response.writableEnded).toBe(true);
  });

  it("should write a translated error event when the stream fails after it started", async () => {
    const response: FakeResponse = new FakeResponse();

    await pipeTutorStreamToSse(asResponse(response), events([{ type: "delta", text: "Parcial" }], new AiStreamInterruptedError()), translate);

    expect(response.chunks[1]).toBe("event: error\ndata: {\"code\":\"ai.stream_interrupted\",\"message\":\"translated\"}\n\n");
    expect(response.writableEnded).toBe(true);
  });

  it("should abort the controller when the client disconnects before the response ends", () => {
    const response: FakeResponse = new FakeResponse();
    const finished: FakeResponse = new FakeResponse();

    const controller: AbortController = abortOnClientDisconnect(asResponse(response));
    const finishedController: AbortController = abortOnClientDisconnect(asResponse(finished));

    response.emit("close");
    finished.end();

    expect(controller.signal.aborted).toBe(true);
    expect(finishedController.signal.aborted).toBe(false);
  });
});
