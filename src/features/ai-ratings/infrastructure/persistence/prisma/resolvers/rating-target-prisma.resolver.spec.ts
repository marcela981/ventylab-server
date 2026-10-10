/*
 * Funcionalidad: Pruebas del resolvedor de objetivos de valoración de IA
 * Descripción: Verifica con un cliente Prisma y una fachada de telemetría simulados el destinatario y el aiCallId de cada tipo de objetivo: retroalimentación de calificación publicada (con la última llamada SUCCESS o FALLBACK enlazada al intento), mensaje del asistente, análisis de notas y asistencia de simulación (evento AI_HELP de la sesión, dueño de la sesión y aiCallId del payload)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type RatingTarget } from "@/features/ai-ratings/application/ports/rating-target-resolver.interface";
import { RatingTargetPrismaResolver } from "@/features/ai-ratings/infrastructure/persistence/prisma/resolvers/rating-target-prisma.resolver";
import { type AiTelemetryFacade } from "@/features/ai-telemetry/application/ai-telemetry.facade";
import { type AiCallSummary } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

interface PrismaMock {
  gradeFeedback: { findUnique: jest.Mock };
  aiMessage: { findUnique: jest.Mock };
  simulationEvent: { findUnique: jest.Mock };
}

const PUBLISHED_AT: Date = new Date("2026-10-01T00:00:00Z");

function notesCall(overrides: Partial<AiCallSummary> = {}): AiCallSummary {
  return {
    id: "call-notes",
    userId: "student-1",
    useCase: "NOTES_ANALYSIS",
    provider: "gemini",
    promptVersion: "1.0.0",
    status: "SUCCESS",
    createdAt: PUBLISHED_AT,
    ...overrides,
  };
}

describe("RatingTargetPrismaResolver", () => {
  let prisma: PrismaMock;
  let telemetry: { getCallById: jest.Mock; getLatestCallByRef: jest.Mock };
  let resolver: RatingTargetPrismaResolver;

  beforeEach(() => {
    prisma = { gradeFeedback: { findUnique: jest.fn() }, aiMessage: { findUnique: jest.fn() }, simulationEvent: { findUnique: jest.fn() } };
    telemetry = { getCallById: jest.fn(), getLatestCallByRef: jest.fn().mockResolvedValue(undefined) };
    resolver = new RatingTargetPrismaResolver(prisma as unknown as PrismaService, telemetry as unknown as AiTelemetryFacade);
  });

  describe("GRADE_FEEDBACK", () => {
    it("resolves a ready feedback of a published grade to the attempt owner and the latest call linked to the attempt", async () => {
      prisma.gradeFeedback.findUnique.mockResolvedValue({ status: "READY", attemptId: "attempt-1", attempt: { userId: "student-1", gradePublishedAt: PUBLISHED_AT } });
      telemetry.getLatestCallByRef.mockResolvedValue(notesCall({ id: "call-grade", useCase: "GRADE_FEEDBACK", userId: undefined }));

      const target: RatingTarget | undefined = await resolver.resolve("GRADE_FEEDBACK", "feedback-1");

      expect(target).toEqual({ recipientUserId: "student-1", aiCallId: "call-grade" });
      expect(prisma.gradeFeedback.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "feedback-1" } }));
      expect(telemetry.getLatestCallByRef).toHaveBeenCalledWith("evaluation_attempt", "attempt-1");
    });

    it("resolves without a call when no call is linked to the attempt", async () => {
      prisma.gradeFeedback.findUnique.mockResolvedValue({ status: "READY", attemptId: "attempt-1", attempt: { userId: "student-1", gradePublishedAt: PUBLISHED_AT } });

      const target: RatingTarget | undefined = await resolver.resolve("GRADE_FEEDBACK", "feedback-1");

      expect(target).toEqual({ recipientUserId: "student-1", aiCallId: undefined });
    });

    it.each([
      ["missing", null],
      ["not published", { status: "READY", attempt: { userId: "student-1", gradePublishedAt: null } }],
      ["still pending", { status: "PENDING", attempt: { userId: "student-1", gradePublishedAt: PUBLISHED_AT } }],
    ])("returns undefined when the feedback is %s", async (_label: string, row: unknown) => {
      prisma.gradeFeedback.findUnique.mockResolvedValue(row);

      await expect(resolver.resolve("GRADE_FEEDBACK", "feedback-1")).resolves.toBeUndefined();
    });
  });

  describe("MESSAGE", () => {
    it("resolves an assistant message to the conversation owner and its call", async () => {
      prisma.aiMessage.findUnique.mockResolvedValue({ role: "ASSISTANT", aiCallId: "call-1", conversation: { userId: "student-1" } });

      const target: RatingTarget | undefined = await resolver.resolve("MESSAGE", "message-1");

      expect(target).toEqual({ recipientUserId: "student-1", aiCallId: "call-1" });
    });

    it("maps a missing call id to undefined", async () => {
      prisma.aiMessage.findUnique.mockResolvedValue({ role: "ASSISTANT", aiCallId: null, conversation: { userId: "student-1" } });

      await expect(resolver.resolve("MESSAGE", "message-1")).resolves.toEqual({ recipientUserId: "student-1", aiCallId: undefined });
    });

    it.each([
      ["missing", null],
      ["written by the user", { role: "USER", aiCallId: null, conversation: { userId: "student-1" } }],
    ])("returns undefined when the message is %s", async (_label: string, row: unknown) => {
      prisma.aiMessage.findUnique.mockResolvedValue(row);

      await expect(resolver.resolve("MESSAGE", "message-1")).resolves.toBeUndefined();
    });
  });

  describe("NOTES_ANALYSIS", () => {
    it("resolves the analysis call to its user", async () => {
      telemetry.getCallById.mockResolvedValue(notesCall());

      const target: RatingTarget | undefined = await resolver.resolve("NOTES_ANALYSIS", "call-notes");

      expect(target).toEqual({ recipientUserId: "student-1", aiCallId: "call-notes" });
      expect(telemetry.getCallById).toHaveBeenCalledWith("call-notes");
    });

    it.each([
      ["missing", undefined],
      ["of another use case", notesCall({ useCase: "FREE_CHAT" })],
      ["without a user", notesCall({ userId: undefined })],
    ])("returns undefined when the call is %s", async (_label: string, summary: AiCallSummary | undefined) => {
      telemetry.getCallById.mockResolvedValue(summary);

      await expect(resolver.resolve("NOTES_ANALYSIS", "call-notes")).resolves.toBeUndefined();
    });
  });

  describe("SIM_ASSIST", () => {
    it("resolves an AI help event to the session owner and the call stored in its payload", async () => {
      prisma.simulationEvent.findUnique.mockResolvedValue({ type: "AI_HELP", payload: { aiCallId: "call-sim", source: "LLM" }, session: { userId: "student-1" } });

      const target: RatingTarget | undefined = await resolver.resolve("SIM_ASSIST", "event-1");

      expect(target).toEqual({ recipientUserId: "student-1", aiCallId: "call-sim" });
      expect(prisma.simulationEvent.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "event-1" } }));
      expect(telemetry.getCallById).not.toHaveBeenCalled();
    });

    it.each([
      ["has no call id", { source: "DETERMINISTIC" }],
      ["has a non-text call id", { aiCallId: 42 }],
      ["is not an object", "call-sim"],
    ])("resolves without a call when the payload %s", async (_label: string, payload: unknown) => {
      prisma.simulationEvent.findUnique.mockResolvedValue({ type: "AI_HELP", payload, session: { userId: "student-1" } });

      await expect(resolver.resolve("SIM_ASSIST", "event-1")).resolves.toEqual({ recipientUserId: "student-1", aiCallId: undefined });
    });

    it.each([
      ["missing", null],
      ["not an AI help event", { type: "PARAM_CHANGE", payload: {}, session: { userId: "student-1" } }],
    ])("returns undefined when the event is %s", async (_label: string, row: unknown) => {
      prisma.simulationEvent.findUnique.mockResolvedValue(row);

      await expect(resolver.resolve("SIM_ASSIST", "event-1")).resolves.toBeUndefined();
    });
  });
});
