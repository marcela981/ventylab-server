/*
 * Funcionalidad: Fachada ClinicalCasesFacade
 * Descripción: API pública de la feature de casos clínicos para otras features: instantánea de un caso por id y caso publicado listo para simular (mecánica, ajustes iniciales, estado inicial, sexo y talla presentes) con errores tipados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  ClinicalCaseNotFoundError,
  ClinicalCaseNotSimulationReadyError,
  ClinicalCaseUnavailableError,
} from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  type ClinicalCaseSimulationProfile,
  type ClinicalCaseSnapshot,
  type SimulationReadyClinicalCase,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";

@Injectable()
export class ClinicalCasesFacade {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
  ) {}

  public async getCaseById(id: string): Promise<ClinicalCaseSnapshot | undefined> {
    const clinicalCase: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(id);

    if (!clinicalCase) {
      return undefined;
    }

    return {
      id: clinicalCase.id,
      title: clinicalCase.content.title,
      status: clinicalCase.status,
      validatedByExpert: clinicalCase.validatedByExpert,
      difficulty: clinicalCase.content.difficulty,
      pathology: clinicalCase.content.pathology,
      patientAge: clinicalCase.content.patientAge,
      patientWeightKg: clinicalCase.content.patientWeight,
      simulationReady: clinicalCase.isSimulationReady,
      simulation: clinicalCase.content.simulation,
    };
  }

  public async getPublishedCaseForSimulation(id: string): Promise<SimulationReadyClinicalCase> {
    const clinicalCase: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(id);

    if (!clinicalCase) {
      throw new ClinicalCaseNotFoundError();
    }

    if (!clinicalCase.isPublished) {
      throw new ClinicalCaseUnavailableError();
    }

    const simulation: ClinicalCaseSimulationProfile = clinicalCase.content.simulation;
    const { patientSex, patientHeightCm, mechanics, initialVentilatorSettings, initialState } = simulation;

    if (
      patientSex === undefined ||
      patientHeightCm === undefined ||
      mechanics === undefined ||
      initialVentilatorSettings === undefined ||
      initialState === undefined
    ) {
      throw new ClinicalCaseNotSimulationReadyError();
    }

    return {
      id: clinicalCase.id,
      title: clinicalCase.content.title,
      validatedByExpert: clinicalCase.validatedByExpert,
      patientSex,
      patientHeightCm,
      patientWeightKg: clinicalCase.content.patientWeight,
      mechanics,
      initialVentilatorSettings,
      initialState,
      events: simulation.events,
      targets: simulation.targets ?? {},
      defaultRubric: simulation.defaultRubric,
    };
  }
}
