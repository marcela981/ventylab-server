/*
 * Funcionalidad: Pruebas de la jerarquía de roles
 * Descripción: Verifica la comparación jerárquica de roles STUDENT < TEACHER < ADMIN
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { hasRoleAtLeast } from "@/features/users/domain/services/role-hierarchy";

describe("hasRoleAtLeast", () => {
  it.each([
    ["STUDENT", "STUDENT", true],
    ["STUDENT", "TEACHER", false],
    ["STUDENT", "ADMIN", false],
    ["TEACHER", "STUDENT", true],
    ["TEACHER", "TEACHER", true],
    ["TEACHER", "ADMIN", false],
    ["ADMIN", "STUDENT", true],
    ["ADMIN", "TEACHER", true],
    ["ADMIN", "ADMIN", true],
  ] as const)("compares %s against required %s", (actual: string, required: "STUDENT" | "TEACHER" | "ADMIN", expected: boolean) => {
    const result: boolean = hasRoleAtLeast(actual, required);

    expect(result).toBe(expected);
  });

  it("rejects an unknown role", () => {
    const result: boolean = hasRoleAtLeast("SUPERVISOR", "STUDENT");

    expect(result).toBe(false);
  });
});
