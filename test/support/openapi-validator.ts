/*
 * Funcionalidad: Validación de respuestas contra el contrato OpenAPI
 * Descripción: Carga openapi/openapi.json, ubica la operación de una petición (método y ruta concreta o plantilla, prefiriendo los segmentos literales), exige que el código de estado esté documentado y valida el cuerpo JSON con Ajv (dialecto JSON Schema 2020-12 de OpenAPI 3.1, formatos de ajv-formats) contra el esquema de esa respuesta; devuelve los errores legibles o los lanza con expectMatchesSpec
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";

type JsonObject = Record<string, unknown>;

export interface ContractResponse {
  readonly status: number;
  readonly body: unknown;
  readonly contentType?: string;
}

interface PathTemplate {
  readonly template: string;
  readonly pattern: RegExp;
  readonly literalSegments: number;
}

const DOCUMENT_ID: string = "openapi.json";
const DOCUMENT_PATH: string = resolve(__dirname, "..", "..", "openapi", "openapi.json");
const JSON_MEDIA_TYPE: string = "application/json";

let cachedDocument: JsonObject | undefined;
let cachedAjv: Ajv2020 | undefined;
let cachedTemplates: PathTemplate[] | undefined;
const validators: Map<string, ValidateFunction> = new Map<string, ValidateFunction>();

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadOpenAPIDocument(): JsonObject {
  cachedDocument ??= JSON.parse(readFileSync(DOCUMENT_PATH, "utf-8")) as JsonObject;

  return cachedDocument;
}

function ajv(): Ajv2020 {
  if (cachedAjv === undefined) {
    // OpenAPI keywords that are not JSON Schema (example, x-*) and non-schema parts of the document must not fail compilation.
    const instance: Ajv2020 = new Ajv2020({ strict: false, validateSchema: false, allErrors: true });

    addFormats(instance);
    instance.addFormat("binary", true);
    instance.addSchema(loadOpenAPIDocument(), DOCUMENT_ID);
    cachedAjv = instance;
  }

  return cachedAjv;
}

function templates(): PathTemplate[] {
  if (cachedTemplates === undefined) {
    const paths: JsonObject = loadOpenAPIDocument().paths as JsonObject;

    cachedTemplates = Object.keys(paths).map((template: string): PathTemplate => {
      const source: string = template.split("/").map((segment: string): string => (/^\{[^}]+\}$/.test(segment) ? "[^/]+" : segment.replace(/[.*+?^$()|[\]\\]/g, "\\$&"))).join("/");

      return { template, pattern: new RegExp(`^${source}$`), literalSegments: template.split("/").filter((segment: string): boolean => segment.length > 0 && !segment.startsWith("{")).length };
    });
  }

  return cachedTemplates;
}

export function resolveOperationPath(path: string): string | undefined {
  const withoutQuery: string = path.split("?")[0].replace(/:([A-Za-z0-9_]+)/g, "{$1}");
  const exact: PathTemplate | undefined = templates().find((candidate: PathTemplate): boolean => candidate.template === withoutQuery);

  if (exact !== undefined) {
    return exact.template;
  }

  const matches: PathTemplate[] = templates().filter((candidate: PathTemplate): boolean => candidate.pattern.test(withoutQuery));

  matches.sort((left: PathTemplate, right: PathTemplate): number => right.literalSegments - left.literalSegments);

  return matches[0]?.template;
}

function escapePointer(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

function formatErrors(errors: readonly ErrorObject[]): string[] {
  return errors.slice(0, 10).map((error: ErrorObject): string => `${error.instancePath || "(body)"} ${error.message ?? "is invalid"}${error.params ? ` ${JSON.stringify(error.params)}` : ""}`);
}

// Returns the contract violations of one response; an empty list means the response matches the documented schema.
export function contractViolations(response: ContractResponse, method: string, path: string): string[] {
  const label: string = `${method.toUpperCase()} ${path} -> ${response.status}`;
  const template: string | undefined = resolveOperationPath(path);

  if (template === undefined) {
    return [`${label}: no documented path`];
  }

  const operation: unknown = (loadOpenAPIDocument().paths as JsonObject)[template] && ((loadOpenAPIDocument().paths as JsonObject)[template] as JsonObject)[method.toLowerCase()];

  if (!isObject(operation) || !isObject(operation.responses)) {
    return [`${label}: no documented operation for ${method.toUpperCase()} ${template}`];
  }

  const status: string = String(response.status);
  const documented: unknown = operation.responses[status];

  if (!isObject(documented)) {
    return [`${label}: status ${status} is not documented for ${method.toUpperCase()} ${template} (documented: ${Object.keys(operation.responses).join(", ")})`];
  }

  const media: unknown = isObject(documented.content) ? documented.content[JSON_MEDIA_TYPE] : undefined;

  if (response.contentType !== undefined && !response.contentType.includes(JSON_MEDIA_TYPE)) {
    return [];
  }

  if (!isObject(media) || media.schema === undefined) {
    return response.body === undefined || response.body === "" || (isObject(response.body) && Object.keys(response.body).length === 0)
      ? []
      : [`${label}: a JSON body was returned but ${method.toUpperCase()} ${template} documents no JSON schema for ${status}`];
  }

  const key: string = `${method.toLowerCase()} ${template} ${status}`;
  let validate: ValidateFunction | undefined = validators.get(key);

  if (validate === undefined) {
    const pointer: string = ["paths", template, method.toLowerCase(), "responses", status, "content", JSON_MEDIA_TYPE, "schema"].map(escapePointer).join("/");

    validate = ajv().compile({ $ref: `${DOCUMENT_ID}#/${pointer}` });
    validators.set(key, validate);
  }

  return validate(response.body) ? [] : formatErrors(validate.errors ?? []).map((message: string): string => `${label} (${template}): ${message}`);
}

export function expectMatchesSpec(response: { status: number; body: unknown; headers?: Record<string, string | string[] | undefined> }, method: string, path: string): void {
  const contentTypeHeader: string | string[] | undefined = response.headers?.["content-type"];
  const contentType: string | undefined = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
  const violations: string[] = contractViolations({ status: response.status, body: response.body, contentType }, method, path);

  if (violations.length > 0) {
    throw new Error(`Response does not match openapi/openapi.json:\n${violations.join("\n")}`);
  }
}
