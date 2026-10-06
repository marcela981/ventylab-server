/*
 * Funcionalidad: Caso de uso GetClinicalCaseUseCase
 * Descripción: Obtiene un caso clínico activo sin su configuración experta, junto con los últimos 5 intentos del usuario, su mejor puntaje y la fecha del último intento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ClinicalCaseDetailResult } from "@/features/clinical-cases/application/results/clinical-case.results";
import { ClinicalCaseNotFoundError, ClinicalCaseUnavailableError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type CaseAttemptRecord, type ClinicalCaseDetail } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { findBestAttempt } from "@/features/clinical-cases/domain/services/case-attempt-statistics";

const RECENT_ATTEMPTS_LIMIT: number = 5;

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 * @throws {ClinicalCaseUnavailableError} If the clinical case is inactive
 */
@Injectable()
export class GetClinicalCaseUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
  ) {}

  public async execute(caseId: string, userId: string): Promise<ClinicalCaseDetailResult> {
    const clinicalCase: ClinicalCaseDetail | undefined = await this._clinicalCasesRepository.getById(caseId);

    if (!clinicalCase) {
      throw new ClinicalCaseNotFoundError();
    }

    if (!clinicalCase.isActive) {
      throw new ClinicalCaseUnavailableError();
    }

    const attempts: CaseAttemptRecord[] = await this._clinicalCasesRepository.getUserAttempts(userId, caseId, RECENT_ATTEMPTS_LIMIT);
    const bestAttempt: CaseAttemptRecord | undefined = findBestAttempt(attempts);

    return new ClinicalCaseDetailResult({
      clinicalCase,
      totalAttempts: attempts.length,
      bestScore: bestAttempt?.score || undefined,
      lastAttempt: attempts[0]?.completedAt,
      attempts,
    });
  }
}
