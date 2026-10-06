/*
 * Funcionalidad: Eventos de relación profesor-estudiante
 * Descripción: Eventos de dominio del agregado TeacherStudent (estudiante asignado a un profesor, relación eliminada)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";

export class StudentAssignedToTeacherEvent extends DomainEvent {
  public readonly entity: TeacherStudent;

  public constructor({ entity, performedBy }: { entity: TeacherStudent; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}

export class TeacherStudentRemovedEvent extends DomainEvent {
  public readonly entity: TeacherStudent;

  public constructor({ entity, performedBy }: { entity: TeacherStudent; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
