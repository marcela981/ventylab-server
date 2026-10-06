/*
 * Funcionalidad: Pruebas del CSV de valoraciones de IA
 * Descripción: Verifica las columnas exportadas (sin identificador de usuario), el escape RFC 4180 de comentarios con comas, comillas y saltos de línea y la neutralización de comentarios con forma de fórmula
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiRatingExportRow } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { AI_RATINGS_CSV_COLUMNS, toAiRatingsCsv } from "@/features/ai-ratings/presentation/utils/ai-ratings-csv";

const ROW: AiRatingExportRow = {
  targetType: "MESSAGE",
  targetId: "message-1",
  helpful: true,
  quality: 4,
  safety: 5,
  comment: "Good, but \"long\"\nsecond line",
  createdAt: new Date("2026-10-02T10:00:00Z"),
  useCase: "FREE_CHAT",
  provider: "gemini",
  model: "gemini-2.0-flash",
  promptVersion: "1.0.0",
};

describe("toAiRatingsCsv", () => {
  it("never exports a user identifier", () => {
    expect(AI_RATINGS_CSV_COLUMNS).not.toContain("userId");
    expect(AI_RATINGS_CSV_COLUMNS).toEqual([
      "targetType",
      "targetId",
      "helpful",
      "quality",
      "understanding",
      "expression",
      "safety",
      "trust",
      "comment",
      "createdAt",
      "useCase",
      "provider",
      "model",
      "promptVersion",
    ]);
  });

  it("escapes comments and leaves missing values empty", () => {
    const csv: string = toAiRatingsCsv([ROW]);
    const [header, line]: string[] = csv.split("\r\n");

    expect(header).toBe(AI_RATINGS_CSV_COLUMNS.join(","));
    expect(line).toBe(
      "MESSAGE,message-1,true,4,,,5,,\"Good, but \"\"long\"\"\nsecond line\",2026-10-02T10:00:00.000Z,FREE_CHAT,gemini,gemini-2.0-flash,1.0.0",
    );
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("neutralizes a comment that a spreadsheet would run as a formula", () => {
    const csv: string = toAiRatingsCsv([{ ...ROW, comment: "=HYPERLINK(\"http://x\")", useCase: undefined, provider: undefined, model: undefined, promptVersion: undefined }]);

    expect(csv).toContain(",\"'=HYPERLINK(\"\"http://x\"\")\",");
    expect(csv.split("\r\n")[1].endsWith("2026-10-02T10:00:00.000Z,,,,")).toBe(true);
  });
});
