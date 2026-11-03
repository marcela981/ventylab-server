/*
 * Funcionalidad: Prueba e2e de la foto de perfil
 * Descripción: Con la aplicación completa y el almacenamiento en disco local (sin Supabase y fuera de producción), un estudiante sube su foto con PUT /api/users/me/avatar y la ve como imagen de su perfil; comprueba 415 para un tipo no permitido o bytes que no corresponden al tipo, 413 para más de 2 MB, que reemplazar la foto borre la media anterior, que DELETE quite la foto y su media y vuelva a la imagen de Google, que la sesión (login, GET /api/auth/me y change-password) muestre la misma foto que el perfil, y que PATCH /api/users/me solo acepte URLs http(s) de hasta 2048 caracteres sin tocar una imagen base64 ya guardada; las respuestas se validan contra openapi/openapi.json
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type User } from "@prisma/client";
import request, { type Response } from "supertest";

import { AVATAR_MAX_BYTES } from "@/common/domain/value-objects/avatar-upload-rules";

import { createStudent, TEST_USER_PASSWORD } from "../../factories";
import { mintAccessToken } from "../../support/auth";
import { contractCaller, type ContractCaller, expectStatus } from "../../support/contract-api";
import { resetDatabase } from "../../support/database";
import { createE2eApp, type E2eApp } from "../../support/e2e-app";
import { expectMatchesSpec } from "../../support/openapi-validator";

const GOOGLE_PICTURE: string = "https://lh3.googleusercontent.com/a/test-picture";
const PNG: Buffer = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const JPEG: Buffer = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 2)]);

describe("flow: a user uploads, replaces and removes the profile photo", () => {
  let e2e: E2eApp;
  let api: ContractCaller;
  let student: User;
  let token: string;

  async function upload(content: Buffer, contentType: string, filename: string = "photo"): Promise<Response> {
    const response: Response = await request(e2e.baseUrl).put("/api/users/me/avatar").set("authorization", `Bearer ${token}`).attach("file", content, { filename, contentType });

    if (response.status === 200) {
      expectMatchesSpec(response, "PUT", "/api/users/me/avatar");
    }

    return response;
  }

  beforeAll(async () => {
    e2e = await createE2eApp();
    api = contractCaller(e2e.baseUrl);
  });

  beforeEach(async () => {
    await resetDatabase(e2e.prisma);
    student = await createStudent(e2e.prisma);
    await e2e.prisma.user.update({ where: { id: student.id }, data: { image: GOOGLE_PICTURE } });
    token = await mintAccessToken(student, e2e.app);
  });

  afterAll(async () => {
    await e2e?.close();
  });

  it("should show the uploaded photo, delete the replaced one and fall back to the Google picture on delete", async () => {
    const first: Response = await upload(PNG, "image/png", "first.png");

    expectStatus(first, 200);
    expect(first.body.data.image).toBe(`data:image/png;base64,${PNG.toString("base64")}`);

    const firstMediaId: string | null = (await e2e.prisma.user.findUniqueOrThrow({ where: { id: student.id } })).avatarMediaId;
    const second: Response = await upload(JPEG, "image/jpeg", "second.jpg");
    const me: Response = await api("GET", "/api/users/me", token);

    expectStatus(second, 200);
    expect(me.body.data.image).toBe(`data:image/jpeg;base64,${JPEG.toString("base64")}`);
    expect(await e2e.prisma.media.count({ where: { id: firstMediaId ?? "" } })).toBe(0);

    const removed: Response = await api("DELETE", "/api/users/me/avatar", token);

    expectStatus(removed, 200);
    expect(removed.body.data.image).toBe(GOOGLE_PICTURE);
    expect(await e2e.prisma.media.count({ where: { ownerId: student.id } })).toBe(0);
    expect((await e2e.prisma.user.findUniqueOrThrow({ where: { id: student.id } })).avatarMediaId).toBeNull();
  });

  it("should show the uploaded photo as the session user image in login, auth/me and change-password, and the Google picture after removal", async () => {
    const photo: string = `data:image/png;base64,${PNG.toString("base64")}`;

    expectStatus(await upload(PNG, "image/png", "photo.png"), 200);

    const login: Response = await api("POST", "/api/auth/login", undefined, { email: student.email, password: TEST_USER_PASSWORD });

    expectStatus(login, 200);
    expect(login.body.data.user.image).toBe(photo);

    const sessionToken: string = login.body.data.accessToken as string;
    const me: Response = await api("GET", "/api/auth/me", sessionToken);

    expectStatus(me, 200);
    expect(me.body.data.user.image).toBe(photo);

    const changed: Response = await api("POST", "/api/auth/change-password", sessionToken, { currentPassword: TEST_USER_PASSWORD, newPassword: "Another-Pass-2" });

    expectStatus(changed, 200);
    expect(changed.body.data.user.image).toBe(photo);

    expectStatus(await api("DELETE", "/api/users/me/avatar", token), 200);
    expect((await api("GET", "/api/auth/me", token)).body.data.user.image).toBe(GOOGLE_PICTURE);
  });

  it.each([
    ["a gif", Buffer.from("GIF89a-content"), "image/gif", 415],
    ["png bytes declared as webp", PNG, "image/webp", 415],
    ["a text file declared as png", Buffer.from("not an image at all"), "image/png", 415],
    ["a photo larger than 2 MB", Buffer.concat([PNG, Buffer.alloc(AVATAR_MAX_BYTES)]), "image/png", 413],
  ])("should refuse %s", async (_label: string, content: Buffer, contentType: string, status: number) => {
    const response: Response = await upload(content, contentType);

    expect(response.status).toBe(status);
    expect(await e2e.prisma.media.count({ where: { ownerId: student.id } })).toBe(0);
  });

  it("should accept only http(s) image URLs of at most 2048 characters and keep an existing base64 image", async () => {
    const legacy: string = `data:image/png;base64,${PNG.toString("base64")}`;

    await e2e.prisma.user.update({ where: { id: student.id }, data: { image: legacy } });

    expect((await api("PATCH", "/api/users/me", token, { image: legacy })).status).toBe(400);
    expect((await api("PATCH", "/api/users/me", token, { image: `https://example.com/${"a".repeat(2048)}` })).status).toBe(400);
    expect((await api("GET", "/api/users/me", token)).body.data.image).toBe(legacy);
    expectStatus(await api("PATCH", "/api/users/me", token, { image: "https://example.com/me.png" }), 200);
  });
});
