/*
 * Funcionalidad: Pruebas del repositorio Prisma de asignaciones de actividades
 * Descripción: Verifica sobre un cliente Prisma simulado que crear una asignación toma el candado de estructura de la evaluación, usa el dueDate de la actividad cuando la asignación no tiene uno y responde como la antigua restricción única (P2002) si ya existe otra para la misma actividad y grupo
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
import { ActivityAssignment } from "@/features/activities/domain/entities/activity-assignment.entity";
import { ActivityAssignmentsPrismaRepository } from "@/features/activities/infrastructure/persistence/prisma/repositories/activity-assignments-prisma.repository";

const ACTIVITY_DUE_DATE: Date = new Date("2026-02-01T23:59:00.000Z");

interface PrismaDoubles {
  repository: ActivityAssignmentsPrismaRepository;
  executeRaw: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  findUnique: jest.Mock;
}

function buildDoubles(): PrismaDoubles {
  const executeRaw: jest.Mock = jest.fn().mockResolvedValue(0);
  const findFirst: jest.Mock = jest.fn().mockResolvedValue(null);
  const findUnique: jest.Mock = jest.fn().mockResolvedValue(null);
  const create: jest.Mock = jest.fn().mockResolvedValue({});
  const update: jest.Mock = jest.fn().mockResolvedValue({});

  const prisma: PrismaService = {
    $executeRaw: executeRaw,
    evaluation: { findUnique: jest.fn().mockResolvedValue({ legacyDueDate: ACTIVITY_DUE_DATE }) },
    evaluationAssignment: { findFirst, findUnique, create, update },
  } as unknown as PrismaService;
  const auditLogRepository: IAuditLogRepository = { save: jest.fn().mockResolvedValue(undefined) };

  return { repository: new ActivityAssignmentsPrismaRepository(prisma, auditLogRepository), executeRaw, findFirst, create, update, findUnique };
}

describe("ActivityAssignmentsPrismaRepository.save", () => {
  it("creates the assignment under the structure lock with the activity due date as its end", async () => {
    const doubles: PrismaDoubles = buildDoubles();
    const assignment: ActivityAssignment = ActivityAssignment.create({ activityId: "activity-1", groupId: "group-1", assignedBy: "teacher-1" });

    await doubles.repository.save(assignment);

    expect(doubles.executeRaw.mock.calls[0]).toContain("evaluations:structure:activity-1");
    expect(doubles.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: assignment.id,
        evaluationId: "activity-1",
        groupId: "group-1",
        startsAt: assignment.createdAt,
        endsAt: ACTIVITY_DUE_DATE,
        assignedById: "teacher-1",
        legacyIsActive: true,
      }) as unknown,
    });
  });

  it("keeps the legacy (activity, group) uniqueness with a P2002 conflict when another assignment exists", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    doubles.findFirst.mockResolvedValue({ id: "assignment-0" });

    const failure: Promise<void> = doubles.repository.save(ActivityAssignment.create({ activityId: "activity-1", groupId: "group-1", assignedBy: "teacher-1" }));

    await expect(failure).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    await expect(failure).rejects.toMatchObject({ code: "P2002" });
    expect(doubles.create).not.toHaveBeenCalled();
  });

  it("updates an existing assignment without taking the lock", async () => {
    const doubles: PrismaDoubles = buildDoubles();
    const assignment: ActivityAssignment = ActivityAssignment.create({ activityId: "activity-1", groupId: "group-1", assignedBy: "teacher-1" });

    doubles.findUnique.mockResolvedValue({ id: assignment.id });
    assignment.remove("teacher-1");

    await doubles.repository.save(assignment);

    expect(doubles.executeRaw).not.toHaveBeenCalled();
    expect(doubles.update).toHaveBeenCalledWith({ where: { id: assignment.id }, data: expect.objectContaining({ legacyIsActive: false }) as unknown });
  });
});
