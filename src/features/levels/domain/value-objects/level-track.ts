/*
 * Funcionalidad: Objeto de valor level-track
 * Descripción: Define los valores permitidos LevelTrackValue, MECANICA_LEVEL_TRACK_VALUE, VENTYLAB_LEVEL_TRACK_VALUE, DEFAULT_LEVEL_TRACK_VALUE, LEVEL_TRACK_VALUES de la feature de niveles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type LevelTrackValue = "mecanica" | "ventylab";

export const MECANICA_LEVEL_TRACK_VALUE: LevelTrackValue = "mecanica";
export const VENTYLAB_LEVEL_TRACK_VALUE: LevelTrackValue = "ventylab";

export const DEFAULT_LEVEL_TRACK_VALUE: LevelTrackValue = MECANICA_LEVEL_TRACK_VALUE;

export const LEVEL_TRACK_VALUES: readonly LevelTrackValue[] = [MECANICA_LEVEL_TRACK_VALUE, VENTYLAB_LEVEL_TRACK_VALUE] as const;
