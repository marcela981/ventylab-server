/*
 * Funcionalidad: Servicio RequestContextService
 * Descripción: Guarda el contexto de cada petición (método, ruta, traceId, agente) en AsyncLocalStorage
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AsyncLocalStorage } from "async_hooks";

import { Injectable } from "@nestjs/common";

export interface RequestAgentInfo {
  readonly ip?: string;
  readonly userAgent?: string;
  readonly referer?: string;
  readonly origin?: string;
  readonly acceptLanguage?: string;
}

export interface RequestContext {
  readonly method: string;
  readonly path: string;
  readonly traceId: string;
  readonly agent: RequestAgentInfo;
}

@Injectable()
export class RequestContextService {
  private readonly _storage: AsyncLocalStorage<RequestContext> = new AsyncLocalStorage();

  public run(context: RequestContext, callback: () => void): void {
    this._storage.run(context, callback);
  }

  public get(): RequestContext | undefined {
    return this._storage.getStore();
  }
}
