/*
 * Funcionalidad: Objeto de valor override-data
 * Descripción: Define los valores permitidos FieldOverrides, ExtraCard, OverrideData de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface FieldOverrides {
  readonly title?: string;
  readonly content?: string;
  readonly order?: number;
  readonly isActive?: boolean;
  readonly estimatedTime?: number;
  readonly contentType?: string;
}

export interface ExtraCard {
  readonly id: string;
  readonly title?: string;
  readonly content: string;
  readonly contentType: string;
  readonly insertAfterOrder: number;
}

export interface OverrideData {
  readonly fieldOverrides?: FieldOverrides;
  readonly extraCards?: ExtraCard[];
  readonly hiddenCardIds?: string[];
}
