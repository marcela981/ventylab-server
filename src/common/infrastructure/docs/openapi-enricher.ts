/*
 * Funcionalidad: Completado del documento OpenAPI
 * Descripción: Completa cada operación que genera @nestjs/swagger con los metadatos de su ruta: envoltorio APIResponse en las respuestas 2xx JSON (data con el esquema documentado o null), contenido de las respuestas por streaming y CSV, respuestas de error estándar con el componente ErrorResponse (cuyo data documenta el detalle por campo errors con el componente FieldError, con ejemplo en la respuesta 400; 400, 401, 403, 404, 429 y 500 según cuerpo, parámetros, guards y limitación de peticiones (todas las rutas salvo las excluidas con @SkipThrottle)), acceso requerido (x-min-role, x-required-permissions, x-self-or-permissions, seguridad y una línea en la descripción), deprecación con su ruta sucesora y operationId únicos. v1.3: ya no añade el esquema de seguridad del puente de NextAuth retirado
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  classifyAccess,
  type RoleModel,
  type RouteAccess,
  type RouteDescriptor,
} from "@/common/infrastructure/docs/openapi-routes";

type JsonObject = Record<string, unknown>;

export const ERROR_RESPONSE_SCHEMA: string = "ErrorResponse";
export const SUCCESS_ENVELOPE_SCHEMA: string = "APIResponseEnvelope";
export const PAGINATION_SCHEMA: string = "APIPagination";
export const FIELD_ERROR_SCHEMA: string = "FieldError";

const HTTP_METHODS: readonly string[] = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

const JSON_MEDIA_TYPE: string = "application/json";

const EXAMPLE_TIMESTAMP: string = "2026-10-12T10:00:00.000Z";
const EXAMPLE_TRACE_ID: string = "0192f1c4-7a3e-7c1d-9b2a-5d4e3f2a1b0c";

interface StandardError {
  readonly description: string;
  readonly example: string;
  readonly code: string;
  readonly message: string | string[];
  readonly data?: JsonObject;
}

const STANDARD_ERRORS: Readonly<Record<string, StandardError>> = {
  400: {
    description: "Validation error or malformed request",
    example: "ValidationError",
    code: "validation_error",
    message: ["name must be a string"],
    data: { errors: [{ field: "name", message: "name must be a string" }, { field: "items[0].quantity", message: "quantity must be an integer" }] },
  },
  401: { description: "Missing, invalid or expired credentials", example: "UnauthorizedError", code: "auth.unauthorized", message: "Unauthorized" },
  403: { description: "The caller lacks the required permission or is not allowed to act on this resource", example: "ForbiddenError", code: "auth.forbidden", message: "Forbidden" },
  404: { description: "The resource does not exist or is not visible to the caller", example: "NotFoundError", code: "common.not_found", message: "Resource not found" },
  409: { description: "The request conflicts with the current state of the resource", example: "ConflictError", code: "common.conflict", message: "Conflict" },
  422: { description: "The request is well-formed but violates a business rule; errors with a field detail add it to data.errors", example: "UnprocessableError", code: "ai-ratings.invalid_score", message: "The rating must be an integer between 1 and 5" },
  429: { description: "Too many requests (rate limit or quota); retry after the time given by the Retry-After header when present", example: "TooManyRequestsError", code: "common.too_many_requests", message: "Too many requests, please try again later" },
  500: { description: "Unexpected server error", example: "InternalServerError", code: "internal_server_error", message: "Internal server error" },
  503: { description: "A required dependency or configuration is not available", example: "ServiceUnavailableError", code: "unknown_error", message: "Service unavailable" },
};

const ERROR_FALLBACK: StandardError = { description: "Error", example: "GenericError", code: "unknown_error", message: "Error" };

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ref(schema: string): JsonObject {
  return { $ref: `#/components/schemas/${schema}` };
}

function errorExample(error: StandardError): JsonObject {
  return { success: false, message: error.message, data: error.data ?? null, code: error.code, timestamp: EXAMPLE_TIMESTAMP, traceId: EXAMPLE_TRACE_ID, pagination: null };
}

function standardError(status: string): StandardError {
  return STANDARD_ERRORS[status] ?? ERROR_FALLBACK;
}

export function buildErrorExamples(): Record<string, JsonObject> {
  return Object.fromEntries([...Object.values(STANDARD_ERRORS), ERROR_FALLBACK].map((error: StandardError): [string, JsonObject] => [
    error.example,
    { summary: error.description, value: errorExample(error) },
  ]));
}

export function buildEnvelopeSchemas(): Record<string, JsonObject> {
  const message: JsonObject = { anyOf: [{ type: "string" }, { type: "array", items: { type: "string" } }, { type: "null" }], description: "Translated message (an array of messages for validation errors)" };
  const envelopeKeys: string[] = ["success", "message", "data", "code", "timestamp", "traceId", "pagination"];

  return {
    [SUCCESS_ENVELOPE_SCHEMA]: {
      type: "object",
      description: "Envelope of every JSON response of the API; operations narrow `data`",
      required: envelopeKeys,
      properties: {
        success: { type: "boolean", description: "True for successful responses", example: true },
        message: { ...message, example: "Resource retrieved successfully" },
        data: { description: "Operation payload; null for commands" },
        code: { type: ["string", "null"], description: "Machine-readable code (null on success)", example: null },
        timestamp: { type: "string", format: "date-time", description: "Server time of the response", example: EXAMPLE_TIMESTAMP },
        traceId: { type: ["string", "null"], description: "Request trace ID (also in the x-trace-id header)", example: null },
        pagination: { anyOf: [ref(PAGINATION_SCHEMA), { type: "null" }], description: "Pagination of list responses; null otherwise" },
      },
    },
    [FIELD_ERROR_SCHEMA]: {
      type: "object",
      description: "Error of one field: the request body path (nested objects with dots, array items with [index]) or, for platform settings, the setting key followed by the path inside its value",
      required: ["field", "message"],
      properties: {
        field: { type: "string", description: "Path of the failing field", example: "items[0].quantity" },
        message: { type: "string", description: "Translated message of the field error", example: "quantity must be an integer" },
      },
    },
    [ERROR_RESPONSE_SCHEMA]: {
      type: "object",
      description: "Error envelope produced by the global exception filter",
      required: envelopeKeys,
      properties: {
        success: { type: "boolean", enum: [false], description: "Always false for errors", example: false },
        message: { ...message, example: "Resource not found" },
        data: {
          description:
            "Structured details some errors return so the client can act (for example conflicting records); validation errors and errors with a field detail carry `errors`; null otherwise",
          anyOf: [
            {
              type: "object",
              properties: { errors: { type: "array", items: ref(FIELD_ERROR_SCHEMA), description: "One entry per failing field, with its translated message" } },
              additionalProperties: true,
            },
            { type: "null" },
          ],
          example: null,
        },
        code: { type: "string", description: "Error code: the domain error i18n key, validation_error, or a code derived from the HTTP status", example: "common.not_found" },
        timestamp: { type: "string", format: "date-time", description: "Server time of the response", example: EXAMPLE_TIMESTAMP },
        traceId: { type: ["string", "null"], description: "Request trace ID to correlate the error with the server logs", example: EXAMPLE_TRACE_ID },
        pagination: { type: "null", description: "Always null for errors", example: null },
      },
      example: errorExample(standardError("404")),
    },
  };
}

function wrapInEnvelope(data: unknown): JsonObject {
  return {
    allOf: [
      ref(SUCCESS_ENVELOPE_SCHEMA),
      { type: "object", required: ["data"], properties: { data: isObject(data) ? data : { type: "null" } } },
    ],
  };
}

function jsonSchemaOf(response: JsonObject): unknown {
  const content: unknown = response.content;

  if (!isObject(content)) {
    return undefined;
  }

  const media: unknown = content[JSON_MEDIA_TYPE] ?? Object.values(content)[0];

  return isObject(media) ? media.schema : undefined;
}

function completeSuccessResponse(status: string, response: JsonObject, route: RouteDescriptor): void {
  if (status === "204") {
    delete response.content;

    return;
  }

  if (route.streamsResponse) {
    const mediaTypes: readonly string[] = route.produces.length > 0 ? route.produces : ["application/octet-stream"];
    const content: JsonObject = isObject(response.content) ? response.content : {};

    response.content = Object.fromEntries(mediaTypes.map((mediaType: string): [string, unknown] => {
      const existing: unknown = content[mediaType];
      const description: string = mediaType === "text/event-stream" ? "Server-sent event stream; the operation description lists its events" : `${mediaType} file`;

      return [mediaType, isObject(existing) && existing.schema !== undefined ? existing : { schema: { type: "string", description } }];
    }));

    return;
  }

  if (route.rawResponse) {
    if (jsonSchemaOf(response) === undefined) {
      throw new Error(`${route.key} returns an unwrapped body but documents no response type`);
    }

    return;
  }

  response.content = { [JSON_MEDIA_TYPE]: { schema: wrapInEnvelope(jsonSchemaOf(response)) } };
}

function completeErrorResponse(status: string, response: JsonObject): void {
  if (jsonSchemaOf(response) !== undefined) {
    return;
  }

  const example: string = standardError(status).example;

  response.content = { [JSON_MEDIA_TYPE]: { schema: ref(ERROR_RESPONSE_SCHEMA), examples: { [example]: { $ref: `#/components/examples/${example}` } } } };
}

function hasParameters(operation: JsonObject, location: string): boolean {
  const parameters: unknown = operation.parameters;

  return Array.isArray(parameters) && parameters.some((parameter: unknown): boolean => isObject(parameter) && parameter.in === location);
}

function standardErrorStatuses(operation: JsonObject, route: RouteDescriptor, access: RouteAccess): string[] {
  const statuses: string[] = ["500"];

  if (operation.requestBody !== undefined || hasParameters(operation, "query") || hasParameters(operation, "path")) {
    statuses.push("400");
  }

  if (access.authenticated) {
    statuses.push("401");
  }

  if (access.permissionChecked) {
    statuses.push("403");
  }

  if (hasParameters(operation, "path")) {
    statuses.push("404");
  }

  // ThrottlerGuard is global, so every route that does not opt out with @SkipThrottle can answer 429.
  if (route.throttled || !route.throttleSkipped) {
    statuses.push("429");
  }

  return statuses;
}

function appendDescription(operation: JsonObject, line: string): void {
  const current: string = typeof operation.description === "string" ? operation.description.trim() : "";

  operation.description = current.length > 0 ? `${current}\n\n${line}` : line;
}

function enrichOperation(operation: JsonObject, route: RouteDescriptor, roles: RoleModel): void {
  const access: RouteAccess = classifyAccess(route, roles);
  const responses: JsonObject = isObject(operation.responses) ? operation.responses : {};

  operation.responses = responses;

  for (const status of standardErrorStatuses(operation, route, access)) {
    if (responses[status] === undefined) {
      responses[status] = { description: standardError(status).description };
    }
  }

  for (const [status, response] of Object.entries(responses)) {
    if (!isObject(response)) {
      continue;
    }

    if (status.startsWith("2")) {
      completeSuccessResponse(status, response, route);
    } else if (/^[45]/.test(status)) {
      completeErrorResponse(status, response);
    }
  }

  operation.security = access.security;
  operation["x-min-role"] = access.minRole;
  operation["x-required-permissions"] = [...access.permissions];

  if (access.selfOr !== undefined) {
    operation["x-self-or-permissions"] = { param: access.selfOr.paramKey, permissions: [...access.selfOr.permissions] };
  }

  appendDescription(operation, `**Required access:** ${access.summary}.`);

  if (route.deprecation !== undefined) {
    const successor: string = route.deprecation.successorPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
    const successorMethod: string = (route.deprecation.successorMethod ?? route.method).toUpperCase();

    operation.deprecated = true;
    operation["x-successor"] = `${successorMethod} ${successor}`;
    appendDescription(operation, `**Deprecated:** use \`${successorMethod} ${successor}\`. Responses carry the \`Deprecation\` header (RFC 9745) and, when the successor URL can be built from this request, \`Link: <successor>; rel="successor-version"\`.`);
  }
}

function lowerFirst(value: string): string {
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
}

function upperFirst(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

// @nestjs/swagger suffixes aliased paths with "[n]" and reuses method names across controllers; both break client generators.
function normalizeOperationIds(entries: readonly { operation: JsonObject; route: RouteDescriptor }[]): void {
  for (const { operation, route } of entries) {
    const id: string = typeof operation.operationId === "string" ? operation.operationId : route.handlerName;
    const match: RegExpExecArray | null = /^(.*)\[(\d+)\]$/.exec(id);

    operation.operationId = match === null ? id : Number(match[2]) === 0 ? match[1] : `${match[1]}Alias${match[2]}`;
  }

  const counts: Map<string, number> = new Map<string, number>();

  for (const { operation } of entries) {
    counts.set(operation.operationId as string, (counts.get(operation.operationId as string) ?? 0) + 1);
  }

  for (const { operation, route } of entries) {
    const id: string = operation.operationId as string;

    if ((counts.get(id) ?? 0) > 1) {
      operation.operationId = `${lowerFirst(route.controllerName.replace(/Controller$/, ""))}${upperFirst(id)}`;
    }
  }
}

export function enrichOpenAPIDocument(document: JsonObject, routes: readonly RouteDescriptor[], roles: RoleModel): JsonObject {
  const byKey: Map<string, RouteDescriptor> = new Map<string, RouteDescriptor>(routes.map((route: RouteDescriptor): [string, RouteDescriptor] => [route.key, route]));
  const paths: JsonObject = isObject(document.paths) ? document.paths : {};
  const entries: { operation: JsonObject; route: RouteDescriptor }[] = [];

  for (const [path, item] of Object.entries(paths)) {
    if (!isObject(item)) {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation: unknown = item[method];

      if (!isObject(operation)) {
        continue;
      }

      const route: RouteDescriptor | undefined = byKey.get(`${method} ${path}`);

      if (route === undefined) {
        throw new Error(`No route metadata for ${method.toUpperCase()} ${path}`);
      }

      enrichOperation(operation, route, roles);
      entries.push({ operation, route });
    }
  }

  normalizeOperationIds(entries);

  const components: JsonObject = isObject(document.components) ? document.components : {};
  const schemas: JsonObject = isObject(components.schemas) ? components.schemas : {};
  const examples: JsonObject = isObject(components.examples) ? components.examples : {};

  document.components = {
    ...components,
    schemas: { ...schemas, ...buildEnvelopeSchemas() },
    examples: { ...examples, ...buildErrorExamples() },
  };

  return document;
}
