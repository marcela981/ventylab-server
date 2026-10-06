/*
 * Funcionalidad: Modelo de lectura de hechos de completitud de lecciones
 * Descripción: Define los datos agregados por lección publicada (páginas publicadas, páginas vistas por el usuario y registro histórico de completitud) que alimentan la regla única de lección completada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface LessonCompletionFact {
  readonly lessonId: string;
  readonly moduleId: string;
  readonly levelId?: string;
  readonly sectionId?: string;
  readonly publishedPageCount: number;
  readonly viewedPageCount: number;
  readonly hasCompletionRecord: boolean;
}

export interface LessonWeightedProgress {
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly percentage: number;
  readonly completed: boolean;
}
