/*
 * Funcionalidad: Actores de las pruebas de autorización
 * Descripción: Crea con las fábricas un estudiante, un docente, un administrador y el superadministrador (ADMIN cuyo correo es SUPERADMIN_EMAIL), emite sus tokens de acceso con el generador de la aplicación y construye la cabecera Authorization de cada actor (ninguna para el anónimo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type INestApplication } from "@nestjs/common";
import { type PrismaClient, type User } from "@prisma/client";

import { createAdmin, createStudent, createSuperadmin, createTeacher } from "../factories";

import { bearer, mintAccessToken } from "./auth";

export type AuthenticatedActor = "student" | "teacher" | "admin" | "superadmin";

export interface ActorIdentity {
  readonly user: User;
  readonly token: string;
}

export type ActorSet = Readonly<Record<AuthenticatedActor, ActorIdentity>>;

async function identity(user: User, app: INestApplication): Promise<ActorIdentity> {
  return { user, token: await mintAccessToken(user, app) };
}

export async function createActors(prisma: PrismaClient, app: INestApplication): Promise<ActorSet> {
  const [student, teacher, admin, superadmin] = await Promise.all([createStudent(prisma), createTeacher(prisma), createAdmin(prisma), createSuperadmin(prisma)]);

  return {
    student: await identity(student, app),
    teacher: await identity(teacher, app),
    admin: await identity(admin, app),
    superadmin: await identity(superadmin, app),
  };
}

export function authHeaders(actors: ActorSet, actor: AuthenticatedActor | "anonymous"): Record<string, string> {
  return actor === "anonymous" ? {} : { authorization: bearer(actors[actor].token) };
}
