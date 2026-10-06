/*
 * Funcionalidad: Pruebas de la política de membresía de grupos
 * Descripción: Verifica qué roles de usuario admite cada tipo de grupo, el rol heredado que se escribe en la membresía y las claves de bloqueo por estudiante y por grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  groupLeadershipLockKey,
  isUserRoleAllowedInGroup,
  legacyMemberRoleFor,
  studentMembershipLockKey,
} from "@/features/groups/domain/services/group-membership-policy";

describe("isUserRoleAllowedInGroup", () => {
  it("admits only students in student groups", () => {
    const results: boolean[] = [
      isUserRoleAllowedInGroup("STUDENT", "STUDENT"),
      isUserRoleAllowedInGroup("STUDENT", "TEACHER"),
      isUserRoleAllowedInGroup("STUDENT", "ADMIN"),
    ];

    expect(results).toEqual([true, false, false]);
  });

  it("admits teachers and admins in teacher groups", () => {
    const results: boolean[] = [
      isUserRoleAllowedInGroup("TEACHER", "STUDENT"),
      isUserRoleAllowedInGroup("TEACHER", "TEACHER"),
      isUserRoleAllowedInGroup("TEACHER", "ADMIN"),
    ];

    expect(results).toEqual([false, true, true]);
  });
});

describe("legacyMemberRoleFor", () => {
  it("keeps STUDENT for students and TEACHER for teachers and admins", () => {
    const results: string[] = [legacyMemberRoleFor("STUDENT"), legacyMemberRoleFor("TEACHER"), legacyMemberRoleFor("ADMIN")];

    expect(results).toEqual(["STUDENT", "TEACHER", "TEACHER"]);
  });
});

describe("lock keys", () => {
  it("builds distinct namespaced keys per student and per group", () => {
    const keys: string[] = [studentMembershipLockKey("u1"), groupLeadershipLockKey("u1")];

    expect(keys[0]).not.toEqual(keys[1]);
    expect(keys[0]).toContain("u1");
    expect(keys[1]).toContain("u1");
  });
});
