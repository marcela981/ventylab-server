/*
 * Funcionalidad: Caso de uso GetSimulationCaseTitlesUseCase
 * Descripción: Resuelve en una sola lectura de ClinicalCasesFacade los títulos de los casos clínicos de una página de sesiones de simulación, indexados por id de caso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { ClinicalCasesFacade } from "@/features/clinical-cases/application/services/clinical-cases.facade";
import { type ClinicalCaseTitleView } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";

@Injectable()
export class GetSimulationCaseTitlesUseCase {
  public constructor(private readonly _clinicalCasesFacade: ClinicalCasesFacade) {}

  public async execute(caseIds: readonly string[]): Promise<Map<string, string>> {
    const titles: ClinicalCaseTitleView[] = await this._clinicalCasesFacade.getCaseTitles(caseIds);

    return new Map<string, string>(titles.map((view: ClinicalCaseTitleView): [string, string] => [view.id, view.title]));
  }
}
