/*
 * Funcionalidad: Elenco de la demostración
 * Descripción: Identidades ficticias de la base de demostración (superadmin, dos docentes y diez estudiantes con correos @ventylab.demo) y sus grupos: un grupo TEACHER con ambos docentes que supervisa dos grupos STUDENT de cinco estudiantes con un líder cada uno; todos los IDs son deterministas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type UserRole } from "@prisma/client";

import { DEMO_EMAIL_DOMAIN, demoId } from "./demo-support";

export interface DemoPerson {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
}

export interface DemoStudentGroup {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly members: readonly DemoPerson[];
  readonly leader: DemoPerson;
  readonly createdBy: DemoPerson;
}

function person(key: string, email: string, name: string, role: UserRole): DemoPerson {
  return { id: demoId(`user:${key}`), email: `${email}@${DEMO_EMAIL_DOMAIN}`, name, role };
}

export const DEMO_TEACHERS: readonly [DemoPerson, DemoPerson] = [
  person("teacher-1", "ana.torres", "Ana Torres", "TEACHER"),
  person("teacher-2", "luis.herrera", "Luis Herrera", "TEACHER"),
];

const STUDENT_NAMES: readonly string[] = [
  "Camila Rojas",
  "Santiago Gómez",
  "Valentina Díaz",
  "Mateo Vargas",
  "Isabella Castro",
  "Sebastián Ortiz",
  "Mariana López",
  "Nicolás Ramírez",
  "Gabriela Moreno",
  "Daniel Suárez",
];

export const DEMO_STUDENTS: readonly DemoPerson[] = STUDENT_NAMES.map((name: string, index: number): DemoPerson => {
  const number: string = String(index + 1).padStart(2, "0");

  return person(`student-${number}`, `estudiante${number}`, name, "STUDENT");
});

export function demoStudent(index: number): DemoPerson {
  const student: DemoPerson | undefined = DEMO_STUDENTS[index];

  if (!student) {
    throw new Error(`Demo student ${index} does not exist`);
  }

  return student;
}

export function demoSuperadmin(email: string): DemoPerson {
  return { id: demoId("user:superadmin"), email: email.toLowerCase(), name: "Superadmin VentyLab (demo)", role: "ADMIN" };
}

export const DEMO_TEACHER_GROUP: { readonly id: string; readonly name: string; readonly description: string } = {
  id: demoId("group:teachers"),
  name: "Docentes de ventilación mecánica (demo)",
  description: "Equipo docente que supervisa los grupos de estudiantes de la demostración",
};

export const DEMO_STUDENT_GROUPS: readonly [DemoStudentGroup, DemoStudentGroup] = [
  {
    id: demoId("group:students-a"),
    name: "Grupo A — mañana (demo)",
    description: "Estudiantes de la jornada de la mañana",
    members: DEMO_STUDENTS.slice(0, 5),
    leader: demoStudent(0),
    createdBy: DEMO_TEACHERS[0],
  },
  {
    id: demoId("group:students-b"),
    name: "Grupo B — tarde (demo)",
    description: "Estudiantes de la jornada de la tarde",
    members: DEMO_STUDENTS.slice(5, 10),
    leader: demoStudent(5),
    createdBy: DEMO_TEACHERS[1],
  },
];

export function studentGroupOf(student: DemoPerson): DemoStudentGroup {
  const group: DemoStudentGroup | undefined = DEMO_STUDENT_GROUPS.find((candidate: DemoStudentGroup): boolean =>
    candidate.members.some((member: DemoPerson): boolean => member.id === student.id),
  );

  if (!group) {
    throw new Error(`Demo student ${student.email} has no group`);
  }

  return group;
}
