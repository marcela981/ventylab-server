/*
 * Funcionalidad: Decoradores DeprecatedRoute y DeprecatedAlias
 * Descripción: Marcan rutas heredadas (una ruta concreta o todas las rutas de un alias de controlador) con su ruta sucesora y registran el interceptor que agrega las cabeceras Deprecation y Link; la generación de OpenAPI lee los mismos metadatos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";

import { DeprecationHeadersInterceptor } from "@/common/presentation/interceptors/deprecation-headers.interceptor";
import {
  DEPRECATED_ROUTE_KEY,
  type DeprecatedAliasOptions,
  type DeprecatedRouteOptions,
  type DeprecationRule,
  LEGACY_ROUTES_DEPRECATED_AT,
  normalizeRoutePath,
} from "@/common/presentation/utils/deprecation.util";

export function DeprecatedRoute(options: DeprecatedRouteOptions): MethodDecorator {
  const rule: DeprecationRule = {
    kind: "route",
    successor: normalizeRoutePath(options.successor),
    successorMethod: options.successorMethod,
    successorParams: options.successorParams ?? {},
    since: options.since ?? LEGACY_ROUTES_DEPRECATED_AT,
  };

  return applyDecorators(SetMetadata(DEPRECATED_ROUTE_KEY, [rule]), UseInterceptors(DeprecationHeadersInterceptor));
}

export function DeprecatedAlias(options: DeprecatedAliasOptions): ClassDecorator {
  const rule: DeprecationRule = {
    kind: "alias",
    alias: normalizeRoutePath(options.alias),
    successor: normalizeRoutePath(options.successor),
    since: options.since ?? LEGACY_ROUTES_DEPRECATED_AT,
  };

  return applyDecorators(SetMetadata(DEPRECATED_ROUTE_KEY, [rule]), UseInterceptors(DeprecationHeadersInterceptor));
}
