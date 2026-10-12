/*
 * Funcionalidad: Pruebas de los enlaces de producción
 * Descripción: Recorre los módulos de producción y la raíz de composición y falla si alguno enlaza una clase de prueba (Noop, Stub, Fake, InMemory o Mock) fuera de la lista de respaldos documentados, o si algún archivo de producción responde 501 o lanza NotImplemented
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, sep } from "path";

const SRC_ROOT: string = join(__dirname, "..");

const TEST_DOUBLE_NAME_PATTERN: RegExp = /\b\w*(?:Noop|Stub|Fake|InMemory|Mock)\w*\b/g;

const NOT_IMPLEMENTED_PATTERN: RegExp = /NotImplemented|NOT_IMPLEMENTED|\b501\b/;

// Each entry is a deliberate production fallback whose behavior is covered by its own spec.
const ALLOWED_FALLBACKS: ReadonlyMap<string, string> = new Map<string, string>([
  ["common/infrastructure/storage/storage.module.ts:NoopFileStorageAdapter", "No storage configured: writes fail with 503 and health reports not_configured"],
]);

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry: string): string[] => {
    const fullPath: string = join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      return entry === "testing" ? [] : listSourceFiles(fullPath);
    }

    return fullPath.endsWith(".ts") && !fullPath.endsWith("spec.ts") && !fullPath.endsWith(".d.ts") ? [fullPath] : [];
  });
}

function toRelative(fullPath: string): string {
  return relative(SRC_ROOT, fullPath).split(sep).join("/");
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function isCompositionFile(relativePath: string): boolean {
  return relativePath.endsWith(".module.ts") || relativePath.startsWith("composition/");
}

describe("production bindings", () => {
  const files: string[] = listSourceFiles(SRC_ROOT);

  it("finds the production modules to scan", () => {
    const modules: string[] = files.map(toRelative).filter(isCompositionFile);

    expect(modules.length).toBeGreaterThan(30);
    expect(modules).toContain("composition/composition.module.ts");
  });

  it("never binds a test double in a module or the composition root", () => {
    const offenders: string[] = files
      .filter((file: string) => isCompositionFile(toRelative(file)))
      .flatMap((file: string): string[] => {
        const names: string[] = stripComments(readFileSync(file, "utf-8")).match(TEST_DOUBLE_NAME_PATTERN) ?? [];

        return [...new Set(names)].map((name: string) => `${toRelative(file)}:${name}`);
      })
      .filter((binding: string) => !ALLOWED_FALLBACKS.has(binding));

    expect(offenders).toEqual([]);
  });

  it("never answers 501 or throws NotImplemented from production code", () => {
    const offenders: string[] = files
      .filter((file: string) => NOT_IMPLEMENTED_PATTERN.test(stripComments(readFileSync(file, "utf-8"))))
      .map(toRelative);

    expect(offenders).toEqual([]);
  });

  it("keeps every allowed fallback in use", () => {
    const stale: string[] = [...ALLOWED_FALLBACKS.keys()].filter((binding: string) => {
      const [file, name]: string[] = binding.split(":");

      return !readFileSync(join(SRC_ROOT, file), "utf-8").includes(name);
    });

    expect(stale).toEqual([]);
  });
});
