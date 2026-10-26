/*
 * Funcionalidad: Resultado LoginResult
 * Descripción: Datos devueltos por el inicio de sesión (local o con Google): usuario autenticado y tokens. v1.2: sin el puente de NextAuth retirado
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AuthenticatedUser } from "@/features/auth/application/results/authenticated-user.result";

export class LoginResult {
  public readonly accessToken: string;
  public readonly refreshToken: string;
  public readonly user: AuthenticatedUser;

  public constructor({ accessToken, refreshToken, user }: { accessToken: string; refreshToken: string; user: AuthenticatedUser }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = user;
  }
}
