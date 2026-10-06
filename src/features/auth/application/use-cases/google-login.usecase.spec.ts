/*
 * Funcionalidad: Pruebas de GoogleLoginUseCase
 * Descripción: Verifica el inicio de sesión con Google: configuración ausente, token inválido, correo no verificado, dominio no permitido, alta como estudiante, vinculación por correo, usuario inactivo y emisión del par de tokens
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { GoogleLoginCommand } from "@/features/auth/application/commands/google-login.command";
import {
  type GoogleIdTokenClaims,
  type IGoogleIdTokenVerifier,
} from "@/features/auth/application/ports/google-id-token-verifier.interface";
import { type ITokenGenerator } from "@/features/auth/application/ports/token-generator.interface";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { GoogleLoginUseCase } from "@/features/auth/application/use-cases/google-login.usecase";
import {
  EmailDomainNotAllowedError,
  GoogleEmailNotVerifiedError,
  GoogleSignInNotConfiguredError,
  InvalidGoogleTokenError,
  UserInactiveError,
} from "@/features/auth/domain/auth.errors";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

const CLAIMS: GoogleIdTokenClaims = {
  sub: "google-123",
  email: "Ana@VentyLab.com",
  emailVerified: true,
  name: "Ana",
  picture: "https://example.com/ana.png",
};

interface HarnessOptions {
  configured?: boolean;
  claims?: GoogleIdTokenClaims;
  verifyError?: Error;
  account?: UserAccount;
  allowedDomains?: string[];
}

interface Harness {
  useCase: GoogleLoginUseCase;
  findOrCreateFromGoogle: jest.Mock;
  generateToken: jest.Mock;
  generateRefreshToken: jest.Mock;
}

function buildAccount(overrides: Partial<UserAccount>): UserAccount {
  return {
    id: "U-new",
    email: "Ana@VentyLab.com",
    name: "Ana",
    role: "STUDENT",
    image: "https://example.com/ana.png",
    isActive: true,
    googleId: "google-123",
    hasPassword: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildHarness({ configured = true, claims = CLAIMS, verifyError, account = buildAccount({}), allowedDomains = [] }: HarnessOptions): Harness {
  const verify: jest.Mock = verifyError ? jest.fn().mockRejectedValue(verifyError) : jest.fn().mockResolvedValue(claims);
  const findOrCreateFromGoogle: jest.Mock = jest.fn().mockResolvedValue(account);
  const generateToken: jest.Mock = jest.fn().mockResolvedValue("access-token");
  const generateRefreshToken: jest.Mock = jest.fn().mockResolvedValue("refresh-token");

  const verifier: IGoogleIdTokenVerifier = { isConfigured: jest.fn().mockReturnValue(configured), verify };
  const usersFacade: UsersFacade = { findOrCreateFromGoogle } as unknown as UsersFacade;
  const tokenGenerator: ITokenGenerator = {
    generateToken,
    generateRefreshToken,
    verifyToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  return {
    useCase: new GoogleLoginUseCase(verifier, usersFacade, tokenGenerator, allowedDomains),
    findOrCreateFromGoogle,
    generateToken,
    generateRefreshToken,
  };
}

const COMMAND: GoogleLoginCommand = new GoogleLoginCommand({ idToken: "google-id-token" });

describe("GoogleLoginUseCase", () => {
  it("fails with service unavailable when the Google client ID is not configured", async () => {
    const { useCase, findOrCreateFromGoogle } = buildHarness({ configured: false });

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(GoogleSignInNotConfiguredError);
    expect(findOrCreateFromGoogle).not.toHaveBeenCalled();
  });

  it("propagates an invalid token error from the verifier", async () => {
    const { useCase } = buildHarness({ verifyError: new InvalidGoogleTokenError() });

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(InvalidGoogleTokenError);
  });

  it("rejects a token without an email as invalid", async () => {
    const { useCase } = buildHarness({ claims: { ...CLAIMS, email: undefined } });

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(InvalidGoogleTokenError);
  });

  it("rejects an unverified Google email", async () => {
    const { useCase, findOrCreateFromGoogle } = buildHarness({ claims: { ...CLAIMS, emailVerified: false } });

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(GoogleEmailNotVerifiedError);
    expect(findOrCreateFromGoogle).not.toHaveBeenCalled();
  });

  it("rejects an email whose domain is not in the allowed list", async () => {
    const { useCase, findOrCreateFromGoogle } = buildHarness({ allowedDomains: ["correounivalle.edu.co"] });

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(EmailDomainNotAllowedError);
    expect(findOrCreateFromGoogle).not.toHaveBeenCalled();
  });

  it("accepts an allowed domain case-insensitively", async () => {
    const { useCase } = buildHarness({ allowedDomains: ["ventylab.com"] });

    const result: LoginResult = await useCase.execute(COMMAND);

    expect(result.accessToken).toBe("access-token");
  });

  it("creates a new user as student from the Google profile", async () => {
    const { useCase, findOrCreateFromGoogle } = buildHarness({});

    const result: LoginResult = await useCase.execute(COMMAND);

    expect(findOrCreateFromGoogle).toHaveBeenCalledWith({
      googleId: "google-123",
      email: "Ana@VentyLab.com",
      name: "Ana",
      avatarUrl: "https://example.com/ana.png",
    });
    expect(result.user).toMatchObject({ id: "U-new", role: "STUDENT" });
  });

  it("signs in the existing account linked by email with its own role", async () => {
    const { useCase } = buildHarness({ account: buildAccount({ id: "U-existing", role: "TEACHER", hasPassword: true }) });

    const result: LoginResult = await useCase.execute(COMMAND);

    expect(result.user).toMatchObject({ id: "U-existing", role: "TEACHER" });
  });

  it("rejects an inactive account", async () => {
    const { useCase, generateToken } = buildHarness({ account: buildAccount({ isActive: false }) });

    const execution: Promise<LoginResult> = useCase.execute(COMMAND);

    await expect(execution).rejects.toBeInstanceOf(UserInactiveError);
    expect(generateToken).not.toHaveBeenCalled();
  });

  it("issues the same token pair and payload shape as local login", async () => {
    const { useCase, generateToken, generateRefreshToken } = buildHarness({});

    const result: LoginResult = await useCase.execute(COMMAND);

    const payload: Record<string, unknown> = generateToken.mock.calls[0][0] as Record<string, unknown>;

    expect(Object.keys(payload).sort()).toEqual(["email", "permissions", "role", "sub"]);
    expect(generateRefreshToken).toHaveBeenCalledWith(payload);
    expect(result).toMatchObject({ accessToken: "access-token", refreshToken: "refresh-token" });
  });
});
