/*
 * Funcionalidad: Redacción de eventos de Sentry
 * Descripción: Procesador global de eventos de Sentry que, antes de enviar un evento, oculta secretos (contraseñas, tokens, claves, cabeceras de autorización y secretos compartidos) y enmascara correos en el cuerpo, la consulta, las cabeceras, las cookies y la URL de la petición que la integración HTTP de Sentry adjunta por defecto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import * as Sentry from "@sentry/nestjs";

import { maskEmailAddresses, maskEmailsInText } from "@/common/domain/utils/mask-email-addresses";
import { isSensitiveKey, REDACTED_VALUE, redactSecrets } from "@/common/domain/utils/redact-secrets";

type RequestEventData = NonNullable<Sentry.Event["request"]>;

function redactValue(value: unknown): unknown {
  return maskEmailAddresses(redactSecrets(value));
}

function redactBody(data: unknown): unknown {
  if (typeof data !== "string") {
    return redactValue(data);
  }

  try {
    return JSON.stringify(redactValue(JSON.parse(data) as unknown));
  } catch {
    return redactValue(data);
  }
}

function redactQueryString(query: string): string {
  const params: URLSearchParams = new URLSearchParams(query);
  const redacted: URLSearchParams = new URLSearchParams();

  params.forEach((value: string, key: string): void => {
    redacted.append(key, isSensitiveKey(key) ? REDACTED_VALUE : (redactValue(value) as string));
  });

  return redacted.toString();
}

function redactUrl(url: string): string {
  const queryStart: number = url.indexOf("?");

  if (queryStart === -1) {
    return maskEmailsInText(url);
  }

  return `${maskEmailsInText(url.slice(0, queryStart))}?${redactQueryString(url.slice(queryStart + 1))}`;
}

// The Sentry HTTP integration attaches incoming request bodies (up to its "medium" size) to every event by default.
export function redactSentryEvent<T extends Sentry.Event>(event: T): T {
  if (event.request === undefined) {
    return event;
  }

  const source: RequestEventData = event.request;
  const request: RequestEventData = {
    ...source,
    url: source.url === undefined ? undefined : redactUrl(source.url),
    data: source.data === undefined ? undefined : redactBody(source.data),
    query_string: source.query_string === undefined ? undefined : typeof source.query_string === "string" ? redactQueryString(source.query_string) : (redactValue(source.query_string) as RequestEventData["query_string"]),
    headers: source.headers === undefined ? undefined : (redactSecrets(source.headers) as Record<string, string>),
    cookies: source.cookies === undefined ? undefined : (Object.fromEntries(Object.keys(source.cookies).map((name: string): [string, string] => [name, REDACTED_VALUE]))),
  };

  return { ...event, request };
}

export function registerSentryRedaction(): void {
  Sentry.getGlobalScope().addEventProcessor((event: Sentry.Event): Sentry.Event => redactSentryEvent(event));
}
