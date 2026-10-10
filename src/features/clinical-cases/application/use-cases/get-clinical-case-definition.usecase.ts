/*
 * Funcionalidad: Caso de uso GetClinicalCaseDefinitionUseCase
 * Descripción: Obtiene la definición completa de un caso clínico en cualquier estado (contenido, definición simulable, estado y validación) para su edición por docentes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ClinicalCaseNotFoundError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 */
@Injectable()
export class GetClinicalCaseDefinitionUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
  ) {}

  public async execute(caseId: string): Promise<ClinicalCase> {
    const clinicalCase: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(caseId);

    if (!clinicalCase) {
      throw new ClinicalCaseNotFoundError();
    }

    return clinicalCase;
  }
}
