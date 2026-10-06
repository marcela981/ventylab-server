/*
 * Funcionalidad: Resultado LessonContentSourceValue
 * Descripción: Define la forma del resultado devuelto por un caso de uso de la feature de páginas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PageView } from "@/features/pages/domain/read-models/page-views.read-model";

export type LessonContentSourceValue = "page" | "lesson";

export class LessonContentSourceResult {
  public readonly source: LessonContentSourceValue;
  public readonly lessonId: string;
  public readonly page?: PageView;

  public constructor({ source, lessonId, page }: { source: LessonContentSourceValue; lessonId: string; page?: PageView }) {
    this.source = source;
    this.lessonId = lessonId;
    this.page = page;
  }
}
