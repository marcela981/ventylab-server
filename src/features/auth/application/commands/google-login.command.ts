/*
 * Funcionalidad: Comando GoogleLoginCommand
 * Descripción: Datos de entrada del inicio de sesión con Google: el ID token emitido por Google Identity Services
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class GoogleLoginCommand {
  public readonly idToken: string;

  public constructor({ idToken }: { idToken: string }) {
    this.idToken = idToken;
  }
}
