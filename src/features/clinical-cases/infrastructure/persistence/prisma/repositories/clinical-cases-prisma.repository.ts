/*
 * Funcionalidad: Repositorio Prisma de casos clínicos
 * Descripción: Implementa IClinicalCasesRepository sobre las tablas clinical_cases, expert_configurations y evaluation_attempts con PrismaService: listado filtrado por estado, lectura y escritura del agregado ClinicalCase, bloqueo FOR UPDATE de la fila del caso, conteo de uso (sesiones de simulación, sesiones heredadas, intentos y preguntas) y auditoría del intento
 * Versión: 1.1
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
import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  type EvaluationAttempt,
  EVALUATION_ATTEMPT_ENTITY_COLLECTION,
  EVALUATION_ATTEMPT_ENTITY_TYPE,
} from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";
import {
  type CaseAttemptRecord,
  type ClinicalCaseDetail,
  type ClinicalCaseSummary,
  type ClinicalCaseUsage,
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

  public async getCases(query: GetClinicalCasesQuery): Promise<Paginated<ClinicalCaseSummary>> {
    const { page, limit, difficulty, pathology, status } = query;

    const where: Prisma.ClinicalCaseWhereInput = {};

    if (difficulty) where.difficulty = difficulty;
    if (pathology) where.pathology = pathology;
    if (status) where.status = status;

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

  public async getCaseById(caseId: string, transaction?: unknown): Promise<ClinicalCase | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const row: ClinicalCaseModel | null = await client.clinicalCase.findUnique({ where: { id: caseId } });

    return row ? ClinicalCasesMapper.toClinicalCase(row) : undefined;
  }

  public async lockCase(caseId: string, transaction: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    // FOR UPDATE conflicts with the FOR KEY SHARE lock that inserting a referencing row takes, so usage counts stay exact until commit
    await client.$executeRaw`SELECT id FROM clinical_cases WHERE id = ${caseId} FOR UPDATE`;
  }

  public async getUsage(caseId: string, transaction?: unknown): Promise<ClinicalCaseUsage> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const [simulationSessions, legacySimulatorSessions, evaluationAttempts, evaluationQuestions] = await Promise.all([
      client.simulationSession.count({ where: { caseId } }),
      client.simulatorSession.count({ where: { clinicalCaseId: caseId } }),
      client.evaluationAttempt.count({ where: { clinicalCaseId: caseId } }),
      client.evaluationQuestion.count({ where: { clinicalCaseId: caseId } }),
    ]);

    return { simulationSessions, legacySimulatorSessions, evaluationAttempts, evaluationQuestions };
  }

  public async saveCase(clinicalCase: ClinicalCase, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.ClinicalCaseUncheckedCreateInput = ClinicalCasesMapper.toCasePersistence(clinicalCase);

    await client.clinicalCase.upsert({
      where: { id: clinicalCase.id },
      create: data,
      update: data,
    });
  }

  public async deleteCase(caseId: string, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.clinicalCase.delete({ where: { id: caseId } });
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
