/*
 * Funcionalidad: Decorador ApiNullableResponse
 * Descripción: Documenta en OpenAPI una respuesta cuyo data puede ser el DTO indicado o null (por ejemplo "mi intento, si existe"), registrando el DTO como modelo extra y marcando el esquema como anulable
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { applyDecorators, type Type } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";

export interface ApiNullableResponseOptions {
  readonly status: number;
  readonly description: string;
  readonly type: Type;
}

export function ApiNullableResponse(options: ApiNullableResponseOptions): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(options.type),
    ApiResponse({ status: options.status, description: options.description, schema: { allOf: [{ $ref: getSchemaPath(options.type) }], nullable: true } }),
  );
}
