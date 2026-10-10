/*
 * Funcionalidad: Pruebas de visibilidad de casos clínicos
 * Descripción: Verifica que un estudiante solo lista y abre casos publicados (un borrador responde ClinicalCaseUnavailableError) y que un docente con permiso de gestión ve cualquier estado y puede filtrar por estado
 * Versión: 1.0
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
} from "@/features/clinical-cases/application/testing/clinical-cases-test-doubles-spec";
import { GetClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case.usecase";
import { GetClinicalCasesUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-cases.usecase";
import { ClinicalCaseUnavailableError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCaseListItem } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";

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
});
