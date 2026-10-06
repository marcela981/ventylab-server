/*
 * Funcionalidad: Comando CreateLessonCommand
 * Descripción: Transporta los datos de entrada de un caso de uso de la feature de lecciones
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentStatusValue } from "@/features/curriculum/domain/value-objects/content-status";

export class CreateLessonCommand {
  public readonly moduleId: string;
  public readonly title: string;
  public readonly content: unknown;
  public readonly order?: number;
  public readonly estimatedTime?: number;
  public readonly aiGenerated?: boolean;
  public readonly sourcePrompt?: string;
  public readonly status?: ContentStatusValue;
  public readonly performedBy: string;

  public constructor({
    moduleId,
    title,
    content,
    order,
    estimatedTime,
    aiGenerated,
    sourcePrompt,
    status,
    performedBy,
  }: {
    moduleId: string;
    title: string;
    content: unknown;
    order?: number;
    estimatedTime?: number;
    aiGenerated?: boolean;
    sourcePrompt?: string;
    status?: ContentStatusValue;
    performedBy: string;
  }) {
    this.moduleId = moduleId;
    this.title = title;
    this.content = content;
    this.order = order;
    this.estimatedTime = estimatedTime;
    this.aiGenerated = aiGenerated;
    this.sourcePrompt = sourcePrompt;
    this.status = status;
    this.performedBy = performedBy;
  }
}
