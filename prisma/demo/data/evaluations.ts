/*
 * Funcionalidad: Semilla de evaluaciones de la demostración
 * Descripción: Crea un quiz, un examen y un taller en cada estado (activa, cerrada y con calificaciones publicadas), todos READY y asignados a los dos grupos de estudiantes, con sus intentos, respuestas, puntajes y notas (escala 0–5 redondeada a un decimal), revisión docente pendiente en las preguntas abiertas, calificaciones publicadas al instante en el quiz activo o por el docente en el estado publicado, y retroalimentación determinística por intento publicado; devuelve los intentos publicados y las evaluaciones activas para las notificaciones y la telemetría de IA
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationAttemptStatus, type EvaluationQuestionType, type EvaluationType, type Prisma } from "@prisma/client";

import { DEMO_STUDENT_GROUPS, DEMO_STUDENTS, DEMO_TEACHERS, type DemoPerson, type DemoStudentGroup, studentGroupOf } from "../demo-cast";
import { addMinutes, type DemoContext, type DemoDb, demoId, tiptapDocument, upsertAll } from "../demo-support";

import { DEMO_LEVEL_ID, DEMO_MODULES, demoLesson } from "./content";

export type DemoEvaluationState = "ACTIVE" | "CLOSED" | "PUBLISHED";

const DEMO_MAX_GRADE: number = 5;

export const DEMO_PASSING_GRADE: number = 3;

export interface SeededEvaluation {
  readonly id: string;
  readonly title: string;
  readonly type: EvaluationType;
  readonly state: DemoEvaluationState;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly assignmentIds: ReadonlyMap<string, string>;
}

export interface PublishedAttempt {
  readonly id: string;
  readonly evaluationId: string;
  readonly userId: string;
  readonly score: number;
  readonly maxScore: number;
  readonly grade: number;
  readonly publishedAt: Date;
}

export interface SeededEvaluations {
  readonly evaluations: readonly SeededEvaluation[];
  readonly publishedAttempts: readonly PublishedAttempt[];
}

interface OptionSeed {
  readonly content: string;
  readonly isCorrect: boolean;
}

interface QuestionSeed {
  readonly type: EvaluationQuestionType;
  readonly points: number;
  readonly prompt: string;
  readonly explanation: string;
  readonly options: readonly OptionSeed[];
}

type Participation = "none" | "in_progress" | "submitted";

interface AnswerOutcome {
  readonly row: Prisma.EvaluationAnswerCreateManyInput;
  readonly earned?: number;
  readonly pendingManual: boolean;
}

const STATES: readonly DemoEvaluationState[] = ["ACTIVE", "CLOSED", "PUBLISHED"];

const TYPES: readonly EvaluationType[] = ["QUIZ", "EXAM", "WORKSHOP"];

const STATE_LABELS: Readonly<Record<DemoEvaluationState, string>> = { ACTIVE: "activa", CLOSED: "cerrada", PUBLISHED: "calificaciones publicadas" };

const TYPE_LABELS: Readonly<Record<EvaluationType, string>> = { QUIZ: "Quiz", EXAM: "Examen", WORKSHOP: "Taller" };

const TRUE_FALSE: readonly OptionSeed[] = [{ content: "Verdadero", isCorrect: true }, { content: "Falso", isCorrect: false }];

const SINGLE_PEEP: QuestionSeed = {
  type: "SINGLE_CHOICE",
  points: 1,
  prompt: "¿Qué valor de PEEP es el punto de partida habitual en un adulto sin lesión pulmonar?",
  explanation: "Una PEEP de 5 cmH2O evita el colapso alveolar al final de la espiración.",
  options: [{ content: "5 cmH2O", isCorrect: true }, { content: "20 cmH2O", isCorrect: false }, { content: "0 cmH2O", isCorrect: false }],
};

const MULTIPLE_LOADS: QuestionSeed = {
  type: "MULTIPLE_CHOICE",
  points: 1,
  prompt: "¿Qué términos forman parte de la ecuación del movimiento?",
  explanation: "La presión vence la carga elástica (V/C) y la resistiva (R·Flujo) sobre la PEEP.",
  options: [{ content: "Volumen / compliance", isCorrect: true }, { content: "Resistencia × flujo", isCorrect: true }, { content: "Frecuencia cardiaca", isCorrect: false }],
};

const TRUE_FALSE_PLATEAU: QuestionSeed = {
  type: "TRUE_FALSE",
  points: 1,
  prompt: "La presión meseta refleja principalmente la carga elástica del sistema respiratorio.",
  explanation: "Durante la pausa inspiratoria no hay flujo, por lo que desaparece el componente resistivo.",
  options: TRUE_FALSE,
};

const OPEN_STRATEGY: QuestionSeed = {
  type: "OPEN_TEXT",
  points: 4,
  prompt: "Describa su estrategia de ventilación protectora para un paciente con SDRA moderado.",
  explanation: "Se espera volumen corriente de 6 mL/kg de peso predicho, presión meseta menor de 30 cmH2O y titulación de PEEP.",
  options: [],
};

const QUESTION_SETS: Readonly<Record<EvaluationType, readonly QuestionSeed[]>> = {
  QUIZ: [SINGLE_PEEP, TRUE_FALSE_PLATEAU, MULTIPLE_LOADS],
  EXAM: [{ ...SINGLE_PEEP, points: 2 }, { ...MULTIPLE_LOADS, points: 2 }, TRUE_FALSE_PLATEAU],
  WORKSHOP: [SINGLE_PEEP, OPEN_STRATEGY],
};

function windowOf(state: DemoEvaluationState, context: DemoContext): { readonly startsAt: Date; readonly endsAt: Date } {
  if (state === "ACTIVE") {
    return { startsAt: context.clock.at(-2, 8), endsAt: context.clock.at(5, 23, 45) };
  }

  return state === "CLOSED" ? { startsAt: context.clock.at(-16, 8), endsAt: context.clock.at(-9, 23, 45) } : { startsAt: context.clock.at(-30, 8), endsAt: context.clock.at(-23, 23, 45) };
}

function participationOf(type: EvaluationType, state: DemoEvaluationState, studentIndex: number): Participation {
  if (state === "CLOSED") {
    return studentIndex === 4 || studentIndex === 9 ? "none" : "submitted";
  }

  if (state === "PUBLISHED") {
    return studentIndex === 9 ? "none" : "submitted";
  }

  const plan: Readonly<Record<EvaluationType, { readonly submitted: readonly number[]; readonly inProgress: readonly number[] }>> = {
    QUIZ: { submitted: [0, 1, 2, 5, 6], inProgress: [3, 7] },
    EXAM: { submitted: [0, 1, 5], inProgress: [] },
    WORKSHOP: { submitted: [0, 5], inProgress: [1] },
  };

  if (plan[type].submitted.includes(studentIndex)) {
    return "submitted";
  }

  return plan[type].inProgress.includes(studentIndex) ? "in_progress" : "none";
}

function roundTo(value: number, decimals: number): number {
  const factor: number = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function answerOf(attemptId: string, question: QuestionSeed, questionIndex: number, studentIndex: number, gradeOpenText: boolean, graderId: string, evaluationId: string): AnswerOutcome {
  const questionId: string = demoId(`evaluation-question:${evaluationId}:${questionIndex + 1}`);
  const base: Prisma.EvaluationAnswerCreateManyInput = { id: demoId(`evaluation-answer:${attemptId}:${questionIndex + 1}`), attemptId, questionId };

  if (question.type === "OPEN_TEXT") {
    const manualScore: number = roundTo((question.points * ((studentIndex % 3) + 2)) / 4, 1);

    return {
      row: {
        ...base,
        textAnswer: "Volumen corriente de 6 mL/kg de peso predicho, presión meseta menor de 30 cmH2O y PEEP según la tabla FiO2/PEEP.",
        manualScore: gradeOpenText ? manualScore : undefined,
        teacherComment: gradeOpenText ? "Buena justificación; precise cómo vigilaría la presión de distensión." : undefined,
        gradedById: gradeOpenText ? graderId : undefined,
      },
      earned: gradeOpenText ? manualScore : undefined,
      pendingManual: !gradeOpenText,
    };
  }

  const correct: boolean = (studentIndex + questionIndex) % 4 !== 3;

  const selected: string[] = question.options.flatMap((option: OptionSeed, optionIndex: number): string[] => {
    const optionId: string = demoId(`evaluation-option:${questionId}:${optionIndex + 1}`);
    const firstWrong: boolean = !option.isCorrect && question.options.findIndex((candidate: OptionSeed) => !candidate.isCorrect) === optionIndex;

    return (correct && option.isCorrect) || (!correct && firstWrong) ? [optionId] : [];
  });

  const earned: number = correct ? question.points : 0;

  return { row: { ...base, selectedOptionIds: selected, autoScore: earned }, earned, pendingManual: false };
}

function deterministicFeedback(title: string, type: EvaluationType, grade: number): string {
  const verdict: string = grade >= DEMO_PASSING_GRADE ? "Aprobaste" : "No alcanzaste la nota mínima";

  return `Obtuviste una nota de ${grade.toFixed(1)} sobre ${DEMO_MAX_GRADE.toFixed(1)} en el ${TYPE_LABELS[type].toLowerCase()} "${title}". ${verdict}; revisa la explicación de cada pregunta.`;
}

export async function seedEvaluations(db: DemoDb, context: DemoContext): Promise<SeededEvaluations> {
  const evaluations: SeededEvaluation[] = [];
  const publishedAttempts: PublishedAttempt[] = [];
  const createdAt: Date = context.clock.at(-35, 9);

  for (const [stateIndex, state] of STATES.entries()) {
    for (const [typeIndex, type] of TYPES.entries()) {
      const evaluationId: string = demoId(`evaluation:${type}:${state}`);
      const author: DemoPerson = DEMO_TEACHERS[typeIndex % 2 === 0 ? 0 : 1];
      const title: string = `${TYPE_LABELS[type]}: mecánica respiratoria (${STATE_LABELS[state]})`;
      const { startsAt, endsAt } = windowOf(state, context);
      const immediate: boolean = type === "QUIZ" && state === "ACTIVE";
      const durationMinutes: number | undefined = type === "EXAM" ? 45 : undefined;
      const questions: readonly QuestionSeed[] = QUESTION_SETS[type];
      const maxScore: number = questions.reduce((total: number, question: QuestionSeed) => total + question.points, 0);
      const teacherPublishedAt: Date = addMinutes(endsAt, 3 * 24 * 60);

      const evaluation: Prisma.EvaluationCreateManyInput = {
        id: evaluationId,
        type,
        title,
        description: `Evaluación de demostración en estado ${STATE_LABELS[state]}.`,
        moduleId: DEMO_MODULES[0]?.id,
        levelId: DEMO_LEVEL_ID,
        lessonId: demoLesson(0).id,
        durationMinutes,
        maxAttempts: type === "QUIZ" ? 2 : 1,
        shuffleQuestions: type === "EXAM",
        showResultsImmediately: immediate,
        status: "READY",
        order: stateIndex * TYPES.length + typeIndex + 1,
        createdById: author.id,
        createdAt,
        updatedAt: createdAt,
      };

      await db.evaluation.upsert({ where: { id: evaluationId }, create: evaluation, update: evaluation });

      for (const [questionIndex, question] of questions.entries()) {
        const questionId: string = demoId(`evaluation-question:${evaluationId}:${questionIndex + 1}`);

        const row: Prisma.EvaluationQuestionCreateManyInput = {
          id: questionId,
          evaluationId,
          order: questionIndex + 1,
          type: question.type,
          prompt: tiptapDocument(question.prompt),
          points: question.points,
          explanation: question.explanation,
          createdAt,
          updatedAt: createdAt,
        };

        await db.evaluationQuestion.upsert({ where: { id: questionId }, create: row, update: row });

        const options: Prisma.EvaluationQuestionOptionCreateManyInput[] = question.options.map((option: OptionSeed, optionIndex: number) => ({
          id: demoId(`evaluation-option:${questionId}:${optionIndex + 1}`),
          questionId,
          order: optionIndex + 1,
          content: option.content,
          isCorrect: option.isCorrect,
        }));

        await upsertAll(options, (option: Prisma.EvaluationQuestionOptionCreateManyInput, id: string) => db.evaluationQuestionOption.upsert({ where: { id }, create: option, update: option }));
      }

      const assignmentIds: Map<string, string> = new Map<string, string>();

      for (const group of DEMO_STUDENT_GROUPS) {
        const assignmentId: string = demoId(`evaluation-assignment:${evaluationId}:${group.id}`);

        const assignment: Prisma.EvaluationAssignmentCreateManyInput = {
          id: assignmentId,
          evaluationId,
          groupId: group.id,
          startsAt,
          endsAt,
          assignedById: group.createdBy.id,
          createdAt: addMinutes(startsAt, -24 * 60),
          updatedAt: addMinutes(startsAt, -24 * 60),
        };

        await db.evaluationAssignment.upsert({ where: { id: assignmentId }, create: assignment, update: assignment });

        assignmentIds.set(group.id, assignmentId);
      }

      evaluations.push({ id: evaluationId, title, type, state, startsAt, endsAt, assignmentIds });

      for (const [studentIndex, student] of DEMO_STUDENTS.entries()) {
        const participation: Participation = participationOf(type, state, studentIndex);

        if (participation === "none") {
          continue;
        }

        const group: DemoStudentGroup = studentGroupOf(student);
        const attemptId: string = demoId(`evaluation-attempt:${evaluationId}:${student.id}:1`);
        const startedAt: Date = state === "ACTIVE" ? context.clock.at(-1, 8 + studentIndex) : addMinutes(startsAt, (1 + (studentIndex % 3)) * 24 * 60 + studentIndex * 30);
        const submitted: boolean = participation === "submitted";
        const submittedAt: Date | undefined = submitted ? addMinutes(startedAt, 20 + studentIndex) : undefined;
        const gradeOpenText: boolean = state === "PUBLISHED";

        const answers: AnswerOutcome[] = questions
          .map((question: QuestionSeed, questionIndex: number) => answerOf(attemptId, question, questionIndex, studentIndex, gradeOpenText, group.createdBy.id, evaluationId))
          .filter((_answer: AnswerOutcome, questionIndex: number) => submitted || questionIndex === 0);

        const pendingManual: boolean = answers.some((answer: AnswerOutcome) => answer.pendingManual);
        const score: number = roundTo(answers.reduce((total: number, answer: AnswerOutcome) => total + (answer.earned ?? 0), 0), 2);
        const graded: boolean = submitted && !pendingManual;
        const grade: number | undefined = graded ? roundTo((DEMO_MAX_GRADE * score) / maxScore, 1) : undefined;
        const publishedAt: Date | undefined = graded && submittedAt ? (immediate ? submittedAt : state === "PUBLISHED" ? teacherPublishedAt : undefined) : undefined;
        const status: EvaluationAttemptStatus = !submitted ? "IN_PROGRESS" : pendingManual ? "PENDING_REVIEW" : "GRADED";

        const attempt: Prisma.StudentEvaluationAttemptCreateManyInput = {
          id: attemptId,
          evaluationId,
          assignmentId: assignmentIds.get(group.id),
          userId: student.id,
          attemptNumber: 1,
          status,
          startedAt,
          submittedAt,
          deadlineAt: durationMinutes === undefined ? endsAt : addMinutes(startedAt, durationMinutes),
          score: submitted ? score : undefined,
          maxScore: submitted ? maxScore : undefined,
          grade,
          gradePublishedAt: publishedAt,
          isLate: false,
          createdAt: startedAt,
          updatedAt: publishedAt ?? submittedAt ?? startedAt,
        };

        await db.studentEvaluationAttempt.upsert({ where: { id: attemptId }, create: attempt, update: attempt });

        await upsertAll(
          answers.map((answer: AnswerOutcome): Prisma.EvaluationAnswerCreateManyInput => ({ ...answer.row, createdAt: startedAt, updatedAt: submittedAt ?? startedAt })),
          (row: Prisma.EvaluationAnswerCreateManyInput, id: string) => db.evaluationAnswer.upsert({ where: { id }, create: row, update: row }),
        );

        if (grade !== undefined && publishedAt !== undefined) {
          const feedbackId: string = demoId(`grade-feedback:${attemptId}`);

          const feedback: Prisma.GradeFeedbackCreateManyInput = {
            id: feedbackId,
            attemptId,
            content: deterministicFeedback(title, type, grade),
            source: "DETERMINISTIC",
            status: "READY",
            createdAt: publishedAt,
            updatedAt: publishedAt,
          };

          await db.gradeFeedback.upsert({ where: { id: feedbackId }, create: feedback, update: feedback });

          publishedAttempts.push({ id: attemptId, evaluationId, userId: student.id, score, maxScore, grade, publishedAt });
        }
      }
    }
  }

  return { evaluations, publishedAttempts };
}
