/*
 * Funcionalidad: Comando de eliminación de nodo del currículo
 * Descripción: Identifica el nivel o módulo que el editor del currículo elimina junto con todos sus descendientes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CurriculumNodeTypeValue } from "@/features/curriculum-editor/domain/value-objects/curriculum-node-type";

export class DeleteCurriculumNodeCommand {
  public readonly id: string;
  public readonly type: CurriculumNodeTypeValue;
  public readonly performedBy: string;

  public constructor({ id, type, performedBy }: { id: string; type: CurriculumNodeTypeValue; performedBy: string }) {
    this.id = id;
    this.type = type;
    this.performedBy = performedBy;
  }
}
