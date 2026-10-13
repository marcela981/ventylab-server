/*
 * Funcionalidad: Propiedades UPPAAL del flujo de autenticación como pruebas ejecutables
 * Descripción: Verifica S4, S5, S6, L1, L2, R1, R2 y R4 del modelo ventilab-auth-uppaal.xml (corrected-v2) sobre el código real de inicio de sesión: LoginUseCase con BcryptPasswordHasher, JwtTokenGenerator sobre JwtService, JwtAuthGuard y JwtAccessTokenVerifier; solo el repositorio de usuarios y la configuración son dobles de prueba
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ExecutionContext } from "@nestjs/common";
import { type ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { type Request } from "express";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { BcryptPasswordHasher } from "@/common/infrastructure/security/bcrypt-password-hasher";
import { LoginCommand } from "@/features/auth/application/commands/login.command";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { LoginUseCase } from "@/features/auth/application/use-cases/login.usecase";
import { InvalidCredentialsError, TokenExpiredError, UnauthorizedError } from "@/features/auth/domain/auth.errors";
import { JwtAccessTokenVerifier } from "@/features/auth/infrastructure/jwt/jwt-access-token-verifier";
import { JwtTokenGenerator } from "@/features/auth/infrastructure/jwt/jwt-token-generator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { resolveRolePermissions } from "@/features/authorization/domain/role-permissions";
import { User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository } from "@/features/users/domain/repositories/users.repository";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

const ACCESS_TOKEN_LIFETIME_SECONDS: number = 15 * 60;
const MODEL_AUTH_TIMEOUT_MS: number = 5000;
const PASSWORD: string = "Secret123";
const CREATED_AT: Date = new Date("2026-01-01T00:00:00.000Z");

interface AuthHarness {
  readonly login: LoginUseCase;
  readonly generator: JwtTokenGenerator;
  readonly guard: JwtAuthGuard;
  readonly verifier: JwtAccessTokenVerifier;
  readonly jwtService: JwtService;
}

function buildUser(id: string, email: string, role: string, passwordHash: string): User {
  return User.reconstitute({
    id,
    email,
    name: id,
    passwordHash,
    role: UserRole.create(role),
    image: undefined,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    auditLogs: [],
  });
}

async function buildHarness(): Promise<AuthHarness> {
  const hasher: BcryptPasswordHasher = new BcryptPasswordHasher();
  const passwordHash: string = await hasher.hash(PASSWORD);
  const users: User[] = [
    buildUser("student-1", "student@ventylab.com", "STUDENT", passwordHash),
    buildUser("admin-1", "admin@ventylab.com", "ADMIN", passwordHash),
  ];
  const usersRepository: IUserRepository = {
    getByEmail: async (email: string): Promise<User | undefined> => await Promise.resolve(users.find((user: User): boolean => user.email === email)),
  } as unknown as IUserRepository;
  const jwtService: JwtService = new JwtService({ secret: "uppaal-access-secret", signOptions: { expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS } });
  const config: Record<string, string> = { JWT_REFRESH_SECRET: "uppaal-refresh-secret", JWT_REFRESH_EXPIRES_IN: "7d" };
  const configService: ConfigService<EnvironmentVariables, true> = {
    get: (key: string): string | undefined => config[key],
  } as unknown as ConfigService<EnvironmentVariables, true>;
  const generator: JwtTokenGenerator = new JwtTokenGenerator(jwtService, configService);

  return {
    login: new LoginUseCase(usersRepository, hasher, generator),
    generator,
    guard: new JwtAuthGuard(generator),
    verifier: new JwtAccessTokenVerifier(generator),
    jwtService,
  };
}

function httpContext(authorization: string | undefined): { context: ExecutionContext; request: Request } {
  const request: Request = { headers: authorization === undefined ? {} : { authorization } } as unknown as Request;
  const context: ExecutionContext = { switchToHttp: () => ({ getRequest: (): Request => request }) } as unknown as ExecutionContext;

  return { context, request };
}

function fakeOnlyTheClock(now: Date): void {
  jest.useFakeTimers({
    now,
    doNotFake: ["hrtime", "nextTick", "performance", "queueMicrotask", "setImmediate", "clearImmediate", "setInterval", "clearInterval", "setTimeout", "clearTimeout"],
  });
}

describe("UPPAAL authentication flow (ventilab-auth-uppaal.xml, corrected-v2) as executable properties", () => {
  let harness: AuthHarness;

  beforeAll(async () => {
    harness = await buildHarness();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("S4 A[] authFlow.AUTHENTICATING imply authFlow.t_auth <= 5000", () => {
    it("completes every successful and failed password login within 5000 ms with the real bcrypt hasher", async () => {
      const attempts: LoginCommand[] = [
        new LoginCommand({ email: "student@ventylab.com", password: PASSWORD }),
        new LoginCommand({ email: "student@ventylab.com", password: "Wrong123" }),
        new LoginCommand({ email: "admin@ventylab.com", password: PASSWORD }),
        new LoginCommand({ email: "unknown@ventylab.com", password: PASSWORD }),
      ];
      const durations: number[] = [];

      for (const attempt of attempts) {
        const startedAt: number = performance.now();

        await harness.login.execute(attempt).catch((): undefined => undefined);
        durations.push(performance.now() - startedAt);
      }

      expect(Math.max(...durations)).toBeLessThanOrEqual(MODEL_AUTH_TIMEOUT_MS);
    });
  });

  describe("L1 authFlow.AUTHENTICATING --> (authFlow.AUTHENTICATED or authFlow.AUTH_FAILED) and R4 E<> authFlow.AUTH_FAILED", () => {
    it("ends every login either with a verifiable token pair or with InvalidCredentialsError", async () => {
      const outcomes: Array<{ token?: string; error?: unknown }> = [];
      const attempts: LoginCommand[] = [
        new LoginCommand({ email: "student@ventylab.com", password: PASSWORD }),
        new LoginCommand({ email: "student@ventylab.com", password: "Wrong123" }),
        new LoginCommand({ email: "nobody@ventylab.com", password: PASSWORD }),
      ];

      for (const attempt of attempts) {
        outcomes.push(
          await harness.login.execute(attempt).then(
            (result: LoginResult): { token: string } => ({ token: result.accessToken }),
            (error: unknown): { error: unknown } => ({ error }),
          ),
        );
      }

      const [success, wrongPassword, unknownEmail] = outcomes;

      await expect(harness.generator.verifyToken(success.token ?? "")).resolves.toMatchObject({ sub: "student-1", role: "STUDENT" });
      expect(wrongPassword.error).toBeInstanceOf(InvalidCredentialsError);
      expect(unknownEmail.error).toBeInstanceOf(InvalidCredentialsError);
    });
  });

  describe("R1 E<> authFlow.ROLE_ADMIN", () => {
    it("reaches an authenticated ADMIN session whose token carries the full ADMIN permission catalog", async () => {
      const result: LoginResult = await harness.login.execute(new LoginCommand({ email: "admin@ventylab.com", password: PASSWORD }));
      const { context, request } = httpContext(`Bearer ${result.accessToken}`);

      const allowed: boolean = await harness.guard.canActivate(context);

      expect(allowed).toBe(true);
      expect(request.user).toMatchObject({ sub: "admin-1", role: "ADMIN", permissions: resolveRolePermissions("ADMIN") });
    });
  });

  describe("S6 A[] (authFlow.ROLE_ADMIN imply authFlow.jwt_expiry <= JWT_EXPIRY_TIME)", () => {
    it("issues ADMIN and STUDENT access tokens whose lifetime is exactly the configured JWT_EXPIRES_IN", async () => {
      const admin: LoginResult = await harness.login.execute(new LoginCommand({ email: "admin@ventylab.com", password: PASSWORD }));
      const student: LoginResult = await harness.login.execute(new LoginCommand({ email: "student@ventylab.com", password: PASSWORD }));

      const lifetimes: number[] = [admin.accessToken, student.accessToken].map((token: string): number => {
        const claims: { iat?: number; exp?: number } = harness.jwtService.decode<{ iat?: number; exp?: number }>(token);

        return (claims.exp ?? Number.POSITIVE_INFINITY) - (claims.iat ?? 0);
      });

      expect(lifetimes).toEqual([ACCESS_TOKEN_LIFETIME_SECONDS, ACCESS_TOKEN_LIFETIME_SECONDS]);
    });
  });

  describe("S5 A[] (authFlow.SESSION_EXPIRED imply !authenticated) and R2 E<> authFlow.SESSION_EXPIRED", () => {
    it("treats an access token past its expiry as unauthenticated in the HTTP guard and in the socket verifier", async () => {
      const issuedAt: Date = new Date("2026-10-13T10:00:00.000Z");

      fakeOnlyTheClock(issuedAt);
      const token: string = await harness.generator.generateToken({ sub: "admin-1", email: "admin@ventylab.com", role: "ADMIN", permissions: [] });
      jest.setSystemTime(new Date(issuedAt.getTime() + (ACCESS_TOKEN_LIFETIME_SECONDS + 1) * 1000));
      const { context, request } = httpContext(`Bearer ${token}`);

      const guardOutcome: Promise<boolean> = harness.guard.canActivate(context);
      const socketClaims: unknown = await harness.verifier.verify(token);

      await expect(guardOutcome).rejects.toBeInstanceOf(TokenExpiredError);
      expect(request.user).toBeUndefined();
      expect(socketClaims).toBeUndefined();
    });
  });

  describe("L2 authFlow.ROLE_STUDENT --> (authFlow.SESSION_EXPIRED or authFlow.ANONYMOUS)", () => {
    it("ends a student session: the token is accepted before its expiry and rejected after it, and a request without a token is anonymous", async () => {
      const issuedAt: Date = new Date("2026-10-13T10:00:00.000Z");

      fakeOnlyTheClock(issuedAt);
      const result: LoginResult = await harness.login.execute(new LoginCommand({ email: "student@ventylab.com", password: PASSWORD }));
      const beforeExpiry: boolean = await harness.guard.canActivate(httpContext(`Bearer ${result.accessToken}`).context);
      jest.setSystemTime(new Date(issuedAt.getTime() + (ACCESS_TOKEN_LIFETIME_SECONDS + 1) * 1000));

      const afterExpiry: Promise<boolean> = harness.guard.canActivate(httpContext(`Bearer ${result.accessToken}`).context);
      const anonymous: Promise<boolean> = harness.guard.canActivate(httpContext(undefined).context);

      expect(beforeExpiry).toBe(true);
      await expect(afterExpiry).rejects.toBeInstanceOf(TokenExpiredError);
      await expect(anonymous).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
