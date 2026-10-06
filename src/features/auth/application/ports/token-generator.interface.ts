/*
 * Funcionalidad: Puerto ITokenGenerator
 * Descripción: Define JwtPayload, RefreshTokenClaims (payload más iat del token de refresco), el contrato y el token de inyección para generar y verificar tokens de acceso y de refresco
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenClaims extends JwtPayload {
  iat: number;
}

export const TOKEN_GENERATOR_TOKEN: unique symbol = Symbol("TOKEN_GENERATOR_TOKEN");

export interface ITokenGenerator {
  generateToken(payload: JwtPayload): Promise<string>;
  verifyToken(token: string): Promise<JwtPayload>;
  generateRefreshToken(payload: JwtPayload): Promise<string>;
  verifyRefreshToken(token: string): Promise<RefreshTokenClaims>;
}
