/*
 * Funcionalidad: Repositorio Prisma de GradeFeedback
 * Descripción: Implementa IGradeFeedbacksRepository sobre grade_feedbacks: candado pg_advisory_xact_lock por intento, lectura por intento (global y por pregunta en orden de creación), reemplazo con deleteMany + createMany en la transacción recibida y cambio de estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type GradeFeedback as GradeFeedbackModel } from "@prisma/client";

import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type GradeFeedbackRecord } from "@/features/evaluation/domain/read-models/grade-feedback.read-model";
import { type IGradeFeedbacksRepository } from "@/features/evaluation/domain/repositories/grade-feedbacks.repository";
import { type GradeFeedbackStatusValue } from "@/features/evaluation/domain/value-objects/grade-feedback-status";
import { GradeFeedbacksMapper } from "@/features/evaluation/infrastructure/persistence/prisma/mappers/grade-feedbacks.mapper";

@Injectable()
export class GradeFeedbacksPrismaRepository implements IGradeFeedbacksRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async acquireTransactionLock(key: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  public async getByAttempt(attemptId: string, transaction?: unknown): Promise<GradeFeedbackRecord[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const rows: GradeFeedbackModel[] = await client.gradeFeedback.findMany({
      where: { attemptId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return rows.map((row: GradeFeedbackModel) => GradeFeedbacksMapper.toRecord(row));
  }

  public async replaceForAttempt(attemptId: string, records: ReadonlyArray<GradeFeedbackRecord>, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.gradeFeedback.deleteMany({ where: { attemptId } });

    if (records.length > 0) {
      await client.gradeFeedback.createMany({ data: records.map((record: GradeFeedbackRecord) => GradeFeedbacksMapper.toPersistence(record)) });
    }
  }

  public async updateStatus(id: string, status: GradeFeedbackStatusValue, now: Date, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.gradeFeedback.updateMany({ where: { id }, data: { status, updatedAt: now } });
  }
}
