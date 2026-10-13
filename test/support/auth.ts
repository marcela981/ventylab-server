/*
 * Funcionalidad: Emisión de tokens de acceso para pruebas
 * Descripción: Emite tokens de acceso de un usuario con el mismo JwtTokenGenerator y buildJwtPayload que usa AuthModule, configurado con JWT_SECRET y JWT_EXPIRES_IN del entorno de pruebas, o con el generador de una aplicación Nest ya arrancada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { buildJwtPayload } from "@/features/auth/application/helpers/build-jwt-payload.helper";
import { type ITokenGenerator, TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { JwtTokenGenerator } from "@/features/auth/infrastructure/jwt/jwt-token-generator";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export interface TokenSubject {
  readonly id: string;
  readonly email: string;
  readonly role: string;
}

function requireEnv(key: string): string {
  const value: string | undefined = process.env[key];

  if (!value) {
    throw new Error(`${key} is not set in the test environment`);
  }

  return value;
}

export function createTestTokenGenerator(): ITokenGenerator {
  const jwtService: JwtService = new JwtService({ secret: requireEnv("JWT_SECRET"), signOptions: { expiresIn: requireEnv("JWT_EXPIRES_IN") as JwtSignOptions["expiresIn"] } });
  const config: ConfigService<EnvironmentVariables, true> = new ConfigService<EnvironmentVariables, true>({
    JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
    JWT_REFRESH_EXPIRES_IN: requireEnv("JWT_REFRESH_EXPIRES_IN"),
  });

  return new JwtTokenGenerator(jwtService, config);
}

export async function mintAccessToken(user: TokenSubject, source?: INestApplication | ITokenGenerator): Promise<string> {
  const generator: ITokenGenerator = source === undefined
    ? createTestTokenGenerator()
    : "generateToken" in source ? source : source.get<ITokenGenerator>(TOKEN_GENERATOR_TOKEN);

  return await generator.generateToken(buildJwtPayload({ id: user.id, email: user.email, role: user.role as UserRoleValue }));
}

export function bearer(token: string): string {
  return `Bearer ${token}`;
}
