/*
 * Funcionalidad: Documentación de la API
 * Descripción: Configura Swagger y Scalar con las secciones pública, de evaluaciones, de IA y administrativa, protegidas por lista de IP permitidas
 * Versión: 1.11
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
/* eslint-disable @typescript-eslint/typedef */

import { type INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, type SwaggerDocumentOptions, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/express-api-reference";
import { type NextFunction, type Request, type Response } from "express";

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
  "Patient simulation",
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
];

export function setupDocs(app: INestApplication, allowedIps: string[]): void {
  const isOpenToAll: boolean = allowedIps.length === 1 && allowedIps[0] === "*";

  const ipGuard = (req: Request, res: Response, next: NextFunction): void => {
    if (isOpenToAll || allowedIps.includes(req.ip ?? "")) {
      next();
    } else {
      res.status(404).end();
    }
  };

  const httpAdapter = app.getHttpAdapter().getInstance();

  httpAdapter.use("/api/docs", ipGuard);
  httpAdapter.use("/api/docs-json", ipGuard);

  const config: Omit<OpenAPIObject, "paths"> = new DocumentBuilder()
    .setTitle("VentyLab API")
    .setDescription("VentyLab backend API built with Clean Architecture and DDD principles")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", name: "Authorization", description: "User JWT token", in: "header" },
      "JWT-auth",
    )
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  };

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config, options);

  (document as OpenAPIObject & Record<string, unknown>)["x-tagGroups"] = [
    { name: "Public", tags: PUBLIC_TAGS },
    { name: "Evaluations", tags: EVALUATION_TAGS },
    { name: "AI", tags: AI_TAGS },
    { name: "Administration", tags: ADMIN_TAGS },
  ];

  httpAdapter.get("/api/docs-json", (_req: Request, res: Response): void => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(document));
  });

  httpAdapter.use("/api/docs", apiReference({
    url: "/api/docs-json",
    pageTitle: "VentyLab API",
  }));
}
