/*
 * Funcionalidad: Repositorio Prisma GroupAnalyticsPrismaRepository
 * Descripción: Implementa IGroupAnalyticsRepository con una consulta por lectura: miembros con rol de usuario STUDENT de grupos de tipo STUDENT (todos o uno), identificadores de grupos STUDENT que un profesor creó o supervisa desde un grupo TEACHER activo del que es miembro (opcionalmente acotados a una lista) y conteo de membresías STUDENT de un usuario con rol STUDENT en unos grupos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type GroupType, type Prisma, type UserRole } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type IGroupAnalyticsRepository,
  type StudentGroupIdsFilter,
  type StudentMembershipView,
} from "@/features/groups/domain/repositories/group-analytics.repository";

const STUDENT_GROUP: GroupType = "STUDENT";

const STUDENT_ROLE: UserRole = "STUDENT";

function managedByWhere(teacherUserId: string): Prisma.GroupWhereInput {
  return {
    OR: [
      { createdBy: teacherUserId },
      { supervisingGroups: { some: { teacherGroup: { isActive: true, members: { some: { userId: teacherUserId } } } } } },
    ],
  };
}

@Injectable()
export class GroupAnalyticsPrismaRepository implements IGroupAnalyticsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getStudentMemberships(groupId?: string): Promise<StudentMembershipView[]> {
    return await this._prisma.groupMember.findMany({
      where: { ...(groupId !== undefined ? { groupId } : {}), group: { type: STUDENT_GROUP }, user: { role: STUDENT_ROLE } },
      select: { userId: true, groupId: true },
      orderBy: [{ groupId: "asc" }, { userId: "asc" }],
    });
  }

  public async getStudentGroupIds(filter: StudentGroupIdsFilter): Promise<string[]> {
    if (filter.groupIds !== undefined && filter.groupIds.length === 0) {
      return [];
    }

    const rows: { id: string }[] = await this._prisma.group.findMany({
      where: {
        AND: [
          { type: STUDENT_GROUP },
          ...(filter.groupIds !== undefined ? [{ id: { in: [...filter.groupIds] } }] : []),
          ...(filter.managedBy !== undefined ? [managedByWhere(filter.managedBy)] : []),
        ],
      },
      select: { id: true },
      orderBy: { id: "asc" },
    });

    return rows.map((row: { id: string }) => row.id);
  }

  public async isStudentMemberOfAny(userId: string, groupIds?: ReadonlyArray<string>): Promise<boolean> {
    if (groupIds !== undefined && groupIds.length === 0) {
      return false;
    }

    const count: number = await this._prisma.groupMember.count({
      where: {
        userId,
        ...(groupIds !== undefined ? { groupId: { in: [...groupIds] } } : {}),
        group: { type: STUDENT_GROUP },
        user: { role: STUDENT_ROLE },
      },
    });

    return count > 0;
  }
}
