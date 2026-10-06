/*
 * Funcionalidad: Pruebas de JwtTokenGenerator
 * Descripción: Verifica que el token de refresco conserve exactamente sus claims (sub, email, role, permissions más iat y exp estándar) y que la verificación exponga el iat
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type JwtPayload, type RefreshTokenClaims } from "@/features/auth/application/ports/token-generator.interface";
import { RefreshTokenInvalidError } from "@/features/auth/domain/auth.errors";
import { JwtTokenGenerator } from "@/features/auth/infrastructure/jwt/jwt-token-generator";

const CONFIG: Record<string, string> = {
  JWT_REFRESH_SECRET: "refresh-secret",
  JWT_REFRESH_EXPIRES_IN: "7d",
};

const PAYLOAD: JwtPayload = { sub: "U1", email: "ana@ventylab.com", role: "STUDENT", permissions: ["levels:read"] };

function buildGenerator(): { generator: JwtTokenGenerator; jwtService: JwtService } {
  const jwtService: JwtService = new JwtService({ secret: "access-secret", signOptions: { expiresIn: "15m" } });
  const configService: ConfigService<EnvironmentVariables, true> = {
    get: (key: string): string | undefined => CONFIG[key],
  } as unknown as ConfigService<EnvironmentVariables, true>;

  return { generator: new JwtTokenGenerator(jwtService, configService), jwtService };
}

describe("JwtTokenGenerator", () => {
  it("signs refresh tokens with only the payload claims plus the standard iat and exp", async () => {
    const { generator, jwtService } = buildGenerator();

    const token: string = await generator.generateRefreshToken(PAYLOAD);

    const decoded: Record<string, unknown> = jwtService.decode<Record<string, unknown>>(token);

    expect(Object.keys(decoded).sort()).toEqual(["email", "exp", "iat", "permissions", "role", "sub"]);
  });

  it("exposes the issued-at time when verifying a refresh token", async () => {
    const { generator } = buildGenerator();
    const before: number = Math.floor(Date.now() / 1000);
    const token: string = await generator.generateRefreshToken(PAYLOAD);

    const claims: RefreshTokenClaims = await generator.verifyRefreshToken(token);

    expect(claims).toMatchObject(PAYLOAD);
    expect(claims.iat).toBeGreaterThanOrEqual(before);
  });

  it("rejects a refresh token signed with another secret", async () => {
    const { generator } = buildGenerator();
    const token: string = await generator.generateToken(PAYLOAD);

    const execution: Promise<RefreshTokenClaims> = generator.verifyRefreshToken(token);

    await expect(execution).rejects.toBeInstanceOf(RefreshTokenInvalidError);
  });
});
