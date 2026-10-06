/*
 * Funcionalidad: Comando FindOrCreateGoogleUserCommand
 * Descripción: Perfil verificado de Google (googleId, email, nombre y avatar) con el que se busca, vincula o crea un usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class FindOrCreateGoogleUserCommand {
  public readonly googleId: string;
  public readonly email: string;
  public readonly name?: string;
  public readonly avatarUrl?: string;

  public constructor({ googleId, email, name, avatarUrl }: { googleId: string; email: string; name?: string; avatarUrl?: string }) {
    this.googleId = googleId;
    this.email = email;
    this.name = name;
    this.avatarUrl = avatarUrl;
  }
}
