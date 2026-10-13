/*
 * Funcionalidad: Documento OpenAPI de la API
 * Descripción: Construye el documento OpenAPI 3.1 a partir de los decoradores de @nestjs/swagger (configuración, esquema de seguridad JWT, grupos de etiquetas de Scalar), lo completa con los metadatos de las rutas y lo convierte a la sintaxis 3.1; también lo serializa de forma determinista (claves ordenadas, sin marcas de tiempo) para el archivo versionado openapi/openapi.json
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, type OpenAPIObject, type SwaggerDocumentOptions, SwaggerModule } from "@nestjs/swagger";

import { toOpenAPI31 } from "@/common/infrastructure/docs/openapi-31";
import { enrichOpenAPIDocument } from "@/common/infrastructure/docs/openapi-enricher";
import { collectRoutes, JWT_SECURITY_SCHEME, type RoleModel } from "@/common/infrastructure/docs/openapi-routes";
import { APIPagination } from "@/common/presentation/dtos/api-response.dto";

const PUBLIC_TAGS: string[] = [
  "Health",
  "Authentication",
  "Users",
  "Sections",
  "Levels",
  "Modules",
  "Lessons",
  "Steps",
  "Pages",
  "Curriculum",
  "Progress",
  "Teaching progression",
  "Quizzes",
  "Clinical cases",
  "Activities",
  "Activity submissions",
  "Scores",
  "Media",
  "Notes",
  "Simulation",
  "Reservations",
  "Ventilator telemetry",
  "Ventilator commands",
  "Patient simulation",
  "Student summary",
];

const EVALUATION_TAGS: string[] = ["Evaluations", "Evaluation assignments", "Student evaluations", "Evaluation grading", "Grade feedback"];

const AI_TAGS: string[] = ["AI telemetry", "AI ratings", "AI tutor"];

const ADMIN_TAGS: string[] = [
  "Authorization",
  "Changelog",
  "Content overrides",
  "Curriculum editor",
  "Activity assignments",
  "Groups",
  "Teacher students",
  "Admin",
  "Platform settings",
  "System status",
  "Analytics",
];

export const TAG_GROUPS: readonly { readonly name: string; readonly tags: readonly string[] }[] = [
  { name: "Public", tags: PUBLIC_TAGS },
  { name: "Evaluations", tags: EVALUATION_TAGS },
  { name: "AI", tags: AI_TAGS },
  { name: "Administration", tags: ADMIN_TAGS },
];

export interface OpenAPIDocumentOptions {
  readonly roles: RoleModel;
}

export function buildOpenAPIDocument(app: INestApplication, options: OpenAPIDocumentOptions): OpenAPIObject {
  const config: Omit<OpenAPIObject, "paths"> = new DocumentBuilder()
    .setTitle("VentyLab API")
    .setDescription("VentyLab backend API built with Clean Architecture and DDD principles. Every JSON response uses the APIResponse envelope; realtime (Socket.io) and server-sent events are described in openapi/asyncapi.yaml.")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", name: "Authorization", description: "User JWT token", in: "header" },
      JWT_SECURITY_SCHEME,
    )
    .build();

  const documentOptions: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string): string => methodKey,
    extraModels: [APIPagination],
  };

  const generated: OpenAPIObject = SwaggerModule.createDocument(app, config, documentOptions);
  const enriched: Record<string, unknown> = enrichOpenAPIDocument(generated as unknown as Record<string, unknown>, collectRoutes(app), options.roles);

  enriched["x-tagGroups"] = TAG_GROUPS.map((group: { readonly name: string; readonly tags: readonly string[] }) => ({ name: group.name, tags: [...group.tags] }));

  return toOpenAPI31(enriched) as unknown as OpenAPIObject;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key: string): [string, unknown] => [key, sortKeys((value as Record<string, unknown>)[key])]),
  );
}

export function serializeOpenAPIDocument(document: OpenAPIObject): string {
  return `${JSON.stringify(sortKeys(document), null, 2)}\n`;
}
