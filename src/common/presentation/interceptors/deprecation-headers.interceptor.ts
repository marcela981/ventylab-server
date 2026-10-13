/*
 * Funcionalidad: Interceptor de cabeceras de deprecación
 * Descripción: En las rutas marcadas con DeprecatedRoute o DeprecatedAlias agrega la cabecera Deprecation (RFC 9745, fecha como @segundos) y, cuando la ruta sucesora se puede construir con los parámetros de la petición, Link con rel="successor-version"; no modifica el cuerpo ni el código de estado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from "@nestjs/common";
import { type Request, type Response } from "express";
import { type Observable } from "rxjs";

import {
  deprecationHeaderValue,
  fillSuccessorPath,
  readDeprecationRules,
  resolveDeprecation,
  type ResolvedDeprecation,
} from "@/common/presentation/utils/deprecation.util";

@Injectable()
export class DeprecationHeadersInterceptor implements NestInterceptor {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const request: Request = context.switchToHttp().getRequest<Request>();
    const response: Response = context.switchToHttp().getResponse<Response>();
    const routePath: unknown = (request.route as { path?: unknown } | undefined)?.path;
    const deprecation: ResolvedDeprecation | undefined = typeof routePath === "string"
      ? resolveDeprecation(readDeprecationRules(context.getHandler(), context.getClass()), routePath)
      : undefined;

    if (deprecation !== undefined) {
      response.setHeader("Deprecation", deprecationHeaderValue(deprecation.since));

      const successor: string | undefined = fillSuccessorPath(deprecation.successorTemplate, request.params as Record<string, string | undefined>);

      if (successor !== undefined) {
        response.setHeader("Link", `<${successor}>; rel="successor-version"`);
      }
    }

    return next.handle();
  }
}
