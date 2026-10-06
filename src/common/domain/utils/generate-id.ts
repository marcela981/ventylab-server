/*
 * Funcionalidad: Utilidad generateId
 * Descripción: Genera identificadores UUID v7 ordenables por tiempo para nuevas entidades
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { v7 as uuidv7 } from "uuid";

export function generateId(): string {
  return uuidv7();
}
