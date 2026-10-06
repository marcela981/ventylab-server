/*
 * Funcionalidad: Puerto IAccessTokenVerifier
 * Descripción: Define el contrato y el token para verificar tokens de acceso desde la capa común sin depender de la feature de autenticación; devuelve sub y rol o undefined
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface AccessTokenClaims {
  sub: string;
  role: string;
}

export const ACCESS_TOKEN_VERIFIER_TOKEN: unique symbol = Symbol("ACCESS_TOKEN_VERIFIER_TOKEN");

export interface IAccessTokenVerifier {
  verify(token: string): Promise<AccessTokenClaims | undefined>;
}
