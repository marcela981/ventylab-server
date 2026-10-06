/*
 * Funcionalidad: Mapper de persistencia de casos clínicos
 * Descripción: Convierte filas Prisma de ClinicalCase, ExpertConfiguration y EvaluationAttempt a modelos de lectura, y el agregado EvaluationAttempt a datos de persistencia con las columnas JSON serializadas como JSON estándar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ClinicalCase as ClinicalCaseModel,
  type ExpertConfiguration as ExpertConfigurationModel,
  Prisma,
} from "@prisma/client";

import { type EvaluationAttempt } from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";
import {
  type CaseAttemptRecord,
  type ClinicalCaseDetail,
  type ClinicalCaseSummary,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type AcceptableRange,
  type ExpertConfigurationData,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";

export type ClinicalCaseSummaryRow = Pick<
  ClinicalCaseModel,
  | "id"
  | "title"
  | "description"
  | "patientAge"
  | "patientWeight"
  | "mainDiagnosis"
  | "comorbidities"
  | "difficulty"
  | "pathology"
  | "educationalGoal"
>;

export interface CaseAttemptRow {
  id: string;
  clinicalCaseId: string;
  score: number;
  isSuccessful: boolean;
  completionTime: number | null;
  startedAt: Date;
  completedAt: Date | null;
}

export class ClinicalCasesMapper {
  public static toSummary(row: ClinicalCaseSummaryRow): ClinicalCaseSummary {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      patientAge: row.patientAge,
      patientWeight: row.patientWeight,
      mainDiagnosis: row.mainDiagnosis,
      comorbidities: row.comorbidities,
      difficulty: row.difficulty,
      pathology: row.pathology,
      educationalGoal: row.educationalGoal,
    };
  }

  public static toDetail(row: ClinicalCaseModel): ClinicalCaseDetail {
    return {
      ...ClinicalCasesMapper.toSummary(row),
      labData: row.labData ?? undefined,
      isActive: row.isActive,
    };
  }

  public static toExpertConfiguration(row: ExpertConfigurationModel): ExpertConfigurationData {
    return {
      id: row.id,
      ventilationMode: row.ventilationMode,
      tidalVolume: row.tidalVolume ?? undefined,
      respiratoryRate: row.respiratoryRate ?? undefined,
      peep: row.peep ?? undefined,
      fio2: row.fio2 ?? undefined,
      maxPressure: row.maxPressure ?? undefined,
      iERatio: row.iERatio ?? undefined,
      justification: row.justification,
      acceptableRanges: (row.acceptableRanges as Record<string, AcceptableRange> | null) ?? undefined,
      parameterPriorities: (row.parameterPriorities as Record<string, string> | null) ?? undefined,
    };
  }

  public static toAttemptRecord(row: CaseAttemptRow): CaseAttemptRecord {
    return {
      id: row.id,
      clinicalCaseId: row.clinicalCaseId,
      score: row.score,
      isSuccessful: row.isSuccessful,
      completionTime: row.completionTime ?? undefined,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? undefined,
    };
  }

  public static toAttemptPersistence(attempt: EvaluationAttempt): Prisma.EvaluationAttemptUncheckedCreateInput {
    return {
      id: attempt.id,
      userId: attempt.userId,
      clinicalCaseId: attempt.clinicalCaseId,
      userConfiguration: ClinicalCasesMapper._toJsonObject(attempt.userConfiguration),
      score: attempt.score,
      differences: attempt.differences ? ClinicalCasesMapper._toJsonObject(attempt.differences) : Prisma.DbNull,
      aiFeedback: attempt.aiFeedback ?? null,
      completionTime: attempt.completionTime ?? null,
      isSuccessful: attempt.isSuccessful,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt ?? null,
    };
  }

  private static _toJsonObject(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }
}
