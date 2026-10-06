/*
 * Funcionalidad: Caso de uso AssignStudentUseCase
 * Descripción: Asigna un estudiante a un profesor validando que el profesor tenga rol TEACHER o ADMIN, que el estudiante tenga rol STUDENT y que la relación no exista; devuelve el ID de la relación
 * Versión: 1.1
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
import { AssignStudentCommand } from "@/features/teacher-students/application/commands/assign-student.command";
import { TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { canActAsTeacher } from "@/features/teacher-students/domain/services/teacher-roles";
import { TeacherRoleRequiredError, TeacherStudentAlreadyExistsError } from "@/features/teacher-students/domain/teacher-students.errors";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the teacher or the student does not exist
 * @throws {TeacherRoleRequiredError} If the teacher does not have the TEACHER or ADMIN role
 * @throws {UserNotStudentError} If the student does not have the STUDENT role
 * @throws {TeacherStudentAlreadyExistsError} If the student is already assigned to the teacher
 */
@Injectable()
export class AssignStudentUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(EVENT_BUS_TOKEN)
    private readonly _eventBus: IEventBus,
  ) {}

  public async execute(command: AssignStudentCommand): Promise<string> {
    const { id, events }: { id: string; events: DomainEvent[] } = await this._transactionManager.run(
      async (transaction: unknown): Promise<{ id: string; events: DomainEvent[] }> => {
        const teacher: User | undefined = await this._usersRepository.getById(command.teacherId, transaction);

        if (!teacher) {
          throw new UserNotFoundError();
        }

        if (!canActAsTeacher(teacher.role.value)) {
          throw new TeacherRoleRequiredError();
        }

        const student: User | undefined = await this._usersRepository.getById(command.studentId, transaction);

        if (!student) {
          throw new UserNotFoundError();
        }

        if (!student.role.isStudent()) {
          throw new UserNotStudentError();
        }

        const existing: TeacherStudent | undefined = await this._teacherStudentsRepository.getByPair(
          command.teacherId,
          command.studentId,
          transaction,
        );

        if (existing) {
          throw new TeacherStudentAlreadyExistsError();
        }

        const relationship: TeacherStudent = TeacherStudent.create({
          teacherId: command.teacherId,
          studentId: command.studentId,
          performedBy: command.performedBy,
        });

        await this._teacherStudentsRepository.save(relationship, transaction);

        return { id: relationship.id, events: relationship.getEvents() };
      },
    );

    this._eventBus.publish(events);

    return id;
  }
}
