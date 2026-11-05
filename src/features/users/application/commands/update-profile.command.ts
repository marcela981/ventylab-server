/*
 * Funcionalidad: Comando UpdateProfileCommand
 * Descripción: Datos de entrada para actualizar el perfil del usuario v1.1: preferencia de apariencia (themeMode, themePalette)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ThemeModeValue, type ThemePaletteValue } from "@/features/users/domain/value-objects/theme-preference";

export class UpdateProfileCommand {
  public readonly userId: string;
  public readonly name?: string;
  public readonly image?: string | null;
  public readonly themeMode?: ThemeModeValue;
  public readonly themePalette?: ThemePaletteValue;
  public readonly performedBy: string;

  public constructor({
    userId,
    name,
    image,
    themeMode,
    themePalette,
    performedBy,
  }: {
    userId: string;
    name?: string;
    image?: string | null;
    themeMode?: ThemeModeValue;
    themePalette?: ThemePaletteValue;
    performedBy: string;
  }) {
    this.userId = userId;
    this.name = name;
    this.image = image;
    this.themeMode = themeMode;
    this.themePalette = themePalette;
    this.performedBy = performedBy;
  }
}
