/*
 * Funcionalidad: Pruebas de ChangeLogMapper (persistencia)
 * Descripción: Verifica que una entrada cuyo autor fue eliminado (changedBy nulo por ON DELETE SET NULL) se reconstituya sin autor y se exponga con changedBy nulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { ChangeLogMapper, type ChangeLogRow } from "@/features/changelog/infrastructure/persistence/prisma/mappers/changelog.mapper";
import { type ChangeLogEntryDTO } from "@/features/changelog/presentation/dtos/change-log-entry.dto";
import { ChangeLogMapper as ChangeLogPresentationMapper } from "@/features/changelog/presentation/mappers/changelog.mapper";

function buildRow(changedBy: string | null): ChangeLogRow {
  return {
    id: "log-1",
    entityType: "Lesson",
    entityId: "lesson-1",
    action: "update",
    changedBy,
    changedAt: new Date("2026-01-01T00:00:00.000Z"),
    diff: null,
    metadata: null,
    user: null,
  };
}

describe("ChangeLogMapper", () => {
  it("keeps the history of a deleted author with a null changedBy", () => {
    const row: ChangeLogRow = buildRow(null);

    const entry: ChangeLogEntry = ChangeLogMapper.toDomain(row);
    const dto: ChangeLogEntryDTO = ChangeLogPresentationMapper.toDTO(entry);

    expect(entry.changedBy).toBeUndefined();
    expect(dto.changedBy).toBeNull();
    expect(dto.user).toBeNull();
  });

  it("keeps the author id while the user exists", () => {
    const row: ChangeLogRow = buildRow("teacher-1");

    const dto: ChangeLogEntryDTO = ChangeLogPresentationMapper.toDTO(ChangeLogMapper.toDomain(row));

    expect(dto.changedBy).toBe("teacher-1");
  });
});
