/*
 * Funcionalidad: Pruebas del editor transaccional de evaluaciones
 * Descripción: Verifica que toda edición toma el candado de la evaluación, responde 404/403, valida medios y referencias, bloquea cambios estructurales con intentos entregados, mantiene READY válido y publica los eventos tras guardar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  ADMIN,
  buildDoubles,
  buildEvaluation,
  type EvaluationsDoubles,
  OTHER_TEACHER,
  OWNER,
  PROMPT,
  TRANSACTION,
} from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  EvaluationHasSubmittedAttemptsError,
  EvaluationManagementForbiddenError,
  EvaluationMediaNotFoundError,
  EvaluationNotFoundError,
  EvaluationNotReadyError,
  EvaluationReferenceNotFoundError,
} from "@/features/evaluation/domain/evaluation.errors";
import { evaluationStructureLockKey } from "@/features/evaluation/domain/services/evaluation-management-policy";

function addQuestion(evaluation: Evaluation): void {
  evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT }, OWNER.id);
}

describe("EvaluationEditor", () => {
  it("locks the evaluation, applies the change, saves it and publishes the events after the transaction", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    await doubles.editor.edit({ evaluationId: "evaluation-1", actor: OWNER, apply: addQuestion });

    expect(doubles.acquireLock).toHaveBeenCalledWith(evaluationStructureLockKey("evaluation-1"), TRANSACTION);
    expect(doubles.save).toHaveBeenCalledWith(expect.anything(), TRANSACTION);
    expect(doubles.publish).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the evaluation does not exist", async () => {
    const doubles: EvaluationsDoubles = buildDoubles();

    const result: Promise<void> = doubles.editor.edit({ evaluationId: "missing", actor: ADMIN, apply: addQuestion });

    await expect(result).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });

  it("forbids a teacher from editing an evaluation created by someone else but lets an admin do it", async () => {
    const forbidden: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });
    const admin: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    const result: Promise<void> = forbidden.editor.edit({ evaluationId: "evaluation-1", actor: OTHER_TEACHER, apply: addQuestion });

    await expect(result).rejects.toBeInstanceOf(EvaluationManagementForbiddenError);
    expect(forbidden.save).not.toHaveBeenCalled();

    await admin.editor.edit({ evaluationId: "evaluation-1", actor: ADMIN, apply: addQuestion });

    expect(admin.save).toHaveBeenCalled();
  });

  it("rejects a structural change once the evaluation has submitted attempts with 409", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()], usage: { attempts: 3, submittedAttempts: 1 } });

    const result: Promise<void> = doubles.editor.edit({ evaluationId: "evaluation-1", actor: OWNER, apply: addQuestion });

    await expect(result).rejects.toBeInstanceOf(EvaluationHasSubmittedAttemptsError);
    expect(doubles.getUsage).toHaveBeenCalledWith("evaluation-1", TRANSACTION);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it("allows non-structural edits even with submitted attempts without counting them", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()], usage: { attempts: 3, submittedAttempts: 3 } });

    await doubles.editor.edit({
      evaluationId: "evaluation-1",
      actor: OWNER,
      apply: (evaluation: Evaluation) => evaluation.update({ title: "Renamed" }, OWNER.id),
    });

    expect(doubles.getUsage).not.toHaveBeenCalled();
    expect(doubles.save).toHaveBeenCalled();
  });

  it("rejects an edit that leaves a READY evaluation invalid with 422", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation({ ready: true })] });

    const result: Promise<void> = doubles.editor.edit({
      evaluationId: "evaluation-1",
      actor: OWNER,
      apply: (evaluation: Evaluation) => evaluation.removeQuestion(evaluation.questions[0].id, OWNER.id),
    });

    await expect(result).rejects.toBeInstanceOf(EvaluationNotReadyError);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it("rejects unknown media and unknown references with 422 before applying the change", async () => {
    const media: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()], missingMediaIds: ["media-x"] });
    const references: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()], missingReferences: ["clinicalCaseId"] });
    const apply: jest.Mock = jest.fn();

    const mediaResult: Promise<void> = media.editor.edit({ evaluationId: "evaluation-1", actor: OWNER, mediaIds: ["media-1", "media-x"], apply });
    const referenceResult: Promise<void> = references.editor.edit({
      evaluationId: "evaluation-1",
      actor: OWNER,
      references: { clinicalCaseId: "case-x" },
      apply,
    });

    await expect(mediaResult).rejects.toBeInstanceOf(EvaluationMediaNotFoundError);
    await expect(referenceResult).rejects.toBeInstanceOf(EvaluationReferenceNotFoundError);
    expect(apply).not.toHaveBeenCalled();
  });
});
