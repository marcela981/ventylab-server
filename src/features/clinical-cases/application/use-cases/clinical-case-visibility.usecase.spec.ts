/*
 * Funcionalidad: Pruebas de visibilidad de casos clínicos
 * Descripción: Verifica que un estudiante solo lista y abre casos publicados (un borrador responde ClinicalCaseUnavailableError) y que un docente con permiso de gestión ve cualquier estado y puede filtrar por estado; un estudiante lee los datos del paciente de un caso publicado (sexo, talla, antecedentes, alergias y signos vitales iniciales)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Paginated } from "@/common/domain/utils/paginated";
import { type ClinicalCaseDetailResult } from "@/features/clinical-cases/application/results/clinical-case.results";
import {
  buildCase,
  buildDoubles,
  type ClinicalCasesDoubles,
  STUDENT_ID,
  TEACHER_ID,
  validContent,
} from "@/features/clinical-cases/application/testing/clinical-cases-test-doubles-spec";
import { GetClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case.usecase";
import { GetClinicalCasesUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-cases.usecase";
import { ClinicalCaseUnavailableError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseListItem } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import { type ClinicalCaseDetailDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case.dto";
import { ClinicalCasesMapper } from "@/features/clinical-cases/presentation/mappers/clinical-cases.mapper";

function buildCatalog(): ClinicalCasesDoubles {
  return buildDoubles({
    cases: [buildCase({ id: "draft-1", status: "DRAFT" }), buildCase({ id: "published-1", status: "PUBLISHED" }), buildCase({ id: "archived-1", status: "ARCHIVED" })],
  });
}

function ids(page: Paginated<ClinicalCaseListItem>): string[] {
  return page.data.map((item: ClinicalCaseListItem) => item.clinicalCase.id);
}

describe("GetClinicalCasesUseCase visibility", () => {
  it("lists only published cases for a student, even when a status filter is sent", async () => {
    const doubles: ClinicalCasesDoubles = buildCatalog();
    const useCase: GetClinicalCasesUseCase = new GetClinicalCasesUseCase(doubles.repository);

    const page: Paginated<ClinicalCaseListItem> = await useCase.execute({ page: 1, limit: 10, status: "DRAFT" }, STUDENT_ID);

    expect(ids(page)).toEqual(["published-1"]);
  });

  it("lists every status for a teacher without a filter", async () => {
    const doubles: ClinicalCasesDoubles = buildCatalog();
    const useCase: GetClinicalCasesUseCase = new GetClinicalCasesUseCase(doubles.repository);

    const page: Paginated<ClinicalCaseListItem> = await useCase.execute({ page: 1, limit: 10 }, TEACHER_ID, true);

    expect(ids(page)).toEqual(["draft-1", "published-1", "archived-1"]);
  });

  it("applies the status filter for a teacher", async () => {
    const doubles: ClinicalCasesDoubles = buildCatalog();
    const useCase: GetClinicalCasesUseCase = new GetClinicalCasesUseCase(doubles.repository);

    const page: Paginated<ClinicalCaseListItem> = await useCase.execute({ page: 1, limit: 10, status: "ARCHIVED" }, TEACHER_ID, true);

    expect(ids(page)).toEqual(["archived-1"]);
  });
});

describe("GetClinicalCaseUseCase visibility", () => {
  it("does not let a student open a draft case", async () => {
    const doubles: ClinicalCasesDoubles = buildCatalog();
    const useCase: GetClinicalCaseUseCase = new GetClinicalCaseUseCase(doubles.repository);

    const result: Promise<ClinicalCaseDetailResult> = useCase.execute("draft-1", STUDENT_ID);

    await expect(result).rejects.toBeInstanceOf(ClinicalCaseUnavailableError);
  });

  it("lets a student open a published case", async () => {
    const doubles: ClinicalCasesDoubles = buildCatalog();
    const useCase: GetClinicalCaseUseCase = new GetClinicalCaseUseCase(doubles.repository);

    const result: ClinicalCaseDetailResult = await useCase.execute("published-1", STUDENT_ID);

    expect(result.clinicalCase.id).toBe("published-1");
  });

  it("lets a teacher open a draft case", async () => {
    const doubles: ClinicalCasesDoubles = buildCatalog();
    const useCase: GetClinicalCaseUseCase = new GetClinicalCaseUseCase(doubles.repository);

    const result: ClinicalCaseDetailResult = await useCase.execute("draft-1", TEACHER_ID, true);

    expect(result.clinicalCase.status).toBe("DRAFT");
  });

  it("shows a student the patient data of a published case", async () => {
    const content: ClinicalCaseContent = validContent({
      history: { presentIllness: "Disnea progresiva", relevantHistory: ["Hipertensión arterial"], allergies: ["Penicilina"] },
      initialVitals: { heartRateBpm: 105, respiratoryRateBpm: 24, spo2Percent: 84, temperatureC: 39.1, systolicMmHg: 150, diastolicMmHg: 90, glasgow: 15 },
    });
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase({ id: "published-2", status: "PUBLISHED", content })] });
    const useCase: GetClinicalCaseUseCase = new GetClinicalCaseUseCase(doubles.repository);

    const dto: ClinicalCaseDetailDTO = ClinicalCasesMapper.toDetailDTO(await useCase.execute("published-2", STUDENT_ID));

    expect(JSON.parse(JSON.stringify(dto.patient))).toEqual({
      sex: "MALE",
      heightCm: 175,
      history: ["Hipertensión arterial"],
      allergies: ["Penicilina"],
      initialVitals: { heartRateBpm: 105, respiratoryRateBpm: 24, spo2Percent: 84, temperatureC: 39.1, systolicMmHg: 150, diastolicMmHg: 90, glasgow: 15 },
    });
  });

  it("returns empty patient lists and null vitals when the case has none", async () => {
    const content: ClinicalCaseContent = validContent({ history: undefined, initialVitals: undefined });
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase({ id: "published-3", status: "PUBLISHED", content })] });

    const dto: ClinicalCaseDetailDTO = ClinicalCasesMapper.toDetailDTO(await new GetClinicalCaseUseCase(doubles.repository).execute("published-3", STUDENT_ID));

    expect([dto.patient.history, dto.patient.allergies, dto.patient.initialVitals]).toEqual([[], [], null]);
  });
});
