/*
 * Funcionalidad: Caso de uso GetStudentsUseCase
 * Descripción: Lista estudiantes paginados con filtros y orden
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Paginated } from "@/common/domain/utils/paginated";
import { StudentResult } from "@/features/users/application/results/student.result";
import { type User } from "@/features/users/domain/entities/user.entity";
import {
  type IUserStatisticsRepository,
  USER_STATISTICS_REPOSITORY_TOKEN,
} from "@/features/users/domain/repositories/user-statistics.repository";
import { type GetUsersQuery, type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { STUDENT_ROLE_VALUE } from "@/features/users/domain/value-objects/user-role";
import { StudentProgressSummary } from "@/features/users/domain/value-objects/user-stats";

@Injectable()
export class GetStudentsUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(USER_STATISTICS_REPOSITORY_TOKEN)
    private readonly _userStatisticsRepository: IUserStatisticsRepository,
  ) {}

  public async execute(query: Omit<GetUsersQuery, "roles">): Promise<Paginated<StudentResult>> {
    const students: Paginated<User> = await this._usersRepository.getAll({ ...query, roles: [STUDENT_ROLE_VALUE] });

    const summaries: StudentProgressSummary[] = await this._userStatisticsRepository.getStudentProgressSummaries(
      students.data.map((student: User) => student.id),
    );

    const summaryByStudentId: Map<string, StudentProgressSummary> = new Map(
      summaries.map((summary: StudentProgressSummary): [string, StudentProgressSummary] => [summary.studentId, summary]),
    );

    return students.map(
      (student: User) =>
        new StudentResult({
          user: student,
          progress: summaryByStudentId.get(student.id) ?? StudentProgressSummary.empty(student.id),
        }),
    );
  }
}
