/*
 * Funcionalidad: Comando UpdatePlatformSetting
 * Descripción: Intención de sobrescribir el valor de un ajuste de la plataforma con la versión que el administrador leyó (concurrencia optimista)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdatePlatformSettingCommand {
  public readonly key: string;
  public readonly value: unknown;
  public readonly version: number;
  public readonly performedBy?: string;

  public constructor({ key, value, version, performedBy }: { key: string; value: unknown; version: number; performedBy?: string }) {
    this.key = key;
    this.value = value;
    this.version = version;
    this.performedBy = performedBy;
  }
}
