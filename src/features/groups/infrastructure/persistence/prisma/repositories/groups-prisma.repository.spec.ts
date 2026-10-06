/*
 * Funcionalidad: Pruebas del repositorio Prisma de grupos
 * Descripción: Verifica sobre un cliente Prisma simulado que el historial que impide el borrado físico de un grupo cuenta asignaciones de evaluaciones e intentos ligados al grupo (por asignación o por el groupId heredado en legacy_payload) y nunca consulta las tablas congeladas de actividades
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { GroupsPrismaRepository } from "@/features/groups/infrastructure/persistence/prisma/repositories/groups-prisma.repository";

const GROUP_ID: string = "group-1";

type CountName = "groupMember" | "evaluationAssignment" | "studentEvaluationAttempt" | "ventilatorReservation" | "auditLog";

const COUNT_NAMES: CountName[] = ["groupMember", "evaluationAssignment", "studentEvaluationAttempt", "ventilatorReservation", "auditLog"];

interface PrismaDoubles {
  repository: GroupsPrismaRepository;
  counts: Record<CountName, jest.Mock>;
  frozen: jest.Mock;
}

function buildDoubles(nonZero?: CountName): PrismaDoubles {
  const counts: Record<CountName, jest.Mock> = Object.fromEntries(
    COUNT_NAMES.map((name: CountName) => [name, jest.fn().mockResolvedValue(name === nonZero ? 1 : 0)]),
  ) as Record<CountName, jest.Mock>;
  const frozen: jest.Mock = jest.fn().mockRejectedValue(new Error("frozen legacy table must not be read"));

  const prisma: PrismaService = {
    ...Object.fromEntries(COUNT_NAMES.map((name: CountName) => [name, { count: counts[name] }])),
    activityAssignment: { count: frozen, findMany: frozen, findFirst: frozen },
    activitySubmission: { count: frozen, findMany: frozen, findFirst: frozen },
    activity: { count: frozen, findMany: frozen, findFirst: frozen },
    quiz: { count: frozen, findMany: frozen, findFirst: frozen },
    quizAttempt: { count: frozen, findMany: frozen, findFirst: frozen },
  } as unknown as PrismaService;
  const auditLogRepository: IAuditLogRepository = { save: jest.fn().mockResolvedValue(undefined) };

  return { repository: new GroupsPrismaRepository(prisma, auditLogRepository), counts, frozen };
}

describe("GroupsPrismaRepository.hasActivityHistory", () => {
  it("returns false when the group has no history at all and never touches the frozen tables", async () => {
    const doubles: PrismaDoubles = buildDoubles();

    await expect(doubles.repository.hasActivityHistory(GROUP_ID)).resolves.toBe(false);
    expect(doubles.frozen).not.toHaveBeenCalled();
  });

  it("counts evaluation assignments of the group", async () => {
    const doubles: PrismaDoubles = buildDoubles("evaluationAssignment");

    await expect(doubles.repository.hasActivityHistory(GROUP_ID)).resolves.toBe(true);
    expect(doubles.counts.evaluationAssignment).toHaveBeenCalledWith({ where: { groupId: GROUP_ID } });
    expect(doubles.frozen).not.toHaveBeenCalled();
  });

  it("counts attempts linked through an assignment or through the legacy groupId in legacy_payload", async () => {
    const doubles: PrismaDoubles = buildDoubles("studentEvaluationAttempt");

    await expect(doubles.repository.hasActivityHistory(GROUP_ID)).resolves.toBe(true);
    expect(doubles.counts.studentEvaluationAttempt).toHaveBeenCalledWith({
      where: { OR: [{ assignment: { groupId: GROUP_ID } }, { legacyPayload: { path: ["groupId"], equals: GROUP_ID } }] },
    });
    expect(doubles.frozen).not.toHaveBeenCalled();
  });

  it.each<CountName>(["groupMember", "ventilatorReservation", "auditLog"])("keeps blocking the physical delete when %s has history", async (name: CountName) => {
    const doubles: PrismaDoubles = buildDoubles(name);

    await expect(doubles.repository.hasActivityHistory(GROUP_ID)).resolves.toBe(true);
    expect(doubles.frozen).not.toHaveBeenCalled();
  });

  it("uses the active transaction client when one is given", async () => {
    const doubles: PrismaDoubles = buildDoubles();
    const transactionCount: jest.Mock = jest.fn().mockResolvedValue(0);
    const transaction: unknown = Object.fromEntries(COUNT_NAMES.map((name: CountName) => [name, { count: transactionCount }]));

    await expect(doubles.repository.hasActivityHistory(GROUP_ID, transaction)).resolves.toBe(false);
    expect(transactionCount).toHaveBeenCalledTimes(COUNT_NAMES.length);
    expect(doubles.counts.evaluationAssignment).not.toHaveBeenCalled();
  });
});
