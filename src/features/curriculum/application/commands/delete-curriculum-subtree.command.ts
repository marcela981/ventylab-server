/*
 * Funcionalidad: Comando DeleteCurriculumSubtreeCommand
 * Descripción: Transporta el tipo y el id del nodo curricular cuyo subárbol se elimina, junto con el usuario que realiza la acción
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumNodeKind } from "@/features/curriculum/domain/read-models/curriculum-subtree.read-model";

export class DeleteCurriculumSubtreeCommand {
  public readonly kind: CurriculumNodeKind;
  public readonly id: string;
  public readonly performedBy?: string;

  public constructor({ kind, id, performedBy }: { kind: CurriculumNodeKind; id: string; performedBy?: string }) {
    this.kind = kind;
    this.id = id;
    this.performedBy = performedBy;
  }
}
