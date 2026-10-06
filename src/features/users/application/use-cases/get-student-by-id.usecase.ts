/*
 * Funcionalidad: Caso de uso GetStudentByIdUseCase
 * Descripción: Devuelve un estudiante; los docentes solo ven a sus estudiantes asignados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GetStudentByIdCommand } from "@/features/users/application/commands/get-student-by-id.command";
import { StudentResult } from "@/features/users/application/results/student.result";
import { type User } from "@/features/users/domain/entities/user.entity";
import {
  type IUserStatisticsRepository,
  USER_STATISTICS_REPOSITORY_TOKEN,
} from "@/features/users/domain/repositories/user-statistics.repository";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { StudentAccessDeniedError, UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";
import { TEACHER_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";
import { StudentProgressSummary } from "@/features/users/domain/value-objects/user-stats";

/**
 * @throws {UserNotFoundError} If no user exists with the given ID
 * @throws {UserNotStudentError} If the user exists but is not a student
 * @throws {StudentAccessDeniedError} If the requester is a teacher not assigned to the student
 */
@Injectable()
export class GetStudentByIdUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(USER_STATISTICS_REPOSITORY_TOKEN)
    private readonly _userStatisticsRepository: IUserStatisticsRepository,
  ) {}

  public async execute(command: GetStudentByIdCommand): Promise<StudentResult> {
    const student: User | undefined = await this._usersRepository.getById(command.studentId);

    if (!student) {
      throw new UserNotFoundError();
    }

    if (!student.role.isStudent()) {
      throw new UserNotStudentError();
    }

    if (command.requesterRole === TEACHER_ROLE_VALUE) {
      const isAssigned: boolean = await this._usersRepository.isStudentAssignedToTeacher(command.requesterId, student.id);

      if (!isAssigned) {
        throw new StudentAccessDeniedError();
      }
    }

    const summaries: StudentProgressSummary[] = await this._userStatisticsRepository.getStudentProgressSummaries([student.id]);

    return new StudentResult({
      user: student,
      progress: summaries[0] ?? StudentProgressSummary.empty(student.id),
    });
  }
}
