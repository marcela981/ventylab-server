/*
 * Funcionalidad: Pruebas de los casos de uso de gestión de casos clínicos
 * Descripción: Verifica creación en borrador con auditoría, rechazo de valores implausibles sin persistir, bloqueo de edición con sesiones de simulación, cambio de estado sincronizando isActive, duplicado como borrador no validado, validación por experto y eliminación (409 si el caso está en uso)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ChangeClinicalCaseStatusCommand } from "@/features/clinical-cases/application/commands/change-clinical-case-status.command";
import { CreateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/create-clinical-case.command";
import { DeleteClinicalCaseCommand } from "@/features/clinical-cases/application/commands/delete-clinical-case.command";
import { DuplicateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/duplicate-clinical-case.command";
import { UpdateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/update-clinical-case.command";
import { ValidateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/validate-clinical-case.command";
import {
  buildCase,
  buildDoubles,
  type ClinicalCasesDoubles,
  NO_USAGE,
  savedCase,
  TEACHER_ID,
  TRANSACTION,
  validContent,
} from "@/features/clinical-cases/application/testing/clinical-cases-test-doubles-spec";
import { ChangeClinicalCaseStatusUseCase } from "@/features/clinical-cases/application/use-cases/change-clinical-case-status.usecase";
import { CreateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/create-clinical-case.usecase";
import { DeleteClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/delete-clinical-case.usecase";
import { DuplicateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/duplicate-clinical-case.usecase";
import { UpdateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/update-clinical-case.usecase";
import { ValidateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/validate-clinical-case.usecase";
import {
  ClinicalCaseHasSimulationSessionsError,
  ClinicalCaseInUseError,
  ClinicalCaseNotFoundError,
  ClinicalCasePhysiologicalRangeError,
} from "@/features/clinical-cases/domain/clinical-cases.errors";
import { type ClinicalCase, type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseMechanics } from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";

function contentWithCompliance(complianceMlPerCmH2O: number): ClinicalCaseContent {
  const content: ClinicalCaseContent = validContent();
  const mechanics: ClinicalCaseMechanics | undefined = content.simulation.mechanics;

  if (!mechanics) {
    throw new Error("The valid content must define mechanics");
  }

  return { ...content, simulation: { ...content.simulation, mechanics: { ...mechanics, complianceMlPerCmH2O } } };
}

describe("CreateClinicalCaseUseCase", () => {
  it("creates an unvalidated draft owned by the caller and audits it", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles();
    const useCase: CreateClinicalCaseUseCase = new CreateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const id: string = await useCase.execute(new CreateClinicalCaseCommand({ content: validContent(), performedBy: TEACHER_ID }));

    const created: ClinicalCase = savedCase(doubles);
    expect(created.id).toBe(id);
    expect(created.status).toBe("DRAFT");
    expect(created.isActive).toBe(false);
    expect(created.validatedByExpert).toBe(false);
    expect(created.createdById).toBe(TEACHER_ID);
    expect(doubles.record).toHaveBeenCalledWith(TEACHER_ID, "clinical_case_created", "ClinicalCase", id, {}, expect.any(Object), TRANSACTION);
  });

  it("rejects a compliance of 0 with a physiological range error and saves nothing", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles();
    const useCase: CreateClinicalCaseUseCase = new CreateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const result: Promise<string> = useCase.execute(new CreateClinicalCaseCommand({ content: contentWithCompliance(0), performedBy: TEACHER_ID }));

    await expect(result).rejects.toBeInstanceOf(ClinicalCasePhysiologicalRangeError);
    expect(doubles.saveCase).not.toHaveBeenCalled();
  });
});

describe("UpdateClinicalCaseUseCase", () => {
  it("replaces the content, clears the expert validation and audits it under the row lock", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase({ validatedByExpert: true })] });
    const useCase: UpdateClinicalCaseUseCase = new UpdateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    await useCase.execute(new UpdateClinicalCaseCommand({ caseId: "case-1", content: validContent({ title: "New title" }), performedBy: TEACHER_ID }));

    expect(doubles.lockCase).toHaveBeenCalledWith("case-1", TRANSACTION);
    expect(savedCase(doubles).content.title).toBe("New title");
    expect(savedCase(doubles).validatedByExpert).toBe(false);
    expect(doubles.record.mock.calls[0][1]).toBe("clinical_case_updated");
  });

  it("rejects editing a case that already has simulation sessions", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase()], usage: { ...NO_USAGE, simulationSessions: 2 } });
    const useCase: UpdateClinicalCaseUseCase = new UpdateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const result: Promise<void> = useCase.execute(new UpdateClinicalCaseCommand({ caseId: "case-1", content: validContent(), performedBy: TEACHER_ID }));

    await expect(result).rejects.toBeInstanceOf(ClinicalCaseHasSimulationSessionsError);
    expect(doubles.saveCase).not.toHaveBeenCalled();
  });

  it("rejects an unknown case", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles();
    const useCase: UpdateClinicalCaseUseCase = new UpdateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const result: Promise<void> = useCase.execute(new UpdateClinicalCaseCommand({ caseId: "missing", content: validContent(), performedBy: TEACHER_ID }));

    await expect(result).rejects.toBeInstanceOf(ClinicalCaseNotFoundError);
  });
});

describe("ChangeClinicalCaseStatusUseCase", () => {
  it("publishes a draft, keeps the legacy active flag in sync and audits the change", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase()] });
    const useCase: ChangeClinicalCaseStatusUseCase = new ChangeClinicalCaseStatusUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    await useCase.execute(new ChangeClinicalCaseStatusCommand({ caseId: "case-1", status: "PUBLISHED", performedBy: TEACHER_ID }));

    expect(savedCase(doubles).status).toBe("PUBLISHED");
    expect(savedCase(doubles).isActive).toBe(true);
    expect(doubles.record).toHaveBeenCalledWith(TEACHER_ID, "clinical_case_status_changed", "ClinicalCase", "case-1", { status: "DRAFT" }, { status: "PUBLISHED" }, TRANSACTION);
  });

  it("writes nothing when the status does not change", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase({ status: "ARCHIVED" })] });
    const useCase: ChangeClinicalCaseStatusUseCase = new ChangeClinicalCaseStatusUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    await useCase.execute(new ChangeClinicalCaseStatusCommand({ caseId: "case-1", status: "ARCHIVED", performedBy: TEACHER_ID }));

    expect(doubles.saveCase).not.toHaveBeenCalled();
    expect(doubles.record).not.toHaveBeenCalled();
  });
});

describe("DuplicateClinicalCaseUseCase", () => {
  it("copies a validated published case as an unvalidated draft with the title suffix", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase({ status: "PUBLISHED", validatedByExpert: true })] });
    const useCase: DuplicateClinicalCaseUseCase = new DuplicateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const id: string = await useCase.execute(new DuplicateClinicalCaseCommand({ caseId: "case-1", titleSuffix: " (copy)", performedBy: "teacher-2" }));

    const copy: ClinicalCase = savedCase(doubles);
    expect(copy.id).toBe(id);
    expect(copy.id).not.toBe("case-1");
    expect(copy.status).toBe("DRAFT");
    expect(copy.validatedByExpert).toBe(false);
    expect(copy.validatedById).toBeUndefined();
    expect(copy.createdById).toBe("teacher-2");
    expect(copy.content.title).toBe(`${validContent().title} (copy)`);
    expect(doubles.record.mock.calls[0][4]).toEqual({ sourceCaseId: "case-1" });
  });
});

describe("ValidateClinicalCaseUseCase", () => {
  it("marks the case as validated by the caller", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase()] });
    const useCase: ValidateClinicalCaseUseCase = new ValidateClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    await useCase.execute(new ValidateClinicalCaseCommand({ caseId: "case-1", performedBy: "expert-9" }));

    expect(savedCase(doubles).validatedByExpert).toBe(true);
    expect(savedCase(doubles).validatedById).toBe("expert-9");
    expect(doubles.record.mock.calls[0][1]).toBe("clinical_case_validated_by_expert");
  });
});

describe("DeleteClinicalCaseUseCase", () => {
  it("rejects deleting a case with simulation sessions and suggests archiving", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase()], usage: { ...NO_USAGE, simulationSessions: 1 } });
    const useCase: DeleteClinicalCaseUseCase = new DeleteClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const result: Promise<void> = useCase.execute(new DeleteClinicalCaseCommand({ caseId: "case-1", performedBy: TEACHER_ID }));

    await expect(result).rejects.toBeInstanceOf(ClinicalCaseInUseError);
    expect(doubles.deleteCase).not.toHaveBeenCalled();
  });

  it.each([
    ["legacy evaluation attempts", { ...NO_USAGE, evaluationAttempts: 3 }],
    ["evaluation questions", { ...NO_USAGE, evaluationQuestions: 1 }],
    ["legacy simulator sessions", { ...NO_USAGE, legacySimulatorSessions: 1 }],
  ])("rejects deleting a case referenced by %s", async (_label: string, usage: typeof NO_USAGE) => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase()], usage });
    const useCase: DeleteClinicalCaseUseCase = new DeleteClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    const result: Promise<void> = useCase.execute(new DeleteClinicalCaseCommand({ caseId: "case-1", performedBy: TEACHER_ID }));

    await expect(result).rejects.toBeInstanceOf(ClinicalCaseInUseError);
  });

  it("deletes an unused case under the row lock and audits it", async () => {
    const doubles: ClinicalCasesDoubles = buildDoubles({ cases: [buildCase()] });
    const useCase: DeleteClinicalCaseUseCase = new DeleteClinicalCaseUseCase(doubles.repository, doubles.transactionManager, doubles.auditRecorder);

    await useCase.execute(new DeleteClinicalCaseCommand({ caseId: "case-1", performedBy: TEACHER_ID }));

    expect(doubles.lockCase).toHaveBeenCalledWith("case-1", TRANSACTION);
    expect(doubles.deleteCase).toHaveBeenCalledWith("case-1", TRANSACTION);
    expect(doubles.record.mock.calls[0][1]).toBe("clinical_case_deleted");
  });
});
