/*
 * Funcionalidad: Seudonimizador HmacPseudonymizer
 * Descripción: Implementa IPseudonymizer con HMAC-SHA256 de node:crypto usando como clave ANALYTICS_EXPORT_SALT leída de ConfigService en cada llamada (hexadecimal en minúsculas); sin sal configurada lanza AnalyticsExportNotConfiguredError y nunca devuelve el identificador original
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHmac } from "node:crypto";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type IPseudonymizer } from "@/features/analytics/application/ports/pseudonymizer.interface";
import { AnalyticsExportNotConfiguredError } from "@/features/analytics/domain/analytics.errors";

@Injectable()
export class HmacPseudonymizer implements IPseudonymizer {
  public constructor(private readonly _configService: ConfigService<EnvironmentVariables>) {}

  public get isConfigured(): boolean {
    return this._salt() !== undefined;
  }

  public pseudonymize(value: string): string {
    const salt: string | undefined = this._salt();

    if (salt === undefined) {
      throw new AnalyticsExportNotConfiguredError();
    }

    return createHmac("sha256", salt).update(value, "utf8").digest("hex");
  }

  private _salt(): string | undefined {
    const salt: string | undefined = this._configService.get("ANALYTICS_EXPORT_SALT");

    return salt !== undefined && salt.length > 0 ? salt : undefined;
  }
}
