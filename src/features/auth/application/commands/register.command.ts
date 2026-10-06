/*
 * Funcionalidad: Comando RegisterCommand
 * Descripción: Datos de entrada del registro de un usuario: nombre, correo y contraseña
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RegisterCommand {
  public readonly name: string;
  public readonly email: string;
  public readonly password: string;

  public constructor({ name, email, password }: { name: string; email: string; password: string }) {
    this.name = name;
    this.email = email;
    this.password = password;
  }
}
