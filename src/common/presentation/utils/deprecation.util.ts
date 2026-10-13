/*
 * Funcionalidad: Reglas de rutas heredadas
 * Descripción: Tipos de las reglas de deprecación (ruta concreta o alias de controlador), lectura de los metadatos de DeprecatedRoute/DeprecatedAlias, resolución de la ruta sucesora a partir de la ruta Express registrada, valor de la cabecera Deprecation (RFC 9745) y llenado de los parámetros de la ruta sucesora
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const DEPRECATED_ROUTE_KEY: string = "deprecatedRoute";

// RFC 9745 date (structured field) shared by every legacy route marked in the same review.
export const LEGACY_ROUTES_DEPRECATED_AT: string = "2026-10-12T00:00:00Z";

export interface DeprecatedRouteOptions {
  readonly successor: string;
  readonly successorMethod?: string;
  readonly successorParams?: Readonly<Record<string, string>>;
  readonly since?: string;
}

export interface DeprecatedAliasOptions {
  readonly alias: string;
  readonly successor: string;
  readonly since?: string;
}

export type DeprecationRule =
  | { readonly kind: "route"; readonly successor: string; readonly successorMethod?: string; readonly successorParams: Readonly<Record<string, string>>; readonly since: string }
  | { readonly kind: "alias"; readonly alias: string; readonly successor: string; readonly since: string };

export interface ResolvedDeprecation {
  readonly since: string;
  readonly successorPath: string;
  readonly successorTemplate: string;
  readonly successorMethod?: string;
}

export function normalizeRoutePath(path: string): string {
  const trimmed: string = path.replace(/\/+/g, "/").replace(/\/$/, "");

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function readDeprecationRules(handler: object, controller: object): DeprecationRule[] {
  const handlerRules: DeprecationRule[] = (Reflect.getMetadata(DEPRECATED_ROUTE_KEY, handler) as DeprecationRule[] | undefined) ?? [];
  const controllerRules: DeprecationRule[] = (Reflect.getMetadata(DEPRECATED_ROUTE_KEY, controller) as DeprecationRule[] | undefined) ?? [];

  return [...handlerRules, ...controllerRules];
}

// routePath is the registered Express pattern (for example "/api/items/:id"); successorPath keeps the successor's own parameter names and successorTemplate renames them to routePath's names so the request parameters fill it.
export function resolveDeprecation(rules: readonly DeprecationRule[], routePath: string): ResolvedDeprecation | undefined {
  const path: string = normalizeRoutePath(routePath);

  for (const rule of rules) {
    if (rule.kind === "route") {
      const successorTemplate: string = rule.successor.replace(/:([A-Za-z0-9_]+)/g, (placeholder: string, name: string): string => {
        const legacyName: string | undefined = rule.successorParams[name];

        return legacyName === undefined ? placeholder : `:${legacyName}`;
      });

      return { since: rule.since, successorPath: rule.successor, successorTemplate, successorMethod: rule.successorMethod };
    }

    if (path === rule.alias || path.startsWith(`${rule.alias}/`)) {
      const successorPath: string = `${rule.successor}${path.slice(rule.alias.length)}`;

      return { since: rule.since, successorPath, successorTemplate: successorPath };
    }
  }

  return undefined;
}

export function deprecationHeaderValue(since: string): string {
  return `@${Math.floor(Date.parse(since) / 1000)}`;
}

// Returns undefined when a placeholder cannot be filled from the request parameters (the successor needs an identifier the legacy route does not carry).
export function fillSuccessorPath(template: string, params: Readonly<Record<string, string | undefined>>): string | undefined {
  let unresolved: boolean = false;

  const filled: string = template.replace(/:([A-Za-z0-9_]+)/g, (_placeholder: string, name: string): string => {
    const value: string | undefined = params[name];

    if (value === undefined) {
      unresolved = true;

      return "";
    }

    return encodeURIComponent(value);
  });

  return unresolved ? undefined : filled;
}
