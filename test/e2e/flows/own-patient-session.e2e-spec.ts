/*
 * Funcionalidad: Flujo e2e de una sesión libre con paciente propio
 * Descripción: Un estudiante inicia una sesión libre con su paciente propio sobre un caso publicado; el estado, la repetición y el listado devuelven el formulario guardado del paciente (no los ajustes internos) validado contra el contrato OpenAPI, una sesión sin paciente devuelve patient null y otro estudiante no puede leer la sesión
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCase, type User } from "@prisma/client";
import { type Response } from "supertest";

import { createClinicalCase, createStudent, makeClinicalCaseSimulationReady } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

const PATIENT: Record<string, unknown> = {
  displayName: "Carmen",
  ageYears: 68,
  sex: "FEMALE",
  weightKg: 65,
  heightCm: 160,
  condition: "COPD_MODERATE",
  difficulty: "INTERMEDIATE",
  diagnosis: "EPOC descompensado",
  allergies: ["Penicilina"],
  history: ["Tabaquismo activo"],
  vitals: { heartRateBpm: 95, respiratoryRateBpm: 28, spo2Percent: 88, temperatureC: 37.5, systolicMmHg: 135, diastolicMmHg: 85, glasgow: 14, breathingPattern: "tachypneic" },
};

describe("flow: free session with an own patient", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let clinicalCase: ClinicalCase;
  let studentToken: string;
  let otherToken: string;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);

    const student: User = await createStudent(e2e.prisma);
    const other: User = await createStudent(e2e.prisma);

    clinicalCase = await makeClinicalCaseSimulationReady(e2e.prisma, (await createClinicalCase(e2e.prisma)).id);
    studentToken = await mintAccessToken(student, e2e.app);
    otherToken = await mintAccessToken(other, e2e.app);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should return the stored patient form in the state, the replay and the list, to its owner only", async () => {
    const started: Response = await api("POST", "/api/simulation/sessions", studentToken, { mode: "FREE", caseId: clinicalCase.id, patient: PATIENT });

    expectStatus(started, 201);

    const sessionId: string = started.body.data.id as string;
    const state: Response = await api("GET", `/api/simulation/sessions/${sessionId}/state`, studentToken);
    const replay: Response = await api("GET", `/api/simulation/sessions/${sessionId}/replay`, studentToken);
    const list: Response = await api("GET", "/api/simulation/sessions/history", studentToken);

    expectStatus(state, 200);
    expectStatus(replay, 200);
    expectStatus(list, 200);
    expect(state.body.data.patient).toEqual(PATIENT);
    expect(replay.body.data.patient).toEqual(PATIENT);
    expect((list.body.data as { id: string; patient: unknown }[]).find((item: { id: string }): boolean => item.id === sessionId)?.patient).toEqual(PATIENT);
    expect(JSON.stringify(state.body.data.patient)).not.toContain("complianceMlPerCmH2O");

    const foreign: Response = await api("GET", `/api/simulation/sessions/${sessionId}/state`, otherToken);

    expect([403, 404]).toContain(foreign.status);
  });

  it("should return patient null for a session without own patient", async () => {
    const started: Response = await api("POST", "/api/simulation/sessions", studentToken, { mode: "FREE", caseId: clinicalCase.id });

    expectStatus(started, 201);

    const state: Response = await api("GET", `/api/simulation/sessions/${started.body.data.id as string}/state`, studentToken);

    expectStatus(state, 200);
    expect(state.body.data.patient).toBeNull();
  });
});
