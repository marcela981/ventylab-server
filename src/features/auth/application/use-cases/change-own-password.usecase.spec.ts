/*
 * Funcionalidad: Pruebas de ChangeOwnPasswordUseCase
 * Descripción: Verifica que el cambio de contraseña se delegue en la feature de usuarios con el propio usuario como ejecutor y que el par reemitido lleve el refresh token fechado un segundo después del segundo de la revocación (redondeado hacia abajo), y que un usuario inexistente tras el cambio responda UserNotFoundError; la respuesta lleva la imagen resuelta del usuario (foto subida)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITokenGenerator } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { ChangeOwnPasswordUseCase, reissuedRefreshIssuedAt } from "@/features/auth/application/use-cases/change-own-password.usecase";
import { ChangePasswordCommand } from "@/features/users/application/commands/change-password.command";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type ChangePasswordUseCase } from "@/features/users/application/use-cases/change-password.usecase";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

const REVOKED_AT: Date = new Date("2026-11-03T12:00:00.900Z");

const SIGNED_PHOTO_URL: string = "https://storage.example.com/avatars/U1.png?token=signed";

function build(user: object | undefined): { useCase: ChangeOwnPasswordUseCase; changePassword: jest.Mock; tokens: { generateToken: jest.Mock; generateRefreshToken: jest.Mock } } {
  const changePassword: jest.Mock = jest.fn().mockResolvedValue(REVOKED_AT);
  const tokens: { generateToken: jest.Mock; generateRefreshToken: jest.Mock } = {
    generateToken: jest.fn().mockResolvedValue("access-b"),
    generateRefreshToken: jest.fn().mockResolvedValue("refresh-b"),
  };
  const users: { getUserById: jest.Mock; resolveImage: jest.Mock } = { getUserById: jest.fn().mockResolvedValue(user), resolveImage: jest.fn().mockResolvedValue(SIGNED_PHOTO_URL) };

  return {
    useCase: new ChangeOwnPasswordUseCase({ execute: changePassword } as unknown as ChangePasswordUseCase, users as unknown as UsersFacade, tokens as unknown as ITokenGenerator),
    changePassword,
    tokens,
  };
}

describe("ChangeOwnPasswordUseCase", () => {
  it("dates the reissued refresh token one second after the revocation second", () => {
    expect(reissuedRefreshIssuedAt(REVOKED_AT)).toBe(Math.floor(REVOKED_AT.getTime() / 1000) + 1);
  });

  it("changes the password as the user and reissues the current session's pair", async () => {
    const { useCase, changePassword, tokens } = build({ id: "U1", email: "ana@ventylab.com", role: "STUDENT", isActive: true });

    const result: LoginResult = await useCase.execute({ userId: "U1", currentPassword: "Old-Pass-1", newPassword: "New-Pass-2" });

    expect(changePassword).toHaveBeenCalledWith(new ChangePasswordCommand({ userId: "U1", currentPassword: "Old-Pass-1", newPassword: "New-Pass-2", performedBy: "U1" }));
    expect(tokens.generateRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ sub: "U1" }), { issuedAtSeconds: reissuedRefreshIssuedAt(REVOKED_AT) });
    expect(result).toMatchObject({ accessToken: "access-b", refreshToken: "refresh-b", user: { id: "U1", image: SIGNED_PHOTO_URL } });
  });

  it("fails with UserNotFoundError when the user vanished after the change", async () => {
    const { useCase } = build(undefined);

    await expect(useCase.execute({ userId: "U1", currentPassword: "Old-Pass-1", newPassword: "New-Pass-2" })).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
