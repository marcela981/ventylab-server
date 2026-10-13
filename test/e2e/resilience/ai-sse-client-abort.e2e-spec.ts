/*
 * Funcionalidad: Prueba de resiliencia del corte de un stream SSE de IA por el cliente
 * Descripción: Un estudiante abre el stream SSE del tutor para profundizar una página contra un proveedor falso lento que registra su AbortSignal, lee el primer fragmento y cierra la conexión; verifica que la llamada al proveedor se aborta, que la telemetría registra ABORTED, que la respuesta parcial queda marcada como incompleta y que no hay errores registrados ni rechazos sin manejar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClientRequest, type IncomingMessage, request } from "node:http";

import { Logger } from "@nestjs/common";
import { type User } from "@prisma/client";

import { SignalRecordingLlmProvider } from "@/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec";

import { type ContentTree, createContentTree, createStudent } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { delay, waitUntil } from "../../support/polling";

const STREAM_CHUNKS: string[] = Array.from({ length: 40 }, (_value: unknown, index: number): string => `fragmento ${index} `);
const CHUNK_DELAY_MS: number = 150;
const AFTER_ABORT_SETTLE_MS: number = 1_000;

function openStreamAndCloseAfterFirstChunk(url: string, token: string, body: object): Promise<{ status: number; firstChunk: string }> {
  return new Promise<{ status: number; firstChunk: string }>((resolve: (value: { status: number; firstChunk: string }) => void, reject: (reason: Error) => void): void => {
    const payload: string = JSON.stringify(body);
    const outgoing: ClientRequest = request(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "content-length": Buffer.byteLength(payload) } }, (response: IncomingMessage): void => {
      response.once("data", (chunk: Buffer): void => {
        resolve({ status: response.statusCode ?? 0, firstChunk: chunk.toString("utf-8") });
        outgoing.destroy();
      });
    });

    outgoing.on("error", (error: Error): void => {
      if (!outgoing.destroyed) {
        reject(error);
      }
    });
    outgoing.end(payload);
  });
}

describe("resilience: client closes an AI SSE stream midway", () => {
  const provider: SignalRecordingLlmProvider = new SignalRecordingLlmProvider("gemini", { kind: "stream", chunks: STREAM_CHUNKS, chunkDelayMs: CHUNK_DELAY_MS });
  const unhandled: unknown[] = [];
  const recordUnhandled = (reason: unknown): void => {
    unhandled.push(reason);
  };
  let e2e: E2eApp;
  let student: User;
  let tree: ContentTree;

  beforeAll(async () => {
    e2e = await createE2eApp({ aiProviders: [provider] });
    process.on("unhandledRejection", recordUnhandled);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    student = await createStudent(e2e.prisma);
    tree = await createContentTree(e2e.prisma);
  });

  afterAll(async () => {
    process.off("unhandledRejection", recordUnhandled);
    await e2e?.close();
  });

  it("should abort the upstream provider call and record ABORTED without logging errors", async () => {
    const errorSpy: jest.SpyInstance = jest.spyOn(Logger.prototype, "error");
    const token: string = await mintAccessToken(student, e2e.app);

    try {
      const opened: { status: number; firstChunk: string } = await openStreamAndCloseAfterFirstChunk(`${e2e.baseUrl}/api/tutor/pages/${tree.page.id}/deepen`, token, { question: "¿Qué es la PEEP?" });

      expect(opened.status).toBe(200);
      expect(opened.firstChunk).toContain("fragmento 0");

      const signal: AbortSignal = await waitUntil(
        (): Promise<AbortSignal | undefined> => Promise.resolve(provider.streamSignals.at(-1)),
        (candidate: AbortSignal | undefined): boolean => candidate?.aborted === true,
        { description: "the provider stream signal to abort", timeoutMs: 5_000, intervalMs: 50 },
      ) as AbortSignal;

      expect(signal.aborted).toBe(true);
      await waitUntil(
        (): Promise<number> => e2e.prisma.aiCallLog.count({ where: { useCase: "PAGE_DEEPEN", status: "ABORTED" } }),
        (count: number): boolean => count === 1,
        { description: "one ABORTED telemetry row" },
      );
      await delay(AFTER_ABORT_SETTLE_MS);

      const incomplete: { content: string }[] = await e2e.prisma.aiMessage.findMany({ where: { role: "ASSISTANT", isIncomplete: true }, select: { content: true } });

      expect(incomplete).toHaveLength(1);
      expect(incomplete[0].content.length).toBeLessThan(STREAM_CHUNKS.join("").length);
      expect(errorSpy).not.toHaveBeenCalled();
      expect(unhandled).toEqual([]);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
