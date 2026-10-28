/*
 * Funcionalidad: Prueba de resiliencia del corte de un stream SSE de IA por el cliente
 * Descripción: Un estudiante abre el stream SSE del tutor para profundizar una página contra un proveedor falso lento que registra su AbortSignal, lee el evento start (conversación y mensaje) y el primer fragmento y cierra la conexión; verifica que la llamada al proveedor se aborta, que la telemetría registra ABORTED, que la respuesta parcial queda marcada como incompleta que no hay errores registrados ni rechazos sin manejar, y que el estudiante puede valorar la respuesta detenida con el id del evento start (superficie ACCORDION, alcance PAGE derivado y llamada ABORTED enlazada) y el administrador la ve agrupada por superficie y alcance
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClientRequest, type IncomingMessage, request } from "node:http";

import { Logger } from "@nestjs/common";
import { type User } from "@prisma/client";
import { type Response } from "supertest";

import { SignalRecordingLlmProvider } from "@/features/ai/application/testing/ai-provider-scenarios-test-doubles-spec";

import { type ContentTree, createAdmin, createContentTree, createStudent } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { delay, waitUntil } from "../../support/polling";

const STREAM_CHUNKS: string[] = Array.from({ length: 40 }, (_value: unknown, index: number): string => `fragmento ${index} `);
const CHUNK_DELAY_MS: number = 150;
const AFTER_ABORT_SETTLE_MS: number = 1_000;

function openStreamAndCloseAfterFirstChunk(url: string, token: string, body: object): Promise<{ status: number; firstChunk: string }> {
  return new Promise<{ status: number; firstChunk: string }>((resolve: (value: { status: number; firstChunk: string }) => void, reject: (reason: Error) => void): void => {
    let received: string = "";
    const payload: string = JSON.stringify(body);
    const outgoing: ClientRequest = request(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "content-length": Buffer.byteLength(payload) } }, (response: IncomingMessage): void => {
      // The start event arrives first; close only once the first text fragment arrived.
      response.on("data", (chunk: Buffer): void => {
        received += chunk.toString("utf-8");

        if (received.includes("event: delta") && !outgoing.destroyed) {
          resolve({ status: response.statusCode ?? 0, firstChunk: received });
          outgoing.destroy();
        }
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
      expect(opened.firstChunk.indexOf("event: start")).toBeLessThan(opened.firstChunk.indexOf("event: delta"));

      const start: { conversationId: string; messageId: string } = JSON.parse(/event: start\ndata: (.+)\n/.exec(opened.firstChunk)?.[1] ?? "{}");

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

      // The stopped answer is ratable with the message id announced by the start event.
      const api: ContractCaller = contractCaller(e2e.baseUrl);

      expectStatus(await api("PUT", "/api/ai-ratings", token, { targetType: "MESSAGE", targetId: start.messageId, helpful: false, surface: "ACCORDION" }), 200);

      const aborted: { id: string } = await e2e.prisma.aiCallLog.findFirstOrThrow({ where: { useCase: "PAGE_DEEPEN", status: "ABORTED" }, select: { id: true } });

      expect(await e2e.prisma.aiRating.findFirstOrThrow({ where: { targetId: start.messageId } })).toMatchObject({ surface: "ACCORDION", scope: "PAGE", aiCallId: aborted.id });
      expectStatus(await api("PUT", "/api/ai-ratings", token, { targetType: "MESSAGE", targetId: start.messageId, helpful: false, scope: "MODULE" }), 422);

      const adminToken: string = await mintAccessToken(await createAdmin(e2e.prisma), e2e.app);
      const stats: Response = await api("GET", "/api/admin/ai-ratings/stats?surface=ACCORDION&scope=PAGE", adminToken);

      expectStatus(stats, 200);
      expect(stats.body.data.groups).toEqual([expect.objectContaining({ surface: "ACCORDION", scope: "PAGE", useCase: "PAGE_DEEPEN", ratings: 1 })]);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
