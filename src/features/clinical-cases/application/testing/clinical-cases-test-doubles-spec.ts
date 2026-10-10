/*
 * Funcionalidad: Dobles de prueba de casos clínicos
 * Descripción: Repositorio en memoria de casos clínicos con uso configurable, gestor de transacciones y registrador de auditoría simulados, y fábricas de contenido válido para las pruebas de los casos de uso de gestión, visibilidad y fachada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { Paginated } from "@/common/domain/utils/paginated";
import { ClinicalCase, type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  type ClinicalCaseDetail,
  type ClinicalCaseSummary,
  type ClinicalCaseUsage,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import { type GetClinicalCasesQuery, type IClinicalCasesRepository } from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";
import { ENGINE_READY_CLINICAL_CASES } from "@/features/clinical-cases/infrastructure/persistence/seed/engine-ready-clinical-cases.data";

export const TRANSACTION: string = "tx";
export const TEACHER_ID: string = "teacher-1";
export const STUDENT_ID: string = "student-1";

export const NO_USAGE: ClinicalCaseUsage = { simulationSessions: 0, legacySimulatorSessions: 0, evaluationAttempts: 0, evaluationQuestions: 0 };

export function validContent(overrides: Partial<ClinicalCaseContent> = {}): ClinicalCaseContent {
  return { ...ENGINE_READY_CLINICAL_CASES[0].content, ...overrides };
}

export function buildCase({
  id = "case-1",
  status = "DRAFT",
  content = validContent(),
  validatedByExpert = false,
}: { id?: string; status?: ClinicalCaseStatusValue; content?: ClinicalCaseContent; validatedByExpert?: boolean } = {}): ClinicalCase {
  const createdAt: Date = new Date("2026-10-01T10:00:00.000Z");

  return ClinicalCase.reconstitute({
    id,
    content,
    status,
    validatedByExpert,
    validatedById: validatedByExpert ? "expert-1" : undefined,
    createdById: TEACHER_ID,
    createdAt,
    updatedAt: createdAt,
  });
}

export interface ClinicalCasesDoubles {
  readonly repository: IClinicalCasesRepository;
  readonly transactionManager: ITransactionManager;
  readonly auditRecorder: IAuditRecorder;
  readonly saveCase: jest.Mock;
  readonly deleteCase: jest.Mock;
  readonly lockCase: jest.Mock;
  readonly getCases: jest.Mock;
  readonly record: jest.Mock;
}

function toDetail(clinicalCase: ClinicalCase): ClinicalCaseDetail {
  return {
    id: clinicalCase.id,
    title: clinicalCase.content.title,
    description: clinicalCase.content.description,
    patientAge: clinicalCase.content.patientAge,
    patientWeight: clinicalCase.content.patientWeight,
    mainDiagnosis: clinicalCase.content.mainDiagnosis,
    comorbidities: [...clinicalCase.content.comorbidities],
    difficulty: clinicalCase.content.difficulty,
    pathology: clinicalCase.content.pathology,
    educationalGoal: clinicalCase.content.educationalGoal,
    isActive: clinicalCase.isActive,
    status: clinicalCase.status,
  };
}

export function buildDoubles({ cases = [], usage = NO_USAGE }: { cases?: ClinicalCase[]; usage?: ClinicalCaseUsage } = {}): ClinicalCasesDoubles {
  const saveCase: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const deleteCase: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const lockCase: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const record: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const findCase = (caseId: string): ClinicalCase | undefined => cases.find((clinicalCase: ClinicalCase) => clinicalCase.id === caseId);

  const getCases: jest.Mock = jest.fn((query: GetClinicalCasesQuery): Promise<Paginated<ClinicalCaseSummary>> => {
    const visible: ClinicalCase[] = cases.filter((clinicalCase: ClinicalCase) => query.status === undefined || clinicalCase.status === query.status);

    return Promise.resolve(new Paginated<ClinicalCaseSummary>({ items: visible.map(toDetail), total: visible.length, page: query.page, limit: query.limit }));
  });

  const repository: IClinicalCasesRepository = {
    getCases,
    getById: jest.fn((caseId: string): Promise<ClinicalCaseDetail | undefined> => {
      const found: ClinicalCase | undefined = findCase(caseId);

      return Promise.resolve(found ? toDetail(found) : undefined);
    }),
    getCaseById: jest.fn((caseId: string): Promise<ClinicalCase | undefined> => Promise.resolve(findCase(caseId))),
    lockCase,
    getUsage: jest.fn().mockResolvedValue(usage),
    saveCase,
    deleteCase,
    getExpertConfiguration: jest.fn().mockResolvedValue(undefined),
    getUserAttempts: jest.fn().mockResolvedValue([]),
    getUserAttemptsForCases: jest.fn().mockResolvedValue([]),
    getLatestOtherAttemptScore: jest.fn().mockResolvedValue(undefined),
    saveAttempt: jest.fn().mockResolvedValue(undefined),
  };

  const transactionManager: ITransactionManager = {
    run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TRANSACTION),
  };

  return { repository, transactionManager, auditRecorder: { record }, saveCase, deleteCase, lockCase, getCases, record };
}

export function savedCase(doubles: ClinicalCasesDoubles): ClinicalCase {
  return doubles.saveCase.mock.calls[0][0] as ClinicalCase;
}
