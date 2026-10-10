/*
 * Funcionalidad: Caso de uso GetClinicalCasesUseCase
 * Descripción: Lista paginada de casos clínicos (más recientes primero) filtrable por dificultad y patología, sin configuración experta, con el resumen de intentos del usuario por caso; sin permiso de gestión solo se listan los publicados, con él cualquier estado (filtro opcional)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { Paginated } from "@/common/domain/utils/paginated";
import {
  type CaseAttemptRecord,
  type CaseUserAttemptsSummary,
  type ClinicalCaseListItem,
  type ClinicalCaseSummary,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type GetClinicalCasesQuery,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { NO_ATTEMPTS_SUMMARY, summarizeAttemptsByCase } from "@/features/clinical-cases/domain/services/case-attempt-statistics";
import { PUBLISHED_STATUS_VALUE } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";

@Injectable()
export class GetClinicalCasesUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
  ) {}

  public async execute(query: GetClinicalCasesQuery, userId: string, canViewAllStatuses: boolean = false): Promise<Paginated<ClinicalCaseListItem>> {
    const visibleQuery: GetClinicalCasesQuery = canViewAllStatuses ? query : { ...query, status: PUBLISHED_STATUS_VALUE };
    const cases: Paginated<ClinicalCaseSummary> = await this._clinicalCasesRepository.getCases(visibleQuery);

    if (cases.data.length === 0) {
      return cases.map((clinicalCase: ClinicalCaseSummary) => ({ clinicalCase, userAttempts: NO_ATTEMPTS_SUMMARY }));
    }

    const attempts: CaseAttemptRecord[] = await this._clinicalCasesRepository.getUserAttemptsForCases(
      userId,
      cases.data.map((clinicalCase: ClinicalCaseSummary) => clinicalCase.id),
    );

    const summaries: Map<string, CaseUserAttemptsSummary> = summarizeAttemptsByCase(attempts);

    return cases.map((clinicalCase: ClinicalCaseSummary) => ({
      clinicalCase,
      userAttempts: summaries.get(clinicalCase.id) ?? NO_ATTEMPTS_SUMMARY,
    }));
  }
}
