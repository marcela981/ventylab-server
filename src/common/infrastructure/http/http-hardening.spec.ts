/*
 * Funcionalidad: Pruebas de la CSP de la documentación
 * Descripción: Verifica con Express y helmet que, en producción, la página de documentación recibe una CSP propia que solo admite el script de Scalar desde jsDelivr y su script de arranque en línea, sin objetos ni marcos de otros orígenes, y que fuera de producción la página queda sin CSP mientras el resto de rutas conserva la de helmet
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import express, { type Express, type Request, type Response as ExpressResponse } from "express";
import helmet from "helmet";
import request, { type Response } from "supertest";

import { DOCS_UI_PATH } from "@/common/infrastructure/docs/setup-docs";
import { docsContentSecurityPolicy } from "@/common/infrastructure/http/http-hardening";

function buildApp(isProduction: boolean): Express {
  const app: Express = express();

  app.use(helmet());
  app.use(DOCS_UI_PATH, docsContentSecurityPolicy(isProduction));
  app.get(DOCS_UI_PATH, (_req: Request, res: ExpressResponse): void => {
    res.type("html").send("<html></html>");
  });
  app.get("/api/other", (_req: Request, res: ExpressResponse): void => {
    res.json({ ok: true });
  });

  return app;
}

describe("docsContentSecurityPolicy", () => {
  it("should allow only the Scalar CDN and its inline bootstrap script on the production documentation page", async () => {
    const app: Express = buildApp(true);

    const docs: Response = await request(app).get(DOCS_UI_PATH);
    const other: Response = await request(app).get("/api/other");
    const policy: string = String(docs.headers["content-security-policy"]);

    expect(policy).toContain("script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("connect-src 'self'");
    expect(String(other.headers["content-security-policy"])).toContain("script-src 'self';");
  });

  it("should leave the documentation page without CSP outside production", async () => {
    const app: Express = buildApp(false);

    const docs: Response = await request(app).get(DOCS_UI_PATH);
    const other: Response = await request(app).get("/api/other");

    expect(docs.headers["content-security-policy"]).toBeUndefined();
    expect(other.headers["content-security-policy"]).toContain("default-src 'self'");
  });
});
