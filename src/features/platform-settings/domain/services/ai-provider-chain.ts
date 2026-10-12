/*
 * Funcionalidad: Reglas de la cadena de proveedores de IA
 * Descripción: Calcula los proveedores que entran en una cadena de un caso de uso de IA respecto de la cadena vigente, para exigir sus credenciales solo a los que se agregan
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiUseCaseSettingValue } from "@/features/platform-settings/domain/registry/platform-setting-values";

export function providersEnteringChain(current: AiUseCaseSettingValue, next: AiUseCaseSettingValue): string[] {
  return next.providerChain.filter((provider: string): boolean => !current.providerChain.includes(provider));
}
