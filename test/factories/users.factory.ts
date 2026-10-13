/*
 * Funcionalidad: Fábrica de usuarios de prueba
 * Descripción: Crea usuarios con Prisma por rol (STUDENT, TEACHER, ADMIN) con correo único, contraseña de prueba conocida con hash bcrypt y valores deterministas sobrescribibles, y el superadmin identificado por SUPERADMIN_EMAIL del entorno de pruebas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient, type User, type UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { nextSequence } from "./sequence";

export const TEST_USER_PASSWORD: string = "Test-Password-123";

const TEST_BCRYPT_ROUNDS: number = 4;

let passwordHash: Promise<string> | undefined;

export interface UserOverrides {
  readonly email?: string;
  readonly name?: string;
  readonly role?: UserRole;
  readonly isActive?: boolean;
  readonly password?: string | null;
}

function testPasswordHash(): Promise<string> {
  passwordHash = passwordHash ?? bcrypt.hash(TEST_USER_PASSWORD, TEST_BCRYPT_ROUNDS);

  return passwordHash;
}

export async function createUser(prisma: PrismaClient, overrides: UserOverrides = {}): Promise<User> {
  const sequence: number = nextSequence();
  const role: UserRole = overrides.role ?? "STUDENT";

  return await prisma.user.create({
    data: {
      email: overrides.email ?? `${role.toLowerCase()}-${sequence}@ventylab.test`,
      name: overrides.name ?? `Test ${role.toLowerCase()} ${sequence}`,
      role,
      isActive: overrides.isActive ?? true,
      password: overrides.password === undefined ? await testPasswordHash() : overrides.password === null ? null : await bcrypt.hash(overrides.password, TEST_BCRYPT_ROUNDS),
    },
  });
}

export function createStudent(prisma: PrismaClient, overrides: Omit<UserOverrides, "role"> = {}): Promise<User> {
  return createUser(prisma, { ...overrides, role: "STUDENT" });
}

export function createTeacher(prisma: PrismaClient, overrides: Omit<UserOverrides, "role"> = {}): Promise<User> {
  return createUser(prisma, { ...overrides, role: "TEACHER" });
}

export function createAdmin(prisma: PrismaClient, overrides: Omit<UserOverrides, "role"> = {}): Promise<User> {
  return createUser(prisma, { ...overrides, role: "ADMIN" });
}

export async function createSuperadmin(prisma: PrismaClient): Promise<User> {
  const email: string | undefined = process.env.SUPERADMIN_EMAIL;

  if (!email) {
    throw new Error("SUPERADMIN_EMAIL is not set in the test environment");
  }

  const existing: User | null = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  return existing ?? await createUser(prisma, { email: email.toLowerCase(), name: "Test superadmin", role: "ADMIN" });
}
