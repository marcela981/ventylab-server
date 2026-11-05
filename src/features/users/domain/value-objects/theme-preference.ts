/*
 * Funcionalidad: Valores de la preferencia de apariencia
 * Descripción: Modos (light, dark) y paletas (ventylab, univalle) que un usuario puede elegir para la interfaz web (Ajustes D4), con los guardas que descartan valores desconocidos leídos de la base. Sin elección, la web sigue el modo del sistema y la paleta VentyLab.
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type ThemeModeValue = "light" | "dark";
export type ThemePaletteValue = "ventylab" | "univalle";

export const THEME_MODE_VALUES: readonly ThemeModeValue[] = ["light", "dark"] as const;
export const THEME_PALETTE_VALUES: readonly ThemePaletteValue[] = ["ventylab", "univalle"] as const;

export function toThemeMode(value: string | null | undefined): ThemeModeValue | undefined {
  return THEME_MODE_VALUES.find((mode: ThemeModeValue) => mode === value);
}

export function toThemePalette(value: string | null | undefined): ThemePaletteValue | undefined {
  return THEME_PALETTE_VALUES.find((palette: ThemePaletteValue) => palette === value);
}
