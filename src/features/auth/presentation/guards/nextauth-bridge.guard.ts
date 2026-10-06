/*
 * Funcionalidad: Guard NextAuthBridgeGuard
 * Descripción: Valida en tiempo constante el secreto compartido del puente de NextAuth
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash, timingSafeEqual } from "crypto";

import { type CanActivate, type ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Request } from "express";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { InvalidBridgeSecretError } from "@/features/auth/domain/auth.errors";

export const NEXTAUTH_BRIDGE_SECRET_HEADER: string = "x-nextauth-bridge-secret";

@Injectable()
export class NextAuthBridgeGuard implements CanActivate {
  public constructor(private readonly _configService: ConfigService<EnvironmentVariables, true>) {}

  public canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest<Request>();

    const providedSecret: string | string[] | undefined = request.headers[NEXTAUTH_BRIDGE_SECRET_HEADER];
    const expectedSecret: string = this._configService.get("NEXTAUTH_BRIDGE_SECRET", { infer: true });

    if (typeof providedSecret !== "string" || providedSecret.length === 0 || !expectedSecret) {
      throw new InvalidBridgeSecretError();
    }

    // Hashing both sides gives equal-length buffers, so timingSafeEqual never leaks the secret length.
    const providedDigest: Buffer = createHash("sha256").update(providedSecret).digest();
    const expectedDigest: Buffer = createHash("sha256").update(expectedSecret).digest();

    if (!timingSafeEqual(providedDigest, expectedDigest)) {
      throw new InvalidBridgeSecretError();
    }

    return true;
  }
}
