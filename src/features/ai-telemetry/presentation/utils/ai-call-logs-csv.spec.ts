/*
 * Funcionalidad: Pruebas del CSV de llamadas de IA
 * Descripción: Verifica el escape RFC 4180 (comillas, comas, saltos de línea), la neutralización de fórmulas de hoja de cálculo, las columnas sin texto de prompt ni respuesta y los terminadores CRLF
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { escapeCsvField } from "@/common/presentation/utils/csv.util";
import { type AiCallLogRow } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";
import { AI_CALL_LOGS_CSV_COLUMNS, toAiCallLogsCsv } from "@/features/ai-telemetry/presentation/utils/ai-call-logs-csv";

describe("escapeCsvField", () => {
  it("leaves plain values unquoted", () => {
    expect(escapeCsvField("gemini")).toBe("gemini");
    expect(escapeCsvField(42)).toBe("42");
    expect(escapeCsvField(-3)).toBe("-3");
  });

  it("returns an empty field for missing values", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("quotes fields with commas, quotes or line breaks and doubles inner quotes", () => {
    expect(escapeCsvField("a,b")).toBe("\"a,b\"");
    expect(escapeCsvField("say \"hi\"")).toBe("\"say \"\"hi\"\"\"");
    expect(escapeCsvField("line1\nline2")).toBe("\"line1\nline2\"");
    expect(escapeCsvField("line1\r\nline2")).toBe("\"line1\r\nline2\"");
  });

  it("neutralizes text that a spreadsheet would run as a formula", () => {
    expect(escapeCsvField("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(escapeCsvField("+1")).toBe("'+1");
    expect(escapeCsvField("@cmd")).toBe("'@cmd");
  });
});

describe("toAiCallLogsCsv", () => {
  it("writes the header and one CRLF-terminated line per call without any text column", () => {
    const row: AiCallLogRow = {
      id: "call-1",
      createdAt: new Date("2026-10-05T10:00:00.000Z"),
      useCase: "FREE_CHAT",
      provider: "openai",
      model: "gpt-4o-mini",
      promptVersion: "free-chat@1",
      status: "ERROR",
      errorCode: "TIMEOUT, retry",
      attempts: 2,
      inputTokens: 10,
      outputTokens: undefined,
      latencyMs: 30000,
      ttftMs: undefined,
      costEstimateUsd: 0.000123,
      refType: "conversation",
      refId: "conv-1",
    };

    const csv: string = toAiCallLogsCsv([row]);
    const lines: string[] = csv.split("\r\n");

    expect(AI_CALL_LOGS_CSV_COLUMNS).not.toContain("prompt");
    expect(lines[0]).toBe(
      "id,createdAt,useCase,provider,model,promptVersion,status,errorCode,attempts,inputTokens,outputTokens,latencyMs,ttftMs,costEstimateUsd,refType,refId",
    );
    expect(lines[1]).toBe(
      "call-1,2026-10-05T10:00:00.000Z,FREE_CHAT,openai,gpt-4o-mini,free-chat@1,ERROR,\"TIMEOUT, retry\",2,10,,30000,,0.000123,conversation,conv-1",
    );
    expect(lines[2]).toBe("");
  });
});
