/*
 * Funcionalidad: Repositorio Prisma de calificaciones
 * Descripción: Implementa IScoresRepository sobre la tabla scores; los listados incluyen al profesor o al estudiante en la misma consulta y registra la auditoría del agregado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type Score as ScoreModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type Score, SCORE_ENTITY_COLLECTION, SCORE_ENTITY_TYPE } from "@/features/scores/domain/entities/score.entity";
import { type ScorePersonView, type ScoreView } from "@/features/scores/domain/read-models/score.read-model";
import { type IScoresRepository, type ScoreKey } from "@/features/scores/domain/repositories/scores.repository";
import { ScoresMapper } from "@/features/scores/infrastructure/persistence/prisma/mappers/scores.mapper";

interface PersonRow {
  id: string;
  name: string | null;
  email: string;
}

@Injectable()
export class ScoresPrismaRepository implements IScoresRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Score | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ScoreModel | null = await client.score.findUnique({ where: { id } });

    return row ? ScoresMapper.toDomain(row) : undefined;
  }

  public async getByKey(key: ScoreKey, transaction?: unknown): Promise<Score | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: ScoreModel | null = await client.score.findUnique({
      where: { graderId_userId_entityType_entityId: key },
    });

    return row ? ScoresMapper.toDomain(row) : undefined;
  }

  public async getStudentScores(userId: string, graderId?: string): Promise<ScoreView[]> {
    const rows: (ScoreModel & { grader: PersonRow })[] = await this._prisma.score.findMany({
      where: { userId, ...(graderId ? { graderId } : {}) },
      include: { grader: { select: { id: true, name: true, email: true } } },
      orderBy: [{ entityType: "asc" }, { createdAt: "desc" }],
    });

    return rows.map((row: ScoreModel & { grader: PersonRow }) => ({
      score: ScoresMapper.toDomain(row),
      grader: this._toPerson(row.grader),
    }));
  }

  public async getGraderScores(graderId: string, userId?: string): Promise<ScoreView[]> {
    const rows: (ScoreModel & { user: PersonRow })[] = await this._prisma.score.findMany({
      where: { graderId, ...(userId ? { userId } : {}) },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [{ userId: "asc" }, { entityType: "asc" }, { createdAt: "desc" }],
    });

    return rows.map((row: ScoreModel & { user: PersonRow }) => ({
      score: ScoresMapper.toDomain(row),
      student: this._toPerson(row.user),
    }));
  }

  public async save(score: Score, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.ScoreUncheckedCreateInput = ScoresMapper.toPersistence(score);

    await client.score.upsert({
      where: { id: score.id },
      create: data,
      update: data,
    });

    await this._saveAuditLogs(score, transaction);
  }

  public async delete(score: Score, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.score.delete({ where: { id: score.id } });

    await this._saveAuditLogs(score, transaction);
  }

  private async _saveAuditLogs(score: Score, transaction?: unknown): Promise<void> {
    if (score.auditLogs.length > 0) {
      await this._auditLogRepository.save(SCORE_ENTITY_COLLECTION, SCORE_ENTITY_TYPE, score.id, score.auditLogs, transaction);
    }
  }

  private _toPerson(row: PersonRow): ScorePersonView {
    return { id: row.id, name: row.name ?? undefined, email: row.email };
  }
}
