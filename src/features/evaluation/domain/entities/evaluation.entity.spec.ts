/*
 * Funcionalidad: Pruebas del agregado Evaluation
 * Descripción: Verifica los valores por defecto por tipo, las transiciones de estado, la marca de cambios estructurales, la coherencia de READY tras editar, el reordenamiento por lotes y la copia profunda al duplicar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationQuestionItem } from "@/features/evaluation/domain/entities/evaluation-items";
import { Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import {
  EvaluationHasSubmittedAttemptsError,
  EvaluationNotReadyError,
  EvaluationOptionsNotAllowedError,
  EvaluationScenarioNotFoundError,
  InvalidEvaluationReorderError,
  InvalidEvaluationStatusTransitionError,
} from "@/features/evaluation/domain/evaluation.errors";

const PROMPT: Record<string, unknown> = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "PEEP?" }] }] };

function draft(type: "QUIZ" | "EXAM" | "WORKSHOP" = "QUIZ"): Evaluation {
  return Evaluation.create({ type, title: "Ventilation basics", createdById: "teacher-1" });
}

function withSingleChoice(evaluation: Evaluation): string {
  return evaluation.addQuestion(
    {
      type: "SINGLE_CHOICE",
      prompt: PROMPT,
      points: 2,
      options: [
        { content: "5 cmH2O", isCorrect: true },
        { content: "20 cmH2O", isCorrect: false },
      ],
    },
    "teacher-1",
  );
}

function readyEvaluation(): Evaluation {
  const evaluation: Evaluation = draft();

  withSingleChoice(evaluation);
  evaluation.changeStatus("READY", { hasSubmittedAttempts: false }, "teacher-1");

  return evaluation;
}

describe("Evaluation", () => {
  describe("create", () => {
    it("shows results immediately by default only for quizzes", () => {
      const values: boolean[] = [draft("QUIZ"), draft("EXAM"), draft("WORKSHOP")].map(
        (evaluation: Evaluation) => evaluation.showResultsImmediately,
      );

      expect(values).toEqual([true, false, false]);
    });

    it("keeps an explicit showResultsImmediately and starts as a draft with one attempt", () => {
      const evaluation: Evaluation = Evaluation.create({ type: "EXAM", title: "Final", createdById: "teacher-1", showResultsImmediately: true });

      expect(evaluation.showResultsImmediately).toBe(true);
      expect(evaluation.status).toBe("DRAFT");
      expect(evaluation.maxAttempts).toBe(1);
      expect(evaluation.createdById).toBe("teacher-1");
    });
  });

  describe("changeStatus", () => {
    it("moves a valid draft to READY", () => {
      const evaluation: Evaluation = readyEvaluation();

      expect(evaluation.status).toBe("READY");
    });

    it("rejects READY when the evaluation fails validation and reports every issue", () => {
      const evaluation: Evaluation = draft();

      evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT, points: 0 }, "teacher-1");
      evaluation.addQuestion({ type: "MULTIPLE_CHOICE", prompt: PROMPT, options: [{ content: "A" }] }, "teacher-1");

      let caught: unknown;

      try {
        evaluation.changeStatus("READY", { hasSubmittedAttempts: false }, "teacher-1");
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(EvaluationNotReadyError);
      expect((caught as EvaluationNotReadyError).issues.map((issue: { code: string }) => issue.code)).toEqual([
        "points_not_positive",
        "correct_option_required",
      ]);
      expect(evaluation.status).toBe("DRAFT");
    });

    it("returns a READY evaluation to DRAFT only without submitted attempts", () => {
      const locked: Evaluation = readyEvaluation();
      const free: Evaluation = readyEvaluation();

      expect(() => locked.changeStatus("DRAFT", { hasSubmittedAttempts: true }, "teacher-1")).toThrow(EvaluationHasSubmittedAttemptsError);

      free.changeStatus("DRAFT", { hasSubmittedAttempts: false }, "teacher-1");

      expect(free.status).toBe("DRAFT");
    });

    it("archives from any status and never leaves ARCHIVED", () => {
      const fromDraft: Evaluation = draft();
      const fromReady: Evaluation = readyEvaluation();

      fromDraft.changeStatus("ARCHIVED", { hasSubmittedAttempts: true }, "teacher-1");
      fromReady.changeStatus("ARCHIVED", { hasSubmittedAttempts: true }, "teacher-1");

      expect([fromDraft.status, fromReady.status]).toEqual(["ARCHIVED", "ARCHIVED"]);
      expect(() => fromDraft.changeStatus("DRAFT", { hasSubmittedAttempts: false }, "teacher-1")).toThrow(InvalidEvaluationStatusTransitionError);
    });
  });

  describe("structural changes", () => {
    it("flags adding questions, changing points, type, rubric or correctness and removing options as structural", () => {
      const evaluation: Evaluation = Evaluation.reconstitute(draft().toSnapshot());
      const questionId: string = withSingleChoice(evaluation);
      const flags: boolean[] = [evaluation.hasStructuralChanges];
      const snapshot: Evaluation = Evaluation.reconstitute(evaluation.toSnapshot());
      const optionId: string = snapshot.questions[0].options[1].id;

      snapshot.updateOption(questionId, optionId, { isCorrect: true }, "teacher-1");
      flags.push(snapshot.hasStructuralChanges);

      const pointsChange: Evaluation = Evaluation.reconstitute(evaluation.toSnapshot());

      pointsChange.updateQuestion(questionId, { points: 3 }, "teacher-1");
      flags.push(pointsChange.hasStructuralChanges);

      const removal: Evaluation = Evaluation.reconstitute(evaluation.toSnapshot());

      removal.removeOption(questionId, optionId, "teacher-1");
      flags.push(removal.hasStructuralChanges);

      expect(flags).toEqual([true, true, true, true]);
    });

    it("treats text edits, unchanged structural values and reordering as non-structural", () => {
      const base: Evaluation = draft();
      const questionId: string = withSingleChoice(base);
      const evaluation: Evaluation = Evaluation.reconstitute(base.toSnapshot());
      const optionId: string = evaluation.questions[0].options[0].id;

      evaluation.update({ title: "Renamed", description: "New description" }, "teacher-1");
      evaluation.updateQuestion(questionId, { prompt: PROMPT, explanation: "Because", points: 2 }, "teacher-1");
      evaluation.updateOption(questionId, optionId, { content: "5 cmH2O (typical)", isCorrect: true }, "teacher-1");
      evaluation.reorderOptions(questionId, [{ id: optionId, order: 5 }], "teacher-1");

      expect(evaluation.hasStructuralChanges).toBe(false);
      expect(evaluation.title).toBe("Renamed");
    });

    it("rejects options on open text and simulation questions", () => {
      const evaluation: Evaluation = draft();
      const questionId: string = evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT }, "teacher-1");

      expect(() => evaluation.addOption(questionId, { content: "A" }, "teacher-1")).toThrow(EvaluationOptionsNotAllowedError);
      expect(() =>
        evaluation.addQuestion({ type: "SIMULATION", prompt: PROMPT, options: [{ content: "A" }] }, "teacher-1"),
      ).toThrow(EvaluationOptionsNotAllowedError);
    });

    it("keeps a READY evaluation valid after an edit", () => {
      const evaluation: Evaluation = readyEvaluation();
      const question: EvaluationQuestionItem = evaluation.questions[0];

      evaluation.updateOption(question.id, question.options[0].id, { isCorrect: false }, "teacher-1");

      expect(() => evaluation.assertConsistentWithStatus()).toThrow(EvaluationNotReadyError);
    });
  });

  describe("scenarios", () => {
    it("links questions to scenarios of the same evaluation and detaches them when the scenario is removed", () => {
      const evaluation: Evaluation = draft();
      const scenarioId: string = evaluation.addScenario({ content: PROMPT, mediaIds: ["media-1"] }, "teacher-1");
      const questionId: string = evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT, scenarioId }, "teacher-1");

      expect(() => evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT, scenarioId: "missing" }, "teacher-1")).toThrow(
        EvaluationScenarioNotFoundError,
      );

      evaluation.removeScenario(scenarioId, "teacher-1");

      expect(evaluation.scenarios).toHaveLength(0);
      expect(evaluation.questions.find((item: EvaluationQuestionItem) => item.id === questionId)?.scenarioId).toBeUndefined();
    });
  });

  describe("reorder", () => {
    it("applies the requested order and scenario moves and records them as pending reorder", () => {
      const evaluation: Evaluation = draft();
      const scenarioId: string = evaluation.addScenario({ content: PROMPT }, "teacher-1");
      const first: string = evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT }, "teacher-1");
      const second: string = evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT }, "teacher-1");

      evaluation.reorderQuestions(
        [
          { id: second, order: 0, scenarioId },
          { id: first, order: 1 },
        ],
        "teacher-1",
      );

      expect(evaluation.questions.map((item: EvaluationQuestionItem) => [item.id, item.order, item.scenarioId])).toEqual([
        [second, 0, scenarioId],
        [first, 1, undefined],
      ]);
      expect(evaluation.pendingChanges.questionOrder).toEqual([
        { id: second, order: 0, scenarioId, setScenario: true },
        { id: first, order: 1, scenarioId: undefined, setScenario: false },
      ]);
    });

    it("rejects unknown ids, duplicated ids, empty batches and unknown scenarios", () => {
      const evaluation: Evaluation = draft();
      const questionId: string = evaluation.addQuestion({ type: "OPEN_TEXT", prompt: PROMPT }, "teacher-1");

      expect(() => evaluation.reorderQuestions([{ id: "other", order: 0 }], "teacher-1")).toThrow(InvalidEvaluationReorderError);
      expect(() =>
        evaluation.reorderQuestions(
          [
            { id: questionId, order: 0 },
            { id: questionId, order: 1 },
          ],
          "teacher-1",
        ),
      ).toThrow(InvalidEvaluationReorderError);
      expect(() => evaluation.reorderQuestions([], "teacher-1")).toThrow(InvalidEvaluationReorderError);
      expect(() => evaluation.reorderQuestions([{ id: questionId, order: 0, scenarioId: "missing" }], "teacher-1")).toThrow(
        InvalidEvaluationReorderError,
      );
    });
  });

  describe("duplicate", () => {
    it("deep copies scenarios, questions and options with new ids as a draft owned by the caller", () => {
      const source: Evaluation = readyEvaluation();
      const scenarioId: string = source.addScenario({ content: PROMPT }, "teacher-1");

      source.updateQuestion(source.questions[0].id, { scenarioId }, "teacher-1");

      const copy: Evaluation = source.duplicate("teacher-2");
      const sourceQuestion: EvaluationQuestionItem = source.questions[0];
      const copiedQuestion: EvaluationQuestionItem = copy.questions[0];

      expect(copy.id).not.toBe(source.id);
      expect(copy.title).toBe("Ventilation basics (copy)");
      expect(copy.status).toBe("DRAFT");
      expect(copy.createdById).toBe("teacher-2");
      expect(copiedQuestion.id).not.toBe(sourceQuestion.id);
      expect(copiedQuestion.evaluationId).toBe(copy.id);
      expect(copiedQuestion.scenarioId).toBe(copy.scenarios[0].id);
      expect(copy.scenarios[0].id).not.toBe(scenarioId);
      expect(copiedQuestion.options.map((option: { content: string; isCorrect: boolean }) => [option.content, option.isCorrect])).toEqual([
        ["5 cmH2O", true],
        ["20 cmH2O", false],
      ]);
      expect(copiedQuestion.options[0].id).not.toBe(sourceQuestion.options[0].id);
      expect(copy.pendingChanges.questions).toHaveLength(1);
    });
  });
});
