/*
 * Funcionalidad: Comando RefreshTokenCommand
 * Descripción: Datos de entrada para renovar el token de acceso con un token de refresco
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RefreshTokenCommand {
  public readonly refreshToken: string;

  public constructor({ refreshToken }: { refreshToken: string }) {
    this.refreshToken = refreshToken;
  }
}
