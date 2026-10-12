/*
 * Funcionalidad: Repositorio Prisma GroupAnalyticsPrismaRepository
 * Descripción: Implementa IGroupAnalyticsRepository con una sola consulta sobre group_members: miembros con rol de usuario STUDENT de grupos de tipo STUDENT (todos o uno), solo con los identificadores de usuario y grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type GroupType, type UserRole } from "@prisma/client";

import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type IGroupAnalyticsRepository, type StudentMembershipView } from "@/features/groups/domain/repositories/group-analytics.repository";

const STUDENT_GROUP: GroupType = "STUDENT";

const STUDENT_ROLE: UserRole = "STUDENT";

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
}
