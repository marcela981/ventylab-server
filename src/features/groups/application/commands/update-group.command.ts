/*
 * Funcionalidad: Comando UpdateGroupCommand
 * Descripción: Datos para actualizar un grupo; los campos ausentes no cambian y los anulables aceptan null para limpiarse; incluye el ejecutor y su rol
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class UpdateGroupCommand {
  public readonly groupId: string;
  public readonly name?: string;
  public readonly description?: string | null;
  public readonly semester?: string | null;
  public readonly academicYear?: string | null;
  public readonly maxStudents?: number | null;
  public readonly isActive?: boolean;
  public readonly performedBy: string;
  public readonly performedByRole: string;

  public constructor({
    groupId,
    name,
    description,
    semester,
    academicYear,
    maxStudents,
    isActive,
    performedBy,
    performedByRole,
  }: {
    groupId: string;
    name?: string;
    description?: string | null;
    semester?: string | null;
    academicYear?: string | null;
    maxStudents?: number | null;
    isActive?: boolean;
    performedBy: string;
    performedByRole: string;
  }) {
    this.groupId = groupId;
    this.name = name;
    this.description = description;
    this.semester = semester;
    this.academicYear = academicYear;
    this.maxStudents = maxStudents;
    this.isActive = isActive;
    this.performedBy = performedBy;
    this.performedByRole = performedByRole;
  }
}
