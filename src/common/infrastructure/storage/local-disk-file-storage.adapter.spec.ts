/*
 * Funcionalidad: Pruebas de LocalDiskFileStorageAdapter y de la elección del almacenamiento
 * Descripción: Verifica que el adaptador de disco guarde y devuelva el objeto como URL data: con su tipo, que borre sin error aunque no exista, que rechace claves fuera de su carpeta, y que StorageModule elija Supabase si está configurado, el disco local fuera de producción y el adaptador que rechaza las escrituras en producción
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { type ConfigService } from "@nestjs/config";

import { type IFileStorageService } from "@/common/application/ports/file-storage.interface";
import { FileStorageUnavailableError } from "@/common/domain/errors/file-storage-unavailable.error";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { LocalDiskFileStorageAdapter } from "@/common/infrastructure/storage/local-disk-file-storage.adapter";
import { NoopFileStorageAdapter } from "@/common/infrastructure/storage/noop-file-storage.adapter";
import { createFileStorage } from "@/common/infrastructure/storage/storage.module";
import { SupabaseFileStorageAdapter } from "@/common/infrastructure/storage/supabase-file-storage.adapter";

function config(values: Record<string, string>): ConfigService<EnvironmentVariables> {
  return { get: (key: string): string | undefined => values[key] } as unknown as ConfigService<EnvironmentVariables>;
}

describe("LocalDiskFileStorageAdapter", () => {
  let root: string;
  let adapter: LocalDiskFileStorageAdapter;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "ventylab-storage-spec-"));
    adapter = new LocalDiskFileStorageAdapter(root);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("stores a file and returns it as a data URL with its content type", async () => {
    await adapter.uploadFile("media/u1/photo.png", Buffer.from("png-bytes"), "image/png");

    const urls: Map<string, string> = await adapter.generateDownloadUrls(["media/u1/photo.png", "media/ghost.png"]);

    expect(adapter.isAvailable()).toBe(true);
    expect(await adapter.checkHealth()).toBe("up");
    expect(urls).toEqual(new Map([["media/u1/photo.png", `data:image/png;base64,${Buffer.from("png-bytes").toString("base64")}`]]));
    expect(await adapter.generateDownloadUrl("media/u1/photo.png")).toContain("data:image/png;base64,");
  });

  it("deletes a file and ignores a missing one", async () => {
    await adapter.uploadFile("media/u1/photo.png", Buffer.from("x"), "image/png");

    await adapter.deleteFile("media/u1/photo.png");
    await adapter.deleteFile("media/u1/photo.png");

    expect(await adapter.generateDownloadUrls(["media/u1/photo.png"])).toEqual(new Map());
  });

  it("refuses keys that escape its folder", async () => {
    await expect(adapter.uploadFile("../outside.png", Buffer.from("x"), "image/png")).rejects.toBeInstanceOf(FileStorageUnavailableError);
  });
});

describe("createFileStorage", () => {
  it.each([
    ["Supabase when it is configured", { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "key", SUPABASE_STORAGE_BUCKET: "media", NODE_ENV: "production" }, SupabaseFileStorageAdapter],
    ["the local disk outside production", { NODE_ENV: "development" }, LocalDiskFileStorageAdapter],
    ["the rejecting adapter in production without Supabase", { NODE_ENV: "production" }, NoopFileStorageAdapter],
  ])("uses %s", (_label: string, values: Record<string, string>, expected: abstract new (...args: never[]) => IFileStorageService) => {
    expect(createFileStorage(config(values))).toBeInstanceOf(expected);
  });
});
