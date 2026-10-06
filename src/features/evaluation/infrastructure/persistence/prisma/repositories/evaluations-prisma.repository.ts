/*
 * Funcionalidad: Repositorio Prisma de evaluaciones
 * Descripción: Implementa IEvaluationsRepository con Prisma: carga el agregado completo, guarda solo los cambios pendientes (evaluación, altas y ediciones de escenarios, preguntas y opciones, bajas y reordenamientos en una sola sentencia), borra físicamente, lista resúmenes paginados, cuenta intentos y asignaciones, verifica medios y referencias, toma el candado transaccional y persiste la auditoría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type EvaluationAttemptStatus, type Evaluation as EvaluationModel, type Prisma } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type EvaluationOptionItem,
  type EvaluationPendingChanges,
  type EvaluationQuestionItem,
  type EvaluationScenarioItem,
} from "@/features/evaluation/domain/entities/evaluation-items";
import {
  type Evaluation,
  EVALUATION_ENTITY_COLLECTION,
  EVALUATION_ENTITY_TYPE,
} from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationSummaryView, type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import {
  type EvaluationReferences,
  type EvaluationSortByValue,
  type GetEvaluationsQuery,
  type IEvaluationsRepository,
} from "@/features/evaluation/domain/repositories/evaluations.repository";
import { ARCHIVED_EVALUATION_STATUS } from "@/features/evaluation/domain/value-objects/evaluation-status";
import {
  applyOptionOrder,
  applyQuestionOrder,
  applyScenarioOrder,
} from "@/features/evaluation/infrastructure/persistence/prisma/apply-evaluation-reorder";
import {
  EVALUATION_GRAPH_INCLUDE,
  type EvaluationRow,
  EvaluationsMapper,
} from "@/features/evaluation/infrastructure/persistence/prisma/mappers/evaluations.mapper";

const SUBMITTED_ATTEMPT_STATUSES: EvaluationAttemptStatus[] = ["SUBMITTED", "PENDING_REVIEW", "GRADED"];
const IN_PROGRESS_ATTEMPT_STATUS: EvaluationAttemptStatus = "IN_PROGRESS";

const SORT_FIELD_MAP: Readonly<Record<EvaluationSortByValue, keyof Prisma.EvaluationOrderByWithRelationInput>> = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  title: "title",
  order: "order",
};

type EvaluationSummaryRow = EvaluationModel & {
  createdBy: { name: string | null } | null;
  _count: { questions: number; scenarios: number; assignments: number };
};

@Injectable()
export class EvaluationsPrismaRepository implements IEvaluationsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<Evaluation | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: EvaluationRow | null = await client.evaluation.findUnique({ where: { id }, include: EVALUATION_GRAPH_INCLUDE });

    return row ? EvaluationsMapper.toDomain(row) : undefined;
  }

  public async getSummaries(query: GetEvaluationsQuery): Promise<Paginated<EvaluationSummaryView>> {
    const { page, limit, ids, type, status, search, createdById, createdAtFrom, createdAtTo, sortBy, sortOrder } = query;

    const where: Prisma.EvaluationWhereInput = {};

    where.status = status ?? { not: ARCHIVED_EVALUATION_STATUS };
    if (type) where.type = type;
    if (createdById) where.createdById = createdById;
    if (ids && ids.length > 0) where.id = { in: ids };
    if (search) where.title = { contains: search, mode: "insensitive" };

    if (createdAtFrom || createdAtTo) {
      where.createdAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const orderBy: Prisma.EvaluationOrderByWithRelationInput = {
      [SORT_FIELD_MAP[sortBy ?? "updatedAt"]]: sortOrder === "asc" ? "asc" : "desc",
    };

    const [rows, total] = await Promise.all([
      this._prisma.evaluation.findMany({
        where,
        orderBy: [orderBy, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: { select: { name: true } },
          _count: { select: { questions: true, scenarios: true, assignments: true } },
        },
      }),
      this._prisma.evaluation.count({ where }),
    ]);

    return new Paginated<EvaluationSummaryView>({
      items: rows.map((row: EvaluationSummaryRow) => this._toSummary(row)),
      total,
      page,
      limit,
    });
  }

  public async getUsage(id: string, transaction?: unknown): Promise<EvaluationUsage> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const [attempts, submittedAttempts, assignments] = await Promise.all([
      client.studentEvaluationAttempt.count({ where: { evaluationId: id } }),
      client.studentEvaluationAttempt.count({ where: { evaluationId: id, status: { in: SUBMITTED_ATTEMPT_STATUSES } } }),
      client.evaluationAssignment.count({ where: { evaluationId: id } }),
    ]);

    return { attempts, submittedAttempts, assignments };
  }

  public async findMissingMediaIds(mediaIds: ReadonlyArray<string>, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const requested: string[] = [...new Set(mediaIds)];

    if (requested.length === 0) {
      return [];
    }

    const found: { id: string }[] = await client.media.findMany({ where: { id: { in: requested } }, select: { id: true } });
    const foundIds: Set<string> = new Set(found.map((media: { id: string }) => media.id));

    return requested.filter((id: string) => !foundIds.has(id));
  }

  public async findMissingReferences(references: EvaluationReferences, transaction?: unknown): Promise<string[]> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const checks: [string, Promise<number>][] = [];

    if (references.moduleId) checks.push(["moduleId", client.module.count({ where: { id: references.moduleId } })]);
    if (references.levelId) checks.push(["levelId", client.level.count({ where: { id: references.levelId } })]);
    if (references.lessonId) checks.push(["lessonId", client.lesson.count({ where: { id: references.lessonId } })]);
    if (references.clinicalCaseId) checks.push(["clinicalCaseId", client.clinicalCase.count({ where: { id: references.clinicalCaseId } })]);

    const counts: number[] = await Promise.all(checks.map(([, count]: [string, Promise<number>]) => count));

    return checks.filter((_check: [string, Promise<number>], index: number) => counts[index] === 0).map(([name]: [string, Promise<number>]) => name);
  }

  public async acquireTransactionLock(key: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // $executeRaw instead of $queryRaw: Prisma cannot deserialize the void column returned by pg_advisory_xact_lock
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  public async save(evaluation: Evaluation, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.EvaluationUncheckedCreateInput = EvaluationsMapper.toPersistence(evaluation);
    const changes: EvaluationPendingChanges = evaluation.pendingChanges;

    await client.evaluation.upsert({ where: { id: evaluation.id }, create: data, update: data });

    for (const scenario of changes.scenarios) {
      await this._upsertScenario(client, scenario);
    }

    for (const question of changes.questions) {
      await this._upsertQuestion(client, question);
    }

    for (const option of changes.options) {
      await this._upsertOption(client, option);
    }

    await this._deleteRemoved(client, changes);
    await this._applyReorders(client, evaluation.id, changes);
    await this._saveAuditLogs(evaluation, transaction);
  }

  public async delete(evaluation: Evaluation, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.evaluation.delete({ where: { id: evaluation.id } });

    await this._saveAuditLogs(evaluation, transaction);
  }

  private async _upsertScenario(client: PrismaExecutor, scenario: EvaluationScenarioItem): Promise<void> {
    const data: Prisma.EvaluationScenarioUncheckedCreateInput = EvaluationsMapper.toScenarioPersistence(scenario);

    await client.evaluationScenario.upsert({ where: { id: scenario.id }, create: data, update: data });
  }

  private async _upsertQuestion(client: PrismaExecutor, question: EvaluationQuestionItem): Promise<void> {
    const data: Prisma.EvaluationQuestionUncheckedCreateInput = EvaluationsMapper.toQuestionPersistence(question);

    await client.evaluationQuestion.upsert({ where: { id: question.id }, create: data, update: data });
  }

  private async _upsertOption(client: PrismaExecutor, option: EvaluationOptionItem): Promise<void> {
    const data: Prisma.EvaluationQuestionOptionUncheckedCreateInput = EvaluationsMapper.toOptionPersistence(option);

    await client.evaluationQuestionOption.upsert({ where: { id: option.id }, create: data, update: data });
  }

  private async _deleteRemoved(client: PrismaExecutor, changes: EvaluationPendingChanges): Promise<void> {
    if (changes.removedOptionIds.length > 0) {
      await client.evaluationQuestionOption.deleteMany({ where: { id: { in: [...changes.removedOptionIds] } } });
    }

    if (changes.removedQuestionIds.length > 0) {
      const questionIds: string[] = [...changes.removedQuestionIds];

      // Answers reference questions with ON DELETE RESTRICT; structural changes are only allowed without submitted attempts, so only drafts of in-progress attempts can remain
      await client.evaluationAnswer.deleteMany({ where: { questionId: { in: questionIds }, attempt: { status: IN_PROGRESS_ATTEMPT_STATUS } } });
      await client.evaluationQuestion.deleteMany({ where: { id: { in: questionIds } } });
    }

    if (changes.removedScenarioIds.length > 0) {
      await client.evaluationScenario.deleteMany({ where: { id: { in: [...changes.removedScenarioIds] } } });
    }
  }

  private async _applyReorders(client: PrismaExecutor, evaluationId: string, changes: EvaluationPendingChanges): Promise<void> {
    if (changes.scenarioOrder) {
      await applyScenarioOrder(client, evaluationId, changes.scenarioOrder);
    }

    if (changes.questionOrder) {
      await applyQuestionOrder(client, evaluationId, changes.questionOrder);
    }

    for (const batch of changes.optionOrders) {
      await applyOptionOrder(client, batch.questionId, batch.entries);
    }
  }

  private async _saveAuditLogs(evaluation: Evaluation, transaction?: unknown): Promise<void> {
    if (evaluation.auditLogs.length > 0) {
      await this._auditLogRepository.save(EVALUATION_ENTITY_COLLECTION, EVALUATION_ENTITY_TYPE, evaluation.id, evaluation.auditLogs, transaction);
    }
  }

  private _toSummary(row: EvaluationSummaryRow): EvaluationSummaryView {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      status: row.status,
      moduleId: row.moduleId ?? undefined,
      levelId: row.levelId ?? undefined,
      lessonId: row.lessonId ?? undefined,
      durationMinutes: row.durationMinutes ?? undefined,
      maxAttempts: row.maxAttempts,
      showResultsImmediately: row.showResultsImmediately,
      createdById: row.createdById ?? undefined,
      createdByName: row.createdBy?.name ?? undefined,
      legacySource: row.legacySource ?? undefined,
      questionCount: row._count.questions,
      scenarioCount: row._count.scenarios,
      assignmentCount: row._count.assignments,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
