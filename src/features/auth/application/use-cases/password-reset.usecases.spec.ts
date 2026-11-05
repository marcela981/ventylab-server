/*
 * Funcionalidad: Pruebas de la recuperación de contraseña
 * Descripción: RequestPasswordResetUseCase solo emite un token (guardando su hash SHA-256, con vencimiento a 30 minutos, invalidando los anteriores) y envía el enlace a cuentas activas con contraseña, sin fallar nunca para correos desconocidos, cuentas de Google o inactivas ni cuando el correo no se puede enviar; ResetPasswordUseCase consume el token una sola vez en la misma transacción que fija la contraseña nueva y rechaza tokens desconocidos, vencidos o ya consumidos; el enlace usa el primer origen de FRONTEND_URL
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { type IEmailService, type SendEmailOptions } from "@/common/application/ports/email-service.interface";
import { hashPasswordResetToken, passwordResetLink, PASSWORD_RESET_TOKEN_TTL_MS } from "@/features/auth/application/helpers/password-reset-token.helper";
import { RequestPasswordResetUseCase } from "@/features/auth/application/use-cases/request-password-reset.usecase";
import { ResetPasswordUseCase } from "@/features/auth/application/use-cases/reset-password.usecase";
import { PasswordResetTokenInvalidError } from "@/features/auth/domain/auth.errors";
import { type IPasswordResetTokensRepository } from "@/features/auth/domain/repositories/password-reset-tokens.repository";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type ResetUserPasswordUseCase } from "@/features/users/application/use-cases/reset-user-password.usecase";

const NOW: Date = new Date("2026-11-04T12:00:00.000Z");
const TRANSACTION: string = "tx";

type TokensMock = { [K in keyof IPasswordResetTokensRepository]: jest.Mock };

function tokensRepository(): TokensMock {
  return {
    create: jest.fn().mockResolvedValue(undefined),
    invalidateForUser: jest.fn().mockResolvedValue(undefined),
    findValid: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(true),
  };
}

const transactions: ITransactionManager = { run: <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => work(TRANSACTION) };

function buildRequest(account: object | undefined, send: jest.Mock = jest.fn().mockResolvedValue(undefined)): { useCase: RequestPasswordResetUseCase; tokens: TokensMock; send: jest.Mock } {
  const tokens: TokensMock = tokensRepository();
  const users: { getUserByEmail: jest.Mock } = { getUserByEmail: jest.fn().mockResolvedValue(account) };
  const email: IEmailService = { send };

  return {
    useCase: new RequestPasswordResetUseCase(users as unknown as UsersFacade, tokens, transactions, email, "https://ventylab.vercel.app/, http://localhost:3000"),
    tokens,
    send,
  };
}

const ACTIVE: object = { id: "U1", email: "ana@ventylab.com", name: "Ana", role: "STUDENT", isActive: true, hasPassword: true };

describe("RequestPasswordResetUseCase", () => {
  it("stores only the hash of a 30-minute token, replaces earlier links and emails the link", async () => {
    const { useCase, tokens, send } = buildRequest(ACTIVE);

    await useCase.execute({ email: "ana@ventylab.com" }, NOW);

    expect(tokens.invalidateForUser).toHaveBeenCalledWith("U1", NOW, TRANSACTION);
    const [{ userId, tokenHash, expiresAt }] = tokens.create.mock.calls[0] as [{ userId: string; tokenHash: string; expiresAt: Date }];
    expect(userId).toBe("U1");
    expect(expiresAt.getTime() - NOW.getTime()).toBe(PASSWORD_RESET_TOKEN_TTL_MS);

    const message: SendEmailOptions = send.mock.calls[0][0] as SendEmailOptions;
    expect(message.to).toBe("ana@ventylab.com");
    const token: string = new URL(/https:\/\/\S+/.exec(message.body)?.[0] ?? "").searchParams.get("token") ?? "";
    expect(message.body).toContain("https://ventylab.vercel.app/auth/reset-password?token=");
    expect(hashPasswordResetToken(token)).toBe(tokenHash);
    expect(tokenHash).not.toBe(token);
    expect(message.html).toContain(`href="${passwordResetLink("https://ventylab.vercel.app", token)}"`);
  });

  it.each([
    ["an unknown email", undefined],
    ["a Google-only account", { ...ACTIVE, hasPassword: false }],
    ["an inactive account", { ...ACTIVE, isActive: false }],
  ])("does nothing (and does not fail) for %s", async (_label: string, account: object | undefined) => {
    const { useCase, tokens, send } = buildRequest(account);

    await expect(useCase.execute({ email: "x@ventylab.com" }, NOW)).resolves.toBeUndefined();

    expect(tokens.create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("does not fail when the email cannot be sent", async () => {
    const { useCase } = buildRequest(ACTIVE, jest.fn().mockRejectedValue(new Error("SMTP down")));

    await expect(useCase.execute({ email: "ana@ventylab.com" }, NOW)).resolves.toBeUndefined();
  });
});

function buildReset(record: object | undefined, consumed: boolean = true): { useCase: ResetPasswordUseCase; tokens: TokensMock; resetUser: jest.Mock } {
  const tokens: TokensMock = tokensRepository();
  tokens.findValid.mockResolvedValue(record);
  tokens.consume.mockResolvedValue(consumed);
  const resetUser: jest.Mock = jest.fn().mockResolvedValue(undefined);

  return {
    useCase: new ResetPasswordUseCase(tokens, transactions, { execute: resetUser } as unknown as ResetUserPasswordUseCase),
    tokens,
    resetUser,
  };
}

describe("ResetPasswordUseCase", () => {
  it("consumes the token and sets the new password in the same transaction", async () => {
    const { useCase, tokens, resetUser } = buildReset({ id: "T1", userId: "U1" });

    await useCase.execute({ token: "raw-token", newPassword: "New-Pass-2" }, NOW);

    expect(tokens.findValid).toHaveBeenCalledWith(hashPasswordResetToken("raw-token"), NOW, TRANSACTION);
    expect(tokens.consume).toHaveBeenCalledWith("T1", NOW, TRANSACTION);
    expect(resetUser).toHaveBeenCalledWith({ userId: "U1", newPassword: "New-Pass-2" }, TRANSACTION);
  });

  it("rejects an unknown, expired or used token", async () => {
    const { useCase, resetUser } = buildReset(undefined);

    await expect(useCase.execute({ token: "raw-token", newPassword: "New-Pass-2" }, NOW)).rejects.toBeInstanceOf(PasswordResetTokenInvalidError);
    expect(resetUser).not.toHaveBeenCalled();
  });

  it("rejects a token another request consumed first", async () => {
    const { useCase, resetUser } = buildReset({ id: "T1", userId: "U1" }, false);

    await expect(useCase.execute({ token: "raw-token", newPassword: "New-Pass-2" }, NOW)).rejects.toBeInstanceOf(PasswordResetTokenInvalidError);
    expect(resetUser).not.toHaveBeenCalled();
  });
});
