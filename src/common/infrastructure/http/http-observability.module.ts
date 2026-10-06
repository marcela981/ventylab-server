/*
 * Funcionalidad: Módulo HttpObservabilityModule
 * Descripción: Instrumenta las llamadas HTTP salientes de @nestjs/axios para reportar errores a Sentry con datos sensibles enmascarados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HttpModule, HttpService } from "@nestjs/axios";
import { Module, type OnModuleInit } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";

import { maskSensitiveHttpData } from "@/common/infrastructure/http/utils/mask-sensitive-http-data.util";

import type { Scope } from "@sentry/nestjs";
import type { AxiosError } from "axios";

/**
 * Feature modules import `@nestjs/axios`'s bare `HttpModule` (no `.register()`), so Nest
 * resolves all of them to the same underlying `HttpService`/axios instance. Attaching the
 * interceptor here — once — instruments every outbound HTTP call made through that shared
 * instance across the app.
 */
@Module({
  imports: [HttpModule],
})
export class HttpObservabilityModule implements OnModuleInit {
  public constructor(private readonly _httpService: HttpService) {}

  public onModuleInit(): void {
    this._httpService.axiosRef.interceptors.response.use(undefined, (error: AxiosError) => {
      Sentry.withScope((scope: Scope) => {
        scope.setContext("request", {
          url: error.config?.url,
          method: error.config?.method,
          headers: maskSensitiveHttpData(error.config?.headers),
          data: maskSensitiveHttpData(error.config?.data),
        });

        scope.setContext("response", {
          status: error.response?.status,
          headers: maskSensitiveHttpData(error.response?.headers),
          data: maskSensitiveHttpData(error.response?.data),
        });

        Sentry.captureException(error, {
          mechanism: { handled: false, type: "auto.http.axios.outbound_interceptor" },
        });

        error.__sentry_captured__ = true;
      });

      return Promise.reject(error);
    });
  }
}
