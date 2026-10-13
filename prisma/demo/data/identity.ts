/*
 * Funcionalidad: Semilla de identidades de la demostración
 * Descripción: Inserta o actualiza las cuentas ficticias (superadmin, docentes y estudiantes con la contraseña de demostración), el grupo docente, los dos grupos de estudiantes con su líder (memberRole LEADER y simulatorLeaderId sincronizados), la supervisión docente y las filas de app_settings: superadmin_email (que lee el disparador protect_superadmin) y el marcador demo_database
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma } from "@prisma/client";

import { DEMO_STUDENT_GROUPS, DEMO_STUDENTS, DEMO_TEACHER_GROUP, DEMO_TEACHERS, type DemoPerson, type DemoStudentGroup, demoSuperadmin } from "../demo-cast";
import { DEMO_MARKER_KEY, DEMO_MARKER_VALUE, type DemoContext, type DemoDb, demoId, SUPERADMIN_SETTING_KEY, upsertAll } from "../demo-support";

function memberRow(groupId: string, member: DemoPerson, leaderId: string | undefined, joinedAt: Date): Prisma.GroupMemberCreateManyInput {
  return {
    id: demoId(`group-member:${groupId}:${member.id}`),
    groupId,
    userId: member.id,
    role: member.role === "STUDENT" ? "STUDENT" : "TEACHER",
    memberRole: member.id === leaderId ? "LEADER" : "MEMBER",
    joinedAt,
  };
}

async function seedSettings(db: DemoDb, context: DemoContext): Promise<void> {
  const settings: readonly [string, string][] = [
    [SUPERADMIN_SETTING_KEY, context.superadminEmail.toLowerCase()],
    [DEMO_MARKER_KEY, DEMO_MARKER_VALUE],
  ];

  for (const [key, value] of settings) {
    await db.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
}

function userRow(person: DemoPerson, context: DemoContext, createdAt: Date): Prisma.UserCreateManyInput {
  return {
    id: person.id,
    email: person.email,
    name: person.name,
    role: person.role,
    password: context.passwordHash,
    emailVerified: createdAt,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  };
}

// The superadmin is matched by email: an account with SUPERADMIN_EMAIL may already exist, and its password is never overwritten.
async function seedSuperadmin(db: DemoDb, context: DemoContext, createdAt: Date): Promise<string> {
  const superadmin: DemoPerson = demoSuperadmin(context.superadminEmail);

  const row: { id: string } = await db.user.upsert({
    where: { email: superadmin.email },
    create: userRow(superadmin, context, createdAt),
    update: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  return row.id;
}

export async function seedIdentity(db: DemoDb, context: DemoContext): Promise<void> {
  await seedSettings(db, context);

  const createdAt: Date = context.clock.at(-60, 9);
  const superadminId: string = await seedSuperadmin(db, context, createdAt);
  const users: Prisma.UserCreateManyInput[] = [...DEMO_TEACHERS, ...DEMO_STUDENTS].map((person: DemoPerson) => userRow(person, context, createdAt));

  await upsertAll(users, (row: Prisma.UserCreateManyInput, id: string) => db.user.upsert({ where: { id }, create: row, update: row }));

  const groupCreatedAt: Date = context.clock.at(-58, 10);

  const groups: Prisma.GroupCreateManyInput[] = [
    {
      id: DEMO_TEACHER_GROUP.id,
      name: DEMO_TEACHER_GROUP.name,
      description: DEMO_TEACHER_GROUP.description,
      type: "TEACHER",
      depth: 0,
      isActive: true,
      createdBy: superadminId,
      createdAt: groupCreatedAt,
      updatedAt: groupCreatedAt,
    },
    ...DEMO_STUDENT_GROUPS.map((group: DemoStudentGroup): Prisma.GroupCreateManyInput => ({
      id: group.id,
      name: group.name,
      description: group.description,
      type: "STUDENT",
      depth: 0,
      isActive: true,
      maxStudents: 10,
      semester: "2026-2",
      academicYear: "2026",
      createdBy: group.createdBy.id,
      simulatorLeaderId: group.leader.id,
      createdAt: groupCreatedAt,
      updatedAt: groupCreatedAt,
    })),
  ];

  await upsertAll(groups, (row: Prisma.GroupCreateManyInput, id: string) => db.group.upsert({ where: { id }, create: row, update: row }));

  const members: Prisma.GroupMemberCreateManyInput[] = [
    ...DEMO_TEACHERS.map((teacher: DemoPerson) => memberRow(DEMO_TEACHER_GROUP.id, teacher, undefined, groupCreatedAt)),
    ...DEMO_STUDENT_GROUPS.flatMap((group: DemoStudentGroup) => group.members.map((member: DemoPerson) => memberRow(group.id, member, group.leader.id, groupCreatedAt))),
  ];

  await upsertAll(members, (row: Prisma.GroupMemberCreateManyInput, id: string) => db.groupMember.upsert({ where: { id }, create: row, update: row }));

  for (const group of DEMO_STUDENT_GROUPS) {
    const key: Prisma.GroupSupervisionTeacherGroupIdStudentGroupIdCompoundUniqueInput = { teacherGroupId: DEMO_TEACHER_GROUP.id, studentGroupId: group.id };

    await db.groupSupervision.upsert({
      where: { teacherGroupId_studentGroupId: key },
      create: { ...key, createdAt: groupCreatedAt },
      update: { createdAt: groupCreatedAt },
    });
  }
}
