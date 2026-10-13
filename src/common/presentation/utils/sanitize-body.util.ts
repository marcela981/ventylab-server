/*
 * Funcionalidad: Utilidad sanitizeBody
 * Descripción: Prepara cuerpos, consultas y parámetros de una petición para registrarlos: oculta secretos con redactSecrets y enmascara direcciones de correo; también describe una excepción para el registro (nombre, mensaje y pila sin correos ni tokens, y para errores de validación solo la propiedad y las restricciones fallidas, nunca el valor ni el objeto recibido)
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ValidationError } from "class-validator";

import { maskEmailAddresses, maskEmailsInText } from "@/common/domain/utils/mask-email-addresses";
import { redactSecrets } from "@/common/domain/utils/redact-secrets";

export interface LoggedValidationFailure {
  readonly property: string;
  readonly constraints: readonly string[];
}

export interface LoggedException {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
  readonly validation?: readonly LoggedValidationFailure[];
}

export function sanitizeBody(
  body: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  if (!body || Object.keys(body).length === 0) {
    return null;
  }

  return maskEmailAddresses(redactSecrets(body)) as Record<string, unknown>;
}

export function sanitizeLogText(text: string): string {
  return maskEmailsInText(redactSecrets(text) as string);
}

function flattenValidationErrors(errors: readonly ValidationError[], parentPath: string): LoggedValidationFailure[] {
  return errors.flatMap((error: ValidationError): LoggedValidationFailure[] => {
    const property: string = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own: LoggedValidationFailure[] = error.constraints ? [{ property, constraints: Object.keys(error.constraints) }] : [];

    return [...own, ...flattenValidationErrors(error.children ?? [], property)];
  });
}

// A class-validator error carries the whole received object (target) and the rejected value, and the
// i18n constraint messages embed that value too, so only property paths and constraint names are kept.
export function describeExceptionForLog(exception: unknown, validationErrors?: readonly ValidationError[]): LoggedException {
  if (!(exception instanceof Error)) {
    return { name: typeof exception, message: sanitizeLogText(String(exception)) };
  }

  return {
    name: exception.name,
    message: sanitizeLogText(exception.message),
    stack: exception.stack === undefined ? undefined : sanitizeLogText(exception.stack),
    validation: validationErrors === undefined ? undefined : flattenValidationErrors(validationErrors, ""),
  };
}
