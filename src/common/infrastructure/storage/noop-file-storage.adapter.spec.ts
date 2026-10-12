/*
 * Funcionalidad: Pruebas de NoopFileStorageAdapter
 * Descripción: Verifica que sin almacenamiento configurado las escrituras fallen con FileStorageUnavailableError en lugar de descartar el archivo en silencio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Logger } from "@nestjs/common";

import { FileStorageUnavailableError } from "@/common/domain/errors/file-storage-unavailable.error";
import { NoopFileStorageAdapter } from "@/common/infrastructure/storage/noop-file-storage.adapter";

describe("NoopFileStorageAdapter", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation((): void => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports itself as unavailable and not configured", async () => {
    const adapter: NoopFileStorageAdapter = new NoopFileStorageAdapter();

    const health: string = await adapter.checkHealth();

    expect(adapter.isAvailable()).toBe(false);
    expect(health).toBe("not_configured");
  });

  it("rejects uploads instead of silently dropping the file", async () => {
    const adapter: NoopFileStorageAdapter = new NoopFileStorageAdapter();

    const upload: Promise<void> = adapter.uploadFile("media/file.png", Buffer.from("data"), "image/png");

    await expect(upload).rejects.toBeInstanceOf(FileStorageUnavailableError);
  });

  it("rejects signed upload URLs instead of returning a placeholder", async () => {
    const adapter: NoopFileStorageAdapter = new NoopFileStorageAdapter();

    const uploadUrl: Promise<{ uploadUrl: string; fileKey: string }> = adapter.generateUploadUrl("media/file.png", "image/png");

    await expect(uploadUrl).rejects.toBeInstanceOf(FileStorageUnavailableError);
  });

  it("keeps deletes as a no-op so cleanup paths never fail", async () => {
    const adapter: NoopFileStorageAdapter = new NoopFileStorageAdapter();

    const deletion: Promise<void> = adapter.deleteFile("media/file.png");

    await expect(deletion).resolves.toBeUndefined();
  });
});
