/*
 * Funcionalidad: Pruebas del repositorio Prisma CurriculumSubtreePrismaRepository
 * Descripción: Verifica con un cliente Prisma simulado que el guardián de borrado cuente los intentos de evaluaciones vinculadas al subárbol por lesson_id, module_id, legacy_module_ref o level_id (nunca quiz_attempts), de modo que un nodo con intentos exija archivar en lugar de borrar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type CurriculumSubtree } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import { ARCHIVE_REQUIRED_DECISION, decideDeletion, HARD_DELETE_DECISION, type StudentDataCounts } from "@/features/curriculum/domain/services/delete-guard";
import {
  CurriculumSubtreePrismaRepository,
  subtreeEvaluationLinks,
} from "@/features/curriculum/infrastructure/persistence/prisma/repositories/curriculum-subtree-prisma.repository";

interface PrismaMock {
  userProgress: { count: jest.Mock };
  lessonCompletion: { count: jest.Mock };
  pageProgress: { count: jest.Mock };
  note: { count: jest.Mock };
  studentEvaluationAttempt: { count: jest.Mock };
  quizAttempt: { count: jest.Mock };
}

function subtree(overrides: Partial<CurriculumSubtree>): CurriculumSubtree {
  return { sectionIds: [], levelIds: [], moduleIds: [], lessonIds: [], pageIds: [], ...overrides };
}

describe("CurriculumSubtreePrismaRepository.countStudentData", () => {
  let prisma: PrismaMock;
  let repository: CurriculumSubtreePrismaRepository;

  beforeEach(() => {
    prisma = {
      userProgress: { count: jest.fn().mockResolvedValue(0) },
      lessonCompletion: { count: jest.fn().mockResolvedValue(0) },
      pageProgress: { count: jest.fn().mockResolvedValue(0) },
      note: { count: jest.fn().mockResolvedValue(0) },
      studentEvaluationAttempt: { count: jest.fn().mockResolvedValue(0) },
      quizAttempt: { count: jest.fn() },
    };
    repository = new CurriculumSubtreePrismaRepository(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    expect(prisma.quizAttempt.count).not.toHaveBeenCalled();
  });

  it("counts attempts of evaluations linked to the lessons, modules (current or legacy reference) and levels of the subtree", async () => {
    prisma.studentEvaluationAttempt.count.mockResolvedValue(3);

    const counts: StudentDataCounts = await repository.countStudentData(
      subtree({ levelIds: ["level-1"], moduleIds: ["module-1"], lessonIds: ["lesson-1"] }),
    );

    expect(prisma.studentEvaluationAttempt.count).toHaveBeenCalledWith({
      where: {
        evaluation: {
          OR: [
            { lessonId: { in: ["lesson-1"] } },
            { moduleId: { in: ["module-1"] } },
            { legacyModuleRef: { in: ["module-1"] } },
            { levelId: { in: ["level-1"] } },
          ],
        },
      },
    });
    expect(counts.quizAttempts).toBe(3);
    expect(decideDeletion(counts)).toBe(ARCHIVE_REQUIRED_DECISION);
  });

  it("blocks deleting a lone level whose evaluations have attempts even without modules or lessons", async () => {
    prisma.studentEvaluationAttempt.count.mockResolvedValue(1);

    const counts: StudentDataCounts = await repository.countStudentData(subtree({ levelIds: ["level-1"] }));

    expect(prisma.studentEvaluationAttempt.count).toHaveBeenCalledWith({ where: { evaluation: { OR: [{ levelId: { in: ["level-1"] } }] } } });
    expect(decideDeletion(counts)).toBe(ARCHIVE_REQUIRED_DECISION);
  });

  it("skips the attempt query for a subtree without lessons, modules or levels", async () => {
    const counts: StudentDataCounts = await repository.countStudentData(subtree({ sectionIds: ["section-1"], pageIds: [] }));

    expect(prisma.studentEvaluationAttempt.count).not.toHaveBeenCalled();
    expect(counts.quizAttempts).toBe(0);
    expect(decideDeletion(counts)).toBe(HARD_DELETE_DECISION);
  });

  it("builds no evaluation link for an empty subtree", () => {
    expect(subtreeEvaluationLinks(subtree({}))).toEqual([]);
  });
});
