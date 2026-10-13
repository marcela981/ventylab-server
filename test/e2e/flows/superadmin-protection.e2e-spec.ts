/*
 * Funcionalidad: Flujo e2e de protección del superadministrador
 * Descripción: Comprueba que ningún actor puede degradar, desactivar ni borrar la cuenta de superadministrador: por la API (otro administrador, un segundo administrador, el propio superadministrador y la ruta heredada) y por SQL directo (UPDATE y DELETE rechazados por el disparador protect_superadmin), validando cada respuesta contra el contrato OpenAPI
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import { type Response } from "supertest";

import { createAdmin, createSuperadmin } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";

type DemotionCase = readonly [actor: "admin" | "secondAdmin" | "superadmin", method: "PATCH", path: (id: string) => string, body: object, status: number, code: string];

const DEMOTIONS: readonly DemotionCase[] = [
  ["admin", "PATCH", (id: string): string => `/api/users/${id}/role`, { role: "STUDENT" }, 403, "users.superadmin_role_immutable"],
  ["secondAdmin", "PATCH", (id: string): string => `/api/users/${id}/role`, { role: "TEACHER" }, 403, "users.superadmin_role_immutable"],
  ["superadmin", "PATCH", (id: string): string => `/api/users/${id}/role`, { role: "STUDENT" }, 403, "users.superadmin_role_immutable"],
  ["admin", "PATCH", (id: string): string => `/api/admin/users/${id}/role`, { role: "STUDENT" }, 403, "users.superadmin_role_immutable"],
  ["admin", "PATCH", (id: string): string => `/api/users/${id}/status`, { isActive: false }, 403, "users.superadmin_status_immutable"],
  ["secondAdmin", "PATCH", (id: string): string => `/api/users/${id}/status`, { isActive: false }, 403, "users.superadmin_status_immutable"],
  ["superadmin", "PATCH", (id: string): string => `/api/users/${id}/status`, { isActive: false }, 403, "users.superadmin_status_immutable"],
];

describe("flow: the superadmin cannot be demoted by any actor", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let superadmin: User;
  let tokens: Record<DemotionCase[0], string>;

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    superadmin = await createSuperadmin(e2e.prisma);

    const [admin, secondAdmin]: User[] = await Promise.all([createAdmin(e2e.prisma), createAdmin(e2e.prisma)]);

    tokens = { admin: await mintAccessToken(admin, e2e.app), secondAdmin: await mintAccessToken(secondAdmin, e2e.app), superadmin: await mintAccessToken(superadmin, e2e.app) };
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it.each(DEMOTIONS)("should refuse %s %s %p", async (actor: DemotionCase[0], method: DemotionCase[1], path: DemotionCase[2], body: object, status: number, code: string) => {
    const response: Response = await api(method, path(superadmin.id), tokens[actor], body);

    expect(response.status).toBe(status);
    expect(response.body).toMatchObject({ success: false, code });
    expect(await e2e.prisma.user.findUniqueOrThrow({ where: { id: superadmin.id } })).toMatchObject({ role: "ADMIN", isActive: true });
  });

  it("should reject direct SQL demotion, deactivation, rename and deletion", async () => {
    const statements: readonly string[] = [
      "UPDATE users SET role = 'STUDENT' WHERE id = $1",
      "UPDATE users SET role = 'TEACHER' WHERE id = $1",
      "UPDATE users SET \"isActive\" = false WHERE id = $1",
      "UPDATE users SET email = 'renamed@ventylab.test' WHERE id = $1",
      "DELETE FROM users WHERE id = $1",
    ];

    const outcomes: PromiseSettledResult<number>[] = [];

    for (const statement of statements) {
      outcomes.push(...await Promise.allSettled([e2e.prisma.$executeRawUnsafe(statement, superadmin.id)]));
    }

    expect(outcomes.map((outcome: PromiseSettledResult<number>): string => outcome.status)).toEqual(statements.map((): string => "rejected"));
    expect(await e2e.prisma.user.findUniqueOrThrow({ where: { id: superadmin.id } })).toMatchObject({ role: "ADMIN", isActive: true, email: superadmin.email });
  });

  it("should still let an administrator demote an ordinary administrator", async () => {
    const other: User = await createAdmin(e2e.prisma);

    const response: Response = await api("PATCH", `/api/users/${other.id}/role`, tokens.admin, { role: "TEACHER" });

    expect(response.status).toBe(200);
    expect((await e2e.prisma.user.findUniqueOrThrow({ where: { id: other.id } })).role).toBe("TEACHER");
  });
});
