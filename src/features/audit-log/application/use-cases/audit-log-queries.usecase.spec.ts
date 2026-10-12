/*
 * Funcionalidad: Pruebas de los casos de uso de consulta de auditoría
 * Descripción: Verifica la búsqueda filtrada y paginada, el historial de un objetivo por tipo o colección, la exportación con tope y bandera de truncado y el rechazo de rangos de fechas invertidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { buildAuditEntry, InMemoryAuditLogQueriesRepository } from "@/features/audit-log/application/testing/audit-log-test-doubles-spec";
import { type AuditLogExport, ExportAuditLogsUseCase } from "@/features/audit-log/application/use-cases/export-audit-logs.usecase";
import { GetAuditTargetHistoryUseCase } from "@/features/audit-log/application/use-cases/get-audit-target-history.usecase";
import { SearchAuditLogsUseCase } from "@/features/audit-log/application/use-cases/search-audit-logs.usecase";
import { InvalidAuditLogRangeError } from "@/features/audit-log/domain/audit-log.errors";
import { type AuditLogEntryView } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";

function buildRepository(): InMemoryAuditLogQueriesRepository {
  return new InMemoryAuditLogQueriesRepository([
    buildAuditEntry({ id: "a-1" }),
    buildAuditEntry({ id: "a-2", action: "user_status_changed", performedAt: new Date("2026-10-02T10:00:00.000Z") }),
    buildAuditEntry({ id: "a-3", actorId: "admin-2", entityCollection: "users", entityType: "users", performedAt: new Date("2026-10-03T10:00:00.000Z") }),
    buildAuditEntry({ id: "a-4", entityCollection: "pages", entityType: "page", entityId: "p-1", action: "page_updated" }),
  ]);
}

describe("SearchAuditLogsUseCase", () => {
  it("filters by actor, action and date range and paginates", async () => {
    const useCase: SearchAuditLogsUseCase = new SearchAuditLogsUseCase(buildRepository());

    const byActorAndRange: Paginated<AuditLogEntryView> = await useCase.execute({
      actorId: "admin-1",
      from: new Date("2026-10-01T00:00:00.000Z"),
      to: new Date("2026-10-03T00:00:00.000Z"),
      page: 1,
      limit: 2,
    });
    const byAction: Paginated<AuditLogEntryView> = await useCase.execute({ action: "user_status_changed", page: 1, limit: 10 });

    expect(byActorAndRange.data.map((entry: AuditLogEntryView) => entry.id)).toEqual(["a-1", "a-2"]);
    expect(byActorAndRange.pagination).toMatchObject({ total: 3, page: 1, limit: 2, next: 2 });
    expect(byAction.data.map((entry: AuditLogEntryView) => entry.id)).toEqual(["a-2"]);
  });

  it("rejects a range that does not start before it ends", async () => {
    const useCase: SearchAuditLogsUseCase = new SearchAuditLogsUseCase(buildRepository());
    const instant: Date = new Date("2026-10-01T00:00:00.000Z");

    await expect(useCase.execute({ from: instant, to: instant, page: 1, limit: 10 })).rejects.toBeInstanceOf(InvalidAuditLogRangeError);
  });
});

describe("GetAuditTargetHistoryUseCase", () => {
  it("returns the entries of one target matched by entity type or collection", async () => {
    const useCase: GetAuditTargetHistoryUseCase = new GetAuditTargetHistoryUseCase(buildRepository());

    const byType: Paginated<AuditLogEntryView> = await useCase.execute("user", "u-2", { page: 1, limit: 10 });
    const byCollection: Paginated<AuditLogEntryView> = await useCase.execute("users", "u-2", { page: 1, limit: 10 });

    expect(byType.data.map((entry: AuditLogEntryView) => entry.id)).toEqual(["a-1", "a-2"]);
    expect(byCollection.data.map((entry: AuditLogEntryView) => entry.id)).toEqual(["a-1", "a-2", "a-3"]);
  });
});

describe("ExportAuditLogsUseCase", () => {
  it("caps the rows and flags the export as truncated", async () => {
    const useCase: ExportAuditLogsUseCase = new ExportAuditLogsUseCase(buildRepository());

    const capped: AuditLogExport = await useCase.execute({ targetType: "users" }, 2);
    const complete: AuditLogExport = await useCase.execute({ targetType: "page" }, 2);

    expect(capped).toMatchObject({ truncated: true });
    expect(capped.rows).toHaveLength(2);
    expect(complete).toMatchObject({ truncated: false });
    expect(complete.rows.map((entry: AuditLogEntryView) => entry.id)).toEqual(["a-4"]);
  });

  it("rejects an inverted range", async () => {
    const useCase: ExportAuditLogsUseCase = new ExportAuditLogsUseCase(buildRepository());

    await expect(
      useCase.execute({ from: new Date("2026-10-02T00:00:00.000Z"), to: new Date("2026-10-01T00:00:00.000Z") }),
    ).rejects.toBeInstanceOf(InvalidAuditLogRangeError);
  });
});
