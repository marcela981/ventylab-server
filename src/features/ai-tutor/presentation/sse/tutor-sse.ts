/*
 * Funcionalidad: Transporte SSE del tutor
 * Descripción: Escribe una respuesta del tutor como Server-Sent Events sobre la respuesta Express (eventos delta, done y error, comentarios de keep-alive), extrae el primer evento antes de abrir el stream para que los errores previos usen el sobre JSON normal y cancela la llamada al modelo cuando el cliente se desconecta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HttpStatus } from "@nestjs/common";
import { type Response } from "express";

import { type TutorStreamEvent } from "@/features/ai-tutor/application/results/tutor-stream.result";

export const SSE_CONTENT_TYPE: string = "text/event-stream";

const HEARTBEAT_INTERVAL_MS: number = 15000;

export interface SseErrorPayload {
  readonly code: string;
  readonly message: string;
}

export type SseErrorTranslator = (error: unknown) => Promise<SseErrorPayload>;

function isWritable(res: Response): boolean {
  return !res.writableEnded && !res.destroyed;
}

function writeEvent(res: Response, event: string, data: unknown): void {
  if (isWritable(res)) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

function writeTutorEvent(res: Response, event: TutorStreamEvent): void {
  if (event.type === "delta") {
    writeEvent(res, "delta", { text: event.text });

    return;
  }

  writeEvent(res, "done", { aiCallId: event.aiCallId, messageId: event.messageId, conversationId: event.conversationId });
}

function openStream(res: Response): void {
  if (!isWritable(res)) {
    return;
  }

  res.status(HttpStatus.OK);
  res.setHeader("Content-Type", `${SSE_CONTENT_TYPE}; charset=utf-8`);
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  // Disables response buffering in reverse proxies such as nginx so each event reaches the client immediately.
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

export function abortOnClientDisconnect(res: Response): AbortController {
  const controller: AbortController = new AbortController();

  res.on("close", () => {
    if (!res.writableEnded) {
      controller.abort();
    }
  });

  return controller;
}

export async function pipeTutorStreamToSse(res: Response, events: AsyncIterable<TutorStreamEvent>, translateError: SseErrorTranslator): Promise<void> {
  const iterator: AsyncIterator<TutorStreamEvent> = events[Symbol.asyncIterator]();
  let next: IteratorResult<TutorStreamEvent> = await iterator.next();

  openStream(res);

  const heartbeat: NodeJS.Timeout = setInterval(() => {
    if (isWritable(res)) {
      res.write(": keep-alive\n\n");
    }
  }, HEARTBEAT_INTERVAL_MS);

  heartbeat.unref();

  try {
    while (!next.done) {
      writeTutorEvent(res, next.value);
      next = await iterator.next();
    }
  } catch (error: unknown) {
    writeEvent(res, "error", await translateError(error));
  } finally {
    clearInterval(heartbeat);

    if (isWritable(res)) {
      res.end();
    }
  }
}
