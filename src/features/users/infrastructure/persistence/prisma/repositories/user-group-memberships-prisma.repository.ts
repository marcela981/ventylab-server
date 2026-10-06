/*
 * Funcionalidad: Repositorio UserGroupMembershipsPrismaRepository
 * Descripción: Implementa IUserGroupMembershipsRepository con Prisma: borra las membresías del usuario en grupos de los tipos indicados y, al dejar los grupos de estudiantes, quita su liderazgo de simulador; escribe sobre group_members y groups con el cliente de la transacción
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Prisma } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type IUserGroupMembershipsRepository } from "@/features/users/domain/repositories/user-group-memberships.repository";
import { type MembershipGroupTypeValue, STUDENT_GROUP_TYPE } from "@/features/users/domain/services/role-change-group-cleanup";

@Injectable()
export class UserGroupMembershipsPrismaRepository implements IUserGroupMembershipsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async removeFromGroupTypes(userId: string, groupTypes: readonly MembershipGroupTypeValue[], transaction?: unknown): Promise<string[]> {
    if (groupTypes.length === 0) {
      return [];
    }

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.GroupMemberWhereInput = { userId, group: { type: { in: [...groupTypes] } } };

    const memberships: { groupId: string }[] = await client.groupMember.findMany({ where, select: { groupId: true } });

    await client.groupMember.deleteMany({ where });

    if (groupTypes.includes(STUDENT_GROUP_TYPE)) {
      await client.group.updateMany({ where: { simulatorLeaderId: userId }, data: { simulatorLeaderId: null } });
    }

    return memberships.map((membership: { groupId: string }) => membership.groupId);
  }
}
