/*
 * Funcionalidad: Conversión de esquemas a OpenAPI 3.1
 * Descripción: Recorre el documento que produce @nestjs/swagger (esquemas con la sintaxis de OpenAPI 3.0) y reemplaza nullable por el tipo "null" de JSON Schema 2020-12 (arreglo de tipos, null en enum o anyOf con {type: "null"} para referencias y composiciones) y la forma booleana de exclusiveMinimum/exclusiveMaximum por la numérica, sin cambiar ningún otro valor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const OPENAPI_31_VERSION: string = "3.1.0";

type JsonObject = Record<string, unknown>;

const ANNOTATION_KEYS: readonly string[] = ["title", "description", "example", "examples", "default", "deprecated", "readOnly", "writeOnly"];

const COMPOSITION_KEYS: readonly string[] = ["$ref", "allOf", "oneOf", "anyOf"];

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function convertExclusiveBound(schema: JsonObject, exclusiveKey: string, boundKey: string): void {
  const exclusive: unknown = schema[exclusiveKey];

  if (typeof exclusive !== "boolean") {
    return;
  }

  if (exclusive && typeof schema[boundKey] === "number") {
    schema[exclusiveKey] = schema[boundKey];
    delete schema[boundKey];
  } else {
    delete schema[exclusiveKey];
  }
}

function convertNullable(schema: JsonObject): JsonObject {
  const nullable: unknown = schema.nullable;

  delete schema.nullable;

  if (nullable !== true) {
    return schema;
  }

  const isComposed: boolean = COMPOSITION_KEYS.some((key: string): boolean => key in schema);

  if (!isComposed) {
    if (typeof schema.type === "string") {
      schema.type = [schema.type, "null"];
    } else if (Array.isArray(schema.type) && !schema.type.includes("null")) {
      schema.type = [...(schema.type as unknown[]), "null"];
    }

    if (Array.isArray(schema.enum) && !schema.enum.includes(null)) {
      schema.enum = [...(schema.enum as unknown[]), null];
    }

    return schema;
  }

  const annotations: JsonObject = {};
  const value: JsonObject = {};

  for (const [key, entry] of Object.entries(schema)) {
    if (ANNOTATION_KEYS.includes(key)) {
      annotations[key] = entry;
    } else {
      value[key] = entry;
    }
  }

  // @nestjs/swagger marks a nullable reference as {type: "object", allOf: [$ref]}; the "object" type would forbid null inside anyOf.
  if (value.type === "object" && !("properties" in value)) {
    delete value.type;
  }

  return { ...annotations, anyOf: [value, { type: "null" }] };
}

function convertSchema(schema: JsonObject): JsonObject {
  for (const [key, entry] of Object.entries(schema)) {
    if (key === "example" || key === "examples" || key === "default" || key === "enum" || key === "const") {
      continue;
    }

    schema[key] = convertNode(entry, key === "properties" || key === "patternProperties" || key === "$defs");
  }

  convertExclusiveBound(schema, "exclusiveMinimum", "minimum");
  convertExclusiveBound(schema, "exclusiveMaximum", "maximum");

  return convertNullable(schema);
}

function convertNode(node: unknown, isSchemaMap: boolean = false): unknown {
  if (Array.isArray(node)) {
    return node.map((item: unknown): unknown => convertNode(item));
  }

  if (!isObject(node)) {
    return node;
  }

  if (isSchemaMap) {
    return Object.fromEntries(Object.entries(node).map(([key, value]: [string, unknown]): [string, unknown] => [key, convertNode(value)]));
  }

  return convertSchema(node);
}

export function toOpenAPI31<T extends object>(document: T): T {
  const converted: JsonObject = convertNode(structuredClone(document)) as JsonObject;

  converted.openapi = OPENAPI_31_VERSION;

  return converted as T;
}
