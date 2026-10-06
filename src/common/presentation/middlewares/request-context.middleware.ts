/*
 * Funcionalidad: Middleware RequestContextMiddleware
 * Descripción: Inicializa el contexto de la petición en RequestContextService para el resto del ciclo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

import {
  RequestContext,
  RequestContextService,
} from "@/common/infrastructure/context/request-context.service";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  public constructor(private readonly _requestContextService: RequestContextService) {}

  public use(req: Request, res: Response, next: NextFunction): void {
    const context: RequestContext = {
      method: req.method,
      path: req.path,
      traceId: req.traceId,
      agent: {
        ip: req.ip,
        userAgent: req.get("user-agent"),
        referer: req.get("referer"),
        origin: req.get("origin"),
        acceptLanguage: req.get("accept-language"),
      },
    };

    this._requestContextService.run(context, next);
  }
}
