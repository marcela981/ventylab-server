/*
 * Funcionalidad: Pruebas de la utilidad CSV
 * Descripción: Verifica el escape RFC 4180 (comillas, comas y saltos de línea), la neutralización de valores que una hoja de cálculo ejecutaría como fórmula y la serialización de filas con terminadores CRLF
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { escapeCsvField, toCsv } from "@/common/presentation/utils/csv.util";

describe("csv util", () => {
  it.each([
    [undefined, ""],
    [3.5, "3.5"],
    [true, "true"],
    [false, "false"],
    [new Date("2026-10-01T00:00:00Z"), "2026-10-01T00:00:00.000Z"],
    ["plain", "plain"],
    ["a,b", "\"a,b\""],
    ["say \"hi\"", "\"say \"\"hi\"\"\""],
    ["line\nbreak", "\"line\nbreak\""],
    ["=SUM(A1)", "'=SUM(A1)"],
    ["+1", "'+1"],
    ["-1", "'-1"],
    ["@cmd", "'@cmd"],
    ["=HYPERLINK(\"x\",\"y\")", "\"'=HYPERLINK(\"\"x\"\",\"\"y\"\")\""],
  ])("escapes %p as %p", (value: string | number | boolean | Date | undefined, expected: string) => {
    expect(escapeCsvField(value)).toBe(expected);
  });

  it("serializes a header and one CRLF-terminated line per row in column order", () => {
    const csv: string = toCsv([{ a: "x", b: 1 }, { a: undefined, b: 2 }], ["b", "a"]);

    expect(csv).toBe("b,a\r\n1,x\r\n2,\r\n");
  });
});
