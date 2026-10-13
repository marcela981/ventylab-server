/*
 * Funcionalidad: Dobles de prueba del inicio de sesión con Google
 * Descripción: Verificador falso de tokens de identidad de Google que nunca contacta a Google: resuelve tokens registrados por la prueba a sus claims y rechaza cualquier otro, más un ayudante de Nest que reemplaza GOOGLE_ID_TOKEN_VERIFIER_TOKEN en un TestingModuleBuilder
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TestingModuleBuilder } from "@nestjs/testing";

import { GOOGLE_ID_TOKEN_VERIFIER_TOKEN, type GoogleIdTokenClaims, type IGoogleIdTokenVerifier } from "@/features/auth/application/ports/google-id-token-verifier.interface";

export class FakeGoogleIdTokenVerifier implements IGoogleIdTokenVerifier {
  public readonly verifiedTokens: string[] = [];
  private readonly _claimsByToken: Map<string, GoogleIdTokenClaims> = new Map<string, GoogleIdTokenClaims>();

  public register(idToken: string, claims: GoogleIdTokenClaims): void {
    this._claimsByToken.set(idToken, claims);
  }

  public isConfigured(): boolean {
    return true;
  }

  public verify(idToken: string): Promise<GoogleIdTokenClaims> {
    this.verifiedTokens.push(idToken);

    const claims: GoogleIdTokenClaims | undefined = this._claimsByToken.get(idToken);

    return claims ? Promise.resolve(claims) : Promise.reject(new Error("Unknown fake Google ID token"));
  }
}

export function withFakeGoogleVerifier(builder: TestingModuleBuilder, verifier: FakeGoogleIdTokenVerifier): TestingModuleBuilder {
  return builder.overrideProvider(GOOGLE_ID_TOKEN_VERIFIER_TOKEN).useValue(verifier);
}
