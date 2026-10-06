/*
 * Funcionalidad: Middleware TraceIdMiddleware
 * Descripción: Reutiliza x-trace-id o x-request-id entrantes o genera un identificador nuevo, lo asigna a la petición y lo devuelve en ambas cabeceras
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

import { generateId } from "@/common/domain/utils/generate-id";
import { REQUEST_ID_HEADER, TRACE_ID_HEADER } from "@/common/infrastructure/config/cors-origins";

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    const traceId: string =
      TraceIdMiddleware._readHeader(req, TRACE_ID_HEADER) ??
      TraceIdMiddleware._readHeader(req, REQUEST_ID_HEADER) ??
      generateId();

    req.traceId = traceId;

    res.setHeader(TRACE_ID_HEADER, traceId);
    res.setHeader(REQUEST_ID_HEADER, traceId);

    next();
  }

  private static _readHeader(req: Request, name: string): string | undefined {
    const value: string | string[] | undefined = req.headers[name];

    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
  }
}
