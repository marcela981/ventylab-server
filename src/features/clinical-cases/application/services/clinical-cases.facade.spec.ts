/*
 * Funcionalidad: Pruebas de ClinicalCasesFacade
 * Descripción: Verifica la instantánea por id y que getPublishedCaseForSimulation solo entrega casos publicados con todos los bloques que el motor necesita, con errores tipados en los demás casos; y los títulos de varios casos en una sola lectura
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ClinicalCasesFacade } from "@/features/clinical-cases/application/services/clinical-cases.facade";
import { buildCase, buildDoubles, type ClinicalCasesDoubles, validContent } from "@/features/clinical-cases/application/testing/clinical-cases-test-doubles-spec";
import {
  ClinicalCaseNotFoundError,
  ClinicalCaseNotSimulationReadyError,
  ClinicalCaseUnavailableError,
} from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  type ClinicalCaseSnapshot,
  type ClinicalCaseTitleView,
  type SimulationReadyClinicalCase,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";

const LEGACY_CONTENT: ClinicalCaseContent = validContent({ simulation: { events: [] } });

function buildFacade(): ClinicalCasesFacade {
  const doubles: ClinicalCasesDoubles = buildDoubles({
    cases: [
      buildCase({ id: "published-ready", status: "PUBLISHED" }),
      buildCase({ id: "draft-ready", status: "DRAFT" }),
      buildCase({ id: "published-legacy", status: "PUBLISHED", content: LEGACY_CONTENT }),
    ],
  });

  return new ClinicalCasesFacade(doubles.repository);
}

describe("ClinicalCasesFacade", () => {
  it("returns the simulation definition of a published ready case", async () => {
    const facade: ClinicalCasesFacade = buildFacade();

    const result: SimulationReadyClinicalCase = await facade.getPublishedCaseForSimulation("published-ready");

    expect(result.patientSex).toBe("MALE");
    expect(result.mechanics.complianceMlPerCmH2O).toBe(60);
    expect(result.initialVentilatorSettings.mode).toBe("VCV");
  });

  it.each([
    ["missing", ClinicalCaseNotFoundError],
    ["draft-ready", ClinicalCaseUnavailableError],
    ["published-legacy", ClinicalCaseNotSimulationReadyError],
  ])("rejects %s with a typed error", async (caseId: string, errorType: new () => Error) => {
    const facade: ClinicalCasesFacade = buildFacade();

    const result: Promise<SimulationReadyClinicalCase> = facade.getPublishedCaseForSimulation(caseId);

    await expect(result).rejects.toBeInstanceOf(errorType);
  });

  it("returns a snapshot of any case and undefined for an unknown one", async () => {
    const facade: ClinicalCasesFacade = buildFacade();

    const snapshot: ClinicalCaseSnapshot | undefined = await facade.getCaseById("published-legacy");
    const missing: ClinicalCaseSnapshot | undefined = await facade.getCaseById("missing");

    expect(snapshot?.simulationReady).toBe(false);
    expect(missing).toBeUndefined();
  });

  it("reads the titles of several cases in one repository call, deduplicating IDs", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase({ id: "case-a", status: "PUBLISHED" }), buildCase({ id: "case-b", status: "DRAFT" })] });
    const facade: ClinicalCasesFacade = new ClinicalCasesFacade(doubles.repository);

    const titles: ClinicalCaseTitleView[] = await facade.getCaseTitles(["case-a", "case-b", "case-a", "missing"]);

    expect(titles.map((view: ClinicalCaseTitleView) => view.id)).toEqual(["case-a", "case-b"]);
    expect(doubles.repository.getCaseTitles).toHaveBeenCalledTimes(1);
    expect(doubles.repository.getCaseTitles).toHaveBeenCalledWith(["case-a", "case-b", "missing"]);
  });

  it("skips the repository when no case IDs are given", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [] });
    const facade: ClinicalCasesFacade = new ClinicalCasesFacade(doubles.repository);

    const titles: ClinicalCaseTitleView[] = await facade.getCaseTitles([]);

    expect(titles).toEqual([]);
    expect(doubles.repository.getCaseTitles).not.toHaveBeenCalled();
  });
});
