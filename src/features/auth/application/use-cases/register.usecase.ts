/*
 * Funcionalidad: Caso de uso RegisterUseCase
 * Descripción: Registra un usuario nuevo siempre con rol de estudiante y emite sus tokens
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { RegisterCommand } from "@/features/auth/application/commands/register.command";
import { CreateUserCommand } from "@/features/users/application/commands/create-user.command";
import { CreateUserUseCase } from "@/features/users/application/use-cases/create-user.usecase";

/**
 * @throws {UserAlreadyExistsError} If the email is already registered
 */
@Injectable()
export class RegisterUseCase {
  public constructor(private readonly _createUserUseCase: CreateUserUseCase) {}

  public async execute(command: RegisterCommand): Promise<void> {
    await this._createUserUseCase.execute(
      new CreateUserCommand({
        name: command.name,
        email: command.email,
        password: command.password,
      }),
    );
  }
}
