/*
 * Funcionalidad: Repositorio Prisma de casos clínicos
 * Descripción: Implementa IClinicalCasesRepository sobre las tablas clinical_cases, expert_configurations y evaluation_attempts con PrismaService y guarda la auditoría del intento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import {
  type ClinicalCase as ClinicalCaseModel,
  type ExpertConfiguration as ExpertConfigurationModel,
  type Prisma,
} from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type EvaluationAttempt,
  EVALUATION_ATTEMPT_ENTITY_COLLECTION,
  EVALUATION_ATTEMPT_ENTITY_TYPE,
} from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";
import {
  type CaseAttemptRecord,
  type ClinicalCaseDetail,
  type ClinicalCaseSummary,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import { type ExpertConfigurationData } from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import {
  type GetClinicalCasesQuery,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import {
  type CaseAttemptRow,
  ClinicalCasesMapper,
  type ClinicalCaseSummaryRow,
} from "@/features/clinical-cases/infrastructure/persistence/prisma/mappers/clinical-cases.mapper";

const CASE_SUMMARY_SELECT: Prisma.ClinicalCaseSelect = {
  id: true,
  title: true,
  description: true,
  patientAge: true,
  patientWeight: true,
  mainDiagnosis: true,
  comorbidities: true,
  difficulty: true,
  pathology: true,
  educationalGoal: true,
};

const ATTEMPT_SELECT: Prisma.EvaluationAttemptSelect = {
  id: true,
  clinicalCaseId: true,
  score: true,
  isSuccessful: true,
  completionTime: true,
  startedAt: true,
  completedAt: true,
};

@Injectable()
export class ClinicalCasesPrismaRepository implements IClinicalCasesRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getActiveCases(query: GetClinicalCasesQuery): Promise<Paginated<ClinicalCaseSummary>> {
    const { page, limit, difficulty, pathology } = query;

    const where: Prisma.ClinicalCaseWhereInput = { isActive: true };

    if (difficulty) where.difficulty = difficulty;
    if (pathology) where.pathology = pathology;

    const [rows, total] = await Promise.all([
      this._prisma.clinicalCase.findMany({
        where,
        select: CASE_SUMMARY_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this._prisma.clinicalCase.count({ where }),
    ]);

    return new Paginated({
      items: (rows as ClinicalCaseSummaryRow[]).map((row: ClinicalCaseSummaryRow) => ClinicalCasesMapper.toSummary(row)),
      total,
      page,
      limit,
    });
  }

  public async getById(caseId: string): Promise<ClinicalCaseDetail | undefined> {
    const row: ClinicalCaseModel | null = await this._prisma.clinicalCase.findUnique({ where: { id: caseId } });

    return row ? ClinicalCasesMapper.toDetail(row) : undefined;
  }

  public async getExpertConfiguration(caseId: string): Promise<ExpertConfigurationData | undefined> {
    const row: ExpertConfigurationModel | null = await this._prisma.expertConfiguration.findUnique({ where: { clinicalCaseId: caseId } });

    return row ? ClinicalCasesMapper.toExpertConfiguration(row) : undefined;
  }

  public async getUserAttempts(userId: string, caseId: string, limit?: number): Promise<CaseAttemptRecord[]> {
    const rows: CaseAttemptRow[] = (await this._prisma.evaluationAttempt.findMany({
      where: { userId, clinicalCaseId: caseId },
      select: ATTEMPT_SELECT,
      orderBy: { completedAt: "desc" },
      take: limit,
    }));

    return rows.map((row: CaseAttemptRow) => ClinicalCasesMapper.toAttemptRecord(row));
  }

  public async getUserAttemptsForCases(userId: string, caseIds: string[]): Promise<CaseAttemptRecord[]> {
    const rows: CaseAttemptRow[] = (await this._prisma.evaluationAttempt.findMany({
      where: { userId, clinicalCaseId: { in: caseIds } },
      select: ATTEMPT_SELECT,
      orderBy: { completedAt: "desc" },
    }));

    return rows.map((row: CaseAttemptRow) => ClinicalCasesMapper.toAttemptRecord(row));
  }

  public async getLatestOtherAttemptScore(userId: string, caseId: string, excludedAttemptId: string): Promise<number | undefined> {
    const row: { score: number } | null = await this._prisma.evaluationAttempt.findFirst({
      where: { userId, clinicalCaseId: caseId, id: { not: excludedAttemptId } },
      select: { score: true },
      orderBy: { completedAt: "desc" },
    });

    return row?.score;
  }

  public async saveAttempt(attempt: EvaluationAttempt, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.EvaluationAttemptUncheckedCreateInput = ClinicalCasesMapper.toAttemptPersistence(attempt);

    await client.evaluationAttempt.upsert({
      where: { id: attempt.id },
      create: data,
      update: data,
    });

    if (attempt.auditLogs.length > 0) {
      await this._auditLogRepository.save(
        EVALUATION_ATTEMPT_ENTITY_COLLECTION,
        EVALUATION_ATTEMPT_ENTITY_TYPE,
        attempt.id,
        attempt.auditLogs,
        transaction,
      );
    }
  }
}
