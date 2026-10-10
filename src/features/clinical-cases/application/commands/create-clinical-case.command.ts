/*
 * Funcionalidad: Comando CreateClinicalCaseCommand
 * Descripción: Intención de crear un caso clínico en borrador con su contenido y definición simulable
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";

export class CreateClinicalCaseCommand {
  public readonly content: ClinicalCaseContent;
  public readonly performedBy: string;

  public constructor({ content, performedBy }: { content: ClinicalCaseContent; performedBy: string }) {
    this.content = content;
    this.performedBy = performedBy;
  }
}
