/*
 * Funcionalidad: Solicitante de la retroalimentación de calificación
 * Descripción: Persona cuya acción dispara la generación de la retroalimentación con IA (el estudiante al entregar, el docente al calificar, recalificar o regenerar) con su rol y el idioma activo de su petición: el idioma decide el de la retroalimentación y el id y el rol deciden la cuota de IA; los cierres automáticos por vencimiento no llevan solicitante (llamada de sistema, español, sin cuota)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";

export interface GradeFeedbackRequester {
  readonly userId: string;
  readonly role: string;
  readonly language: LanguageValue;
}
