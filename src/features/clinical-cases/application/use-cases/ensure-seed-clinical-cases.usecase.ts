/*
 * Funcionalidad: Caso de uso EnsureSeedClinicalCasesUseCase
 * Descripción: Inserta como PUBLISHED y sin validación por experto los casos de siembra que todavía no existen (por id), tras validarlos con las reglas de edición de casos; nunca actualiza un caso existente, así no altera la repetición ni la nota de sesiones ya jugadas ni lo que un docente haya editado
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { ClinicalCase, type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { CLINICAL_CASES_REPOSITORY_TOKEN, type IClinicalCasesRepository } from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { assertValidClinicalCaseDefinition } from "@/features/clinical-cases/domain/services/clinical-case-definition-validator";
import { PUBLISHED_STATUS_VALUE } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";

export interface SeedClinicalCase {
  readonly id: string;
  readonly content: ClinicalCaseContent;
}

export interface SeedClinicalCasesOutcome {
  readonly inserted: readonly string[];
  readonly existing: readonly string[];
}

/**
 * @throws {ClinicalCasePhysiologicalRangeError} If a seed case has a value outside its physiological range
 * @throws {InvalidClinicalCaseDefinitionError} If a seed case is inconsistent
 */
@Injectable()
export class EnsureSeedClinicalCasesUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
  ) {}

  public async execute(seeds: readonly SeedClinicalCase[]): Promise<SeedClinicalCasesOutcome> {
    const inserted: string[] = [];
    const existing: string[] = [];

    for (const seed of seeds) {
      assertValidClinicalCaseDefinition(seed.content);

      const now: Date = new Date();
      const clinicalCase: ClinicalCase = ClinicalCase.reconstitute({
        id: seed.id,
        content: seed.content,
        status: PUBLISHED_STATUS_VALUE,
        validatedByExpert: false,
        createdAt: now,
        updatedAt: now,
      });

      if (await this._clinicalCasesRepository.insertCaseIfMissing(clinicalCase)) {
        inserted.push(seed.id);
      } else {
        existing.push(seed.id);
      }
    }

    return { inserted, existing };
  }
}
