/*
 * Funcionalidad: Caso de uso GetStudentByIdUseCase
 * Descripción: Devuelve un estudiante; un docente solo ve a los miembros de los grupos que creó o supervisa (puerto IStudentScopeChecker) o, por compatibilidad, a sus estudiantes asignados en TeacherStudent; incluye sus grupos STUDENT activos, leídos en paralelo con el resumen de progreso
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { GetStudentByIdCommand } from "@/features/users/application/commands/get-student-by-id.command";
import { type IStudentGroupsReader, STUDENT_GROUPS_READER_TOKEN, type StudentGroupRef } from "@/features/users/application/ports/student-groups-reader.interface";
import { type IStudentScopeChecker, STUDENT_SCOPE_CHECKER_TOKEN } from "@/features/users/application/ports/student-scope-checker.interface";
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
 * @throws {StudentAccessDeniedError} If the requester is a teacher who neither manages a group of the student nor is assigned to them
 */
@Injectable()
export class GetStudentByIdUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(USER_STATISTICS_REPOSITORY_TOKEN)
    private readonly _userStatisticsRepository: IUserStatisticsRepository,
    @Inject(STUDENT_SCOPE_CHECKER_TOKEN)
    private readonly _studentScope: IStudentScopeChecker,
    @Inject(STUDENT_GROUPS_READER_TOKEN)
    private readonly _studentGroups: IStudentGroupsReader,
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
      const canView: boolean =
        (await this._studentScope.canViewStudent({ id: command.requesterId, role: command.requesterRole }, student.id)) ||
        (await this._usersRepository.isStudentAssignedToTeacher(command.requesterId, student.id));

      if (!canView) {
        throw new StudentAccessDeniedError();
      }
    }

    const [summaries, groupsByStudentId]: [StudentProgressSummary[], ReadonlyMap<string, StudentGroupRef[]>] = await Promise.all([
      this._userStatisticsRepository.getStudentProgressSummaries([student.id]),
      this._studentGroups.getActiveGroups([student.id]),
    ]);

    return new StudentResult({
      user: student,
      progress: summaries[0] ?? StudentProgressSummary.empty(student.id),
      groups: groupsByStudentId.get(student.id) ?? [],
    });
  }
}
