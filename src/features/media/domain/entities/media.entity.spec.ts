/*
 * Funcionalidad: Pruebas de la entidad Media
 * Descripción: Verifica la clave de almacenamiento generada y la decisión de borrado según las referencias desde secciones de página
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type DomainEvent } from "@/common/domain/events/domain-event";
import { Media } from "@/features/media/domain/entities/media.entity";
import { MediaDeletedEvent } from "@/features/media/domain/events/media.events";
import { MediaInUseError } from "@/features/media/domain/media.errors";

function buildMedia(): Media {
  const media: Media = Media.create({
    ownerId: "teacher-1",
    kind: "IMAGE",
    mimeType: "image/png",
    sizeBytes: 2048,
    originalName: "Curva Presión/Volumen (v2).PNG",
  });

  media.getEvents();

  return media;
}

describe("Media", () => {
  it("builds the storage key from kind, id and sanitized name", () => {
    const media: Media = buildMedia();

    expect(media.storageKey).toBe(`media/image/${media.id}/curva-presion-volumen-v2-.png`);
  });

  it("refuses deletion while any page section references it", () => {
    const media: Media = buildMedia();

    const act = (): void => media.delete({ referenceCount: 1, performedBy: "teacher-1" });

    expect(act).toThrow(MediaInUseError);
    expect(media.getEvents()).toHaveLength(0);
  });

  it("allows deletion when no page section references it", () => {
    const media: Media = buildMedia();

    media.delete({ referenceCount: 0, performedBy: "admin-1" });

    const events: DomainEvent[] = media.getEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(MediaDeletedEvent);
    expect(media.auditLogs.map((log: Media["auditLogs"][number]) => log.action)).toContain("media_deleted");
  });
});
