/*
 * Funcionalidad: Pruebas de la regla de visibilidad del contenido
 * Descripción: Verifica que el contenido en borrador o archivado, o con un ancestro en borrador, quede oculto para estudiantes y visible para docentes y administradores, y que la sincronización de estado con isActive funcione
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { canManageContent, isContentVisible, isVisibleToStudent } from "@/features/curriculum/domain/services/content-visibility";
import { type ContentStatusState, resolveContentStatus } from "@/features/curriculum/domain/value-objects/content-status";

describe("content visibility", () => {
  it("shows a fully published chain to students", () => {
    const result: boolean = isVisibleToStudent(["PUBLISHED", "PUBLISHED", "PUBLISHED"]);

    expect(result).toBe(true);
  });

  it("hides a draft entity from students", () => {
    const result: boolean = isVisibleToStudent(["PUBLISHED", "PUBLISHED", "DRAFT"]);

    expect(result).toBe(false);
  });

  it("hides a published entity with a draft ancestor from students", () => {
    const result: boolean = isVisibleToStudent(["PUBLISHED", "DRAFT", "PUBLISHED", "PUBLISHED"]);

    expect(result).toBe(false);
  });

  it("hides archived content from students", () => {
    const result: boolean = isVisibleToStudent(["ARCHIVED", "PUBLISHED"]);

    expect(result).toBe(false);
  });

  it("ignores missing optional ancestors such as a level without section", () => {
    const result: boolean = isVisibleToStudent([undefined, "PUBLISHED", "PUBLISHED"]);

    expect(result).toBe(true);
  });

  it("shows draft content and draft ancestors to teachers and admins", () => {
    const result: boolean = isContentVisible(true, ["DRAFT", "ARCHIVED", "DRAFT"]);

    expect(result).toBe(true);
  });

  it("treats readers without the update permission as students", () => {
    const anonymous: boolean = canManageContent(undefined, "levels:update");
    const student: boolean = canManageContent(["levels:read"], "levels:update");
    const teacher: boolean = canManageContent(["levels:read", "levels:update"], "levels:update");

    expect(anonymous).toBe(false);
    expect(student).toBe(false);
    expect(teacher).toBe(true);
  });

  it("keeps isActive in sync with the status", () => {
    const archived: ContentStatusState = resolveContentStatus({ currentStatus: "PUBLISHED", status: "ARCHIVED" });
    const deactivated: ContentStatusState = resolveContentStatus({ currentStatus: "DRAFT", isActive: false });
    const reactivated: ContentStatusState = resolveContentStatus({ currentStatus: "ARCHIVED", isActive: true });

    expect(archived).toEqual({ status: "ARCHIVED", isActive: false });
    expect(deactivated).toEqual({ status: "ARCHIVED", isActive: false });
    expect(reactivated).toEqual({ status: "PUBLISHED", isActive: true });
  });
});
