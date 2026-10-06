/*
 * Funcionalidad: Identidad del llamador del tutor
 * Descripción: Datos del usuario autenticado que usan los casos de uso del tutor de IA: id y rol para la cuota y la telemetría, correo para redactarlo del texto saliente, si puede ver contenido no publicado y el idioma de la respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";

export interface TutorCaller {
  readonly userId: string;
  readonly userRole: string;
  readonly email: string;
  readonly canManage: boolean;
  readonly language: LanguageValue;
}
