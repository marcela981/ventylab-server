/*
 * Funcionalidad: Repositorio Prisma de miembros de grupo
 * Descripción: Implementa IGroupMembersRepository sobre la tabla group_members; la vista de miembros incluye los datos del usuario en la misma consulta, lista los usuarios STUDENT miembros del grupo, cuenta las membresías del estudiante en otros grupos STUDENT activos, toma el bloqueo pg_advisory_xact_lock con el cliente de la transacción y registra la auditoría del agregado
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type GroupMember as GroupMemberModel, type Prisma, UserRole } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type GroupMember,
  GROUP_MEMBER_ENTITY_COLLECTION,
  GROUP_MEMBER_ENTITY_TYPE,
} from "@/features/groups/domain/entities/group-member.entity";
import { type GroupMemberView } from "@/features/groups/domain/read-models/group.read-model";
import { type IGroupMembersRepository } from "@/features/groups/domain/repositories/group-members.repository";
import { type GroupMemberRoleValue } from "@/features/groups/domain/value-objects/group-member-role";
import { LEADER_MEMBERSHIP_ROLE } from "@/features/groups/domain/value-objects/group-membership-role";
import { STUDENT_GROUP_TYPE } from "@/features/groups/domain/value-objects/group-type";
import { GroupsMapper } from "@/features/groups/infrastructure/persistence/prisma/mappers/groups.mapper";

type MemberViewRow = GroupMemberModel & {
  user: { id: string; name: string | null; email: string; role: string; image: string | null; createdAt: Date };
};

@Injectable()
export class GroupMembersPrismaRepository implements IGroupMembersRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getByGroupAndUser(groupId: string, userId: string, transaction?: unknown): Promise<GroupMember | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: GroupMemberModel | null = await client.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });

    return row ? GroupsMapper.toMember(row) : undefined;
  }

  public async getLeaders(groupId: string, transaction?: unknown): Promise<GroupMember[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: GroupMemberModel[] = await client.groupMember.findMany({ where: { groupId, memberRole: LEADER_MEMBERSHIP_ROLE } });

    return rows.map((row: GroupMemberModel) => GroupsMapper.toMember(row));
  }

  public async getStudentMemberUserIds(groupId: string, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: { userId: string }[] = await client.groupMember.findMany({
      where: { groupId, user: { role: UserRole.STUDENT } },
      select: { userId: true },
      orderBy: { userId: "asc" },
    });

    return rows.map((row: { userId: string }) => row.userId);
  }

  public async countOtherActiveStudentGroupMemberships(userId: string, excludedGroupId: string, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.groupMember.count({
      where: { userId, groupId: { not: excludedGroupId }, group: { type: STUDENT_GROUP_TYPE, isActive: true } },
    });
  }

  public async acquireTransactionLock(key: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  public async countByRole(groupId: string, role: GroupMemberRoleValue, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.groupMember.count({ where: { groupId, role } });
  }

  public async getViews(groupId: string): Promise<GroupMemberView[]> {
    const rows: MemberViewRow[] = await this._prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true, role: true, image: true, createdAt: true } } },
      orderBy: [{ role: "asc" }, { memberRole: "asc" }, { joinedAt: "asc" }],
    });

    return rows.map((row: MemberViewRow) => ({
      member: GroupsMapper.toMember(row),
      user: {
        id: row.user.id,
        name: row.user.name ?? undefined,
        email: row.user.email,
        role: row.user.role,
        image: row.user.image ?? undefined,
        createdAt: row.user.createdAt,
      },
    }));
  }

  public async save(member: GroupMember, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.GroupMemberUncheckedCreateInput = GroupsMapper.toMemberPersistence(member);

    await client.groupMember.upsert({
      where: { id: member.id },
      create: data,
      update: data,
    });

    await this._saveAuditLogs(member, transaction);
  }

  public async delete(member: GroupMember, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.groupMember.delete({ where: { id: member.id } });

    await this._saveAuditLogs(member, transaction);
  }

  private async _saveAuditLogs(member: GroupMember, transaction?: unknown): Promise<void> {
    if (member.auditLogs.length > 0) {
      await this._auditLogRepository.save(
        GROUP_MEMBER_ENTITY_COLLECTION,
        GROUP_MEMBER_ENTITY_TYPE,
        member.id,
        member.auditLogs,
        transaction,
      );
    }
  }
}
