/*
 * Funcionalidad: Pruebas del repositorio Prisma de entregas de actividades
 * Descripción: Verifica sobre un cliente Prisma simulado que crear una entrega toma el candado por evaluación y estudiante, rechaza con el 409 heredado una segunda entrega viva o una carrera P2002, numera el intento y enlaza la asignación del grupo; que reiniciar borra una entrega no calificada y conserva una calificada como 'activity_submission_reset'; y que el filtro por grupo usa legacyPayload.groupId
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Prisma } from "@prisma/client";

import { type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { ActivitySubmissionAlreadyCompletedError } from "@/features/activities/domain/activities.errors";
import { ActivitySubmission } from "@/features/activities/domain/entities/activity-submission.entity";
import { type SubmissionStatusValue } from "@/features/activities/domain/value-objects/submission-status";
import { ActivitySubmissionsPrismaRepository } from "@/features/activities/infrastructure/persistence/prisma/repositories/activity-submissions-prisma.repository";

interface PrismaDoubles {
  repository: ActivitySubmissionsPrismaRepository;
  executeRaw: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  aggregate: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  remove: jest.Mock;
  assignmentFindFirst: jest.Mock;
}

function buildDoubles(): PrismaDoubles {
  const executeRaw: jest.Mock = jest.fn().mockResolvedValue(0);
  const findUnique: jest.Mock = jest.fn().mockResolvedValue(null);
  const findFirst: jest.Mock = jest.fn().mockResolvedValue(null);
  const findMany: jest.Mock = jest.fn().mockResolvedValue([]);
  const aggregate: jest.Mock = jest.fn().mockResolvedValue({ _max: { attemptNumber: 1 } });
  const create: jest.Mock = jest.fn().mockResolvedValue({});
  const update: jest.Mock = jest.fn().mockResolvedValue({});
  const remove: jest.Mock = jest.fn().mockResolvedValue({});
  const assignmentFindFirst: jest.Mock = jest.fn().mockResolvedValue({ id: "assignment-1" });

  const prisma: PrismaService = {
    $executeRaw: executeRaw,
    studentEvaluationAttempt: { findUnique, findFirst, findMany, aggregate, create, update, delete: remove },
    evaluationAssignment: { findFirst: assignmentFindFirst },
    user: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaService;
  const auditLogRepository: IAuditLogRepository = { save: jest.fn().mockResolvedValue(undefined) };

  return {
    repository: new ActivitySubmissionsPrismaRepository(prisma, auditLogRepository),
    executeRaw,
    findUnique,
    findFirst,
    findMany,
    aggregate,
    create,
    update,
    remove,
    assignmentFindFirst,
  };
}

function storedSubmission(status: SubmissionStatusValue): ActivitySubmission {
  return ActivitySubmission.reconstitute({
    id: "submission-1",
    activityId: "activity-1",
    userId: "student-1",
    groupId: "group-1",
    status,
    score: status === "GRADED" ? 40 : undefined,
    maxScore: 50,
    createdAt: new Date("2026-01-10T08:00:00.000Z"),
    updatedAt: new Date("2026-01-10T08:00:00.000Z"),
    auditLogs: [],
  });
}

describe("ActivitySubmissionsPrismaRepository", () => {
  it("creates a started submission under the attempt lock with the next attempt number and the group assignment", async () => {
    const doubles: PrismaDoubles = buildDoubles();
    const submission: ActivitySubmission = ActivitySubmission.start({ activityId: "activity-1", userId: "student-1", groupId: "group-1", maxScore: 50 });

    await doubles.repository.save(submission);

    expect(doubles.executeRaw).toHaveBeenCalledTimes(1);
    expect(doubles.executeRaw.mock.calls[0]).toContain("evaluations:attempt:activity-1:student-1");
    expect(doubles.findFirst).toHaveBeenCalledWith({
      where: { evaluationId: "activity-1", userId: "student-1", legacySource: "activity_submission" },
      select: { id: true },
    });
    expect(doubles.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: submission.id,
        attemptNumber: 2,
        assignmentId: "assignment-1",
        status: "IN_PROGRESS",
        legacySource: "activity_submission",
      }) as unknown,
    });
  });

  it("rejects a second live submission of the same student with the legacy 409 error", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    doubles.findFirst.mockResolvedValue({ id: "other-submission" });

    await expect(
      doubles.repository.save(ActivitySubmission.start({ activityId: "activity-1", userId: "student-1", maxScore: 50 })),
    ).rejects.toBeInstanceOf(ActivitySubmissionAlreadyCompletedError);
    expect(doubles.create).not.toHaveBeenCalled();
  });

  it("maps a unique-constraint race (P2002) to the legacy 409 error instead of a 500", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    doubles.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Unique constraint failed", { code: "P2002", clientVersion: "6" }));

    await expect(
      doubles.repository.save(ActivitySubmission.start({ activityId: "activity-1", userId: "student-1", maxScore: 50 })),
    ).rejects.toBeInstanceOf(ActivitySubmissionAlreadyCompletedError);
  });

  it("updates an existing submission row in place", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    doubles.findUnique.mockResolvedValue({ id: "submission-1" });

    await doubles.repository.save(storedSubmission("SUBMITTED"));

    expect(doubles.executeRaw).not.toHaveBeenCalled();
    expect(doubles.update).toHaveBeenCalledWith({ where: { id: "submission-1" }, data: expect.objectContaining({ status: "PENDING_REVIEW", isLate: false }) as unknown });
  });

  it("resets a submission that is not graded by deleting it, as before", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    await doubles.repository.delete(storedSubmission("SUBMITTED"));

    expect(doubles.remove).toHaveBeenCalledWith({ where: { id: "submission-1" } });
    expect(doubles.update).not.toHaveBeenCalled();
  });

  it("keeps a graded submission on reset, detached from the legacy routes as activity_submission_reset", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    await doubles.repository.delete(storedSubmission("GRADED"));

    expect(doubles.remove).not.toHaveBeenCalled();
    expect(doubles.update).toHaveBeenCalledWith({
      where: { id: "submission-1" },
      data: {
        legacySource: "activity_submission_reset",
        legacyPayload: expect.objectContaining({ status: "GRADED", groupId: "group-1", resetAt: expect.any(String) as unknown }) as unknown,
      },
    });
  });

  it("filters the submissions of an activity by the group stored in legacyPayload", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    await doubles.repository.getViewsByActivity("activity-1", "group-1");

    expect(doubles.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { evaluationId: "activity-1", legacySource: "activity_submission", legacyPayload: { path: ["groupId"], equals: "group-1" } },
        orderBy: [{ submittedAt: "desc" }],
      }),
    );
  });
});
