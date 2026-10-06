/*
 * Funcionalidad: Comando CreateGroupCommand
 * Descripción: Datos para crear un grupo raíz o subgrupo (nombre, tipo STUDENT o TEACHER, descripción, grupo padre, periodo, año académico, cupo de estudiantes, creador y su rol)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

export class CreateGroupCommand {
  public readonly name: string;
  public readonly type: GroupTypeValue;
  public readonly description?: string;
  public readonly parentGroupId?: string;
  public readonly semester?: string;
  public readonly academicYear?: string;
  public readonly maxStudents?: number;
  public readonly performedBy: string;
  public readonly performedByRole: string;

  public constructor({
    name,
    type,
    description,
    parentGroupId,
    semester,
    academicYear,
    maxStudents,
    performedBy,
    performedByRole,
  }: {
    name: string;
    type: GroupTypeValue;
    description?: string;
    parentGroupId?: string;
    semester?: string;
    academicYear?: string;
    maxStudents?: number;
    performedBy: string;
    performedByRole: string;
  }) {
    this.name = name;
    this.type = type;
    this.description = description;
    this.parentGroupId = parentGroupId;
    this.semester = semester;
    this.academicYear = academicYear;
    this.maxStudents = maxStudents;
    this.performedBy = performedBy;
    this.performedByRole = performedByRole;
  }
}
