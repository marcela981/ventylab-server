/*
 * Funcionalidad: Repositorio Prisma de grupos
 * Descripción: Implementa IGroupsRepository sobre las tablas groups, group_members y group_supervisions; las vistas leen líder, creador, grupo padre y subgrupos activos en una sola consulta y aplican el alcance del profesor; consulta el historial (miembros actuales o pasados en audit_logs, asignaciones de evaluaciones, intentos ligados al grupo por asignación o por el groupId heredado en legacy_payload, y reservas) que impide el borrado físico, y registra la auditoría del agregado
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Group as GroupModel, type GroupMember as GroupMemberModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { GROUP_MEMBER_ENTITY_COLLECTION } from "@/features/groups/domain/entities/group-member.entity";
import { type Group, GROUP_ENTITY_COLLECTION, GROUP_ENTITY_TYPE } from "@/features/groups/domain/entities/group.entity";
import {
  type GetGroupsFilter,
  type GroupDetailView,
  type GroupMembershipSummaryView,
  type GroupMemberView,
  type GroupPersonView,
  type GroupView,
  type StudentGroupSummaryView,
} from "@/features/groups/domain/read-models/group.read-model";
import { type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { STUDENT_MEMBER_ROLE, TEACHER_MEMBER_ROLE } from "@/features/groups/domain/value-objects/group-member-role";
import { toGroupMembershipRole } from "@/features/groups/domain/value-objects/group-membership-role";
import { STUDENT_GROUP_TYPE, TEACHER_GROUP_TYPE, toGroupType } from "@/features/groups/domain/value-objects/group-type";
import { GroupsMapper } from "@/features/groups/infrastructure/persistence/prisma/mappers/groups.mapper";

interface PersonRow {
  id: string;
  name: string | null;
  email: string;
}

interface CountRow {
  members: number;
  subGroups: number;
}

type GroupViewRow = GroupModel & {
  leader: PersonRow | null;
  creator: PersonRow | null;
  parentGroup: { id: string; name: string; depth: number } | null;
  subGroups: { id: string; name: string; depth: number; _count: CountRow }[];
  _count: CountRow;
};

interface StudentGroupSummaryRow {
  id: string;
  name: string;
  leader: { id: string; name: string | null } | null;
  members: { userId: string; memberRole: string; user: { name: string | null } }[];
  supervisingGroups: { teacherGroup: { id: string; name: string } }[];
}

interface MembershipSummaryRow {
  memberRole: string;
  group: { id: string; name: string; type: string; isActive: boolean };
}

const GROUP_MEMBER_ADDED_ACTION: string = "group_member_added";

type GroupDetailRow = GroupViewRow & {
  members: (GroupMemberModel & {
    user: { id: string; name: string | null; email: string; role: string; image: string | null };
  })[];
};

@Injectable()
export class GroupsPrismaRepository implements IGroupsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Group | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: GroupModel | null = await client.group.findUnique({ where: { id } });

    return row ? GroupsMapper.toGroup(row) : undefined;
  }

  public async existsByEnrollmentCode(enrollmentCode: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: { id: string } | null = await client.group.findUnique({ where: { enrollmentCode }, select: { id: true } });

    return row !== null;
  }

  public async countSubgroups(groupId: string, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.group.count({ where: { parentGroupId: groupId } });
  }

  public async getViews(filter: GetGroupsFilter): Promise<GroupView[]> {
    const where: Prisma.GroupWhereInput = {};

    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.depth !== undefined) where.depth = filter.depth;
    if (filter.parentGroupId !== undefined) where.parentGroupId = filter.parentGroupId;
    if (filter.type !== undefined) where.type = filter.type;

    if (filter.studentId) {
      where.members = { some: { userId: filter.studentId, role: STUDENT_MEMBER_ROLE } };
    } else if (filter.teacherId) {
      where.members = { some: { userId: filter.teacherId, role: TEACHER_MEMBER_ROLE } };
    }

    if (filter.managedByTeacherId) {
      where.AND = [{ OR: this._teacherScope(filter.managedByTeacherId) }];
    }

    const rows: GroupViewRow[] = await this._prisma.group.findMany({
      where,
      include: {
        leader: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        parentGroup: { select: { id: true, name: true, depth: true } },
        subGroups: {
          where: { isActive: true },
          select: { id: true, name: true, depth: true, _count: { select: { members: true, subGroups: true } } },
        },
        _count: { select: { members: true, subGroups: true } },
      },
      orderBy: [{ depth: "asc" }, { name: "asc" }],
    });

    return rows.map((row: GroupViewRow) => this._toView(row));
  }

  public async getDetailView(id: string): Promise<GroupDetailView | undefined> {
    const row: GroupDetailRow | null = await this._prisma.group.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        parentGroup: { select: { id: true, name: true, depth: true } },
        subGroups: {
          where: { isActive: true },
          select: { id: true, name: true, depth: true, _count: { select: { members: true, subGroups: true } } },
        },
        _count: { select: { members: true, subGroups: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true, image: true } } },
          orderBy: [{ role: "asc" }, { memberRole: "asc" }, { joinedAt: "asc" }],
        },
      },
    });

    if (!row) {
      return undefined;
    }

    return {
      ...this._toView(row),
      members: row.members.map(
        (member: GroupDetailRow["members"][number]): GroupMemberView => ({
          member: GroupsMapper.toMember(member),
          user: {
            id: member.user.id,
            name: member.user.name ?? undefined,
            email: member.user.email,
            role: member.user.role,
            image: member.user.image ?? undefined,
          },
        }),
      ),
    };
  }

  public async getGroupIdsForUser(userId: string, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const memberships: { groupId: string }[] = await client.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    return memberships.map((membership: { groupId: string }) => membership.groupId);
  }

  public async isActiveGroup(groupId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const group: { isActive: boolean } | null = await client.group.findUnique({
      where: { id: groupId },
      select: { isActive: true },
    });

    return group?.isActive === true;
  }

  public async isSupervisedByTeacherMember(studentGroupId: string, teacherUserId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const links: number = await client.groupSupervision.count({
      where: { studentGroupId, teacherGroup: { isActive: true, members: { some: { userId: teacherUserId } } } },
    });

    return links > 0;
  }

  public async getSupervisedStudentGroupIds(teacherUserId: string, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const links: { studentGroupId: string }[] = await client.groupSupervision.findMany({
      where: { teacherGroup: { isActive: true, members: { some: { userId: teacherUserId } } } },
      select: { studentGroupId: true },
      distinct: ["studentGroupId"],
    });

    return links.map((link: { studentGroupId: string }) => link.studentGroupId);
  }

  public async hasActivityHistory(groupId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const counts: number[] = [
      await client.groupMember.count({ where: { groupId } }),
      await client.evaluationAssignment.count({ where: { groupId } }),
      await client.studentEvaluationAttempt.count({
        where: { OR: [{ assignment: { groupId } }, { legacyPayload: { path: ["groupId"], equals: groupId } }] },
      }),
      await client.ventilatorReservation.count({ where: { groupId } }),
      await client.auditLog.count({
        where: {
          entityCollection: GROUP_MEMBER_ENTITY_COLLECTION,
          action: GROUP_MEMBER_ADDED_ACTION,
          metadata: { path: ["groupId"], equals: groupId },
        },
      }),
    ];

    return counts.some((count: number) => count > 0);
  }

  public async getStudentGroupSummaryOfUser(userId: string): Promise<StudentGroupSummaryView | undefined> {
    const membership: { group: StudentGroupSummaryRow } | null = await this._prisma.groupMember.findFirst({
      where: { userId, group: { type: STUDENT_GROUP_TYPE, isActive: true } },
      orderBy: { joinedAt: "asc" },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            leader: { select: { id: true, name: true } },
            members: {
              select: { userId: true, memberRole: true, user: { select: { name: true } } },
              orderBy: [{ memberRole: "asc" }, { joinedAt: "asc" }],
            },
            supervisingGroups: {
              where: { teacherGroup: { isActive: true } },
              select: { teacherGroup: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!membership) {
      return undefined;
    }

    const { group }: { group: StudentGroupSummaryRow } = membership;

    return {
      id: group.id,
      name: group.name,
      leader: group.leader ? { id: group.leader.id, name: group.leader.name ?? undefined } : undefined,
      members: group.members.map((member: StudentGroupSummaryRow["members"][number]) => ({
        userId: member.userId,
        name: member.user.name ?? undefined,
        memberRole: toGroupMembershipRole(member.memberRole),
      })),
      supervisingGroups: group.supervisingGroups.map((link: StudentGroupSummaryRow["supervisingGroups"][number]) => link.teacherGroup),
    };
  }

  public async getMembershipSummariesOfUser(userId: string): Promise<GroupMembershipSummaryView[]> {
    const rows: MembershipSummaryRow[] = await this._prisma.groupMember.findMany({
      where: { userId },
      select: { memberRole: true, group: { select: { id: true, name: true, type: true, isActive: true } } },
      orderBy: { joinedAt: "asc" },
    });

    return rows.map(
      (row: MembershipSummaryRow): GroupMembershipSummaryView => ({
        groupId: row.group.id,
        groupName: row.group.name,
        groupType: toGroupType(row.group.type),
        isActive: row.group.isActive,
        memberRole: toGroupMembershipRole(row.memberRole),
      }),
    );
  }

  public async save(group: Group, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.GroupUncheckedCreateInput = GroupsMapper.toGroupPersistence(group);

    await client.group.upsert({
      where: { id: group.id },
      create: data,
      update: data,
    });

    await this._saveAuditLogs(group, transaction);
  }

  public async delete(group: Group, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.group.delete({ where: { id: group.id } });

    await this._saveAuditLogs(group, transaction);
  }

  private async _saveAuditLogs(group: Group, transaction?: unknown): Promise<void> {
    if (group.auditLogs.length > 0) {
      await this._auditLogRepository.save(GROUP_ENTITY_COLLECTION, GROUP_ENTITY_TYPE, group.id, group.auditLogs, transaction);
    }
  }

  private _teacherScope(teacherUserId: string): Prisma.GroupWhereInput[] {
    return [
      { type: STUDENT_GROUP_TYPE, createdBy: teacherUserId },
      {
        type: STUDENT_GROUP_TYPE,
        supervisingGroups: { some: { teacherGroup: { isActive: true, members: { some: { userId: teacherUserId } } } } },
      },
      { type: TEACHER_GROUP_TYPE, members: { some: { userId: teacherUserId } } },
    ];
  }

  private _toView(row: GroupViewRow): GroupView {
    return {
      group: GroupsMapper.toGroup(row),
      leader: this._toPerson(row.leader),
      creator: this._toPerson(row.creator),
      parentGroup: row.parentGroup ?? undefined,
      subGroups: row.subGroups.map((subGroup: GroupViewRow["subGroups"][number]) => ({
        id: subGroup.id,
        name: subGroup.name,
        depth: subGroup.depth,
        membersCount: subGroup._count.members,
        subGroupsCount: subGroup._count.subGroups,
      })),
      membersCount: row._count.members,
      subGroupsCount: row._count.subGroups,
    };
  }

  private _toPerson(row: PersonRow | null): GroupPersonView | undefined {
    return row ? { id: row.id, name: row.name ?? undefined, email: row.email } : undefined;
  }
}
