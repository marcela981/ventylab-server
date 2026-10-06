/*
 * Funcionalidad: Caso de uso RemoveTeacherStudentByPairUseCase
 * Descripción: Elimina la relación entre un profesor y un estudiante identificada por ambos IDs
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { EVENT_BUS_TOKEN, type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { RemoveTeacherStudentByPairCommand } from "@/features/teacher-students/application/commands/remove-teacher-student-by-pair.command";
import { type TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { TeacherStudentNotFoundError } from "@/features/teacher-students/domain/teacher-students.errors";

/**
 * @throws {TeacherStudentNotFoundError} If no relationship exists between the teacher and the student
 */
@Injectable()
export class RemoveTeacherStudentByPairUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: RemoveTeacherStudentByPairCommand): Promise<void> {
    const events: DomainEvent[] = await this._transactionManager.run(async (transaction: unknown): Promise<DomainEvent[]> => {
      const relationship: TeacherStudent | undefined = await this._teacherStudentsRepository.getByPair(
        command.teacherId,
        command.studentId,
        transaction,
      );

      if (!relationship) {
        throw new TeacherStudentNotFoundError();
      }

      relationship.remove(command.performedBy);

      await this._teacherStudentsRepository.delete(relationship, transaction);

      return relationship.getEvents();
    });

    this._eventBus.publish(events);
  }
}
