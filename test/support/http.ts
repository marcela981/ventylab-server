/*
 * Funcionalidad: Cliente HTTP de las pruebas e2e
 * Descripción: Envía peticiones JSON a la aplicación e2e con supertest y el token Bearer de un usuario (o sin cabecera Authorization), y recorre en profundidad un cuerpo JSON para encontrar claves o valores prohibidos con la ruta donde aparecen
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import request, { type Response, type Test } from "supertest";

import { bearer } from "./auth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function callApi(baseUrl: string, method: HttpMethod, path: string, token?: string, body?: object): Promise<Response> {
  const agent: ReturnType<typeof request> = request(baseUrl);
  let pending: Test = method === "GET" ? agent.get(path) : method === "POST" ? agent.post(path) : method === "PUT" ? agent.put(path) : method === "PATCH" ? agent.patch(path) : agent.delete(path);

  if (token !== undefined) {
    pending = pending.set("authorization", bearer(token));
  }

  return await (body === undefined ? pending : pending.send(body));
}

export function findKeysDeep(value: unknown, forbiddenKeys: readonly string[], path: string = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, index: number): string[] => findKeysDeep(item, forbiddenKeys, `${path}[${index}]`));
  }

  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]: [string, unknown]): string[] => [
    ...(forbiddenKeys.includes(key) ? [`${path}.${key}`] : []),
    ...findKeysDeep(nested, forbiddenKeys, `${path}.${key}`),
  ]);
}

export function findValuesDeep(value: unknown, forbiddenValues: readonly string[], path: string = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown, index: number): string[] => findValuesDeep(item, forbiddenValues, `${path}[${index}]`));
  }

  if (typeof value === "string") {
    return forbiddenValues.some((forbidden: string): boolean => value.includes(forbidden)) ? [path] : [];
  }

  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]: [string, unknown]): string[] => findValuesDeep(nested, forbiddenValues, `${path}.${key}`));
}
