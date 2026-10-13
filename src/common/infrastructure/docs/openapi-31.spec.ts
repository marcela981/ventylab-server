/*
 * Funcionalidad: Pruebas de la conversión a OpenAPI 3.1
 * Descripción: Verifica que toOpenAPI31 fije la versión 3.1.0, convierta nullable en tipos con null (también en enum) y en anyOf con {type: "null"} para referencias y composiciones conservando las anotaciones, convierta exclusiveMinimum/exclusiveMaximum booleanos en numéricos, no toque ejemplos ni propiedades llamadas nullable y no modifique el documento original
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toOpenAPI31 } from "@/common/infrastructure/docs/openapi-31";

type JsonObject = Record<string, unknown>;

function schemaOf(document: JsonObject, name: string): JsonObject {
  return ((document.components as JsonObject).schemas as JsonObject)[name] as JsonObject;
}

function documentWith(schemas: JsonObject): JsonObject {
  return { openapi: "3.0.0", paths: {}, components: { schemas } };
}

describe("toOpenAPI31", () => {
  it("sets the 3.1.0 version without mutating the input", () => {
    const input: JsonObject = documentWith({ Item: { type: "string", nullable: true } });

    const output: JsonObject = toOpenAPI31(input);

    expect(output.openapi).toBe("3.1.0");
    expect(input.openapi).toBe("3.0.0");
    expect(schemaOf(input, "Item")).toEqual({ type: "string", nullable: true });
  });

  it("turns a nullable scalar into a type array and adds null to its enum", () => {
    const output: JsonObject = toOpenAPI31(documentWith({ Status: { type: "string", enum: ["A", "B"], nullable: true, description: "Status" } }));

    expect(schemaOf(output, "Status")).toEqual({ type: ["string", "null"], enum: ["A", "B", null], description: "Status" });
  });

  it("wraps a nullable reference in anyOf with null and keeps the annotations outside", () => {
    const output: JsonObject = toOpenAPI31(documentWith({
      Order: {
        type: "object",
        properties: { account: { type: "object", nullable: true, allOf: [{ $ref: "#/components/schemas/Account" }], description: "Account", example: null } },
      },
    }));

    expect((schemaOf(output, "Order").properties as JsonObject).account).toEqual({
      description: "Account",
      example: null,
      anyOf: [{ allOf: [{ $ref: "#/components/schemas/Account" }] }, { type: "null" }],
    });
  });

  it("drops nullable false and converts boolean exclusive bounds", () => {
    const output: JsonObject = toOpenAPI31(documentWith({
      Range: { type: "number", nullable: false, minimum: 0, exclusiveMinimum: true, maximum: 10, exclusiveMaximum: false },
    }));

    expect(schemaOf(output, "Range")).toEqual({ type: "number", exclusiveMinimum: 0, maximum: 10 });
  });

  it("leaves examples and properties named nullable untouched", () => {
    const output: JsonObject = toOpenAPI31(documentWith({
      Flag: { type: "object", properties: { nullable: { type: "boolean" } }, example: { nullable: true } },
    }));

    expect(schemaOf(output, "Flag")).toEqual({ type: "object", properties: { nullable: { type: "boolean" } }, example: { nullable: true } });
  });
});
