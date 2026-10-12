/*
 * Funcionalidad: Pruebas de autorización de los controladores de analítica
 * Descripción: Verifica los metadatos RBAC: /api/analytics exige JWT y analytics:read (TEACHER y ADMIN, no STUDENT) en el panel, la exportación del grupo, la línea de tiempo y las estadísticas de evaluación, y analytics:research-export (solo ADMIN) en la exportación de investigación; /api/me/summary solo exige JWT; y que los errores de analítica tienen su estado HTTP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HttpStatus } from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";

import { DOMAIN_ERROR_STATUS_MAP } from "@/common/presentation/errors-map";
import {
  AnalyticsEvaluationNotFoundError,
  AnalyticsExportNotConfiguredError,
  AnalyticsGroupNotFoundError,
  AnalyticsScopeForbiddenError,
  InvalidAnalyticsRangeError,
} from "@/features/analytics/domain/analytics.errors";
import { AnalyticsController } from "@/features/analytics/presentation/controllers/analytics.controller";
import { MySummaryController } from "@/features/analytics/presentation/controllers/my-summary.controller";
import { PERMISSIONS_KEY } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ROLE_PERMISSIONS } from "@/features/authorization/domain/role-permissions";

const TEACHING_HANDLERS: readonly (keyof AnalyticsController)[] = ["getGroupDashboard", "exportGroupAnalytics", "getStudentTimeline", "getEvaluationAnalytics"];

function permissionsOf(name: keyof AnalyticsController): string[] {
  return Reflect.getMetadata(PERMISSIONS_KEY, AnalyticsController.prototype[name]) as string[];
}

describe("Analytics controllers authorization", () => {
  it("guards the analytics routes with JWT and permissions", () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AnalyticsController)).toEqual([JwtAuthGuard, PermissionsGuard]);
  });

  it("requires analytics:read, granted to teachers and admins only, on the teaching panels", () => {
    for (const handler of TEACHING_HANDLERS) {
      expect(permissionsOf(handler)).toEqual(["analytics:read"]);
    }

    expect(ROLE_PERMISSIONS.TEACHER).toContain("analytics:read");
    expect(ROLE_PERMISSIONS.ADMIN).toContain("analytics:read");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("analytics:read");
  });

  it("requires analytics:research-export, granted to admins only, on the research export", () => {
    expect(permissionsOf("exportResearchDataset")).toEqual(["analytics:research-export"]);
    expect(ROLE_PERMISSIONS.ADMIN).toContain("analytics:research-export");
    expect(ROLE_PERMISSIONS.TEACHER).not.toContain("analytics:research-export");
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain("analytics:research-export");
  });

  it("only requires an authenticated user for the own summary", () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, MySummaryController)).toEqual([JwtAuthGuard]);
    expect(Reflect.getMetadata(PERMISSIONS_KEY, MySummaryController.prototype.getMySummary)).toBeUndefined();
  });

  it("maps the analytics errors to their HTTP status", () => {
    expect(DOMAIN_ERROR_STATUS_MAP.get(AnalyticsScopeForbiddenError)).toBe(HttpStatus.FORBIDDEN);
    expect(DOMAIN_ERROR_STATUS_MAP.get(AnalyticsGroupNotFoundError)).toBe(HttpStatus.NOT_FOUND);
    expect(DOMAIN_ERROR_STATUS_MAP.get(AnalyticsEvaluationNotFoundError)).toBe(HttpStatus.NOT_FOUND);
    expect(DOMAIN_ERROR_STATUS_MAP.get(InvalidAnalyticsRangeError)).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(DOMAIN_ERROR_STATUS_MAP.get(AnalyticsExportNotConfiguredError)).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });
});
