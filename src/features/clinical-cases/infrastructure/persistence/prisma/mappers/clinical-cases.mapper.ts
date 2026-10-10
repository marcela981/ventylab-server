/*
 * Funcionalidad: Mapper de persistencia de casos clínicos
 * Descripción: Convierte filas Prisma de ClinicalCase, ExpertConfiguration y EvaluationAttempt a modelos de lectura y a la entidad ClinicalCase, y las entidades ClinicalCase y EvaluationAttempt a datos de persistencia con las columnas JSON serializadas como JSON estándar; isActive se deriva siempre del estado
 * Versión: 1.1
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

import { ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type EvaluationAttempt } from "@/features/clinical-cases/domain/entities/evaluation-attempt.entity";
import {
  type ClinicalCaseEvent,
  type ClinicalCaseHistory,
  type ClinicalCaseInitialState,
  type ClinicalCaseMechanics,
  type ClinicalCaseRubric,
  type ClinicalCaseSimulationProfile,
  type ClinicalCaseTargets,
  type ClinicalCaseVentilatorSettings,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import {
  type CaseAttemptRecord,
  type ClinicalCaseDetail,
  type ClinicalCaseSummary,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type AcceptableRange,
  type ExpertConfigurationData,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import { type PatientSexValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-simulation-values";

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
      status: row.status,
    };
  }

  public static toClinicalCase(row: ClinicalCaseModel): ClinicalCase {
    return ClinicalCase.reconstitute({
      id: row.id,
      content: {
        title: row.title,
        description: row.description,
        summary: row.summary ?? undefined,
        history: ClinicalCasesMapper._fromJson<ClinicalCaseHistory>(row.history),
        patientAge: row.patientAge,
        patientWeight: row.patientWeight,
        mainDiagnosis: row.mainDiagnosis,
        comorbidities: row.comorbidities,
        labData: row.labData ?? undefined,
        difficulty: row.difficulty,
        pathology: row.pathology,
        educationalGoal: row.educationalGoal,
        simulation: ClinicalCasesMapper._toSimulationProfile(row),
      },
      status: row.status,
      validatedByExpert: row.validatedByExpert,
      validatedById: row.validatedById ?? undefined,
      createdById: row.createdById ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toCasePersistence(clinicalCase: ClinicalCase): Prisma.ClinicalCaseUncheckedCreateInput {
    const { content } = clinicalCase;
    const simulation: ClinicalCaseSimulationProfile = content.simulation;

    return {
      id: clinicalCase.id,
      title: content.title,
      description: content.description,
      summary: content.summary ?? null,
      history: ClinicalCasesMapper._toNullableJson(content.history),
      patientAge: content.patientAge,
      patientWeight: content.patientWeight,
      patientSex: simulation.patientSex ?? null,
      patientHeightCm: simulation.patientHeightCm ?? null,
      mainDiagnosis: content.mainDiagnosis,
      comorbidities: [...content.comorbidities],
      labData: ClinicalCasesMapper._toNullableJson(content.labData),
      difficulty: content.difficulty,
      pathology: content.pathology,
      educationalGoal: content.educationalGoal,
      isActive: clinicalCase.isActive,
      mechanics: ClinicalCasesMapper._toNullableJson(simulation.mechanics),
      initialVentilatorSettings: ClinicalCasesMapper._toNullableJson(simulation.initialVentilatorSettings),
      initialState: ClinicalCasesMapper._toNullableJson(simulation.initialState),
      events: ClinicalCasesMapper._toNullableJson(simulation.events),
      targets: ClinicalCasesMapper._toNullableJson(simulation.targets),
      defaultRubric: ClinicalCasesMapper._toNullableJson(simulation.defaultRubric),
      status: clinicalCase.status,
      validatedByExpert: clinicalCase.validatedByExpert,
      validatedById: clinicalCase.validatedById ?? null,
      createdById: clinicalCase.createdById ?? null,
      createdAt: clinicalCase.createdAt,
      updatedAt: clinicalCase.updatedAt,
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

  private static _toSimulationProfile(row: ClinicalCaseModel): ClinicalCaseSimulationProfile {
    return {
      patientSex: (row.patientSex as PatientSexValue | null) ?? undefined,
      patientHeightCm: row.patientHeightCm ?? undefined,
      mechanics: ClinicalCasesMapper._fromJson<ClinicalCaseMechanics>(row.mechanics),
      initialVentilatorSettings: ClinicalCasesMapper._fromJson<ClinicalCaseVentilatorSettings>(row.initialVentilatorSettings),
      initialState: ClinicalCasesMapper._fromJson<ClinicalCaseInitialState>(row.initialState),
      events: ClinicalCasesMapper._fromJson<ClinicalCaseEvent[]>(row.events) ?? [],
      targets: ClinicalCasesMapper._fromJson<ClinicalCaseTargets>(row.targets),
      defaultRubric: ClinicalCasesMapper._fromJson<ClinicalCaseRubric>(row.defaultRubric),
    };
  }

  private static _fromJson<T>(value: Prisma.JsonValue | null): T | undefined {
    return value === null ? undefined : (value as unknown as T);
  }

  private static _toNullableJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
    return value === undefined || value === null ? Prisma.DbNull : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);
  }

  private static _toJsonObject(value: object): Prisma.InputJsonObject {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
  }
}
