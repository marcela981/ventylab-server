/*
 * Funcionalidad: Comando ResetPlatformSetting
 * Descripción: Intención de devolver un ajuste de la plataforma a su valor por defecto con la versión que el administrador leyó (concurrencia optimista)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ResetPlatformSettingCommand {
  public readonly key: string;
  public readonly version: number;
  public readonly performedBy?: string;

  public constructor({ key, version, performedBy }: { key: string; version: number; performedBy?: string }) {
    this.key = key;
    this.version = version;
    this.performedBy = performedBy;
  }
}
