/*
 * Funcionalidad: Pruebas de la política de gestión de evaluaciones
 * Descripción: Verifica que ADMIN gestiona cualquier evaluación, TEACHER solo las que creó y STUDENT ninguna
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { canManageEvaluation } from "@/features/evaluation/domain/services/evaluation-management-policy";

describe("canManageEvaluation", () => {
  it("lets an admin manage any evaluation, including legacy ones without creator", () => {
    const allowed: boolean[] = [
      canManageEvaluation({ id: "admin-1", role: "ADMIN" }, { createdById: "teacher-1" }),
      canManageEvaluation({ id: "admin-1", role: "ADMIN" }, {}),
    ];

    expect(allowed).toEqual([true, true]);
  });

  it("lets a teacher manage only the evaluations they created", () => {
    const own: boolean = canManageEvaluation({ id: "teacher-1", role: "TEACHER" }, { createdById: "teacher-1" });
    const other: boolean = canManageEvaluation({ id: "teacher-1", role: "TEACHER" }, { createdById: "teacher-2" });
    const legacy: boolean = canManageEvaluation({ id: "teacher-1", role: "TEACHER" }, {});

    expect([own, other, legacy]).toEqual([true, false, false]);
  });

  it("never lets a student manage an evaluation", () => {
    const allowed: boolean = canManageEvaluation({ id: "student-1", role: "STUDENT" }, { createdById: "student-1" });

    expect(allowed).toBe(false);
  });
});
