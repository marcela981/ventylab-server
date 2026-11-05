/*
 * Funcionalidad: Pruebas de ResetUserPasswordUseCase
 * Descripción: Fija la contraseña nueva hasheada sin pedir la actual, revoca los refresh tokens y las sesiones dentro de la transacción del llamador y publica el evento; un usuario inexistente responde UserNotFoundError.
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IPasswordHasher } from "@/common/application/security/password-hasher.interface";
import { ResetUserPasswordUseCase } from "@/features/users/application/use-cases/reset-user-password.usecase";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

function user(): User {
  return User.reconstitute({
    id: "U1",
    email: "ana@ventylab.com",
    passwordHash: "old-hash",
    role: UserRole.create("STUDENT"),
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    auditLogs: [],
  });
}

function build(found: User | undefined): { useCase: ResetUserPasswordUseCase; repository: { getById: jest.Mock; save: jest.Mock; revokeSessions: jest.Mock }; publish: jest.Mock } {
  const repository: { getById: jest.Mock; save: jest.Mock; revokeSessions: jest.Mock } = {
    getById: jest.fn().mockResolvedValue(found),
    save: jest.fn().mockResolvedValue(undefined),
    revokeSessions: jest.fn().mockResolvedValue(undefined),
  };
  const publish: jest.Mock = jest.fn();
  const hasher: IPasswordHasher = { hash: jest.fn().mockResolvedValue("new-hash"), verify: jest.fn() };

  return {
    useCase: new ResetUserPasswordUseCase(repository as unknown as IUserRepository, { publish }, hasher),
    repository,
    publish,
  };
}

describe("ResetUserPasswordUseCase", () => {
  it("sets the hashed password and revokes every session inside the caller transaction", async () => {
    const target: User = user();
    const { useCase, repository, publish } = build(target);

    await useCase.execute({ userId: "U1", newPassword: "New-Pass-2" }, "tx");

    expect(repository.getById).toHaveBeenCalledWith("U1", "tx");
    expect(target.passwordHash).toBe("new-hash");
    expect(target.refreshTokensRevokedAt).toBeInstanceOf(Date);
    expect(repository.save).toHaveBeenCalledWith(target, "tx");
    expect(repository.revokeSessions).toHaveBeenCalledWith("U1", "tx");
    expect(publish).toHaveBeenCalled();
  });

  it("fails with UserNotFoundError for an unknown user", async () => {
    const { useCase } = build(undefined);

    await expect(useCase.execute({ userId: "U9", newPassword: "New-Pass-2" }, "tx")).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
