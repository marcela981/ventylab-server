/*
 * Funcionalidad: Pruebas del transporte SSE de la asistencia de simulación
 * Descripción: Verifica las cabeceras del stream (text/event-stream, Cache-Control no-cache, no-transform, X-Accel-Buffering no para que el proxy inverso no acumule eventos), el formato de los eventos delta y done y el cierre de la respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EventEmitter } from "events";

import { type Response } from "express";

import { type SimulationAssistEvent } from "@/features/simulation/application/assist/simulation-assist-stream.result";
import { pipeAssistStreamToSse, type SseErrorPayload } from "@/features/simulation/presentation/sse/simulation-assist-sse";

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

async function* events(items: SimulationAssistEvent[]): AsyncGenerator<SimulationAssistEvent> {
  for (const item of items) {
    yield await Promise.resolve(item);
  }
}

const translate = (): Promise<SseErrorPayload> => Promise.resolve({ code: "simulation.assist_failed", message: "translated" });

describe("simulation assist SSE transport", () => {
  it("opens the stream with headers that disable caching, transformation and proxy buffering", async () => {
    const response: FakeResponse = new FakeResponse();

    await pipeAssistStreamToSse(response as unknown as Response, events([{ type: "delta", text: "PEEP" }]), translate);

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("text/event-stream; charset=utf-8");
    expect(response.headers["cache-control"]).toBe("no-cache, no-transform");
    expect(response.headers["x-accel-buffering"]).toBe("no");
    expect(response.headers["connection"]).toBe("keep-alive");
    expect(response.headersFlushed).toBe(true);
  });

  it("writes delta and done events and ends the response", async () => {
    const response: FakeResponse = new FakeResponse();

    await pipeAssistStreamToSse(
      response as unknown as Response,
      events([
        { type: "delta", text: "Sube la PEEP" },
        { type: "done", aiHelpEventId: "help-1", aiCallId: "call-1", source: "LLM" },
      ]),
      translate,
    );

    expect(response.chunks).toEqual([
      "event: delta\ndata: {\"text\":\"Sube la PEEP\"}\n\n",
      "event: done\ndata: {\"aiHelpEventId\":\"help-1\",\"aiCallId\":\"call-1\",\"source\":\"LLM\"}\n\n",
    ]);
    expect(response.writableEnded).toBe(true);
  });
});
