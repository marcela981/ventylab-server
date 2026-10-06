/*
 * Funcionalidad: Pruebas de RefreshTokenUseCase
 * Descripción: Verifica la renovación del token de acceso: usuario inexistente, usuario inactivo y revocación por refreshTokensRevokedAt comparada con el iat del token
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { RefreshTokenCommand } from "@/features/auth/application/commands/refresh-token.command";
import { type ITokenGenerator } from "@/features/auth/application/ports/token-generator.interface";
import { type RefreshTokenResult } from "@/features/auth/application/results/refresh-token.result";
import { RefreshTokenUseCase } from "@/features/auth/application/use-cases/refresh-token.usecase";
import { RefreshTokenRevokedError, UserInactiveError } from "@/features/auth/domain/auth.errors";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

const REVOKED_AT: Date = new Date("2026-01-01T00:00:10.500Z");
const REVOKED_AT_SECONDS: number = 1767225610;

interface Harness {
  useCase: RefreshTokenUseCase;
  generateToken: jest.Mock;
}

function buildAccount(overrides: Partial<UserAccount>): UserAccount {
  return {
    id: "U1",
    email: "ana@ventylab.com",
    name: "Ana",
    role: "TEACHER",
    isActive: true,
    hasPassword: true,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildHarness(account: UserAccount | undefined, iat: number): Harness {
  const generateToken: jest.Mock = jest.fn().mockResolvedValue("new-access-token");

  const tokenGenerator: ITokenGenerator = {
    generateToken,
    generateRefreshToken: jest.fn(),
    verifyToken: jest.fn(),
    verifyRefreshToken: jest.fn().mockResolvedValue({ sub: "U1", email: "ana@ventylab.com", role: "TEACHER", permissions: [], iat }),
  };
  const usersFacade: UsersFacade = { getUserById: jest.fn().mockResolvedValue(account) } as unknown as UsersFacade;

  return { useCase: new RefreshTokenUseCase(usersFacade, tokenGenerator), generateToken };
}

const COMMAND: RefreshTokenCommand = new RefreshTokenCommand({ refreshToken: "refresh-token" });

describe("RefreshTokenUseCase", () => {
  it("rejects a token whose user no longer exists", async () => {
    const { useCase } = buildHarness(undefined, REVOKED_AT_SECONDS);

    const execution: Promise<RefreshTokenResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(UserNotFoundError);
  });

  it("rejects an inactive user", async () => {
    const { useCase, generateToken } = buildHarness(buildAccount({ isActive: false }), REVOKED_AT_SECONDS);

    const execution: Promise<RefreshTokenResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(UserInactiveError);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it.each([
    ["issued before the revocation", REVOKED_AT_SECONDS - 60],
    ["issued in the same second as the revocation", REVOKED_AT_SECONDS],
  ])("rejects a refresh token %s", async (_label: string, iat: number) => {
    const { useCase } = buildHarness(buildAccount({ refreshTokensRevokedAt: REVOKED_AT }), iat);

    const execution: Promise<RefreshTokenResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(RefreshTokenRevokedError);
  });

  it("accepts a refresh token issued after the revocation", async () => {
    const { useCase } = buildHarness(buildAccount({ refreshTokensRevokedAt: REVOKED_AT }), REVOKED_AT_SECONDS + 1);

    const result: RefreshTokenResult = await useCase.execute(COMMAND);

    expect(result).toMatchObject({ accessToken: "new-access-token", userId: "U1" });
  });

  it("issues an access token with the unchanged claims from the current user data", async () => {
    const { useCase, generateToken } = buildHarness(buildAccount({ role: "ADMIN" }), REVOKED_AT_SECONDS);

    await useCase.execute(COMMAND);

    const payload: Record<string, unknown> = generateToken.mock.calls[0][0] as Record<string, unknown>;

    expect(payload).toMatchObject({ sub: "U1", email: "ana@ventylab.com", role: "ADMIN" });
    expect(Object.keys(payload).sort()).toEqual(["email", "permissions", "role", "sub"]);
  });
});
