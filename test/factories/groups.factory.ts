/*
 * Funcionalidad: Fábrica de grupos de prueba
 * Descripción: Crea grupos STUDENT y TEACHER con Prisma, con miembros y líder, respetando las reglas del dominio de grupos: solo roles permitidos por tipo de grupo (isUserRoleAllowedInGroup), un estudiante en a lo sumo un grupo de estudiantes activo, un único líder que debe ser miembro y solo en grupos de estudiantes, con memberRole LEADER y simulatorLeaderId sincronizados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Group, type GroupMember, type GroupType, type PrismaClient, type User } from "@prisma/client";

import { isStudentUserRole, isUserRoleAllowedInGroup, legacyMemberRoleFor } from "@/features/groups/domain/services/group-membership-policy";

import { nextSequence } from "./sequence";

export interface GroupOverrides {
  readonly name?: string;
  readonly description?: string;
  readonly members?: readonly User[];
  readonly leader?: User;
  readonly createdBy?: User;
  readonly isActive?: boolean;
  readonly maxStudents?: number;
  readonly parentGroupId?: string;
  readonly depth?: number;
}

export interface GroupWithMembers {
  readonly group: Group;
  readonly members: GroupMember[];
}

async function assertMembershipRules(prisma: PrismaClient, type: GroupType, overrides: GroupOverrides): Promise<void> {
  const members: readonly User[] = overrides.members ?? [];

  for (const member of members) {
    if (!isUserRoleAllowedInGroup(type, member.role)) {
      throw new Error(`Group factory: role ${member.role} is not allowed in a ${type} group`);
    }

    if (type === "STUDENT" && isStudentUserRole(member.role) && (overrides.isActive ?? true)) {
      const otherGroups: number = await prisma.groupMember.count({ where: { userId: member.id, group: { type: "STUDENT", isActive: true } } });

      if (otherGroups > 0) {
        throw new Error(`Group factory: student ${member.email} already belongs to an active student group`);
      }
    }
  }

  if (overrides.leader) {
    const leaderId: string = overrides.leader.id;

    if (type !== "STUDENT") {
      throw new Error("Group factory: only student groups have a leader");
    }

    if (!members.some((member: User): boolean => member.id === leaderId)) {
      throw new Error("Group factory: the leader must be one of the members");
    }
  }
}

async function createGroup(prisma: PrismaClient, type: GroupType, overrides: GroupOverrides): Promise<GroupWithMembers> {
  await assertMembershipRules(prisma, type, overrides);

  const sequence: number = nextSequence();
  const leaderId: string | undefined = overrides.leader?.id;

  const group: Group = await prisma.group.create({
    data: {
      name: overrides.name ?? `Test ${type.toLowerCase()} group ${sequence}`,
      description: overrides.description,
      type,
      isActive: overrides.isActive ?? true,
      maxStudents: overrides.maxStudents,
      parentGroupId: overrides.parentGroupId,
      depth: overrides.depth ?? 0,
      createdBy: overrides.createdBy?.id,
      simulatorLeaderId: leaderId,
      members: {
        create: (overrides.members ?? []).map((member: User) => ({
          userId: member.id,
          role: legacyMemberRoleFor(member.role),
          memberRole: member.id === leaderId ? "LEADER" : "MEMBER",
        })),
      },
    },
  });

  const members: GroupMember[] = await prisma.groupMember.findMany({ where: { groupId: group.id }, orderBy: { joinedAt: "asc" } });

  return { group, members };
}

export function createStudentGroup(prisma: PrismaClient, overrides: GroupOverrides = {}): Promise<GroupWithMembers> {
  return createGroup(prisma, "STUDENT", overrides);
}

export function createTeacherGroup(prisma: PrismaClient, overrides: Omit<GroupOverrides, "leader"> = {}): Promise<GroupWithMembers> {
  return createGroup(prisma, "TEACHER", overrides);
}
