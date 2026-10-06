/*
 * Funcionalidad: Caso de uso GetClinicalCaseAttemptsUseCase
 * Descripción: Historial de intentos del usuario en un caso clínico (más recientes primero) con estadísticas y la mejora de cada intento frente al anterior de la lista
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ClinicalCaseAttemptsResult } from "@/features/clinical-cases/application/results/clinical-case.results";
import { ClinicalCaseNotFoundError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type CaseAttemptRecord, type ClinicalCaseDetail } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { computeAttemptStats, withImprovement } from "@/features/clinical-cases/domain/services/case-attempt-statistics";

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 */
@Injectable()
export class GetClinicalCaseAttemptsUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
  ) {}

  public async execute(caseId: string, userId: string): Promise<ClinicalCaseAttemptsResult> {
    const clinicalCase: ClinicalCaseDetail | undefined = await this._clinicalCasesRepository.getById(caseId);

    if (!clinicalCase) {
      throw new ClinicalCaseNotFoundError();
    }

    const attempts: CaseAttemptRecord[] = await this._clinicalCasesRepository.getUserAttempts(userId, caseId);

    return new ClinicalCaseAttemptsResult({
      caseId: clinicalCase.id,
      caseTitle: clinicalCase.title,
      stats: computeAttemptStats(attempts),
      attempts: withImprovement(attempts),
    });
  }
}
