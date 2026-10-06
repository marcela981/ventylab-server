/*
 * Funcionalidad: Comando IssueNextAuthTokenCommand
 * Descripción: Datos de entrada para emitir tokens del backend a partir de una sesión de NextAuth
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class IssueNextAuthTokenCommand {
  public readonly userId: string;
  public readonly email: string;

  public constructor({ userId, email }: { userId: string; email: string }) {
    this.userId = userId;
    this.email = email;
  }
}
