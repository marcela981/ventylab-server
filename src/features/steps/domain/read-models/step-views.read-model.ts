/*
 * Funcionalidad: Modelos de lectura de pasos (tarjetas)
 * Descripción: Define las interfaces StepSummary, StepListItem, StepDetail que devuelven las consultas de la feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface StepSummary {
  readonly id: string;
  readonly lessonId: string;
  readonly title?: string;
  readonly content: string;
  readonly contentType: string;
  readonly order: number;
  readonly isActive: boolean;
  readonly lastModifiedBy?: string;
  readonly lastModifiedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface StepListItem extends StepSummary {
  readonly lesson: { readonly id: string; readonly title: string; readonly moduleId: string };
}

export interface StepDetail extends StepSummary {
  readonly lesson: {
    readonly id: string;
    readonly title: string;
    readonly moduleId: string;
    readonly module: { readonly id: string; readonly title: string; readonly levelId?: string };
  };
}
