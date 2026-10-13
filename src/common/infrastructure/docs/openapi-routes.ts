/*
 * Funcionalidad: Metadatos de rutas para OpenAPI
 * Descripción: Recorre los controladores registrados en el contenedor de Nest y describe cada operación (método, ruta OpenAPI y Express, guards, permisos de @RequirePermissions y @AllowSelfOr, límites de @Throttle y exclusiones de @SkipThrottle, respuesta sin envoltorio o por streaming, tipos producidos y regla de deprecación); también clasifica el acceso requerido (rol mínimo, permisos, esquema de seguridad) a partir de esos metadatos y del mapa rol → permisos que recibe
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplication, RequestMethod, type Type } from "@nestjs/common";
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA, RESPONSE_PASSTHROUGH_METADATA, ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { RouteParamtypes } from "@nestjs/common/enums/route-paramtypes.enum";
import { MetadataScanner, ModulesContainer } from "@nestjs/core";
import { DECORATORS } from "@nestjs/swagger";

import { RAW_RESPONSE_KEY } from "@/common/presentation/decorators/raw-response.decorator";
import { readDeprecationRules, resolveDeprecation, type ResolvedDeprecation } from "@/common/presentation/utils/deprecation.util";

// Metadata keys written by decorators of other layers; read by name so src/common stays independent of the features that define them.
const PERMISSIONS_METADATA: string = "permissions";
const SELF_OR_PERMISSIONS_METADATA: string = "selfOrPermissions";
const THROTTLER_LIMIT_METADATA_PREFIX: string = "THROTTLER:LIMIT";
const DEFAULT_THROTTLER_SKIP_METADATA: string = "THROTTLER:SKIPdefault";
const DEFAULT_THROTTLER_LIMIT_METADATA: string = "THROTTLER:LIMITdefault";

export const JWT_SECURITY_SCHEME: string = "JWT-auth";
export const BRIDGE_SECURITY_SCHEME: string = "NextAuth-bridge";

export const ANONYMOUS_ACCESS: string = "ANONYMOUS";
export const SERVER_ACCESS: string = "SERVER";

const JWT_GUARD: string = "JwtAuthGuard";
const OPTIONAL_JWT_GUARD: string = "OptionalJwtAuthGuard";
const PERMISSIONS_GUARD: string = "PermissionsGuard";
const SELF_OR_PERMISSION_GUARD: string = "SelfOrPermissionGuard";
const BRIDGE_GUARD: string = "NextAuthBridgeGuard";

export interface SelfOrPermissions {
  readonly paramKey: string;
  readonly permissions: readonly string[];
}

export interface RouteDescriptor {
  readonly key: string;
  readonly method: string;
  readonly openapiPath: string;
  readonly expressPath: string;
  readonly controllerName: string;
  readonly handlerName: string;
  readonly guards: readonly string[];
  readonly permissions: readonly string[];
  readonly selfOr?: SelfOrPermissions;
  readonly throttled: boolean;
  readonly throttleSkipped: boolean;
  readonly throttleLimit?: number;
  readonly rawResponse: boolean;
  readonly streamsResponse: boolean;
  readonly produces: readonly string[];
  readonly deprecation?: ResolvedDeprecation;
}

export interface RoleModel {
  readonly hierarchy: readonly string[];
  readonly permissions: Readonly<Record<string, readonly string[]>>;
}

export interface RouteAccess {
  readonly minRole: string;
  readonly permissions: readonly string[];
  readonly selfOr?: SelfOrPermissions;
  readonly security: Record<string, string[]>[];
  readonly authenticated: boolean;
  readonly permissionChecked: boolean;
  readonly summary: string;
}

type Handler = (...args: unknown[]) => unknown;

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry: unknown): entry is string => typeof entry === "string");
  }

  return typeof value === "string" ? [value] : [""];
}

function joinPath(...segments: string[]): string {
  const joined: string = `/${segments.join("/")}`.replace(/\/+/g, "/");

  return joined.length > 1 ? joined.replace(/\/$/, "") : joined;
}

function guardName(guard: unknown): string {
  if (typeof guard === "function") {
    return guard.name;
  }

  return (guard as { constructor?: { name?: string } } | undefined)?.constructor?.name ?? "UnknownGuard";
}

function readOverride<T>(key: string, handler: Handler, controller: Type): T | undefined {
  return (Reflect.getMetadata(key, handler) as T | undefined) ?? (Reflect.getMetadata(key, controller) as T | undefined);
}

function hasThrottle(target: object): boolean {
  return Reflect.getMetadataKeys(target).some((key: unknown): boolean => typeof key === "string" && key.startsWith(THROTTLER_LIMIT_METADATA_PREFIX));
}

function streamsResponse(controller: Type, handlerName: string): boolean {
  const args: Record<string, unknown> = (Reflect.getMetadata(ROUTE_ARGS_METADATA, controller, handlerName) as Record<string, unknown> | undefined) ?? {};
  const usesResponse: boolean = Object.keys(args).some((key: string): boolean => key.split(":")[0] === String(RouteParamtypes.RESPONSE));
  const passthrough: boolean = Reflect.getMetadata(RESPONSE_PASSTHROUGH_METADATA, controller, handlerName) === true;

  return usesResponse && !passthrough;
}

function describeController(controller: Type, scanner: MetadataScanner): RouteDescriptor[] {
  const controllerPaths: string[] = asArray(Reflect.getMetadata(PATH_METADATA, controller));
  const controllerGuards: unknown[] = (Reflect.getMetadata(GUARDS_METADATA, controller) as unknown[] | undefined) ?? [];
  const prototype: Record<string, unknown> = controller.prototype as Record<string, unknown>;
  const routes: RouteDescriptor[] = [];

  for (const handlerName of scanner.getAllMethodNames(prototype)) {
    const handler: Handler = prototype[handlerName] as Handler;
    const requestMethod: RequestMethod | undefined = Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined;
    const handlerPaths: unknown = Reflect.getMetadata(PATH_METADATA, handler);

    if (requestMethod === undefined || handlerPaths === undefined) {
      continue;
    }

    const method: string = RequestMethod[requestMethod].toLowerCase();
    const handlerGuards: unknown[] = (Reflect.getMetadata(GUARDS_METADATA, handler) as unknown[] | undefined) ?? [];
    const rawResponse: boolean = readOverride<boolean>(RAW_RESPONSE_KEY, handler, controller) === true;
    const produces: string[] = readOverride<string[]>(DECORATORS.API_PRODUCES, handler, controller) ?? [];

    for (const controllerPath of controllerPaths) {
      for (const handlerPath of asArray(handlerPaths)) {
        const expressPath: string = joinPath(controllerPath, handlerPath);
        const openapiPath: string = expressPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");

        routes.push({
          key: `${method} ${openapiPath}`,
          method,
          openapiPath,
          expressPath,
          controllerName: controller.name,
          handlerName,
          guards: [...controllerGuards, ...handlerGuards].map(guardName),
          permissions: readOverride<string[]>(PERMISSIONS_METADATA, handler, controller) ?? [],
          selfOr: readOverride<SelfOrPermissions>(SELF_OR_PERMISSIONS_METADATA, handler, controller),
          throttled: hasThrottle(handler) || hasThrottle(controller),
          throttleSkipped: readOverride<boolean>(DEFAULT_THROTTLER_SKIP_METADATA, handler, controller) === true,
          throttleLimit: readOverride<number>(DEFAULT_THROTTLER_LIMIT_METADATA, handler, controller),
          rawResponse,
          streamsResponse: streamsResponse(controller, handlerName),
          produces,
          deprecation: resolveDeprecation(readDeprecationRules(handler, controller), expressPath),
        });
      }
    }
  }

  return routes;
}

export function collectRoutes(app: INestApplication): RouteDescriptor[] {
  const modules: ModulesContainer = app.get(ModulesContainer);
  const scanner: MetadataScanner = new MetadataScanner();
  const seen: Set<Type> = new Set<Type>();
  const routes: RouteDescriptor[] = [];

  for (const module of modules.values()) {
    for (const wrapper of module.controllers.values()) {
      const controller: Type | undefined = wrapper.metatype as Type | undefined;

      if (controller === undefined || seen.has(controller)) {
        continue;
      }

      seen.add(controller);
      routes.push(...describeController(controller, scanner));
    }
  }

  return routes;
}

function lowestRoleHolding(permissions: readonly string[], roles: RoleModel): string {
  const role: string | undefined = roles.hierarchy.find((candidate: string): boolean => {
    const granted: readonly string[] = roles.permissions[candidate] ?? [];

    return permissions.every((permission: string): boolean => granted.includes(permission));
  });

  if (role === undefined) {
    throw new Error(`No role holds every permission of [${permissions.join(", ")}]`);
  }

  return role;
}

function codeList(values: readonly string[]): string {
  return values.map((value: string): string => `\`${value}\``).join(", ");
}

export function classifyAccess(route: RouteDescriptor, roles: RoleModel): RouteAccess {
  const guards: readonly string[] = route.guards;

  if (guards.includes(BRIDGE_GUARD)) {
    return {
      minRole: SERVER_ACCESS,
      permissions: [],
      security: [{ [BRIDGE_SECURITY_SCHEME]: [] }],
      authenticated: true,
      permissionChecked: false,
      summary: "server-to-server only: the `x-nextauth-bridge-secret` header must carry the bridge secret; user tokens are rejected",
    };
  }

  if (!guards.includes(JWT_GUARD)) {
    const optional: boolean = guards.includes(OPTIONAL_JWT_GUARD);

    return {
      minRole: ANONYMOUS_ACCESS,
      permissions: [],
      security: optional ? [{}, { [JWT_SECURITY_SCHEME]: [] }] : [],
      authenticated: false,
      permissionChecked: false,
      summary: optional ? "public; an optional bearer token identifies the caller and may widen what is returned" : "public",
    };
  }

  const permissions: readonly string[] = guards.includes(PERMISSIONS_GUARD) ? route.permissions : [];
  const selfOr: SelfOrPermissions | undefined = guards.includes(SELF_OR_PERMISSION_GUARD) ? route.selfOr : undefined;
  const minRole: string = lowestRoleHolding(permissions, roles);
  const parts: string[] = [permissions.length > 0 ? `bearer token holding ${codeList(permissions)}` : "any authenticated user (bearer token)"];

  if (selfOr !== undefined) {
    parts.push(`and the caller must be the user in the \`${selfOr.paramKey}\` route parameter or hold ${codeList(selfOr.permissions)}`);
  }

  return {
    minRole,
    permissions,
    selfOr,
    security: [{ [JWT_SECURITY_SCHEME]: [] }],
    authenticated: true,
    permissionChecked: permissions.length > 0 || selfOr !== undefined,
    summary: `${parts.join(" ")}; minimum role ${minRole}`,
  };
}
