/*
 * Funcionalidad: Comando UpdateProfileCommand
 * Descripción: Datos de entrada para actualizar el perfil del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdateProfileCommand {
  public readonly userId: string;
  public readonly name?: string;
  public readonly image?: string | null;
  public readonly performedBy: string;

  public constructor({
    userId,
    name,
    image,
    performedBy,
  }: {
    userId: string;
    name?: string;
    image?: string | null;
    performedBy: string;
  }) {
    this.userId = userId;
    this.name = name;
    this.image = image;
    this.performedBy = performedBy;
  }
}
