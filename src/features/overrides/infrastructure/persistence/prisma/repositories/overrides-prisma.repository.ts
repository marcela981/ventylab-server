/*
 * Funcionalidad: Repositorio Prisma OverridesPrismaRepository
 * Descripción: Implementa IContentOverrideRepository sobre PrismaService y resolveClient para la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type ContentOverride as ContentOverrideModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type ContentOverride,
  CONTENT_OVERRIDE_ENTITY_COLLECTION,
  CONTENT_OVERRIDE_ENTITY_TYPE,
} from "@/features/overrides/domain/entities/content-override.entity";
import { type ContentOverrideView } from "@/features/overrides/domain/read-models/content-override-view.read-model";
import { type GetStudentOverridesQuery, type IContentOverrideRepository } from "@/features/overrides/domain/repositories/overrides.repository";
import { type OverrideEntityTypeValue } from "@/features/overrides/domain/value-objects/override-entity-type";
import { type ContentOverrideViewRow, OverridesMapper } from "@/features/overrides/infrastructure/persistence/prisma/mappers/overrides.mapper";

const USERS_INCLUDE: {
  student: { select: { id: true; name: true; email: true } };
  creator: { select: { id: true; name: true; email: true } };
} = {
  student: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
};

@Injectable()
export class OverridesPrismaRepository implements IContentOverrideRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<ContentOverride | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ContentOverrideModel | null = await client.contentOverride.findUnique({ where: { id } });

    return row ? OverridesMapper.toDomain(row) : undefined;
  }

  public async existsForTarget(studentId: string, entityType: OverrideEntityTypeValue, entityId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ContentOverrideModel | null = await client.contentOverride.findUnique({
      where: { override_student_entity_unique: { studentId, entityType, entityId } },
    });

    return row !== null;
  }

  public async getView(id: string): Promise<ContentOverrideView | undefined> {
    const row: ContentOverrideViewRow | null = await this._prisma.contentOverride.findUnique({ where: { id }, include: USERS_INCLUDE });

    return row ? OverridesMapper.toView(row) : undefined;
  }

  public async getViewsForStudent(query: GetStudentOverridesQuery): Promise<ContentOverrideView[]> {
    const where: Prisma.ContentOverrideWhereInput = { studentId: query.studentId };

    if (query.entityType) where.entityType = query.entityType;
    if (!query.includeInactive) where.isActive = true;

    const rows: ContentOverrideViewRow[] = await this._prisma.contentOverride.findMany({
      where,
      include: USERS_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row: ContentOverrideViewRow) => OverridesMapper.toView(row));
  }

  public async save(override: ContentOverride, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.ContentOverrideUncheckedCreateInput = OverridesMapper.toPersistence(override);

    await client.contentOverride.upsert({
      where: { id: override.id },
      create: data,
      update: data,
    });

    if (override.auditLogs.length > 0) {
      await this._auditLogRepository.save(CONTENT_OVERRIDE_ENTITY_COLLECTION, CONTENT_OVERRIDE_ENTITY_TYPE, override.id, override.auditLogs, transaction);
    }
  }
}
