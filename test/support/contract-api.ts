/*
 * Funcionalidad: Llamadas HTTP de pruebas e2e validadas contra el contrato
 * Descripción: Envuelve callApi para que cada respuesta JSON de un flujo e2e se valide contra openapi/openapi.json (estado documentado y esquema del cuerpo) antes de que la prueba la use
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Response } from "supertest";

import { callApi, type HttpMethod } from "./http";
import { expectMatchesSpec } from "./openapi-validator";

export type ContractCaller = (method: HttpMethod, path: string, token?: string, body?: object) => Promise<Response>;

export function contractCaller(baseUrl: string): ContractCaller {
  return async (method: HttpMethod, path: string, token?: string, body?: object): Promise<Response> => {
    const response: Response = await callApi(baseUrl, method, path, token, body);

    expectMatchesSpec(response, method, path);

    return response;
  };
}

export function expectStatus(response: Response, status: number): void {
  if (response.status !== status) {
    throw new Error(`Expected HTTP ${status} but received ${response.status} from ${response.request.method} ${response.request.url}: ${JSON.stringify(response.body)}`);
  }
}
