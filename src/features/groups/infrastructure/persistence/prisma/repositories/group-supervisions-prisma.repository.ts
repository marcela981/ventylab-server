/*
 * Funcionalidad: Repositorio Prisma de supervisiones de grupo
 * Descripción: Implementa IGroupSupervisionsRepository sobre la tabla group_supervisions (clave compuesta grupo TEACHER y grupo STUDENT) con el cliente de la transacción activa; la vista incluye nombre y estado del grupo supervisado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type GroupSupervision as GroupSupervisionModel } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type GroupSupervisionView } from "@/features/groups/domain/read-models/group.read-model";
import { type IGroupSupervisionsRepository } from "@/features/groups/domain/repositories/group-supervisions.repository";

type SupervisionViewRow = GroupSupervisionModel & { studentGroup: { id: string; name: string; isActive: boolean } };

@Injectable()
export class GroupSupervisionsPrismaRepository implements IGroupSupervisionsRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async exists(teacherGroupId: string, studentGroupId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: GroupSupervisionModel | null = await client.groupSupervision.findUnique({
      where: { teacherGroupId_studentGroupId: { teacherGroupId, studentGroupId } },
    });

    return row !== null;
  }

  public async add(teacherGroupId: string, studentGroupId: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.groupSupervision.create({ data: { teacherGroupId, studentGroupId } });
  }

  public async remove(teacherGroupId: string, studentGroupId: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.groupSupervision.delete({ where: { teacherGroupId_studentGroupId: { teacherGroupId, studentGroupId } } });
  }

  public async getViews(teacherGroupId: string): Promise<GroupSupervisionView[]> {
    const rows: SupervisionViewRow[] = await this._prisma.groupSupervision.findMany({
      where: { teacherGroupId },
      include: { studentGroup: { select: { id: true, name: true, isActive: true } } },
      orderBy: { createdAt: "asc" },
    });

    return rows.map(
      (row: SupervisionViewRow): GroupSupervisionView => ({
        teacherGroupId: row.teacherGroupId,
        studentGroup: row.studentGroup,
        createdAt: row.createdAt,
      }),
    );
  }
}
