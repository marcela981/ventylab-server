/*
 * Funcionalidad: Repositorio Prisma de media
 * Descripción: Persiste y consulta la tabla media con PrismaService; incluye dos lecturas acotadas sobre page_sections (conteo de referencias por mediaId y existencia de una referencia visible para estudiantes con página, lección, módulo, nivel y sección publicados)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { ContentStatus, type Media as MediaModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type Media, MEDIA_ENTITY_COLLECTION, MEDIA_ENTITY_TYPE } from "@/features/media/domain/entities/media.entity";
import { type GetMediaListQuery, type IMediaRepository } from "@/features/media/domain/repositories/media.repository";
import { MediaMapper } from "@/features/media/infrastructure/persistence/prisma/mappers/media.mapper";

const PUBLISHED_STATUS: ContentStatus = ContentStatus.PUBLISHED;

@Injectable()
export class MediaPrismaRepository implements IMediaRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getAll(query: GetMediaListQuery, transaction?: unknown): Promise<Paginated<Media>> {
    const { page, limit, ids, ownerId, kind, search, sortOrder, createdAtFrom, createdAtTo } = query;

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.MediaWhereInput = {};

    if (ids && ids.length > 0) where.id = { in: ids };
    if (ownerId) where.ownerId = ownerId;
    if (kind) where.kind = kind;
    if (search) where.originalName = { contains: search, mode: "insensitive" };

    if (createdAtFrom || createdAtTo) {
      where.createdAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const [rows, total] = await Promise.all([
      client.media.findMany({
        where,
        orderBy: { createdAt: sortOrder === "asc" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.media.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: MediaModel) => MediaMapper.toDomain(row)),
      total,
      page,
      limit,
    });
  }

  public async getById(id: string, transaction?: unknown): Promise<Media | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: MediaModel | null = await client.media.findUnique({ where: { id } });

    return row ? MediaMapper.toDomain(row) : undefined;
  }

  public async getByIds(ids: string[], transaction?: unknown): Promise<Media[]> {
    if (ids.length === 0) {
      return [];
    }

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: MediaModel[] = await client.media.findMany({ where: { id: { in: ids } } });

    return rows.map((row: MediaModel) => MediaMapper.toDomain(row));
  }

  public async countPageSectionReferences(mediaId: string, transaction?: unknown): Promise<number> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    return await client.pageSection.count({ where: { mediaId } });
  }

  public async isReferencedByPublishedContent(mediaId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const reference: { id: string } | null = await client.pageSection.findFirst({
      where: {
        mediaId,
        isActive: true,
        page: {
          is: {
            status: PUBLISHED_STATUS,
            lesson: { is: { status: PUBLISHED_STATUS } },
            module: {
              is: {
                status: PUBLISHED_STATUS,
                level: { is: { status: PUBLISHED_STATUS, section: { is: { status: PUBLISHED_STATUS } } } },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    return reference !== null;
  }

  public async save(media: Media, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.MediaUncheckedCreateInput = MediaMapper.toPersistence(media);

    await client.media.upsert({
      where: { id: media.id },
      create: data,
      update: data,
    });

    await this._saveAuditLogs(media, transaction);
  }

  public async delete(media: Media, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.media.delete({ where: { id: media.id } });

    await this._saveAuditLogs(media, transaction);
  }

  private async _saveAuditLogs(media: Media, transaction?: unknown): Promise<void> {
    if (media.auditLogs.length > 0) {
      await this._auditLogRepository.save(MEDIA_ENTITY_COLLECTION, MEDIA_ENTITY_TYPE, media.id, media.auditLogs, transaction);
    }
  }
}
