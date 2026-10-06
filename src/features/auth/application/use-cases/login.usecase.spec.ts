/*
 * Funcionalidad: Pruebas de LoginUseCase
 * Descripción: Verifica el inicio de sesión local: credenciales inválidas, cuenta sin contraseña (solo Google), usuario inactivo y emisión del par de tokens
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IPasswordHasher } from "@/common/application/security/password-hasher.interface";
import { LoginCommand } from "@/features/auth/application/commands/login.command";
import { type ITokenGenerator } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { LoginUseCase } from "@/features/auth/application/use-cases/login.usecase";
import { InvalidCredentialsError, PasswordLoginNotAvailableError, UserInactiveError } from "@/features/auth/domain/auth.errors";
import { resolveRolePermissions } from "@/features/authorization/domain/role-permissions";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

interface Harness {
  useCase: LoginUseCase;
  generateToken: jest.Mock;
  generateRefreshToken: jest.Mock;
}

function buildUser({ passwordHash, isActive }: { passwordHash?: string; isActive: boolean }): User {
  const createdAt: Date = new Date("2026-01-01T00:00:00.000Z");

  return User.reconstitute({
    id: "U1",
    email: "ana@ventylab.com",
    name: "Ana",
    passwordHash,
    role: UserRole.create("STUDENT"),
    image: undefined,
    isActive,
    createdAt,
    updatedAt: createdAt,
    auditLogs: [],
  });
}

function buildHarness(user: User | undefined, isPasswordValid: boolean): Harness {
  const generateToken: jest.Mock = jest.fn().mockResolvedValue("access-token");
  const generateRefreshToken: jest.Mock = jest.fn().mockResolvedValue("refresh-token");

  const usersRepository: IUserRepository = { getByEmail: jest.fn().mockResolvedValue(user) } as unknown as IUserRepository;
  const passwordHasher: IPasswordHasher = { hash: jest.fn(), verify: jest.fn().mockResolvedValue(isPasswordValid) };
  const tokenGenerator: ITokenGenerator = {
    generateToken,
    generateRefreshToken,
    verifyToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  return { useCase: new LoginUseCase(usersRepository, passwordHasher, tokenGenerator), generateToken, generateRefreshToken };
}

const COMMAND: LoginCommand = new LoginCommand({ email: "ana@ventylab.com", password: "Secret123" });

describe("LoginUseCase", () => {
  it("rejects an unknown email with the generic invalid credentials error", async () => {
    const { useCase } = buildHarness(undefined, true);

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("tells a Google-only account to sign in with Google", async () => {
    const { useCase } = buildHarness(buildUser({ passwordHash: undefined, isActive: true }), true);

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(PasswordLoginNotAvailableError);
  });

  it("rejects a wrong password with the generic invalid credentials error", async () => {
    const { useCase } = buildHarness(buildUser({ passwordHash: "hash", isActive: true }), false);

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("rejects an inactive user after a valid password", async () => {
    const { useCase, generateToken } = buildHarness(buildUser({ passwordHash: "hash", isActive: false }), true);

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(UserInactiveError);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("issues the access and refresh tokens with the unchanged payload", async () => {
    const { useCase, generateToken, generateRefreshToken } = buildHarness(buildUser({ passwordHash: "hash", isActive: true }), true);
    const expectedPayload: Record<string, unknown> = {
      sub: "U1",
      email: "ana@ventylab.com",
      role: "STUDENT",
      permissions: resolveRolePermissions("STUDENT"),
    };

    const result: LoginResult = await useCase.execute(COMMAND);

    expect(generateToken).toHaveBeenCalledWith(expectedPayload);
    expect(generateRefreshToken).toHaveBeenCalledWith(expectedPayload);
    expect(result).toMatchObject({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      user: { id: "U1", email: "ana@ventylab.com", name: "Ana", role: "STUDENT" },
    });
  });
});
