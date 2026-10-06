/*
 * Funcionalidad: Mapper de persistencia de grupos
 * Descripción: Convierte filas Prisma de Group (con su tipo) y GroupMember (con su rol heredado y su rol LEADER o MEMBER) a sus agregados y los agregados a datos de persistencia
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Group as GroupModel, type GroupMember as GroupMemberModel, type Prisma } from "@prisma/client";

import { GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { Group } from "@/features/groups/domain/entities/group.entity";
import { toGroupMemberRole } from "@/features/groups/domain/value-objects/group-member-role";
import { toGroupMembershipRole } from "@/features/groups/domain/value-objects/group-membership-role";
import { toGroupType } from "@/features/groups/domain/value-objects/group-type";

export class GroupsMapper {
  public static toGroup(row: GroupModel): Group {
    return Group.reconstitute({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      type: toGroupType(row.type),
      parentGroupId: row.parentGroupId ?? undefined,
      depth: row.depth,
      simulatorLeaderId: row.simulatorLeaderId ?? undefined,
      isActive: row.isActive,
      maxStudents: row.maxStudents ?? undefined,
      enrollmentCode: row.enrollmentCode ?? undefined,
      semester: row.semester ?? undefined,
      academicYear: row.academicYear ?? undefined,
      createdBy: row.createdBy ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toGroupPersistence(group: Group): Prisma.GroupUncheckedCreateInput {
    return {
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      type: group.type,
      parentGroupId: group.parentGroupId ?? null,
      depth: group.depth,
      simulatorLeaderId: group.simulatorLeaderId ?? null,
      isActive: group.isActive,
      maxStudents: group.maxStudents ?? null,
      enrollmentCode: group.enrollmentCode ?? null,
      semester: group.semester ?? null,
      academicYear: group.academicYear ?? null,
      createdBy: group.createdBy ?? null,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  public static toMember(row: GroupMemberModel): GroupMember {
    return GroupMember.reconstitute({
      id: row.id,
      groupId: row.groupId,
      userId: row.userId,
      role: toGroupMemberRole(row.role),
      memberRole: toGroupMembershipRole(row.memberRole),
      joinedAt: row.joinedAt,
      auditLogs: [],
    });
  }

  public static toMemberPersistence(member: GroupMember): Prisma.GroupMemberUncheckedCreateInput {
    return {
      id: member.id,
      groupId: member.groupId,
      userId: member.userId,
      role: member.role,
      memberRole: member.memberRole,
      joinedAt: member.joinedAt,
    };
  }
}
