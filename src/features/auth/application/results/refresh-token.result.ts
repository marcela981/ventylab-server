/*
 * Funcionalidad: Resultado RefreshTokenResult
 * Descripción: Datos devueltos al renovar tokens
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RefreshTokenResult {
  public readonly accessToken: string;
  public readonly userId: string;

  public constructor({ accessToken, userId }: { accessToken: string; userId: string }) {
    this.accessToken = accessToken;
    this.userId = userId;
  }
}
