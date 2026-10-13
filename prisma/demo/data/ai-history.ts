/*
 * Funcionalidad: Semilla del historial de IA de la demostración
 * Descripción: Inserta o actualiza conversaciones del tutor de IA (libre, por lección y por página) con sus mensajes, las filas de ai_call_logs que los enlazan (proveedor ficticio "demo", sin prompts ni respuestas), llamadas de análisis de notas, de cuota excedida y fuera de tema, una llamada GRADE_FEEDBACK con respaldo determinístico por intento publicado y valoraciones de estudiantes; ninguna fila proviene de un proveedor real
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiCallStatus, type AiConversationScope, type AiUseCase, Prisma } from "@prisma/client";

import { type DemoPerson, demoStudent } from "../demo-cast";
import { addMinutes, type DemoContext, type DemoDb, demoId, sha256Hex, upsertAll } from "../demo-support";

import { demoLesson } from "./content";
import { type PublishedAttempt } from "./evaluations";

const DEMO_PROVIDER: string = "demo";

const DEMO_MODEL: string = "demo-tutor-v1";

const PROMPT_VERSION: string = "1.0.0";

interface ExchangeSeed {
  readonly question: string;
  readonly answer: string;
}

interface ConversationSeed {
  readonly key: string;
  readonly student: DemoPerson;
  readonly scope: AiConversationScope;
  readonly refId?: string;
  readonly title: string;
  readonly day: number;
  readonly exchanges: readonly ExchangeSeed[];
}

interface CallSeed {
  readonly id: string;
  readonly userId?: string;
  readonly useCase: AiUseCase;
  readonly status: AiCallStatus;
  readonly createdAt: Date;
  readonly refType?: string;
  readonly refId?: string;
  readonly deterministic?: boolean;
}

function callRow(seed: CallSeed, index: number): Prisma.AiCallLogCreateManyInput {
  const answered: boolean = seed.status === "SUCCESS";

  return {
    id: seed.id,
    userId: seed.userId,
    useCase: seed.useCase,
    provider: seed.deterministic ? "deterministic" : DEMO_PROVIDER,
    model: seed.deterministic ? undefined : DEMO_MODEL,
    promptVersion: PROMPT_VERSION,
    promptHash: sha256Hex(`demo-prompt:${seed.id}`),
    inputTokens: answered ? 420 + index * 7 : undefined,
    outputTokens: answered ? 180 + index * 5 : undefined,
    latencyMs: seed.deterministic ? 3 : 900 + index * 37,
    ttftMs: answered ? 350 + index * 11 : undefined,
    status: seed.status,
    errorCode: seed.status === "QUOTA_EXCEEDED" ? "quota_exceeded" : undefined,
    attempts: seed.status === "QUOTA_EXCEEDED" || seed.status === "BLOCKED_OFFTOPIC" ? 0 : 1,
    costEstimateUsd: answered ? new Prisma.Decimal((0.0004 + index * 0.00001).toFixed(6)) : undefined,
    refType: seed.refType,
    refId: seed.refId,
    createdAt: seed.createdAt,
  };
}

function conversationSeeds(): readonly ConversationSeed[] {
  const lesson: { id: string; pages: readonly { id: string }[] } = demoLesson(0);

  return [
    {
      key: "s01-lesson",
      student: demoStudent(0),
      scope: "LESSON",
      refId: lesson.id,
      title: "Dudas sobre la ecuación del movimiento",
      day: -15,
      exchanges: [
        { question: "¿Por qué la presión pico sube si aumenta la resistencia?", answer: "Porque el término R·Flujo crece; la meseta no cambia porque en la pausa no hay flujo." },
        { question: "¿Y si baja la compliance?", answer: "Suben pico y meseta, ya que aumenta la carga elástica V/C." },
      ],
    },
    {
      key: "s02-page",
      student: demoStudent(1),
      scope: "PAGE",
      refId: lesson.pages[0]?.id,
      title: "Componentes de la presión",
      day: -9,
      exchanges: [{ question: "¿Qué representa la PEEP en la ecuación?", answer: "Es la presión basal al final de la espiración sobre la que se suman las cargas." }],
    },
    {
      key: "s06-free",
      student: demoStudent(5),
      scope: "FREE",
      title: "Pregunta libre sobre la PEEP",
      day: -4,
      exchanges: [{ question: "¿Cómo titulo la PEEP en un SDRA moderado?", answer: "Puede usar la tabla FiO2/PEEP y vigilar la presión de distensión y la oxigenación." }],
    },
  ];
}

export async function seedAiHistory(db: DemoDb, context: DemoContext, publishedAttempts: readonly PublishedAttempt[]): Promise<void> {
  const calls: CallSeed[] = [];
  const conversations: Prisma.AiConversationCreateManyInput[] = [];
  const messages: Prisma.AiMessageCreateManyInput[] = [];
  const ratings: Prisma.AiRatingCreateManyInput[] = [];

  for (const seed of conversationSeeds()) {
    const conversationId: string = demoId(`ai-conversation:${seed.key}`);
    const startedAt: Date = context.clock.at(seed.day, 20);
    let lastAt: Date = startedAt;

    for (const [index, exchange] of seed.exchanges.entries()) {
      const askedAt: Date = addMinutes(startedAt, index * 5);
      const answeredAt: Date = addMinutes(askedAt, 1);
      const assistantId: string = demoId(`ai-message:${seed.key}:${index + 1}:assistant`);
      const callId: string = demoId(`ai-call:${seed.key}:${index + 1}`);

      calls.push({ id: callId, userId: seed.student.id, useCase: seed.scope === "FREE" ? "FREE_CHAT" : "LESSON_QA", status: "SUCCESS", createdAt: answeredAt, refType: "ai_message", refId: assistantId });
      messages.push({ id: demoId(`ai-message:${seed.key}:${index + 1}:user`), conversationId, role: "USER", content: exchange.question, createdAt: askedAt });
      messages.push({ id: assistantId, conversationId, role: "ASSISTANT", content: exchange.answer, aiCallId: callId, createdAt: answeredAt });

      lastAt = answeredAt;

      if (index === 0) {
        const helpful: boolean = seed.scope !== "FREE";

        ratings.push({
          id: demoId(`ai-rating:${seed.key}`),
          userId: seed.student.id,
          aiCallId: callId,
          targetType: "MESSAGE",
          targetId: assistantId,
          helpful,
          comment: helpful ? "Explicación clara" : "Esperaba más detalle",
          quality: helpful ? 5 : 3,
          understanding: helpful ? 4 : 3,
          expression: 4,
          safety: 5,
          trust: helpful ? 4 : 3,
          createdAt: addMinutes(answeredAt, 2),
          updatedAt: addMinutes(answeredAt, 2),
        });
      }
    }

    conversations.push({ id: conversationId, userId: seed.student.id, scope: seed.scope, refId: seed.refId, title: seed.title, createdAt: startedAt, updatedAt: lastAt });
  }

  calls.push(
    { id: demoId("ai-call:notes-analysis:s01"), userId: demoStudent(0).id, useCase: "NOTES_ANALYSIS", status: "SUCCESS", createdAt: context.clock.at(-11, 21), refType: "notes_analysis" },
    { id: demoId("ai-call:quota:s04"), userId: demoStudent(3).id, useCase: "FREE_CHAT", status: "QUOTA_EXCEEDED", createdAt: context.clock.at(-2, 22) },
    { id: demoId("ai-call:offtopic:s08"), userId: demoStudent(7).id, useCase: "FREE_CHAT", status: "BLOCKED_OFFTOPIC", createdAt: context.clock.at(-1, 21) },
    ...publishedAttempts.map(
      (attempt: PublishedAttempt): CallSeed => ({
        id: demoId(`ai-call:grade-feedback:${attempt.id}`),
        useCase: "GRADE_FEEDBACK",
        status: "FALLBACK",
        createdAt: attempt.publishedAt,
        refType: "evaluation_attempt",
        refId: attempt.id,
        deterministic: true,
      }),
    ),
  );

  await upsertAll(
    calls.map((call: CallSeed, index: number) => callRow(call, index)),
    (row: Prisma.AiCallLogCreateManyInput, id: string) => db.aiCallLog.upsert({ where: { id }, create: row, update: row }),
  );

  await upsertAll(conversations, (row: Prisma.AiConversationCreateManyInput, id: string) => db.aiConversation.upsert({ where: { id }, create: row, update: row }));
  await upsertAll(messages, (row: Prisma.AiMessageCreateManyInput, id: string) => db.aiMessage.upsert({ where: { id }, create: row, update: row }));
  await upsertAll(ratings, (row: Prisma.AiRatingCreateManyInput, id: string) => db.aiRating.upsert({ where: { id }, create: row, update: row }));
}
