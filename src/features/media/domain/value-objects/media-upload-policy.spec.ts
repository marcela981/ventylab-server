/*
 * Funcionalidad: Pruebas de MediaUploadPolicy
 * Descripción: Verifica la aceptación y el rechazo de archivos por tipo MIME y por límite de tamaño de cada tipo de media, y la política de la foto de perfil (png, jpeg o webp de hasta 2 MB: 415 para otros tipos, 413 por tamaño y 415 si los bytes iniciales no corresponden)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AVATAR_MAX_BYTES } from "@/common/domain/value-objects/avatar-upload-rules";
import { MediaContentMismatchError, MediaFileRequiredError, MediaTooLargeError, UnsupportedMediaTypeError } from "@/features/media/domain/media.errors";
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

const PNG: Buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG: Buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const WEBP: Buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

describe("MediaUploadPolicy.avatar", () => {
  const policy: MediaUploadPolicy = MediaUploadPolicy.avatar();

  it.each([
    ["image/png", PNG],
    ["image/jpeg", JPEG],
    ["image/webp", WEBP],
  ])("accepts a %s whose first bytes match", (mimeType: string, content: Buffer) => {
    expect(policy.resolveKind(mimeType, content.length)).toBe("IMAGE");
    expect(() => policy.assertContent(mimeType, content)).not.toThrow();
  });

  it.each(["image/gif", "application/pdf", "video/mp4"])("rejects %s with UnsupportedMediaTypeError (415)", (mimeType: string) => {
    expect(() => policy.resolveKind(mimeType, 100)).toThrow(UnsupportedMediaTypeError);
  });

  it("rejects a photo larger than 2 MB with MediaTooLargeError (413)", () => {
    expect(() => policy.resolveKind("image/png", AVATAR_MAX_BYTES + 1)).toThrow(MediaTooLargeError);
    expect(policy.resolveKind("image/png", AVATAR_MAX_BYTES)).toBe("IMAGE");
  });

  it("rejects bytes that do not match the declared type with MediaContentMismatchError (415)", () => {
    expect(() => policy.assertContent("image/png", JPEG)).toThrow(MediaContentMismatchError);
    expect(() => policy.assertContent("image/webp", Buffer.from("RIFF0000WAVE"))).toThrow(MediaContentMismatchError);
    expect(() => policy.assertContent("image/jpeg", Buffer.from("<svg></svg>"))).toThrow(MediaContentMismatchError);
  });

  it("does not verify the content with the default policy", () => {
    expect(() => MediaUploadPolicy.create().assertContent("image/png", JPEG)).not.toThrow();
  });
});
