/*
 * Funcionalidad: Árbol del currículo para el editor
 * Descripción: Obtiene los niveles con sus módulos y lecciones desde ICurriculumTreeRepository y los anida en memoria como árbol recursivo de niveles y subniveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type CurriculumTreeLevel } from "@/features/curriculum-editor/domain/read-models/curriculum-tree.read-model";
import {
  CURRICULUM_TREE_REPOSITORY_TOKEN,
  type ICurriculumTreeRepository,
} from "@/features/curriculum-editor/domain/repositories/curriculum-tree.repository";

@Injectable()
export class GetCurriculumTreeUseCase {
  public constructor(
    @Inject(CURRICULUM_TREE_REPOSITORY_TOKEN)
    private readonly _curriculumTreeRepository: ICurriculumTreeRepository,
  ) {}

  public async execute(track?: string): Promise<CurriculumTreeLevel[]> {
    const levels: CurriculumTreeLevel[] = await this._curriculumTreeRepository.getLevelsWithContent(track);
    const nodes: Map<string, CurriculumTreeLevel> = new Map<string, CurriculumTreeLevel>();

    for (const level of levels) {
      nodes.set(level.id, { ...level, children: [] });
    }

    const roots: CurriculumTreeLevel[] = [];

    for (const level of levels) {
      const node: CurriculumTreeLevel | undefined = nodes.get(level.id);
      const parent: CurriculumTreeLevel | undefined = level.parentId ? nodes.get(level.parentId) : undefined;

      if (!node) {
        continue;
      }

      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
