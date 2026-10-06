/*
 * Funcionalidad: Puerto ITutorContentReader
 * Descripción: Contrato de lectura del contenido del currículo que usa el tutor (texto plano de una página con títulos de lección y módulo, esquema de una lección y de un módulo), aplicando la visibilidad del lector: el contenido no publicado responde 404 a quien no puede gestionarlo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const TUTOR_CONTENT_READER_TOKEN: unique symbol = Symbol("TUTOR_CONTENT_READER_TOKEN");

export interface TutorPageContent {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly moduleId: string;
  readonly moduleTitle: string;
  readonly lessonId?: string;
  readonly lessonTitle?: string;
}

export interface TutorLessonOutline {
  readonly id: string;
  readonly title: string;
  readonly moduleId: string;
  readonly pageIds: string[];
}

export interface TutorModuleOutline {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly lessonTitles: string[];
  readonly pageIds: string[];
}

export interface ITutorContentReader {
  getPage(pageId: string, canManage: boolean): Promise<TutorPageContent>;
  getLessonOutline(lessonId: string, canManage: boolean): Promise<TutorLessonOutline>;
  getModuleOutline(moduleId: string, canManage: boolean): Promise<TutorModuleOutline>;
}
