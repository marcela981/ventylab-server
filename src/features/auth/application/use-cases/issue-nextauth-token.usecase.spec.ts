/*
 * Funcionalidad: Pruebas de IssueNextAuthTokenUseCase
 * Descripción: Verifica el puente de NextAuth: usuario inexistente, correo distinto, usuario inactivo y emisión del par de tokens
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { IssueNextAuthTokenCommand } from "@/features/auth/application/commands/issue-nextauth-token.command";
import { type ITokenGenerator } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { IssueNextAuthTokenUseCase } from "@/features/auth/application/use-cases/issue-nextauth-token.usecase";
import { InvalidCredentialsError, UserInactiveError } from "@/features/auth/domain/auth.errors";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

function buildAccount(isActive: boolean): UserAccount {
  return {
    id: "U1",
    email: "ana@ventylab.com",
    name: "Ana",
    role: "STUDENT",
    isActive,
    hasPassword: false,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
  };
}

function buildUseCase(account: UserAccount | undefined): IssueNextAuthTokenUseCase {
  const tokenGenerator: ITokenGenerator = {
    generateToken: jest.fn().mockResolvedValue("access-token"),
    generateRefreshToken: jest.fn().mockResolvedValue("refresh-token"),
    verifyToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };
  const usersFacade: UsersFacade = { getUserById: jest.fn().mockResolvedValue(account) } as unknown as UsersFacade;

  return new IssueNextAuthTokenUseCase(usersFacade, tokenGenerator);
}

const COMMAND: IssueNextAuthTokenCommand = new IssueNextAuthTokenCommand({ userId: "U1", email: "ana@ventylab.com" });

describe("IssueNextAuthTokenUseCase", () => {
  it("rejects an unknown user", async () => {
    const useCase: IssueNextAuthTokenUseCase = buildUseCase(undefined);

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("rejects an email that does not match the user", async () => {
    const useCase: IssueNextAuthTokenUseCase = buildUseCase(buildAccount(true));

    const execution: Promise<LoginResult> = useCase.execute(new IssueNextAuthTokenCommand({ userId: "U1", email: "other@ventylab.com" }));

    await expect(execution).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects an inactive user", async () => {
    const useCase: IssueNextAuthTokenUseCase = buildUseCase(buildAccount(false));

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(UserInactiveError);
  });

  it("issues the same token pair as login", async () => {
    const useCase: IssueNextAuthTokenUseCase = buildUseCase(buildAccount(true));

    const result: LoginResult = await useCase.execute(COMMAND);

    expect(result).toMatchObject({ accessToken: "access-token", refreshToken: "refresh-token", user: { id: "U1", role: "STUDENT" } });
  });
});
