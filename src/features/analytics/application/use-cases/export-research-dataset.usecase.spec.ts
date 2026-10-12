/*
 * Funcionalidad: Pruebas de ExportResearchDatasetUseCase
 * Descripción: Verifica que el CSV de investigación reemplaza usuarios y grupos por HMAC-SHA256 con la sal (estable y reproducible) y no contiene ningún nombre, correo, código de estudiante ni identificador original del fixture, que lee los datos con una llamada por lotes por fachada, que exporta una sola vez a un estudiante de varios grupos y que sin sal configurada falla con 503 sin leer datos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHmac } from "node:crypto";

import { type ResearchDatasetRow } from "@/features/analytics/application/results/analytics.results";
import {
  type AnalyticsHarness,
  batchMocks,
  buildAnalyticsHarness,
  buildStudents,
  GROUP_ID,
  SALT,
} from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { AnalyticsExportNotConfiguredError } from "@/features/analytics/domain/analytics.errors";
import { toResearchCsv } from "@/features/analytics/presentation/utils/analytics-csv";
import { type GroupMemberSummary } from "@/features/groups/application/services/groups.facade";

const STUDENT_CODES: string[] = ["2026-1001", "2026-1002", "2026-1003"];

function hmac(value: string): string {
  return createHmac("sha256", SALT).update(value, "utf8").digest("hex");
}

describe("ExportResearchDatasetUseCase", () => {
  it("exports pseudonymized rows without names, emails, student codes or raw identifiers", async () => {
    const students: GroupMemberSummary[] = buildStudents(3);
    const harness: AnalyticsHarness = buildAnalyticsHarness(students);

    const rows: ResearchDatasetRow[] = await harness.research.execute();
    const csv: string = toResearchCsv(rows);

    expect(csv.split("\r\n")[0]).toBe("participant,group,domain,item,metric,value");
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.participant))).toEqual(new Set(students.map((student: GroupMemberSummary) => hmac(student.userId))));
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.group))).toEqual(new Set([hmac(GROUP_ID)]));
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.domain))).toEqual(new Set(["progress", "grades", "simulation", "ai_telemetry", "ai_ratings"]));

    const forbidden: string[] = [
      ...students.flatMap((student: GroupMemberSummary) => [student.userId, student.email, student.name ?? ""]),
      ...STUDENT_CODES,
      GROUP_ID,
      "Student Name",
      "@example.edu",
    ];

    for (const value of forbidden) {
      expect(csv).not.toContain(value);
    }
  });

  it("reads the data with one batch call per facade", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(30));

    await harness.research.execute(GROUP_ID);

    expect(harness.facades.groups.getStudentMemberships).toHaveBeenCalledWith(GROUP_ID);

    for (const batch of batchMocks(harness.facades)) {
      expect(batch).toHaveBeenCalledTimes(1);
    }
  });

  it("exports a student of several groups once", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(1));

    harness.facades.groups.getStudentMemberships.mockResolvedValueOnce([
      { userId: "student-01", groupId: "group-1" },
      { userId: "student-01", groupId: "group-2" },
    ]);

    const rows: ResearchDatasetRow[] = await harness.research.execute();

    expect(harness.facades.progress.getProgressForUsers).toHaveBeenCalledWith(["student-01"]);
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.group))).toEqual(new Set([hmac("group-1")]));
  });

  it("refuses to export without a configured salt and reads nothing", async () => {
    const harness: AnalyticsHarness = buildAnalyticsHarness(buildStudents(3), null);

    await expect(harness.research.execute()).rejects.toBeInstanceOf(AnalyticsExportNotConfiguredError);
    expect(harness.facades.groups.getStudentMemberships).not.toHaveBeenCalled();
  });
});
