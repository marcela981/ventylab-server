/*
 * Funcionalidad: Caso de uso ChangeUserStudentCodeUseCase
 * Descripción: Asigna, cambia o quita el código estudiantil de un usuario en una sola transacción: recorta y valida el código (1 a 32 letras, dígitos o guiones), rechaza un código ya asignado a otro usuario (409; el índice único resuelve las carreras), guarda y audita con IAuditRecorder el valor anterior y el nuevo; sin cambio no escribe ni audita
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { ChangeUserStudentCodeCommand } from "@/features/users/application/commands/change-user-student-code.command";
import { type User, USER_ENTITY_COLLECTION, USER_STUDENT_CODE_CHANGED_AUDIT_ACTION } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { InvalidStudentCodeError, StudentCodeAlreadyInUseError, UserNotFoundError } from "@/features/users/domain/users.errors";
import { isValidStudentCode } from "@/features/users/domain/value-objects/student-code";

/**
 * @throws {InvalidStudentCodeError} If the trimmed code is empty, longer than 32 characters or has characters other than letters, digits and hyphens
 * @throws {UserNotFoundError} If the target user does not exist
 * @throws {StudentCodeAlreadyInUseError} If another user already has the code
 */
@Injectable()
export class ChangeUserStudentCodeUseCase {
  public constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
  ) {}

  public async execute(command: ChangeUserStudentCodeCommand): Promise<void> {
    const studentCode: string | undefined = command.studentCode === null ? undefined : command.studentCode.trim();

    if (studentCode !== undefined && !isValidStudentCode(studentCode)) {
      throw new InvalidStudentCodeError();
    }

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      const user: User | undefined = await this._usersRepository.getById(command.userId, transaction);

      if (!user) {
        throw new UserNotFoundError();
      }

      if (studentCode !== undefined) {
        const holder: User | undefined = await this._usersRepository.getByStudentCode(studentCode, transaction);

        if (holder && holder.id !== user.id) {
          throw new StudentCodeAlreadyInUseError();
        }
      }

      const previous: string | null = user.studentCode ?? null;

      if (!user.changeStudentCode(studentCode)) {
        return;
      }

      await this._usersRepository.save(user, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        USER_STUDENT_CODE_CHANGED_AUDIT_ACTION,
        USER_ENTITY_COLLECTION,
        user.id,
        { studentCode: previous },
        { studentCode: user.studentCode ?? null },
        transaction,
      );
    });
  }
}
