/*
 * Funcionalidad: Comando LoginCommand
 * Descripción: Datos de entrada del inicio de sesión: correo y contraseña
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class LoginCommand {
  public readonly email: string;
  public readonly password: string;

  public constructor({ email, password }: { email: string; password: string }) {
    this.email = email;
    this.password = password;
  }
}
