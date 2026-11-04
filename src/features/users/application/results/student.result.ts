/*
 * Funcionalidad: Resultado StudentResult
 * Descripción: Datos de un estudiante con su resumen de progreso y sus grupos STUDENT activos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StudentGroupRef } from "@/features/users/application/ports/student-groups-reader.interface";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type StudentProgressSummary } from "@/features/users/domain/value-objects/user-stats";

export class StudentResult {
  public readonly user: User;
  public readonly progress: StudentProgressSummary;
  public readonly groups: StudentGroupRef[];

  public constructor({ user, progress, groups }: { user: User; progress: StudentProgressSummary; groups: StudentGroupRef[] }) {
    this.user = user;
    this.progress = progress;
    this.groups = groups;
  }
}
