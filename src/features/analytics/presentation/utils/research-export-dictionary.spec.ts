/*
 * Funcionalidad: Pruebas del diccionario de datos de la exportación de investigación
 * Descripción: Verifica que el CSV de investigación usa exactamente las columnas del diccionario en su orden, que cada columna tiene tipo, descripción y ejemplo, y que docs/operation/RESEARCH-EXPORT-DICTIONARY.md documenta todas las columnas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { toResearchCsv } from "@/features/analytics/presentation/utils/analytics-csv";
import { RESEARCH_CSV_COLUMNS, RESEARCH_EXPORT_DICTIONARY, type ResearchExportColumnDefinition } from "@/features/analytics/presentation/utils/research-export-dictionary";

const DICTIONARY_DOC_PATH: string = resolve(__dirname, "../../../../../docs/operation/RESEARCH-EXPORT-DICTIONARY.md");

describe("RESEARCH_EXPORT_DICTIONARY", () => {
  it("defines the CSV header in file order", () => {
    const columns: string[] = RESEARCH_EXPORT_DICTIONARY.map((definition: ResearchExportColumnDefinition) => definition.column);

    const header: string = toResearchCsv([]).split(/\r?\n/)[0];

    expect(RESEARCH_CSV_COLUMNS).toEqual(["participant", "group", "domain", "item", "metric", "value"]);
    expect(columns).toEqual([...RESEARCH_CSV_COLUMNS]);
    expect(header).toBe(RESEARCH_CSV_COLUMNS.join(","));
  });

  it("gives every column a type, a description and an example", () => {
    const incomplete: ResearchExportColumnDefinition[] = RESEARCH_EXPORT_DICTIONARY.filter(
      (definition: ResearchExportColumnDefinition) => definition.description.length === 0 || definition.example === undefined,
    );

    expect(incomplete).toEqual([]);
    expect(RESEARCH_EXPORT_DICTIONARY.find((definition: ResearchExportColumnDefinition) => definition.column === "value")?.type).toBe("number");
  });

  it("is documented column by column in the operation docs", () => {
    const doc: string = readFileSync(DICTIONARY_DOC_PATH, "utf8");

    const missing: string[] = RESEARCH_CSV_COLUMNS.filter((column: string) => !doc.includes(`| \`${column}\` |`));

    expect(missing).toEqual([]);
  });
});
