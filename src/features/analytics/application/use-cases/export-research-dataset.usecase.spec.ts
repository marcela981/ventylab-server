/*
 * Funcionalidad: Pruebas de ExportResearchDatasetUseCase
 * Descripción: Verifica que el CSV de investigación reemplaza usuarios, grupos y evaluaciones por HMAC-SHA256 con la sal (las evaluaciones con separación de dominio, estable y reproducible), que cada columna solo admite los valores permitidos aunque las fuentes traigan nombres, correos, códigos de estudiante e identificadores sembrados, que lee los datos con una llamada por lotes por fachada, que exporta una sola vez a un estudiante de varios grupos y que sin sal configurada falla con 503 sin leer datos
 * Versión: 1.1
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
  PUBLISHED_AT,
  SALT,
} from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { AnalyticsExportNotConfiguredError } from "@/features/analytics/domain/analytics.errors";
import { toResearchCsv } from "@/features/analytics/presentation/utils/analytics-csv";
import { type GroupMemberSummary } from "@/features/groups/application/services/groups.facade";

const STUDENT_CODES: string[] = ["2026-1001", "2026-1002", "2026-1003"];

const EVALUATION_ID: string = "evaluation-raw-0042";

const ALLOWED_METRICS: Record<string, string[]> = {
  progress: ["percentage"],
  grades: ["grade"],
  simulation: ["session_count", "average_score", "average_time_to_stabilize_s"],
  ai_telemetry: ["calls", "input_tokens", "output_tokens", "average_latency_ms"],
  ai_ratings: ["ratings", "helpful_rate", "quality_mean", "understanding_mean", "expression_mean", "safety_mean", "trust_mean"],
};

function hmac(value: string): string {
  return createHmac("sha256", SALT).update(value, "utf8").digest("hex");
}

function seededStudents(): GroupMemberSummary[] {
  return buildStudents(3).map(
    (student: GroupMemberSummary, index: number): GroupMemberSummary => ({ ...student, name: `${student.name ?? ""} ${STUDENT_CODES[index]}` }),
  );
}

function seedIdentifierLikeValues(harness: AnalyticsHarness, students: GroupMemberSummary[]): void {
  harness.facades.evaluation.getGradesForUsers.mockImplementation((userIds: string[]) =>
    Promise.resolve(
      userIds.map((userId: string, index: number) => ({
        attemptId: `attempt-${userId}`,
        evaluationId: EVALUATION_ID,
        evaluationTitle: `${students[index].name ?? ""} <${students[index].email}> ${STUDENT_CODES[index]}`,
        evaluationType: "EXAM",
        userId,
        attemptNumber: 1,
        grade: 4,
        passed: true,
        publishedAt: PUBLISHED_AT,
        legacy: false,
      })),
    ),
  );
}

describe("ExportResearchDatasetUseCase", () => {
  it("allows only pseudonyms and content identifiers in every column, whatever identifiers the sources carry", async () => {
    const students: GroupMemberSummary[] = seededStudents();
    const harness: AnalyticsHarness = buildAnalyticsHarness(students);

    seedIdentifierLikeValues(harness, students);

    const rows: ResearchDatasetRow[] = await harness.research.execute();
    const csv: string = toResearchCsv(rows);
    const participants: string[] = students.map((student: GroupMemberSummary) => hmac(student.userId));
    const allowedItems: Record<string, string[]> = {
      progress: ["overall", "section-1"],
      grades: [hmac(`evaluation:${EVALUATION_ID}`)],
      simulation: ["all"],
      ai_telemetry: ["FREE_CHAT"],
      ai_ratings: ["FREE_CHAT"],
    };

    expect(csv.split("\r\n")[0]).toBe("participant,group,domain,item,metric,value");
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.participant))).toEqual(new Set(participants));
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.group))).toEqual(new Set([hmac(GROUP_ID)]));
    expect(new Set(rows.map((row: ResearchDatasetRow) => row.domain))).toEqual(new Set(Object.keys(allowedItems)));
    expect(rows.filter((row: ResearchDatasetRow) => row.domain === "grades")).toHaveLength(3);

    for (const row of rows) {
      expect(allowedItems[row.domain]).toContain(row.item);
      expect(ALLOWED_METRICS[row.domain]).toContain(row.metric);
      expect(typeof row.value).toBe("number");
    }

    const forbidden: string[] = [
      ...students.flatMap((student: GroupMemberSummary) => [student.userId, student.email, student.name ?? ""]),
      ...STUDENT_CODES,
      EVALUATION_ID,
      GROUP_ID,
      hmac(EVALUATION_ID),
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
