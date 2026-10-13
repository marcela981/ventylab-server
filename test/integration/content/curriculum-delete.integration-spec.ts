/*
 * Funcionalidad: Prueba de integración del borrado de contenido
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el borrado en cascada de una sección por DeleteSectionUseCase (niveles, módulos, lecciones, páginas, secciones de página y pasos desaparecen y queda una fila de auditoría content_deleted) y que se rechace con CurriculumNodeHasStudentDataError (409) sin borrar nada cuando un descendiente tiene datos de estudiantes (notas o progreso)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";

import { CurriculumNodeHasStudentDataError } from "@/features/curriculum/domain/curriculum.errors";
import { DeleteSectionUseCase } from "@/features/sections/application/use-cases/delete-section.usecase";

import { type ContentTree, createAdmin, createContentTree, createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

interface SubtreeCounts {
  readonly sections: number;
  readonly levels: number;
  readonly modules: number;
  readonly lessons: number;
  readonly pages: number;
  readonly pageSections: number;
  readonly steps: number;
}

describe("curriculum subtree deletion against PostgreSQL", () => {
  let harness: IntegrationApp;
  let admin: User;
  let tree: ContentTree;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    admin = await createAdmin(harness.prisma);
    tree = await createContentTree(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  async function countSubtree(): Promise<SubtreeCounts> {
    return {
      sections: await harness.prisma.section.count({ where: { id: tree.section.id } }),
      levels: await harness.prisma.level.count({ where: { id: tree.level.id } }),
      modules: await harness.prisma.module.count({ where: { id: tree.module.id } }),
      lessons: await harness.prisma.lesson.count({ where: { id: tree.lesson.id } }),
      pages: await harness.prisma.page.count({ where: { id: tree.page.id } }),
      pageSections: await harness.prisma.pageSection.count({ where: { id: tree.pageSection.id } }),
      steps: await harness.prisma.step.count({ where: { id: tree.step.id } }),
    };
  }

  it("should delete the whole subtree and audit it when no student data exists", async () => {
    await harness.app.get(DeleteSectionUseCase).execute(tree.section.id, admin.id);

    expect(await countSubtree()).toEqual({ sections: 0, levels: 0, modules: 0, lessons: 0, pages: 0, pageSections: 0, steps: 0 });
    expect(await harness.prisma.auditLog.count({ where: { action: "content_deleted", performedByUserId: admin.id } })).toBe(1);
  });

  it("should refuse with 409 and keep every row when a student wrote a note in a descendant lesson", async () => {
    const student: User = await createStudent(harness.prisma);

    await harness.prisma.note.create({ data: { userId: student.id, lessonId: tree.lesson.id, content: { type: "doc", content: [] } } });

    const deletion: Promise<void> = harness.app.get(DeleteSectionUseCase).execute(tree.section.id, admin.id);

    await expect(deletion).rejects.toBeInstanceOf(CurriculumNodeHasStudentDataError);
    expect(await countSubtree()).toEqual({ sections: 1, levels: 1, modules: 1, lessons: 1, pages: 1, pageSections: 1, steps: 1 });
    expect(await harness.prisma.auditLog.count()).toBe(0);
  });

  it("should refuse with 409 when a student has progress in a descendant module", async () => {
    const student: User = await createStudent(harness.prisma);

    await harness.prisma.userProgress.create({ data: { id: `progress-${student.id}`, userId: student.id, moduleId: tree.module.id } });

    const deletion: Promise<void> = harness.app.get(DeleteSectionUseCase).execute(tree.section.id, admin.id);

    await expect(deletion).rejects.toBeInstanceOf(CurriculumNodeHasStudentDataError);
    expect((await countSubtree()).modules).toBe(1);
  });
});
