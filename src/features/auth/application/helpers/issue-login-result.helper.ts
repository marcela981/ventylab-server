/*
 * Funcionalidad: Utilidad issueLoginResult
 * Descripción: Emite el mismo par de tokens de acceso y de refresco para cualquier inicio de sesión (local o con Google) y arma el LoginResult. v1.1: sin el puente de NextAuth retirado; opcionalmente fecha el refresh token con un iat explícito (reemisión tras cambiar la contraseña) v1.3: el usuario del resultado lleva la preferencia de apariencia
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildJwtPayload } from "@/features/auth/application/helpers/build-jwt-payload.helper";
import { type ITokenGenerator, type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { type AuthenticatedUser } from "@/features/auth/application/results/authenticated-user.result";
import { LoginResult } from "@/features/auth/application/results/login.result";

export async function issueLoginResult(tokenGenerator: ITokenGenerator, user: AuthenticatedUser, options: { refreshIssuedAtSeconds?: number } = {}): Promise<LoginResult> {
  const payload: JwtPayload = buildJwtPayload(user);

  const accessToken: string = await tokenGenerator.generateToken(payload);
  const refreshToken: string =
    options.refreshIssuedAtSeconds === undefined
      ? await tokenGenerator.generateRefreshToken(payload)
      : await tokenGenerator.generateRefreshToken(payload, { issuedAtSeconds: options.refreshIssuedAtSeconds });

  return new LoginResult({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, image: user.image, themeMode: user.themeMode, themePalette: user.themePalette },
  });
}
