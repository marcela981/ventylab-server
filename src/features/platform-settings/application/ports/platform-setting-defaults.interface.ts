/*
 * Funcionalidad: Puerto de valores por defecto de los ajustes de la plataforma
 * Descripción: Token del valor por defecto de cada ajuste del registro, resuelto por la raíz de composición desde la configuración del entorno o las constantes del código de cada feature
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PlatformSettingValues } from "@/features/platform-settings/domain/registry/platform-setting-values";

export const PLATFORM_SETTING_DEFAULTS_TOKEN: unique symbol = Symbol("PLATFORM_SETTING_DEFAULTS_TOKEN");

export type PlatformSettingDefaults = PlatformSettingValues;
