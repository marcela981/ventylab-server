/*
 * Funcionalidad: Documentación de la API
 * Descripción: Monta Scalar en /api/docs y el documento OpenAPI 3.1 en /api/docs-json (el mismo que genera npm run openapi:generate), protegidos por la regla de acceso de docs-access: abiertos fuera de producción, solo para un token de ADMIN en producción y, si SWAGGER_ALLOWED_IPS tiene IPs, solo desde esas IPs
 * Versión: 1.18
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplication } from "@nestjs/common";
import { type OpenAPIObject } from "@nestjs/swagger";
import { apiReference } from "@scalar/express-api-reference";
import { type Express, type Request, type Response } from "express";

import { ACCESS_TOKEN_VERIFIER_TOKEN, type IAccessTokenVerifier } from "@/common/application/ports/access-token-verifier.interface";
import { createDocsAccessMiddleware, type DocsAccessOptions } from "@/common/infrastructure/docs/docs-access";
import { buildOpenAPIDocument } from "@/common/infrastructure/docs/openapi-document";
import { type RoleModel } from "@/common/infrastructure/docs/openapi-routes";

export const DOCS_UI_PATH: string = "/api/docs";
export const DOCS_JSON_PATH: string = "/api/docs-json";

export interface SetupDocsOptions extends DocsAccessOptions {
  readonly roles: RoleModel;
}

export function setupDocs(app: INestApplication, options: SetupDocsOptions): void {
  const httpAdapter: Express = app.getHttpAdapter().getInstance() as Express;
  const verifier: IAccessTokenVerifier = app.get<IAccessTokenVerifier>(ACCESS_TOKEN_VERIFIER_TOKEN);
  const guard: ReturnType<typeof createDocsAccessMiddleware> = createDocsAccessMiddleware(options, verifier);
  const document: OpenAPIObject = buildOpenAPIDocument(app, { roles: options.roles });
  const serialized: string = JSON.stringify(document);

  httpAdapter.use(DOCS_UI_PATH, guard);
  httpAdapter.use(DOCS_JSON_PATH, guard);

  httpAdapter.get(DOCS_JSON_PATH, (_req: Request, res: Response): void => {
    res.setHeader("Content-Type", "application/json");
    res.send(serialized);
  });

  httpAdapter.use(DOCS_UI_PATH, apiReference({
    url: DOCS_JSON_PATH,
    pageTitle: "VentyLab API",
  }));
}
