/*
 * Funcionalidad: Pruebas de MediaUploadPolicy
 * Descripción: Verifica la aceptación y el rechazo de archivos por tipo MIME y por límite de tamaño de cada tipo de media
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { MediaFileRequiredError, MediaTooLargeError, UnsupportedMediaTypeError } from "@/features/media/domain/media.errors";
import { type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";
import { DEFAULT_MEDIA_SIZE_LIMITS, MediaUploadPolicy } from "@/features/media/domain/value-objects/media-upload-policy";

const MEGABYTE: number = 1024 * 1024;

describe("MediaUploadPolicy", () => {
  const policy: MediaUploadPolicy = MediaUploadPolicy.create(DEFAULT_MEDIA_SIZE_LIMITS);

  it.each([
    ["image/png", "IMAGE"],
    ["image/jpeg", "IMAGE"],
    ["image/webp", "IMAGE"],
    ["image/gif", "IMAGE"],
    ["application/pdf", "FILE"],
    ["video/mp4", "VIDEO"],
    ["video/webm", "VIDEO"],
    ["IMAGE/PNG; charset=binary", "IMAGE"],
  ])("accepts %s as %s", (mimeType: string, expected: string) => {
    const kind: MediaKindValue = policy.resolveKind(mimeType, MEGABYTE);

    expect(kind).toBe(expected);
  });

  it.each(["image/svg+xml", "text/html", "application/zip", "video/quicktime", ""])("rejects the MIME type %p", (mimeType: string) => {
    const act = (): MediaKindValue => policy.resolveKind(mimeType, MEGABYTE);

    expect(act).toThrow(UnsupportedMediaTypeError);
  });

  it.each([
    ["image/png", 10 * MEGABYTE],
    ["application/pdf", 20 * MEGABYTE],
    ["video/mp4", 100 * MEGABYTE],
  ])("accepts %s exactly at its limit", (mimeType: string, sizeBytes: number) => {
    const act = (): MediaKindValue => policy.resolveKind(mimeType, sizeBytes);

    expect(act).not.toThrow();
  });

  it.each([
    ["image/png", 10 * MEGABYTE + 1],
    ["application/pdf", 20 * MEGABYTE + 1],
    ["video/webm", 100 * MEGABYTE + 1],
  ])("rejects %s above its limit", (mimeType: string, sizeBytes: number) => {
    const act = (): MediaKindValue => policy.resolveKind(mimeType, sizeBytes);

    expect(act).toThrow(MediaTooLargeError);
  });

  it("applies the limit of the resolved kind, not the global maximum", () => {
    const act = (): MediaKindValue => policy.resolveKind("image/jpeg", 50 * MEGABYTE);

    expect(act).toThrow(MediaTooLargeError);
  });

  it("rejects an empty file", () => {
    const act = (): MediaKindValue => policy.resolveKind("image/png", 0);

    expect(act).toThrow(MediaFileRequiredError);
  });

  it("honors configured limits and exposes the largest one", () => {
    const custom: MediaUploadPolicy = MediaUploadPolicy.create({ IMAGE: 1000, VIDEO: 5000, FILE: 2000 });

    const act = (): MediaKindValue => custom.resolveKind("image/png", 1001);

    expect(act).toThrow(MediaTooLargeError);
    expect(custom.maxSizeBytes).toBe(5000);
  });
});
