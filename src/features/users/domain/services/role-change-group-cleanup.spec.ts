/*
 * Funcionalidad: Pruebas de la limpieza de grupos por cambio de rol
 * Descripción: Verifica qué tipos de grupo abandona un usuario según su rol anterior y su rol nuevo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { groupTypesToLeave } from "@/features/users/domain/services/role-change-group-cleanup";

describe("groupTypesToLeave", () => {
  it("leaves student groups when a student becomes staff", () => {
    expect(groupTypesToLeave("STUDENT", "TEACHER")).toEqual(["STUDENT"]);
    expect(groupTypesToLeave("STUDENT", "ADMIN")).toEqual(["STUDENT"]);
  });

  it("leaves teacher groups when staff becomes a student", () => {
    expect(groupTypesToLeave("TEACHER", "STUDENT")).toEqual(["TEACHER"]);
    expect(groupTypesToLeave("ADMIN", "STUDENT")).toEqual(["TEACHER"]);
  });

  it("keeps every membership between teacher and admin", () => {
    expect(groupTypesToLeave("TEACHER", "ADMIN")).toEqual([]);
    expect(groupTypesToLeave("ADMIN", "TEACHER")).toEqual([]);
  });

  it("keeps every membership when the role does not change", () => {
    expect(groupTypesToLeave("STUDENT", "STUDENT")).toEqual([]);
    expect(groupTypesToLeave("ADMIN", "ADMIN")).toEqual([]);
  });
});
