/*
 * Funcionalidad: Entidad TeacherStudent
 * Descripción: Agregado de la asignación de un estudiante a un profesor; registra auditoría y eventos al crearse y al eliminarse
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AggregateRoot } from "@/common/domain/aggregates/aggregate-root";
import { AuditLog } from "@/common/domain/entities/audit-log.entity";
import { generateId } from "@/common/domain/utils/generate-id";
import { StudentAssignedToTeacherEvent, TeacherStudentRemovedEvent } from "@/features/teacher-students/domain/events/teacher-student.events";

export const TEACHER_STUDENT_ENTITY_COLLECTION: string = "teacher_students";
export const TEACHER_STUDENT_ENTITY_TYPE: string = "teacher_student";

export type TeacherStudentAuditAction = "student_assigned_to_teacher" | "teacher_student_removed";

export class TeacherStudent extends AggregateRoot {
  private _id: string;
  private _teacherId: string;
  private _studentId: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _auditLogs: AuditLog<TeacherStudentAuditAction>[];

  private constructor({
    id,
    teacherId,
    studentId,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    teacherId: string;
    studentId: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<TeacherStudentAuditAction>[];
  }) {
    super();
    this._id = id;
    this._teacherId = teacherId;
    this._studentId = studentId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._auditLogs = auditLogs;
  }

  public get id(): string {
    return this._id;
  }

  public get teacherId(): string {
    return this._teacherId;
  }

  public get studentId(): string {
    return this._studentId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get auditLogs(): ReadonlyArray<AuditLog<TeacherStudentAuditAction>> {
    return this._auditLogs;
  }

  public static create({ teacherId, studentId, performedBy }: { teacherId: string; studentId: string; performedBy: string }): TeacherStudent {
    const now: Date = new Date();

    const relationship: TeacherStudent = new TeacherStudent({
      id: generateId(),
      teacherId,
      studentId,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        AuditLog.create<TeacherStudentAuditAction>({
          action: "student_assigned_to_teacher",
          performedByUserId: performedBy,
          metadata: { teacherId, studentId },
        }),
      ],
    });

    relationship.publishEvent(new StudentAssignedToTeacherEvent({ entity: relationship, performedBy }));

    return relationship;
  }

  public static reconstitute({
    id,
    teacherId,
    studentId,
    createdAt,
    updatedAt,
    auditLogs,
  }: {
    id: string;
    teacherId: string;
    studentId: string;
    createdAt: Date;
    updatedAt: Date;
    auditLogs: AuditLog<TeacherStudentAuditAction>[];
  }): TeacherStudent {
    return new TeacherStudent({ id, teacherId, studentId, createdAt, updatedAt, auditLogs });
  }

  public remove(performedBy: string): void {
    this._auditLogs.push(
      AuditLog.create<TeacherStudentAuditAction>({
        action: "teacher_student_removed",
        performedByUserId: performedBy,
        metadata: { teacherId: this._teacherId, studentId: this._studentId },
      }),
    );

    this.publishEvent(new TeacherStudentRemovedEvent({ entity: this, performedBy }));
  }
}
