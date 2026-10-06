/*
 * Funcionalidad: Pruebas del borrado de evaluaciones
 * Descripción: Verifica que una evaluación sin intentos ni asignaciones se borra físicamente y que con intentos o asignaciones se archiva, y que solo quien la gestiona puede borrarla
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DeleteEvaluationCommand } from "@/features/evaluation/application/commands/delete-evaluation.command";
import {
  buildDoubles,
  buildEvaluation,
  type EvaluationsDoubles,
  OTHER_TEACHER,
  OWNER,
  savedEvaluation,
} from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { type DeleteEvaluationOutcome, DeleteEvaluationUseCase } from "@/features/evaluation/application/use-cases/delete-evaluation.usecase";
import { EvaluationManagementForbiddenError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

function execute(doubles: EvaluationsDoubles, actor: EvaluationActor = OWNER): Promise<DeleteEvaluationOutcome> {
  return new DeleteEvaluationUseCase(doubles.repository, doubles.transactionManager, doubles.eventBus).execute(
    new DeleteEvaluationCommand({ evaluationId: "evaluation-1", actor }),
  );
}

describe("DeleteEvaluationUseCase", () => {
  it("deletes an evaluation without attempts or assignments", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    const outcome: DeleteEvaluationOutcome = await execute(doubles);

    expect(outcome).toBe("deleted");
    expect(doubles.remove).toHaveBeenCalled();
    expect(doubles.save).not.toHaveBeenCalled();
    expect(doubles.publish).toHaveBeenCalled();
  });

  it("archives an evaluation that has attempts", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation({ ready: true })], usage: { attempts: 1 } });

    const outcome: DeleteEvaluationOutcome = await execute(doubles);

    expect(outcome).toBe("archived");
    expect(savedEvaluation(doubles).status).toBe("ARCHIVED");
    expect(doubles.remove).not.toHaveBeenCalled();
  });

  it("archives an evaluation that only has assignments", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation({ ready: true })], usage: { assignments: 1 } });

    const outcome: DeleteEvaluationOutcome = await execute(doubles);

    expect(outcome).toBe("archived");
  });

  it("forbids deleting an evaluation the caller does not manage", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    await expect(execute(doubles, OTHER_TEACHER)).rejects.toBeInstanceOf(EvaluationManagementForbiddenError);
    expect(doubles.remove).not.toHaveBeenCalled();
  });
});
