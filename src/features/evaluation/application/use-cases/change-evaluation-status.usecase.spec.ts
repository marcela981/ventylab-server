/*
 * Funcionalidad: Pruebas del cambio de estado de evaluaciones
 * Descripción: Verifica que pasar a READY valida la evaluación (422 con todos los problemas), que volver a DRAFT se bloquea con intentos entregados (409) y que archivar siempre es posible
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ChangeEvaluationStatusCommand } from "@/features/evaluation/application/commands/change-evaluation-status.command";
import {
  buildDoubles,
  buildEvaluation,
  type EvaluationsDoubles,
  OWNER,
  savedEvaluation,
} from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { ChangeEvaluationStatusUseCase } from "@/features/evaluation/application/use-cases/change-evaluation-status.usecase";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { EvaluationHasSubmittedAttemptsError, EvaluationNotReadyError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationStatusValue } from "@/features/evaluation/domain/value-objects/evaluation-status";

function execute(doubles: EvaluationsDoubles, status: EvaluationStatusValue): Promise<void> {
  return new ChangeEvaluationStatusUseCase(doubles.editor).execute(new ChangeEvaluationStatusCommand({ evaluationId: "evaluation-1", actor: OWNER, status }));
}

describe("ChangeEvaluationStatusUseCase", () => {
  it("publishes a valid draft as READY", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    await execute(doubles, "READY");

    expect(savedEvaluation(doubles).status).toBe("READY");
  });

  it("rejects READY for an evaluation without questions with 422", async () => {
    const empty: Evaluation = Evaluation.reconstitute({
      ...Evaluation.create({ type: "EXAM", title: "Empty", createdById: OWNER.id }).toSnapshot(),
      id: "evaluation-1",
    });
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [empty] });

    await expect(execute(doubles, "READY")).rejects.toBeInstanceOf(EvaluationNotReadyError);
  });

  it("blocks returning to DRAFT once there are submitted attempts with 409", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation({ ready: true })], usage: { attempts: 2, submittedAttempts: 1 } });

    await expect(execute(doubles, "DRAFT")).rejects.toBeInstanceOf(EvaluationHasSubmittedAttemptsError);
    expect(doubles.save).not.toHaveBeenCalled();
  });

  it("archives a READY evaluation even with submitted attempts", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation({ ready: true })], usage: { attempts: 2, submittedAttempts: 2 } });

    await execute(doubles, "ARCHIVED");

    expect(savedEvaluation(doubles).status).toBe("ARCHIVED");
  });
});
