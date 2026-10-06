/*
 * Funcionalidad: Caso de uso InspectCurriculumSubtreeUseCase
 * Descripción: Recolecta el subárbol de un nodo curricular, cuenta sus datos de estudiantes y decide si puede eliminarse o debe archivarse; depende de ICurriculumSubtreeRepository y de la guarda de eliminación del dominio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type CurriculumDeleteInspection,
  type CurriculumNodeKind,
  type CurriculumSubtree,
} from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";
import {
  CURRICULUM_SUBTREE_REPOSITORY_TOKEN,
  type ICurriculumSubtreeRepository,
} from "@/features/curriculum/domain/repositories/curriculum-subtree.repository";
import { decideDeletion, type StudentDataCounts } from "@/features/curriculum/domain/services/delete-guard";

@Injectable()
export class InspectCurriculumSubtreeUseCase {
  public constructor(
    @Inject(CURRICULUM_SUBTREE_REPOSITORY_TOKEN)
    private readonly _subtreeRepository: ICurriculumSubtreeRepository,
  ) {}

  public async execute(kind: CurriculumNodeKind, id: string, transaction?: unknown): Promise<CurriculumDeleteInspection | undefined> {
    const subtree: CurriculumSubtree | undefined = await this._subtreeRepository.collect(kind, id, transaction);

    if (!subtree) {
      return undefined;
    }

    const studentData: StudentDataCounts = await this._subtreeRepository.countStudentData(subtree, transaction);

    return { subtree, studentData, decision: decideDeletion(studentData) };
  }
}
