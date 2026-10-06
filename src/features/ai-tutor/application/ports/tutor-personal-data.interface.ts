/*
 * Funcionalidad: Puerto ITutorPersonalData
 * Descripción: Contrato para obtener los identificadores personales de un usuario (nombre) que el tutor elimina del texto antes de enviarlo a los proveedores de IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const TUTOR_PERSONAL_DATA_TOKEN: unique symbol = Symbol("TUTOR_PERSONAL_DATA_TOKEN");

export interface ITutorPersonalData {
  getRedactableNames(userId: string): Promise<string[]>;
}
