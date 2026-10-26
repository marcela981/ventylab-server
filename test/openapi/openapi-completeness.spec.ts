/*
 * Funcionalidad: Prueba de completitud del contrato OpenAPI
 * Descripción: Lee openapi/openapi.json y falla si el documento no es OpenAPI 3.1 sin nullable, si alguna operación no tiene respuesta 2xx con contenido (salvo 204), seguridad cuando está protegida, x-min-role, x-required-permissions, respuestas de error con ErrorResponse (500 siempre, 401 si autentica, 403 si exige permisos) u operationId único; además contrasta x-min-role con la matriz de autorización e2e (misma cantidad de operaciones y el rol mínimo que la matriz observa, salvo divergencias explicadas por reglas del caso de uso) y verifica que ningún DTO comparta nombre de esquema con otro
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { type Actor, type ActorOutcomes, AUTHORIZATION_MATRIX } from "../e2e/authorization/authorization-matrix";

type JsonObject = Record<string, unknown>;

interface OperationEntry {
  readonly key: string;
  readonly operation: JsonObject;
}

const REPO_ROOT: string = resolve(__dirname, "..", "..");
const DOCUMENT: JsonObject = JSON.parse(readFileSync(join(REPO_ROOT, "openapi", "openapi.json"), "utf-8")) as JsonObject;
const HTTP_METHODS: readonly string[] = ["get", "put", "post", "delete", "patch", "options", "head", "trace"];
const ACCESS_LEVELS: readonly string[] = ["ANONYMOUS", "STUDENT", "TEACHER", "ADMIN"];
const ERROR_RESPONSE_REF: string = "#/components/schemas/ErrorResponse";

// Routes where the guards admit a lower role than the matrix observes, because the use case or the self-or rule adds a check the random fixture cannot satisfy.
const MATRIX_DIVERGENCES: Readonly<Record<string, string>> = {
  "GET /api/analytics/students/:userId/timeline": "a teacher only sees STUDENT members of their groups (use case)",
  "GET /api/teachers/:id/students": "a teacher passes only for their own ID (self-or rule)",
  "GET /api/teachers/:teacherId/students/:studentId/progress": "a teacher passes only for their own ID (self-or rule)",
};

const MATRIX_ACTOR_ROLES: readonly [Actor, string][] = [["anonymous", "ANONYMOUS"], ["student", "STUDENT"], ["teacher", "TEACHER"], ["admin", "ADMIN"]];

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function operations(): OperationEntry[] {
  const entries: OperationEntry[] = [];

  for (const [path, item] of Object.entries(DOCUMENT.paths as JsonObject)) {
    for (const method of HTTP_METHODS) {
      const operation: unknown = (item as JsonObject)[method];

      if (isObject(operation)) {
        entries.push({ key: `${method.toUpperCase()} ${path}`, operation });
      }
    }
  }

  return entries;
}

function responses(operation: JsonObject): Record<string, JsonObject> {
  return (operation.responses ?? {}) as Record<string, JsonObject>;
}

function schemaOf(response: JsonObject): unknown {
  const content: unknown = response.content;

  if (!isObject(content)) {
    return undefined;
  }

  const media: unknown = Object.values(content)[0];

  return isObject(media) ? media.schema : undefined;
}

function isEnveloped(operation: JsonObject): boolean {
  return Object.entries(responses(operation)).some(([status, response]: [string, JsonObject]): boolean => status.startsWith("2") && JSON.stringify(schemaOf(response) ?? {}).includes("APIResponseEnvelope"));
}

function violations(check: (entry: OperationEntry) => string | undefined): string[] {
  return operations().map(check).filter((message: string | undefined): message is string => message !== undefined);
}

function toMatrixKey(key: string): string {
  return key.replace(/\{([^}]+)\}/g, ":$1");
}

function expectedMinRole(outcomes: ActorOutcomes): string | undefined {
  return MATRIX_ACTOR_ROLES.find(([actor]: [Actor, string]): boolean => outcomes[actor] === "allow")?.[1];
}

function listDtoFiles(folder: string): string[] {
  return readdirSync(folder).flatMap((name: string): string[] => {
    const path: string = join(folder, name);

    if (statSync(path).isDirectory()) {
      return listDtoFiles(path);
    }

    return /[\\/]dtos[\\/][^\\/]+\.dto\.ts$/.test(path) ? [path] : [];
  });
}

describe("OpenAPI contract completeness", () => {
  it("should be an OpenAPI 3.1 document without OpenAPI 3.0 nullable keywords", () => {
    expect(DOCUMENT.openapi).toBe("3.1.0");
    expect(JSON.stringify(DOCUMENT)).not.toContain("\"nullable\"");
  });

  it("should give every operation a 2xx response with content (except 204)", () => {
    expect(violations(({ key, operation }: OperationEntry): string | undefined => {
      const success: [string, JsonObject][] = Object.entries(responses(operation)).filter(([status]: [string, JsonObject]): boolean => status.startsWith("2"));

      if (success.length === 0) {
        return `${key}: no 2xx response`;
      }

      const missing: string[] = success.filter(([status, response]: [string, JsonObject]): boolean => status !== "204" && schemaOf(response) === undefined).map(([status]: [string, JsonObject]): string => status);

      return missing.length > 0 ? `${key}: ${missing.join(", ")} without a content schema` : undefined;
    })).toEqual([]);
  });

  it("should declare the required access of every operation", () => {
    expect(violations(({ key, operation }: OperationEntry): string | undefined => {
      const minRole: unknown = operation["x-min-role"];
      const permissions: unknown = operation["x-required-permissions"];
      const security: unknown = operation.security;
      const description: unknown = operation.description;

      if (typeof minRole !== "string" || !ACCESS_LEVELS.includes(minRole)) {
        return `${key}: x-min-role missing or invalid (${String(minRole)})`;
      }

      if (!Array.isArray(permissions)) {
        return `${key}: x-required-permissions missing`;
      }

      if (typeof description !== "string" || !description.includes("**Required access:**")) {
        return `${key}: description lacks the required access line`;
      }

      const guarded: boolean = minRole !== "ANONYMOUS";
      const schemes: unknown[] = Array.isArray(security) ? security.filter((requirement: unknown): boolean => isObject(requirement) && Object.keys(requirement).length > 0) : [];

      return guarded && schemes.length === 0 ? `${key}: guarded (${minRole}) but declares no security scheme` : undefined;
    })).toEqual([]);
  });

  it("should document the standard error responses with the ErrorResponse envelope", () => {
    expect(violations(({ key, operation }: OperationEntry): string | undefined => {
      const documented: Record<string, JsonObject> = responses(operation);
      const required: string[] = ["500"];
      const minRole: string = operation["x-min-role"] as string;

      if (minRole !== "ANONYMOUS") {
        required.push("401");
      }

      if ((operation["x-required-permissions"] as unknown[]).length > 0 || operation["x-self-or-permissions"] !== undefined) {
        required.push("403");
      }

      const missing: string[] = required.filter((status: string): boolean => documented[status] === undefined);

      if (missing.length > 0) {
        return `${key}: missing ${missing.join(", ")}`;
      }

      const enveloped: boolean = isEnveloped(operation);
      const wrong: string[] = Object.entries(documented)
        .filter(([status]: [string, JsonObject]): boolean => /^[45]/.test(status))
        .filter(([status, response]: [string, JsonObject]): boolean => {
          const schema: unknown = schemaOf(response);

          if (schema === undefined) {
            return true;
          }

          return (enveloped || status === "500") && (!isObject(schema) || schema.$ref !== ERROR_RESPONSE_REF);
        })
        .map(([status]: [string, JsonObject]): string => status);

      return wrong.length > 0 ? `${key}: ${wrong.join(", ")} not described with ErrorResponse` : undefined;
    })).toEqual([]);
  });

  it("should have unique operation IDs and a successor on every deprecated operation", () => {
    const ids: string[] = operations().map(({ operation }: OperationEntry): string => String(operation.operationId));
    const duplicates: string[] = ids.filter((id: string, index: number): boolean => ids.indexOf(id) !== index);
    const withoutSuccessor: string[] = operations().filter(({ operation }: OperationEntry): boolean => operation.deprecated === true && typeof operation["x-successor"] !== "string").map(({ key }: OperationEntry): string => key);

    expect({ duplicates, withoutSuccessor }).toEqual({ duplicates: [], withoutSuccessor: [] });
  });

  it("should document exactly the routes of the authorization matrix with the minimum role the matrix observes", () => {
    const documented: Map<string, JsonObject> = new Map<string, JsonObject>(operations().map(({ key, operation }: OperationEntry): [string, JsonObject] => [toMatrixKey(key), operation]));
    const matrixKeys: string[] = Object.keys(AUTHORIZATION_MATRIX);

    const undocumented: string[] = matrixKeys.filter((key: string): boolean => !documented.has(key));
    const notInMatrix: string[] = [...documented.keys()].filter((key: string): boolean => !(key in AUTHORIZATION_MATRIX));
    const roleMismatches: string[] = matrixKeys
      .filter((key: string): boolean => documented.has(key) && !(key in MATRIX_DIVERGENCES))
      .map((key: string): string | undefined => {
        const expected: string | undefined = expectedMinRole(AUTHORIZATION_MATRIX[key]);
        const actual: unknown = documented.get(key)?.["x-min-role"];

        return expected === undefined || expected === actual ? undefined : `${key}: matrix ${expected}, OpenAPI ${String(actual)}`;
      })
      .filter((message: string | undefined): message is string => message !== undefined);

    expect({ undocumented, notInMatrix, roleMismatches }).toEqual({ undocumented: [], notInMatrix: [], roleMismatches: [] });
  });

  it("should not let two DTO classes share an OpenAPI schema name", () => {
    const owners: Map<string, string[]> = new Map<string, string[]>();
    const declaration: RegExp = /(@ApiSchema\(\{\s*name:\s*"(\w+)"[^)]*\)\s*)?export class (\w+)/g;

    for (const file of listDtoFiles(join(REPO_ROOT, "src"))) {
      for (const match of readFileSync(file, "utf-8").matchAll(declaration)) {
        const name: string = match[2] ?? match[3];

        owners.set(name, [...(owners.get(name) ?? []), file.slice(REPO_ROOT.length + 1)]);
      }
    }

    const collisions: string[] = [...owners.entries()].filter(([, files]: [string, string[]]): boolean => files.length > 1).map(([name, files]: [string, string[]]): string => `${name}: ${files.join(", ")}`);

    expect(collisions).toEqual([]);
  });
});
