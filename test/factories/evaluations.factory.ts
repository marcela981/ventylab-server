/*
 * Funcionalidad: Fábrica de evaluaciones de prueba
 * Descripción: Crea con Prisma evaluaciones de cada tipo del esquema (EXAM, QUIZ, WORKSHOP) con preguntas de los tipos pedidos (selección única, selección múltiple, verdadero/falso, texto abierto y simulación ligada a un caso clínico) y sus opciones, con enunciados en texto enriquecido, estado READY por defecto, y asignaciones de una evaluación a un grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ClinicalCase,
  type Evaluation,
  type EvaluationAssignment,
  type EvaluationQuestion,
  type EvaluationQuestionOption,
  type EvaluationQuestionType,
  type EvaluationStatus,
  type EvaluationType,
  type Group,
  type Prisma,
  type PrismaClient,
  type User,
} from "@prisma/client";

import { createClinicalCase } from "./clinical-cases.factory";
import { nextSequence } from "./sequence";

export const DEFAULT_QUESTION_TYPES: readonly EvaluationQuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "OPEN_TEXT"];

export interface EvaluationOverrides {
  readonly type?: EvaluationType;
  readonly status?: EvaluationStatus;
  readonly title?: string;
  readonly createdBy?: User;
  readonly moduleId?: string;
  readonly lessonId?: string;
  readonly levelId?: string;
  readonly maxAttempts?: number;
  readonly durationMinutes?: number;
  readonly showResultsImmediately?: boolean;
  readonly questionTypes?: readonly EvaluationQuestionType[];
}

export type EvaluationQuestionWithOptions = EvaluationQuestion & { options: EvaluationQuestionOption[] };

export interface EvaluationWithQuestions {
  readonly evaluation: Evaluation;
  readonly questions: EvaluationQuestionWithOptions[];
  readonly clinicalCase?: ClinicalCase;
}

interface OptionSeed {
  readonly content: string;
  readonly isCorrect: boolean;
}

const OPTIONS_BY_TYPE: Readonly<Record<EvaluationQuestionType, readonly OptionSeed[]>> = {
  SINGLE_CHOICE: [{ content: "5 cmH2O", isCorrect: true }, { content: "25 cmH2O", isCorrect: false }],
  MULTIPLE_CHOICE: [{ content: "Volumen corriente", isCorrect: true }, { content: "PEEP", isCorrect: true }, { content: "Color del monitor", isCorrect: false }],
  TRUE_FALSE: [{ content: "Verdadero", isCorrect: true }, { content: "Falso", isCorrect: false }],
  OPEN_TEXT: [],
  SIMULATION: [],
};

function richText(text: string): Prisma.InputJsonValue {
  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

export async function createEvaluation(prisma: PrismaClient, overrides: EvaluationOverrides = {}): Promise<EvaluationWithQuestions> {
  const sequence: number = nextSequence();
  const questionTypes: readonly EvaluationQuestionType[] = overrides.questionTypes ?? DEFAULT_QUESTION_TYPES;
  const clinicalCase: ClinicalCase | undefined = questionTypes.includes("SIMULATION") ? await createClinicalCase(prisma, { createdBy: overrides.createdBy }) : undefined;

  const evaluation: Evaluation = await prisma.evaluation.create({
    data: {
      type: overrides.type ?? "QUIZ",
      title: overrides.title ?? `Test evaluation ${sequence}`,
      status: overrides.status ?? "READY",
      maxAttempts: overrides.maxAttempts ?? 1,
      durationMinutes: overrides.durationMinutes,
      showResultsImmediately: overrides.showResultsImmediately ?? true,
      moduleId: overrides.moduleId,
      lessonId: overrides.lessonId,
      levelId: overrides.levelId,
      createdById: overrides.createdBy?.id,
      order: sequence,
      questions: {
        create: questionTypes.map((type: EvaluationQuestionType, index: number): Prisma.EvaluationQuestionCreateWithoutEvaluationInput => ({
          order: index + 1,
          type,
          prompt: richText(`Pregunta de prueba ${index + 1} (${type})`),
          points: 1,
          clinicalCase: type === "SIMULATION" && clinicalCase ? { connect: { id: clinicalCase.id } } : undefined,
          options: { create: OPTIONS_BY_TYPE[type].map((option: OptionSeed, optionIndex: number) => ({ order: optionIndex + 1, content: option.content, isCorrect: option.isCorrect })) },
        })),
      },
    },
  });

  const questions: EvaluationQuestionWithOptions[] = await prisma.evaluationQuestion.findMany({
    where: { evaluationId: evaluation.id },
    include: { options: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  return { evaluation, questions, clinicalCase };
}

export async function assignEvaluationToGroup(
  prisma: PrismaClient,
  evaluation: Evaluation,
  group: Group,
  overrides: { readonly startsAt?: Date; readonly endsAt?: Date; readonly assignedBy?: User } = {},
): Promise<EvaluationAssignment> {
  return await prisma.evaluationAssignment.create({
    data: {
      evaluationId: evaluation.id,
      groupId: group.id,
      startsAt: overrides.startsAt ?? new Date(Date.now() - 60_000),
      endsAt: overrides.endsAt,
      assignedById: overrides.assignedBy?.id,
    },
  });
}
