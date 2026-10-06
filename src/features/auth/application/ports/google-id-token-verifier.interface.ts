/*
 * Funcionalidad: Puerto IGoogleIdTokenVerifier
 * Descripción: Define GoogleIdTokenClaims, el contrato y el token de inyección para verificar ID tokens de Google contra el client ID configurado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export const GOOGLE_ID_TOKEN_VERIFIER_TOKEN: unique symbol = Symbol("GOOGLE_ID_TOKEN_VERIFIER_TOKEN");

export interface IGoogleIdTokenVerifier {
  isConfigured(): boolean;
  verify(idToken: string): Promise<GoogleIdTokenClaims>;
}
