/*
 * Funcionalidad: Resultado StudentResult
 * Descripción: Datos de un estudiante con su resumen de progreso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@/features/users/domain/entities/user.entity";
import { type StudentProgressSummary } from "@/features/users/domain/value-objects/user-stats";

export class StudentResult {
  public readonly user: User;
  public readonly progress: StudentProgressSummary;

  public constructor({ user, progress }: { user: User; progress: StudentProgressSummary }) {
    this.user = user;
    this.progress = progress;
  }
}
