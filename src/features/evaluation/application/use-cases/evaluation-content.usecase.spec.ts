/*
 * Funcionalidad: Pruebas de edición del contenido de evaluaciones
 * Descripción: Verifica que agregar preguntas sanea el enunciado y valida medios y caso clínico, que los cambios de texto siguen permitidos con intentos entregados mientras los de corrección no (409) y que el reordenamiento por lotes rechaza elementos ajenos (400)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AddEvaluationQuestionCommand } from "@/features/evaluation/application/commands/add-evaluation-question.command";
import { ReorderEvaluationQuestionsCommand } from "@/features/evaluation/application/commands/reorder-evaluation-questions.command";
import { UpdateEvaluationOptionCommand } from "@/features/evaluation/application/commands/update-evaluation-option.command";
import { UpdateEvaluationQuestionCommand } from "@/features/evaluation/application/commands/update-evaluation-question.command";
import {
  buildDoubles,
  buildEvaluation,
  type EvaluationsDoubles,
  OWNER,
  PROMPT,
  savedEvaluation,
} from "@/features/evaluation/application/testing/evaluation-test-doubles-spec";
import { AddEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/add-evaluation-question.usecase";
import { ReorderEvaluationQuestionsUseCase } from "@/features/evaluation/application/use-cases/reorder-evaluation-questions.usecase";
import { UpdateEvaluationOptionUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-option.usecase";
import { UpdateEvaluationQuestionUseCase } from "@/features/evaluation/application/use-cases/update-evaluation-question.usecase";
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  EvaluationHasSubmittedAttemptsError,
  EvaluationMediaNotFoundError,
  InvalidEvaluationReorderError,
} from "@/features/evaluation/domain/evaluation.errors";

describe("AddEvaluationQuestionUseCase", () => {
  it("adds a question with sanitized prompt, options and validated media and clinical case", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    const id: string = await new AddEvaluationQuestionUseCase(doubles.editor).execute(
      new AddEvaluationQuestionCommand({
        evaluationId: "evaluation-1",
        actor: OWNER,
        type: "SIMULATION",
        prompt: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "<b>Ventilate</b>" }] }] },
        points: 5,
        mediaIds: ["media-1"],
        clinicalCaseId: "case-1",
        rubric: { criteria: [{ parameter: "peep", expectedValue: 5 }] },
      }),
    );

    const question: EvaluationQuestionItem | undefined = savedEvaluation(doubles).questions.find((item: EvaluationQuestionItem) => item.id === id);

    expect(question?.prompt).toEqual({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Ventilate" }] }] });
    expect(question?.points).toBe(5);
    expect(doubles.findMissingMediaIds).toHaveBeenCalledWith(["media-1"], "tx");
    expect(doubles.findMissingReferences).toHaveBeenCalledWith({ clinicalCaseId: "case-1" }, "tx");
  });

  it("rejects unknown option media with 422", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()], missingMediaIds: ["media-x"] });

    const result: Promise<string> = new AddEvaluationQuestionUseCase(doubles.editor).execute(
      new AddEvaluationQuestionCommand({
        evaluationId: "evaluation-1",
        actor: OWNER,
        type: "SINGLE_CHOICE",
        prompt: PROMPT,
        options: [{ content: "A", isCorrect: true, mediaId: "media-x" }],
      }),
    );

    await expect(result).rejects.toBeInstanceOf(EvaluationMediaNotFoundError);
  });
});

describe("UpdateEvaluationOptionUseCase", () => {
  function command(evaluation: Evaluation, changes: { content?: string; isCorrect?: boolean }): UpdateEvaluationOptionCommand {
    const question: EvaluationQuestionItem = evaluation.questions[0];

    return new UpdateEvaluationOptionCommand({
      evaluationId: "evaluation-1",
      questionId: question.id,
      optionId: question.options[1].id,
      actor: OWNER,
      ...changes,
    });
  }

  it("allows fixing an option text after attempts were submitted", async () => {
    const evaluation: Evaluation = buildEvaluation({ ready: true });
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [evaluation], usage: { attempts: 1, submittedAttempts: 1 } });

    await new UpdateEvaluationOptionUseCase(doubles.editor).execute(command(evaluation, { content: "20 cmH2O (high)" }));

    expect(savedEvaluation(doubles).questions[0].options[1].content).toBe("20 cmH2O (high)");
  });

  it("rejects changing which option is correct after attempts were submitted with 409", async () => {
    const evaluation: Evaluation = buildEvaluation({ ready: true });
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [evaluation], usage: { attempts: 1, submittedAttempts: 1 } });

    const result: Promise<void> = new UpdateEvaluationOptionUseCase(doubles.editor).execute(command(evaluation, { isCorrect: true }));

    await expect(result).rejects.toBeInstanceOf(EvaluationHasSubmittedAttemptsError);
  });
});

describe("UpdateEvaluationQuestionUseCase", () => {
  it("rejects editing the points of a question of an evaluation with submitted attempts with 409 (check 16)", async () => {
    const evaluation: Evaluation = buildEvaluation({ ready: true });
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [evaluation], usage: { attempts: 2, submittedAttempts: 1 } });
    const command: UpdateEvaluationQuestionCommand = new UpdateEvaluationQuestionCommand({
      evaluationId: "evaluation-1",
      questionId: evaluation.questions[0].id,
      actor: OWNER,
      points: 5,
    });

    const result: Promise<void> = new UpdateEvaluationQuestionUseCase(doubles.editor).execute(command);

    await expect(result).rejects.toBeInstanceOf(EvaluationHasSubmittedAttemptsError);
    expect(doubles.save).not.toHaveBeenCalled();
  });
});

describe("ReorderEvaluationQuestionsUseCase", () => {
  it("rejects ids that do not belong to the evaluation with 400", async () => {
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [buildEvaluation()] });

    const result: Promise<void> = new ReorderEvaluationQuestionsUseCase(doubles.editor).execute(
      new ReorderEvaluationQuestionsCommand({ evaluationId: "evaluation-1", actor: OWNER, items: [{ id: "foreign", order: 0 }] }),
    );

    await expect(result).rejects.toBeInstanceOf(InvalidEvaluationReorderError);
  });

  it("records the batch for a single transactional update even with submitted attempts", async () => {
    const evaluation: Evaluation = buildEvaluation({ ready: true });
    const doubles: EvaluationsDoubles = buildDoubles({ evaluations: [evaluation], usage: { submittedAttempts: 2 } });
    const questionId: string = evaluation.questions[0].id;

    await new ReorderEvaluationQuestionsUseCase(doubles.editor).execute(
      new ReorderEvaluationQuestionsCommand({ evaluationId: "evaluation-1", actor: OWNER, items: [{ id: questionId, order: 3 }] }),
    );

    expect(savedEvaluation(doubles).pendingChanges.questionOrder).toEqual([{ id: questionId, order: 3, scenarioId: undefined, setScenario: false }]);
  });
});
