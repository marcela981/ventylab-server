/*
 * Funcionalidad: Pruebas de la política de gestión de grupos
 * Descripción: Verifica quién puede crear, gestionar y leer grupos según su rol (ADMIN, TEACHER, STUDENT), el tipo del grupo, su creador, la supervisión y la pertenencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  canCreateGroup,
  canManageGroup,
  canReadGroup,
  type GroupActor,
  type ManagedGroup,
} from "@/features/groups/domain/services/group-management-policy";

const ADMIN: GroupActor = { id: "admin-1", role: "ADMIN" };
const TEACHER: GroupActor = { id: "teacher-1", role: "TEACHER" };
const STUDENT: GroupActor = { id: "student-1", role: "STUDENT" };

const OWN_STUDENT_GROUP: ManagedGroup = { type: "STUDENT", createdBy: "teacher-1" };
const OTHER_STUDENT_GROUP: ManagedGroup = { type: "STUDENT", createdBy: "teacher-2" };
const TEACHER_GROUP: ManagedGroup = { type: "TEACHER", createdBy: "admin-1" };

describe("canCreateGroup", () => {
  it("lets an admin create both group types", () => {
    const results: boolean[] = [canCreateGroup(ADMIN, "STUDENT"), canCreateGroup(ADMIN, "TEACHER")];

    expect(results).toEqual([true, true]);
  });

  it("lets a teacher create only student groups", () => {
    const results: boolean[] = [canCreateGroup(TEACHER, "STUDENT"), canCreateGroup(TEACHER, "TEACHER")];

    expect(results).toEqual([true, false]);
  });

  it("never lets a student create groups", () => {
    const results: boolean[] = [canCreateGroup(STUDENT, "STUDENT"), canCreateGroup(STUDENT, "TEACHER")];

    expect(results).toEqual([false, false]);
  });
});

describe("canManageGroup", () => {
  it("lets an admin manage every group", () => {
    const results: boolean[] = [
      canManageGroup(ADMIN, OTHER_STUDENT_GROUP, { supervisedByActor: false }),
      canManageGroup(ADMIN, TEACHER_GROUP, { supervisedByActor: false }),
    ];

    expect(results).toEqual([true, true]);
  });

  it("lets a teacher manage a student group they created", () => {
    const result: boolean = canManageGroup(TEACHER, OWN_STUDENT_GROUP, { supervisedByActor: false });

    expect(result).toBe(true);
  });

  it("lets a teacher manage a student group supervised by one of their teacher groups", () => {
    const result: boolean = canManageGroup(TEACHER, OTHER_STUDENT_GROUP, { supervisedByActor: true });

    expect(result).toBe(true);
  });

  it("denies a teacher a student group they neither created nor supervise", () => {
    const result: boolean = canManageGroup(TEACHER, OTHER_STUDENT_GROUP, { supervisedByActor: false });

    expect(result).toBe(false);
  });

  it("denies a teacher every teacher group, even one they created", () => {
    const result: boolean = canManageGroup(TEACHER, { type: "TEACHER", createdBy: "teacher-1" }, { supervisedByActor: true });

    expect(result).toBe(false);
  });

  it("denies a student any management", () => {
    const result: boolean = canManageGroup(STUDENT, { type: "STUDENT", createdBy: "student-1" }, { supervisedByActor: true });

    expect(result).toBe(false);
  });
});

describe("canReadGroup", () => {
  it("lets an admin read every group", () => {
    const result: boolean = canReadGroup(ADMIN, TEACHER_GROUP, { canManage: false, isMember: false });

    expect(result).toBe(true);
  });

  it("lets a teacher read the groups they manage and the teacher groups they belong to", () => {
    const results: boolean[] = [
      canReadGroup(TEACHER, OWN_STUDENT_GROUP, { canManage: true, isMember: false }),
      canReadGroup(TEACHER, TEACHER_GROUP, { canManage: false, isMember: true }),
      canReadGroup(TEACHER, OTHER_STUDENT_GROUP, { canManage: false, isMember: false }),
      canReadGroup(TEACHER, TEACHER_GROUP, { canManage: false, isMember: false }),
    ];

    expect(results).toEqual([true, true, false, false]);
  });

  it("lets a student read only the student group they belong to", () => {
    const results: boolean[] = [
      canReadGroup(STUDENT, OTHER_STUDENT_GROUP, { canManage: false, isMember: true }),
      canReadGroup(STUDENT, OTHER_STUDENT_GROUP, { canManage: false, isMember: false }),
      canReadGroup(STUDENT, TEACHER_GROUP, { canManage: false, isMember: true }),
    ];

    expect(results).toEqual([true, false, false]);
  });
});
