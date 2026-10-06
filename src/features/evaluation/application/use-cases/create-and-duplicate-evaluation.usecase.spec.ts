/*
 * Funcionalidad: Pruebas de creación y duplicado de evaluaciones
 * Descripción: Verifica que crear valida las referencias curriculares (422), aplica el valor por defecto de resultados inmediatos y sanea la descripción enriquecida, y que duplicar copia en profundidad como borrador del llamador sin tocar asignaciones ni intentos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { CreateEvaluationCommand } from "@/features/evaluation/application/commands/create-evaluation.command";
import { DuplicateEvaluationCommand } from "@/features/evaluation/application/commands/duplicate-evaluation.command";
import {
  buildDoubles,
  buildEvaluation,
  type EvaluationsDoubles,
  OTHER_TEACHER,
  OWNER,
  PROMPT,
  savedEvaluation,
} from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { CreateEvaluationUseCase } from "@/features/evaluation/application/use-cases/create-evaluation.usecase";
import { DuplicateEvaluationUseCase } from "@/features/evaluation/application/use-cases/duplicate-evaluation.usecase";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  EvaluationNotFoundError,
  EvaluationReferenceNotFoundError,
  InvalidEvaluationRichTextError,
} from "@/features/evaluation/domain/evaluation.errors";

function createUseCase(doubles: EvaluationsDoubles): CreateEvaluationUseCase {
  return new CreateEvaluationUseCase(doubles.repository, doubles.transactionManager, doubles.eventBus);
}

describe("CreateEvaluationUseCase", () => {
  it("creates a draft exam that hides results by default and stores a rich text description", async () => {
    const doubles: EvaluationsDoubles = buildDoubles();

    const id: string = await createUseCase(doubles).execute(
      new CreateEvaluationCommand({ actor: OWNER, type: "EXAM", title: "Final exam", description: PROMPT, lessonId: "lesson-1" }),
    );

    const saved: Evaluation = savedEvaluation(doubles);

    expect(saved.id).toBe(id);
    expect(saved.showResultsImmediately).toBe(false);
    expect(saved.createdById).toBe(OWNER.id);
    expect(JSON.parse(saved.description ?? "{}")).toEqual(PROMPT);
    expect(doubles.findMissingReferences).toHaveBeenCalledWith({ moduleId: undefined, levelId: undefined, lessonId: "lesson-1" }, "tx");
    expect(doubles.publish).toHaveBeenCalled();
  });

  it("rejects unknown curriculum references with 422 and invalid rich text with 400", async () => {
    const missing: EvaluationsDoubles = buildDoubles({ missingReferences: ["lessonId"] });
    const invalid: EvaluationsDoubles = buildDoubles();

    await expect(
      createUseCase(missing).execute(new CreateEvaluationCommand({ actor: OWNER, type: "QUIZ", title: "Quiz", lessonId: "missing" })),
    ).rejects.toBeInstanceOf(EvaluationReferenceNotFoundError);
    await expect(
      createUseCase(invalid).execute(new CreateEvaluationCommand({ actor: OWNER, type: "QUIZ", title: "Quiz", description: { type: "paragraph" } })),
    ).rejects.toBeInstanceOf(InvalidEvaluationRichTextError);
    expect(missing.save).not.toHaveBeenCalled();
  });
});

describe("DuplicateEvaluationUseCase", () => {
  it("lets a teacher duplicate another teacher's evaluation as their own draft", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation({ ready: true })] });

    const id: string = await new DuplicateEvaluationUseCase(doubles.repository, doubles.transactionManager, doubles.eventBus).execute(
      new DuplicateEvaluationCommand({ evaluationId: "evaluation-1", actor: OTHER_TEACHER }),
    );

    const copy: Evaluation = savedEvaluation(doubles);

    expect(copy.id).toBe(id);
    expect(copy.id).not.toBe("evaluation-1");
    expect(copy.status).toBe("DRAFT");
    expect(copy.createdById).toBe(OTHER_TEACHER.id);
    expect(copy.questions).toHaveLength(1);
    expect(doubles.save).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the source evaluation does not exist", async () => {
    const doubles: EvaluationsDoubles = buildDoubles();

    const result: Promise<string> = new DuplicateEvaluationUseCase(doubles.repository, doubles.transactionManager, doubles.eventBus).execute(
      new DuplicateEvaluationCommand({ evaluationId: "missing", actor: OWNER }),
    );

    await expect(result).rejects.toBeInstanceOf(EvaluationNotFoundError);
  });
});
