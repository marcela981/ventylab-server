/*
 * Funcionalidad: Token MEDIA_SETTINGS_TOKEN
 * Descripción: Define el token de inyección y la forma de la configuración de media (límites de tamaño por tipo y vigencia de las URLs firmadas)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MediaSizeLimits } from "@/features/media/domain/value-objects/media-upload-policy";

export const MEDIA_SETTINGS_TOKEN: unique symbol = Symbol("MEDIA_SETTINGS_TOKEN");

export interface MediaSettings {
  sizeLimits: MediaSizeLimits;
  signedUrlTtlSeconds: number;
}
