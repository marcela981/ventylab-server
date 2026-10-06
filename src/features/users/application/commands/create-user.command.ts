/*
 * Funcionalidad: Comando CreateUserCommand
 * Descripción: Datos de entrada para crear un usuario con contraseña o con cuenta de Google; el rol lo decide el caso de uso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CreateUserCommand {
  public readonly email: string;
  public readonly name?: string;
  public readonly password?: string;
  public readonly googleId?: string;
  public readonly image?: string;
  public readonly performedBy?: string;

  public constructor({
    email,
    name,
    password,
    googleId,
    image,
    performedBy,
  }: {
    email: string;
    name?: string;
    password?: string;
    googleId?: string;
    image?: string;
    performedBy?: string;
  }) {
    this.email = email;
    this.name = name;
    this.password = password;
    this.googleId = googleId;
    this.image = image;
    this.performedBy = performedBy;
  }
}
