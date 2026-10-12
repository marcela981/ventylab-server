/*
 * Funcionalidad: Puerto de disponibilidad de proveedores de IA
 * Descripción: Contrato para saber si un proveedor de IA tiene sus credenciales configuradas, usado para impedir que entre en una cadena de proveedores sin ellas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const AI_PROVIDER_AVAILABILITY_TOKEN: unique symbol = Symbol("AI_PROVIDER_AVAILABILITY_TOKEN");

export interface IAiProviderAvailability {
  isConfigured(providerId: string): boolean;
}
